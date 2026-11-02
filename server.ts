import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
import YouTubeCastReceiver, { Player, Constants } from 'yt-cast-receiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Handle body formats
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Location');
  res.header('Access-Control-Expose-Headers', 'Location');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = Number(process.env.PORT) || 8547;

// Find local Wi-Fi / LAN IP address
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  
  // 1. First priority: look for Wi-Fi interface
  for (const name of Object.keys(interfaces)) {
    if (/wi-?fi|wireless|wlan/i.test(name)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  // 2. Second priority: look for 192.168.x.x
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address;
      }
    }
  }

  // 3. Fallback to any valid non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}

const localIp = getLocalIpAddress();
const pcHostname = os.hostname() || 'Windows-PC';
const DEVICE_NAME = `Youtube TV (${pcHostname})`;

// Trạng thái Chế độ chờ (Standby) - Mặc định bật khi khởi động app và khi ngắt kết nối
// Khi ở chế độ chờ: video hoàn toàn không chạy để tiết kiệm tài nguyên, TV vẫn lắng nghe kết nối từ điện thoại
let isStandby = true;

// Store current casted video and connected clients
let currentVideo = {
  videoId: '', // Rỗng khi ở chế độ chờ
  title: 'Chế độ chờ (Standby)',
  isPlaying: false,
  startSeconds: 0,
  timestamp: Date.now(),
  source: 'Chế độ chờ (Standby)'
};

let realPairingCode = '';
const connectedClients = new Set<WebSocket>();

// Biến theo dõi âm lượng, vị trí, thời lượng thực tế, độ phân giải & phụ đề của video đang phát
let currentVolumeLevel = 30; // Mặc định 30% khi khởi động
let isVolumeMuted = false;
let currentPositionSeconds = 0;
let currentVideoDuration = 0; // Thời lượng thực của video (giây) đồng bộ từ YouTube IFrame Player
let currentDurationVideoId = ''; // ID video tương ứng với currentVideoDuration để tránh gán nhầm thời lượng của video khác
let currentSeekableStartTime = 0;
let currentSeekableEndTime = 0;
let positionLastUpdated = Date.now();
let isVideoPlaying = false;
let lastSeekTimestamp = 0; // Chống nhảy ngược về live-head / 0s khi đang tua
let lastVideoLoadTimestamp = 0; // Mốc thời gian bắt đầu nạp video mới để chống sự kiện ended ảo lúc chuyển bài
let lastExternalNotifyTime = 0;
let lastDurationNotifyTime = 0;
let lastNotifiedDuration = 0;
let lastLoungeSyncPosition = 0;
let lastLoungeSyncTime = Date.now();
let lastLoungeSyncPlaying = false;
let postLoadResyncTimers: NodeJS.Timeout[] = [];
let preferredQuality = 'hd1080'; // Độ phân giải ưu tiên mặc định (hd2160, hd1440, hd1080, hd720, large, medium, auto)
let subtitlesEnabled = false; // Mặc định tắt phụ đề
let subtitlesLang = 'vi';

// Resolver chờ thời lượng thực từ trình phát khi bắt đầu video mới
let pendingDurationResolver: ((dur: number) => void) | null = null;

function clearPostLoadResyncTimers() {
  for (const t of postLoadResyncTimers) {
    clearTimeout(t);
  }
  postLoadResyncTimers = [];
}

async function forceLoungeTimelineResync(reason: string) {
  if (isStandby || !currentVideo.videoId || currentVideoDuration <= 0) return;
  const targetStatus = isVideoPlaying
    ? Constants.PLAYER_STATUSES.PLAYING
    : Constants.PLAYER_STATUSES.PAUSED;
  if (
    ytPlayer.status === Constants.PLAYER_STATUSES.PLAYING ||
    ytPlayer.status === Constants.PLAYER_STATUSES.PAUSED ||
    ytPlayer.status === Constants.PLAYER_STATUSES.LOADING
  ) {
    lastExternalNotifyTime = Date.now();
    lastLoungeSyncPosition = currentPositionSeconds;
    lastLoungeSyncTime = Date.now();
    lastLoungeSyncPlaying = isVideoPlaying;
    console.log(`[Timeline Resync] Đồng bộ chuẩn thời gian lên iPhone (${reason}): pos=${Math.floor(currentPositionSeconds)}s / dur=${currentVideoDuration}s`);
    await (ytPlayer as any).notifyExternalStateChange(targetStatus, true).catch(() => {});
  }
}

function schedulePostLoadResyncs(videoId: string) {
  clearPostLoadResyncTimers();
  const delays = [1200, 2600, 4800];
  for (const ms of delays) {
    const timer = setTimeout(() => {
      if (!isStandby && currentVideo.videoId === videoId) {
        broadcastControl({ action: 'requestSync' });
        setTimeout(() => {
          if (!isStandby && currentVideo.videoId === videoId && currentVideoDuration > 0) {
            forceLoungeTimelineResync(`Post-load ${ms}ms`).catch(() => {});
          }
        }, 180);
      }
    }, ms);
    postLoadResyncTimers.push(timer);
  }
}

async function broadcastStandbyState(standby: boolean) {
  isStandby = standby;
  if (standby) {
    isVideoPlaying = false;
    currentVideo.isPlaying = false;
  }
  const message = JSON.stringify({
    type: 'standby_state',
    isStandby: standby,
    video: currentVideo
  });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const tvWindowManagerPath = path.join(__dirname, 'bin', 'TvWindowManager.exe');

async function runTvWindowManager(action: 'minimize' | 'restore', display?: DisplayInfo): Promise<boolean> {
  if (process.platform !== 'win32' || !fs.existsSync(tvWindowManagerPath)) return false;

  return new Promise((resolve) => {
    const args: string[] = [action];
    if (action === 'restore' && display) {
      args.push(String(display.x), String(display.y), String(display.width), String(display.height));
    }
    const proc = spawn(tvWindowManagerPath, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let out = '';
    proc.stdout?.on('data', d => { out += d.toString(); });
    proc.on('close', (code) => {
      const success = code === 0 && !out.includes(':0');
      if (success) {
        console.log(`[TvWindowManager Native] ${action} thành công (${out.trim()})`);
      }
      resolve(success);
    });
    proc.on('error', () => {
      resolve(false);
    });
  });
}

// Thu nhỏ và ẩn cửa sổ Kiosk YouTube TV xuống Taskbar để không chiếm màn hình PC
async function minimizeKioskWindow() {
  if (process.platform !== 'win32') return;

  const ok = await runTvWindowManager('minimize');
  if (ok) return;

  const ps = `
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class Win32TvMinimizer {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")]
  public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetProcessWindowStation(IntPtr hWinSta);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetThreadDesktop(IntPtr hDesktop);
  [DllImport("user32.dll")]
  public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);

  public static List<IntPtr> FindWindows(int[] pids) {
    List<IntPtr> list = new List<IntPtr>();
    IntPtr hWinSta = OpenWindowStation("WinSta0", false, 0x037F);
    if (hWinSta != IntPtr.Zero) SetProcessWindowStation(hWinSta);
    IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
    if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

    HashSet<int> pidSet = new HashSet<int>(pids);

    if (hDesk != IntPtr.Zero) {
      EnumDesktopWindows(hDesk, (hWnd, lParam) => {
        uint pid;
        GetWindowThreadProcessId(hWnd, out pid);
        StringBuilder sbCls = new StringBuilder(256);
        GetClassName(hWnd, sbCls, 256);
        string cls = sbCls.ToString();
        StringBuilder sbTitle = new StringBuilder(256);
        GetWindowText(hWnd, sbTitle, 256);
        string title = sbTitle.ToString();

        bool matchPid = pidSet.Contains((int)pid);
        bool matchTitle = title.Contains("YouTube TV") || title.Contains("YouTube-TV");
        bool matchCls = (cls == "Chrome_WidgetWin_1");

        if ((matchPid && matchCls) || (matchTitle && matchCls)) {
          if (!list.Contains(hWnd)) list.Add(hWnd);
        }
        return true;
      }, IntPtr.Zero);
    }

    EnumWindows((hWnd, lParam) => {
      uint pid;
      GetWindowThreadProcessId(hWnd, out pid);
      StringBuilder sbCls = new StringBuilder(256);
      GetClassName(hWnd, sbCls, 256);
      string cls = sbCls.ToString();
      StringBuilder sbTitle = new StringBuilder(256);
      GetWindowText(hWnd, sbTitle, 256);
      string title = sbTitle.ToString();

      bool matchPid = pidSet.Contains((int)pid);
      bool matchTitle = title.Contains("YouTube TV") || title.Contains("YouTube-TV");
      bool matchCls = (cls == "Chrome_WidgetWin_1");

      if ((matchPid && matchCls) || (matchTitle && matchCls)) {
        if (!list.Contains(hWnd)) list.Add(hWnd);
      }
      return true;
    }, IntPtr.Zero);

    return list;
  }

  public static void Minimize(IntPtr hWnd) {
    if (hWnd == IntPtr.Zero) return;
    // Bỏ cờ Topmost trước khi thu nhỏ để không che các ứng dụng khác
    SetWindowPos(hWnd, new IntPtr(-2), 0, 0, 0, 0, 0x0003); // HWND_NOTOPMOST, SWP_NOSIZE | SWP_NOMOVE
    ShowWindow(hWnd, 6); // 6 = SW_MINIMIZE
  }
}
"@

$allPids = @(Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and $_.CommandLine -like '*YouTubeTV_Profile*' } | Select-Object -ExpandProperty ProcessId)
if ($allPids.Count -gt 0) {
  $targetHwnds = [Win32TvMinimizer]::FindWindows([int[]]$allPids)
  foreach ($h in $targetHwnds) {
    [Win32TvMinimizer]::Minimize($h)
  }
  if ($targetHwnds.Count -eq 0) {
    foreach ($pidVal in $allPids) {
      $pr = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
      if ($pr -and $pr.MainWindowHandle -ne 0) {
        [Win32TvMinimizer]::Minimize($pr.MainWindowHandle)
      }
    }
  }
}
`;
  await runPowerShellEncoded(ps);
}

// Khôi phục cửa sổ TV về toàn màn hình trên Display đã lưu và đưa lên trên cùng che mọi app
async function restoreKioskWindow() {
  const target = await getTargetDisplay();
  const running = await isKioskRunning();
  if (!running) {
    console.log('[Kiosk Manager] Cửa sổ TV Kiosk chưa mở hoặc đã bị đóng -> Tự động khởi chạy trên màn hình đích...');
    launchKioskBrowser(target);
    setTimeout(async () => {
      await moveKioskWindowToDisplay(target);
    }, 1500);
  } else {
    await moveKioskWindowToDisplay(target);
  }
}

let autoStandbyTimer: NodeJS.Timeout | null = null;

function scheduleAutoStandby(reason: string, delayMs: number = 4000) {
  cancelAutoStandby();
  autoStandbyTimer = setTimeout(() => {
    if (!isVideoPlaying && !isStandby) {
      console.log(`[Auto Standby] Tự động kích hoạt Chế độ ẩn TV: ${reason}`);
      enterStandbyMode(`Tự động: ${reason}`);
    }
  }, delayMs);
}

function cancelAutoStandby() {
  if (autoStandbyTimer) {
    clearTimeout(autoStandbyTimer);
    autoStandbyTimer = null;
  }
}

// ==========================================
// CUSTOM AUTOMATION ACTIONS & TRIGGER ENGINE
// Cho phép người dùng cấu hình app / script tự động chạy khi âm lượng về 0 (Mute) hoặc khi đánh thức TV
// ==========================================
async function runCustomAutomation(trigger: 'zero_volume' | 'wake', customCmd?: string): Promise<{ success: boolean; command?: string; error?: string; reason?: string }> {
  try {
    let cmd = customCmd;
    if (!cmd) {
      if (trigger === 'zero_volume') {
        cmd = await persistentStore.get('automation.onZeroVolume');
      } else if (trigger === 'wake') {
        cmd = await persistentStore.get('automation.onWake');
      }
    }
    if (typeof cmd === 'string' && cmd.trim()) {
      const trimmed = cmd.trim();
      console.log(`[Automation Trigger] Kích hoạt tác vụ tự động hóa [${trigger}]: "${trimmed}"`);
      if (process.platform === 'win32') {
        // Khởi chạy độc lập bằng start "" để không làm treo tiến trình server Node.js
        exec(`start "" ${trimmed}`, { windowsHide: true }, (error) => {
          if (error) {
            exec(trimmed, { windowsHide: true }, (err2) => {
              if (err2) {
                console.error(`[Automation Trigger Error] Lỗi khi chạy lệnh [${trigger}]:`, err2.message);
              }
            });
          }
        });
      } else {
        exec(trimmed);
      }
      return { success: true, command: trimmed };
    }
  } catch (err: any) {
    console.error(`[Automation Trigger Exception]`, err);
    return { success: false, error: err.message };
  }
  return { success: false, reason: 'No command configured' };
}

async function handleVolumeAutomation(level: number, muted: boolean, reason: string) {
  if (muted || level === 0) {
    console.log(`[Volume Automation] Âm lượng về 0 hoặc Mute -> Tự động hóa (${reason})`);
    const collapseSetting = await persistentStore.get('automation.collapseOnZeroVolume');
    const shouldCollapse = collapseSetting !== false; // Mặc định là true
    if (shouldCollapse) {
      await enterStandbyMode(`Âm lượng = 0 / Mute [${reason}]`);
    } else {
      // Dù không khép TV thì vẫn kích hoạt custom action
      await runCustomAutomation('zero_volume');
    }
  } else if (isStandby && level > 0) {
    console.log(`[Volume Automation] Tăng âm lượng > 0 -> Đánh thức TV (${reason})`);
    await exitStandbyMode(`Tăng âm lượng lên ${level}% [${reason}]`);
  }
}

async function enterStandbyMode(reason: string = 'Thao tác thủ công') {
  cancelAutoStandby();
  console.log(`[YouTube Cast Standby] Kích hoạt Chế độ chờ (Standby) [Lý do: ${reason}]. Thu nhỏ ẩn cửa sổ PC.`);
  isStandby = true;
  isVideoPlaying = false;
  currentPositionSeconds = 0;
  ytPlayer.stop().catch(() => {});
  broadcastStandbyState(true);
  broadcastControl({ action: 'standby' });
  await minimizeKioskWindow();
  await runCustomAutomation('zero_volume');
}

async function exitStandbyMode(reason: string = 'Đánh thức / Bắt đầu phát') {
  cancelAutoStandby();
  console.log(`[YouTube Cast Standby] Thoát Chế độ chờ -> Hiện ứng dụng [Lý do: ${reason}].`);
  isStandby = false;
  broadcastStandbyState(false);
  broadcastControl({ action: 'wake' });
  
  const restoreSetting = await persistentStore.get('automation.restoreOnWake');
  if (restoreSetting !== false) {
    await restoreKioskWindow();
  }
  await runCustomAutomation('wake');
}

function broadcastVideo(videoData: typeof currentVideo) {
  const wasStandby = isStandby;
  cancelAutoStandby();
  isStandby = false;
  currentVideo = videoData;
  isVideoPlaying = videoData.isPlaying;
  lastVideoLoadTimestamp = Date.now();
  const message = JSON.stringify({
    type: 'cast_video',
    video: currentVideo,
    isStandby: false,
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted,
    preferredQuality,
    subtitlesEnabled,
    subtitlesLang
  });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  if (wasStandby) {
    restoreKioskWindow().catch(() => {});
  }
}

function broadcastControl(controlData: any) {
  const message = JSON.stringify({ type: 'control', ...controlData });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function formatPairingCode(code: string): string {
  if (!code) return 'Đang tạo mã TV...';
  const clean = code.replace(/\s+/g, '');
  if (clean.length === 12) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 12)}`;
  }
  return clean;
}

function broadcastPairingCode(code: string) {
  const message = JSON.stringify({ 
    type: 'pairing_code', 
    pairingCode: formatPairingCode(code),
    rawCode: code 
  });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Fetch tiêu đề & thời lượng chuẩn xác của video từ YouTube chạy ngầm
async function resolveVideoMetadataAsync(videoId: string): Promise<{ duration: number; title: string }> {
  let dur = 0;
  let title = '';

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const mDur = html.match(/approxDurationMs...(\d+)/);
      if (mDur && mDur[1]) {
        dur = Math.round(parseInt(mDur[1], 10) / 1000);
      }
      const mTitle = html.match(/<title>([^<]+) - YouTube<\/title>/);
      if (mTitle && mTitle[1]) {
        title = mTitle[1].replace(/ - YouTube$/, '').trim();
      }
    }
  } catch {}

  // Dự phòng bằng oembed nếu chưa lấy được tiêu đề
  if (!title) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oData = (await oembedRes.json()) as any;
        if (oData?.title) title = oData.title;
      }
    } catch {}
  }

  if (currentVideo.videoId === videoId) {
    if (title && (!currentVideo.title || currentVideo.title.startsWith('YouTube Video'))) {
      currentVideo.title = title;
      broadcastControl({ action: 'updateTitle', videoId, title });
    }

    if (dur > 0) {
      currentDurationVideoId = videoId;
      if (currentVideoDuration <= 0 || dur > currentVideoDuration) {
        currentVideoDuration = dur;
        currentSeekableEndTime = dur;
        lastNotifiedDuration = dur;
        console.log(`[Video Metadata] Đã tải thời lượng chuẩn từ YouTube cho (${videoId}): ${dur}s (${Math.floor(dur / 3600)}h ${Math.floor((dur % 3600) / 60)}m)`);
      }
      if (pendingDurationResolver) {
        const r = pendingDurationResolver;
        pendingDurationResolver = null;
        r(dur);
      }
      forceLoungeTimelineResync('Metadata duration resolved');
    }
  }

  return { duration: dur, title };
}

async function resolveVideoTitleAsync(videoId: string) {
  return resolveVideoMetadataAsync(videoId);
}

// ==========================================
// PERSISTENT DATA STORE (.yt-cast-store.json)
// Giữ nguyên screenId và deviceId qua các lần mở app để iPhone nhận diện tức thì ở lần bấm đầu tiên
// ==========================================
const STORE_FILE = path.resolve(__dirname, '.yt-cast-store.json');

class PersistentDataStore {
  map = new Map<string, any>();
  constructor() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.map.set(k, v);
        }
      }
    } catch {}
  }
  async get(key: string) {
    return this.map.get(key);
  }
  async set(key: string, val: any) {
    this.map.set(key, val);
    try {
      const obj: Record<string, any> = {};
      this.map.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch {}
  }
  setLogger() {}
}

// ==========================================
// FAST PLAYLIST REQUEST HANDLER
// Loại bỏ độ trễ 5-8s của Innertube.create() khi iPhone kết nối hoặc đổi bài
// ==========================================
class FastPlaylistRequestHandler {
  logger: any = null;
  setLogger(logger: any) {
    this.logger = logger;
  }
  reset() {}
  async getPreviousNextVideosAbortable(target: any, playlist: any, _abortSignal?: AbortSignal) {
    return this.getPreviousNextVideos(target, playlist);
  }
  async getPreviousNextVideos(target: any, playlist: any) {
    const ids: string[] = playlist?.videoIds || [];
    const idx = target?.context?.index !== undefined ? Number(target.context.index) : ids.indexOf(target?.id);
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
    return {
      previous: prevId ? { id: prevId, client: target.client, context: { playlistId: playlist.id, index: idx - 1 } } : null,
      next: nextId ? { id: nextId, client: target.client, context: { playlistId: playlist.id, index: idx + 1 } } : null
    };
  }
}

// ==========================================
// OFFICIAL YOUTUBE CAST PLAYER IMPLEMENTATION
// ==========================================
class WebCastPlayer extends Player {
  onBeforePlay(video: any, position: number) {
    console.log(`[Cast Player onBeforePlay] Chuẩn bị phát video mới: ${video.id}`);
    currentVideo.videoId = video.id;
    currentDurationVideoId = video.id;
    currentVideoDuration = 0;
    currentSeekableStartTime = 0;
    currentSeekableEndTime = 0;
    lastNotifiedDuration = 0;
    lastDurationNotifyTime = 0;
    currentPositionSeconds = Math.max(0, Math.floor(Number(position) || 0));
    positionLastUpdated = Date.now();
  }

  protected async doPlay(video: any, position: number): Promise<boolean> {
    const startSec = Math.max(0, Math.floor(Number(position) || 0));
    console.log(`[YouTube Cast Received from iPhone] Video ID: ${video.id}, Position: ${startSec}s`);

    // Tự động thoát Chế độ chờ và hiện lại cửa sổ TV full screen khi có video mới
    if (isStandby) {
      exitStandbyMode('Phát video Cast từ YouTube App');
    }

    currentPositionSeconds = startSec;
    positionLastUpdated = Date.now();
    lastSeekTimestamp = Date.now();
    isVideoPlaying = true;

    // Luôn đặt lại toàn bộ thời lượng và dải seek khi bắt đầu bất kỳ lượt phát mới nào để không bao giờ dính dữ liệu của video cũ
    currentDurationVideoId = video.id;
    currentVideoDuration = 0;
    currentSeekableStartTime = 0;
    currentSeekableEndTime = 0;
    lastDurationNotifyTime = 0;
    lastNotifiedDuration = 0;
    lastLoungeSyncPosition = startSec;
    lastLoungeSyncTime = Date.now();
    lastLoungeSyncPlaying = true;

    if (pendingDurationResolver) {
      const oldResolver = pendingDurationResolver;
      pendingDurationResolver = null;
      oldResolver(0);
    }

    const initialTitle = video.title || `YouTube Video (${video.id})`;
    broadcastVideo({
      videoId: video.id,
      title: initialTitle,
      isPlaying: true,
      startSeconds: startSec,
      timestamp: Date.now(),
      source: 'iPhone YouTube App'
    });

    // Kích hoạt ngay việc tải metadata (thời lượng thực & tiêu đề đầy đủ từ YouTube)
    const metaPromise = resolveVideoMetadataAsync(video.id);

    // Chờ tối đa 1600ms hoặc khi metadata / trình phát IFrame đã xác nhận xong duration thực
    if (currentVideoDuration <= 0 && connectedClients.size > 0) {
      await Promise.race([
        metaPromise,
        new Promise<number>((resolve) => {
          pendingDurationResolver = resolve;
          setTimeout(() => {
            if (pendingDurationResolver === resolve) {
              pendingDurationResolver = null;
              resolve(currentVideoDuration);
            }
          }, 1600);
        })
      ]);
    }

    lastLoungeSyncPosition = currentPositionSeconds;
    lastLoungeSyncTime = Date.now();
    lastLoungeSyncPlaying = isVideoPlaying;
    schedulePostLoadResyncs(video.id);

    return true;
  }

  protected async doPause(): Promise<boolean> {
    console.log('[YouTube Cast from iPhone] Pause command');
    if (isVideoPlaying) {
      currentPositionSeconds += (Date.now() - positionLastUpdated) / 1000;
      isVideoPlaying = false;
    }
    broadcastControl({ action: 'pause' });
    return true;
  }

  protected async doResume(): Promise<boolean> {
    console.log('[YouTube Cast from iPhone] Resume command');
    cancelAutoStandby();
    if (isStandby) {
      exitStandbyMode('iPhone Resume').catch(() => {});
    }
    positionLastUpdated = Date.now();
    isVideoPlaying = true;
    broadcastControl({ action: 'play' });
    return true;
  }

  protected async doStop(): Promise<boolean> {
    console.log('[YouTube Cast from iPhone] Stop/Transition command');
    isVideoPlaying = false;
    currentVideoDuration = 0;
    currentSeekableEndTime = 0;
    currentDurationVideoId = '';
    lastNotifiedDuration = 0;
    return true;
  }

  protected async doSeek(position: number): Promise<boolean> {
    let target = Math.max(0, Math.floor(Number(position) || 0));
    cancelAutoStandby();
    const maxSeek = Math.max(currentVideoDuration, currentSeekableEndTime);
    if (maxSeek > 0 && target > maxSeek) {
      target = maxSeek;
    }
    console.log(`[YouTube Cast Tua] iPhone yêu cầu tua tới: ${target}s (Duration: ${currentVideoDuration}s, SeekableEnd: ${currentSeekableEndTime}s)`);
    currentPositionSeconds = target;
    positionLastUpdated = Date.now();
    lastSeekTimestamp = Date.now();
    lastLoungeSyncPosition = target;
    lastLoungeSyncTime = Date.now();
    broadcastControl({ action: 'seekTo', value: target });
    if (currentVideo.videoId) {
      schedulePostLoadResyncs(currentVideo.videoId);
    }
    return true;
  }

  protected async doSetVolume(volume: { level: number; muted: boolean }): Promise<boolean> {
    console.log(`[YouTube Cast from iPhone] Set volume: ${volume.level}%, muted: ${volume.muted}`);
    currentVolumeLevel = Math.max(0, Math.min(100, Math.round(volume.level)));
    isVolumeMuted = Boolean(volume.muted);

    await handleVolumeAutomation(currentVolumeLevel, isVolumeMuted, 'iPhone YouTube Cast');

    if (volume.muted) {
      broadcastControl({ action: 'mute' });
    } else {
      broadcastControl({ action: 'setVolume', value: currentVolumeLevel });
    }
    return true;
  }

  protected async doGetVolume() {
    return { level: currentVolumeLevel, muted: isVolumeMuted };
  }

  protected async doGetPosition(): Promise<number> {
    let current = currentPositionSeconds;
    if (isVideoPlaying && Date.now() - lastSeekTimestamp > 1200) {
      current += (Date.now() - positionLastUpdated) / 1000;
    }
    const maxDur = Math.max(currentVideoDuration, currentSeekableEndTime);
    if (maxDur > 0 && current > maxDur) {
      current = maxDur;
    }
    return Math.max(0, Math.floor(current));
  }

  protected async doGetDuration(): Promise<number> {
    if (currentDurationVideoId && currentVideo.videoId && currentDurationVideoId !== currentVideo.videoId) {
      return 0;
    }
    const effDur = Math.max(currentVideoDuration, currentSeekableEndTime);
    return effDur > 0 ? Math.round(effDur) : 0;
  }

  async getSeekableRange(): Promise<{ start: number; end: number }> {
    if (currentDurationVideoId && currentVideo.videoId && currentDurationVideoId !== currentVideo.videoId) {
      return { start: 0, end: 0 };
    }
    const effEnd = Math.max(currentVideoDuration, currentSeekableEndTime);
    return {
      start: 0,
      end: Math.max(0, Math.round(effEnd))
    };
  }
}

const ytPlayer = new WebCastPlayer();
const persistentStore = new PersistentDataStore();

// Khôi phục cài đặt độ phân giải và phụ đề đã lưu
(async () => {
  const savedQuality = await persistentStore.get('tv.preferredQuality');
  if (typeof savedQuality === 'string' && savedQuality) {
    preferredQuality = savedQuality;
  }
  const savedSubs = await persistentStore.get('tv.subtitlesEnabled');
  if (typeof savedSubs === 'boolean') {
    subtitlesEnabled = savedSubs;
  }
  const savedSubsLang = await persistentStore.get('tv.subtitlesLang');
  if (typeof savedSubsLang === 'string' && savedSubsLang) {
    subtitlesLang = savedSubsLang;
  }
})();

// Lắng nghe sự kiện bật/tắt phụ đề trực tiếp từ nút CC trên ứng dụng YouTube của iPhone
ytPlayer.on('subtitlesTrack', async (evt: any) => {
  const payload = evt?.payload || {};
  const langCode = typeof payload.languageCode === 'string' ? payload.languageCode.trim() : '';
  const enabled = Boolean(langCode && langCode.toLowerCase() !== 'off' && langCode.toLowerCase() !== 'none');
  subtitlesEnabled = enabled;
  if (enabled && langCode) {
    subtitlesLang = langCode;
    await persistentStore.set('tv.subtitlesLang', subtitlesLang);
  }
  await persistentStore.set('tv.subtitlesEnabled', subtitlesEnabled);
  console.log(`[YouTube Cast Subtitles] Nhận lệnh Phụ đề từ iPhone: ${enabled ? `BẬT (${subtitlesLang})` : 'TẮT'}`);
  broadcastControl({
    action: 'setSubtitles',
    enabled: subtitlesEnabled,
    lang: subtitlesLang
  });
});

// ==========================================
// MULTI-MONITOR / DISPLAY SELECTION SYSTEM
// Cho phép chọn màn hình hiển thị (Màn hình chính / Màn hình phụ / TV) và tự động ghi nhớ cho các lần mở sau
// ==========================================
export interface DisplayInfo {
  id: number;
  deviceName: string;
  primary: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

let cachedDisplays: DisplayInfo[] = [];
let preferredDisplayDeviceName: string = '';

function runPowerShellEncoded(psScript: string): Promise<string> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve('');
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    ps.stdout.on('data', (d) => { stdout += d.toString(); });
    ps.on('close', () => { resolve(stdout.trim()); });
    ps.on('error', () => { resolve(''); });

    const scriptWithNewline = psScript.endsWith('\n') ? psScript : psScript + '\r\n';
    ps.stdin.write(scriptWithNewline);
    ps.stdin.end();
  });
}

async function detectDisplays(): Promise<DisplayInfo[]> {
  if (process.platform !== 'win32') {
    cachedDisplays = [{ id: 1, deviceName: 'DISPLAY1', primary: true, x: 0, y: 0, width: 1920, height: 1080 }];
    return cachedDisplays;
  }

  const ps = `
Add-Type -AssemblyName System.Windows.Forms
$screens = @([System.Windows.Forms.Screen]::AllScreens)
$result = @()
for ($i = 0; $i -lt $screens.Count; $i++) {
  $s = $screens[$i]
  $result += [PSCustomObject]@{
    id = $i + 1
    deviceName = $s.DeviceName
    primary = [bool]$s.Primary
    x = [int]$s.Bounds.X
    y = [int]$s.Bounds.Y
    width = [int]$s.Bounds.Width
    height = [int]$s.Bounds.Height
  }
}
$result | ConvertTo-Json -Compress
`;
  const out = await runPowerShellEncoded(ps);
  try {
    if (out) {
      const parsed = JSON.parse(out);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length > 0) {
        cachedDisplays = arr;
      }
    }
  } catch {}

  if (cachedDisplays.length === 0) {
    cachedDisplays = [{ id: 1, deviceName: '\\\\.\\DISPLAY1', primary: true, x: 0, y: 0, width: 1920, height: 1080 }];
  }
  return cachedDisplays;
}

async function getTargetDisplay(): Promise<DisplayInfo> {
  if (cachedDisplays.length === 0) {
    await detectDisplays();
  }
  if (!preferredDisplayDeviceName) {
    const saved = await persistentStore.get('tv.preferredDisplay');
    if (typeof saved === 'string' && saved) {
      preferredDisplayDeviceName = saved;
    }
  }
  if (preferredDisplayDeviceName) {
    const match = cachedDisplays.find(d => d.deviceName === preferredDisplayDeviceName);
    if (match) return match;
  }
  return cachedDisplays.find(d => d.primary) || cachedDisplays[0];
}

// Ghi tọa độ màn hình đã chọn vào Chrome Profile Preferences để Chrome mở đúng màn hình ngay từ đầu
function updateChromeProfilePlacement(display: DisplayInfo) {
  try {
    const tempDir = process.env.TEMP || os.tmpdir();
    const prefFile = path.join(tempDir, 'YouTubeTV_Profile', 'Default', 'Preferences');
    if (!fs.existsSync(prefFile)) return; // Tránh ghi đè file hỏng trước khi Chrome tự tạo profile chuẩn
    let prefs: any = {};
    try {
      prefs = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
    } catch {
      return;
    }
    if (!prefs.browser) prefs.browser = {};
    prefs.browser.window_placement = {
      bottom: display.y + display.height,
      left: display.x,
      maximized: true,
      right: display.x + display.width,
      top: display.y,
      work_area_bottom: display.y + display.height,
      work_area_left: display.x,
      work_area_right: display.x + display.width,
      work_area_top: display.y
    };
    fs.writeFileSync(prefFile, JSON.stringify(prefs), 'utf8');
  } catch {}
}

async function isKioskRunning(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return connectedClients.size > 0;
  }
  // 1. Kiểm tra nhanh & chính xác tuyệt đối qua TvWindowManager (quét cửa sổ & YouTubeTV_Profile trong 80ms)
  if (fs.existsSync(tvWindowManagerPath)) {
    return new Promise<boolean>((resolve) => {
      const proc = spawn(tvWindowManagerPath, ['status'], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
      let out = '';
      proc.stdout?.on('data', d => { out += d.toString(); });
      proc.on('close', () => {
        const hasWindow = out.includes('FOUND:') && !out.includes('FOUND:0');
        const hasProc = out.includes('PROCS:') && !out.includes('PROCS:0');
        resolve(hasWindow || hasProc);
      });
      proc.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 1500);
    });
  }

  return connectedClients.size > 0;
}

function launchKioskBrowser(display: DisplayInfo) {
  if (process.platform !== 'win32') return;
  updateChromeProfilePlacement(display);
  const tempDir = process.env.TEMP || os.tmpdir();
  const profileDir = path.join(tempDir, 'YouTubeTV_Profile');
  const commonArgs = [
    `--user-data-dir=${profileDir}`,
    '--profile-directory=Default',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=ProfilePicker',
    '--disable-session-crashed-bubble',
    `--window-position=${display.x},${display.y}`,
    `--window-size=${display.width},${display.height}`,
    '--autoplay-policy=no-user-gesture-required',
    '--start-fullscreen',
    `--app=http://localhost:${PORT}?tv=1`
  ];
  const candidates = [
    process.env['ProgramFiles'] ? path.join(process.env['ProgramFiles'], 'Google/Chrome/Application/chrome.exe') : '',
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe') : '',
    process.env['LOCALAPPDATA'] ? path.join(process.env['LOCALAPPDATA'], 'Google/Chrome/Application/chrome.exe') : '',
    process.env['ProgramFiles(x86)'] ? path.join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe') : '',
    process.env['ProgramFiles'] ? path.join(process.env['ProgramFiles'], 'Microsoft/Edge/Application/msedge.exe') : '',
  ].filter(p => p && fs.existsSync(p));

  const browserBin = candidates[0] || 'chrome.exe';
  try {
    const child = spawn(browserBin, commonArgs, { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
  } catch (err) {
    console.error('[Launch Kiosk Error]', err);
  }
}

// Di chuyển và đưa ngay lập tức cửa sổ TV Kiosk lên trên cùng màn hình (Foreground / Topmost) bằng Win32 API
async function moveKioskWindowToDisplay(display: DisplayInfo) {
  updateChromeProfilePlacement(display);
  if (process.platform !== 'win32') return;

  const ok = await runTvWindowManager('restore', display);
  if (ok) return;

  const ps = `
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class Win32TvForegrounder {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetProcessWindowStation(IntPtr hWinSta);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetThreadDesktop(IntPtr hDesktop);

  [DllImport("user32.dll")]
  public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool IsIconic(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

  [DllImport("user32.dll")]
  public static extern bool BringWindowToTop(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

  [DllImport("kernel32.dll")]
  public static extern uint GetCurrentThreadId();

  public static List<IntPtr> FindWindows(int[] pids) {
    List<IntPtr> list = new List<IntPtr>();
    IntPtr hWinSta = OpenWindowStation("WinSta0", false, 0x037F);
    if (hWinSta != IntPtr.Zero) SetProcessWindowStation(hWinSta);
    IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
    if (hDesk != IntPtr.Zero) SetThreadDesktop(hDesk);

    HashSet<int> pidSet = new HashSet<int>(pids);

    if (hDesk != IntPtr.Zero) {
      EnumDesktopWindows(hDesk, (hWnd, lParam) => {
        uint pid;
        GetWindowThreadProcessId(hWnd, out pid);
        StringBuilder sbCls = new StringBuilder(256);
        GetClassName(hWnd, sbCls, 256);
        string cls = sbCls.ToString();
        StringBuilder sbTitle = new StringBuilder(256);
        GetWindowText(hWnd, sbTitle, 256);
        string title = sbTitle.ToString();

        bool matchPid = pidSet.Contains((int)pid);
        bool matchTitle = title.Contains("YouTube TV") || title.Contains("YouTube-TV");
        bool matchCls = (cls == "Chrome_WidgetWin_1");

        if ((matchPid && matchCls) || (matchTitle && matchCls)) {
          if (!list.Contains(hWnd)) list.Add(hWnd);
        }
        return true;
      }, IntPtr.Zero);
    }

    EnumWindows((hWnd, lParam) => {
      uint pid;
      GetWindowThreadProcessId(hWnd, out pid);
      StringBuilder sbCls = new StringBuilder(256);
      GetClassName(hWnd, sbCls, 256);
      string cls = sbCls.ToString();
      StringBuilder sbTitle = new StringBuilder(256);
      GetWindowText(hWnd, sbTitle, 256);
      string title = sbTitle.ToString();

      bool matchPid = pidSet.Contains((int)pid);
      bool matchTitle = title.Contains("YouTube TV") || title.Contains("YouTube-TV");
      bool matchCls = (cls == "Chrome_WidgetWin_1");

      if ((matchPid && matchCls) || (matchTitle && matchCls)) {
        if (!list.Contains(hWnd)) list.Add(hWnd);
      }
      return true;
    }, IntPtr.Zero);

    return list;
  }

  public static void BringToFront(IntPtr hWnd, int x, int y, int w, int h) {
    if (hWnd == IntPtr.Zero) return;

    // 1. Chỉ gọi SW_RESTORE (9) khi cửa sổ thực sự đang bị thu nhỏ dưới Taskbar (IsIconic)
    if (IsIconic(hWnd)) {
      ShowWindow(hWnd, 9); // SW_RESTORE
    } else {
      ShowWindow(hWnd, 5); // SW_SHOW
    }

    // 2. Đưa lên đỉnh Z-order (HWND_TOPMOST = -1), không dùng SWP_FRAMECHANGED
    SetWindowPos(hWnd, new IntPtr(-1), x, y, w, h, 0x0040);

    // 3. Vượt qua cơ chế chặn chiếm tiêu điểm (Focus Stealing Prevention) của Windows bằng AttachThreadInput
    try {
      IntPtr fg = GetForegroundWindow();
      if (fg != IntPtr.Zero && fg != hWnd) {
        uint dummyPid;
        uint fgThread = GetWindowThreadProcessId(fg, out dummyPid);
        uint curThread = GetCurrentThreadId();
        if (fgThread != 0 && fgThread != curThread) {
          AttachThreadInput(curThread, fgThread, true);
          SetForegroundWindow(hWnd);
          BringWindowToTop(hWnd);
          AttachThreadInput(curThread, fgThread, false);
        }
      }
      SetForegroundWindow(hWnd);
      BringWindowToTop(hWnd);
    } catch {}

    // 4. SwitchToThisWindow không dùng hiệu ứng Alt-Tab
    try {
      SwitchToThisWindow(hWnd, false);
    } catch {}

    // 5. Giải phóng về HWND_NOTOPMOST (-2) sau khi đã chiếm đỉnh để tránh lỗi full đen màn hình của DWM
    try {
      SetWindowPos(hWnd, new IntPtr(-2), x, y, w, h, 0x0040 | 0x0001 | 0x0002);
    } catch {}
  }
}
"@

$allPids = @(Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'chrome.exe' -or $_.Name -eq 'msedge.exe') -and $_.CommandLine -like '*YouTubeTV_Profile*' } | Select-Object -ExpandProperty ProcessId)
if ($allPids.Count -gt 0) {
  $targetHwnds = [Win32TvForegrounder]::FindWindows([int[]]$allPids)
  foreach ($h in $targetHwnds) {
    [Win32TvForegrounder]::BringToFront($h, ${display.x}, ${display.y}, ${display.width}, ${display.height})
  }

  # Fallback nếu FindWindows không khớp class
  if ($targetHwnds.Count -eq 0) {
    foreach ($pidVal in $allPids) {
      $pr = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
      if ($pr -and $pr.MainWindowHandle -ne 0) {
        [Win32TvForegrounder]::BringToFront($pr.MainWindowHandle, ${display.x}, ${display.y}, ${display.width}, ${display.height})
      }
    }
  }
}
`;
  await runPowerShellEncoded(ps);
}

// Chuẩn hóa mọi bản tin setPlaylist / updatePlaylist từ iPhone để:
// 1. Khi vuốt xuống tìm kiếm và chọn video đơn lẻ (không có listId hoặc currentIndex), video luôn tự phát ngay lập tức
// 2. Không bao giờ bị xóa danh sách phát (playlistCleared) làm mất mini-player trên iPhone
const origUpdateByMessage = ytPlayer.queue.updateByMessage.bind(ytPlayer.queue);
ytPlayer.queue.updateByMessage = async (message: any, client: any) => {
  const p = message?.payload || {};
  console.log(`[Lounge Queue Message] ${message?.name}:`, JSON.stringify(p));

  let eventVideoId: string | undefined;
  let eventType: string | undefined;
  if (p.eventDetails) {
    try {
      const ed = typeof p.eventDetails === 'string' ? JSON.parse(p.eventDetails) : p.eventDetails;
      eventVideoId = ed?.videoId;
      eventType = ed?.eventType;
    } catch {}
  }

  const videoIdsList = p.videoIds ? String(p.videoIds).split(',').filter(Boolean) : [];
  const resolvedVideoId = p.videoId || eventVideoId || videoIdsList[0] || '';

  if (message?.name === 'setPlaylist') {
    if (resolvedVideoId) {
      if (isStandby) {
        exitStandbyMode('Nhận video mới từ setPlaylist');
      }
      p.videoId = resolvedVideoId;
      if (!p.videoIds || !videoIdsList.includes(resolvedVideoId)) {
        p.videoIds = resolvedVideoId;
      }
      if (!p.listId) {
        p.listId = ytPlayer.queue.id || `PPSV_${resolvedVideoId}`;
      }
      const updatedList = String(p.videoIds).split(',').filter(Boolean);
      if (p.currentIndex === undefined || p.currentIndex === null || p.currentIndex === '') {
        const idx = updatedList.indexOf(resolvedVideoId);
        p.currentIndex = String(idx >= 0 ? idx : 0);
      }
    } else if (!p.listId && ytPlayer.queue.current?.id) {
      // Giữ lại video đang phát nếu iPhone gửi gói rỗng khi người dùng vuốt thu nhỏ
      p.videoId = ytPlayer.queue.current.id;
      p.videoIds = ytPlayer.queue.videoIds.length > 0 ? ytPlayer.queue.videoIds.join(',') : ytPlayer.queue.current.id;
      p.listId = ytPlayer.queue.id || `PPSV_${ytPlayer.queue.current.id}`;
      p.currentIndex = String(ytPlayer.queue.current.context?.index ?? 0);
    }

    const res = await origUpdateByMessage(message, client);

    // Chỉ dùng fallback nếu origUpdateByMessage không gán được queue.current (tránh gọi play() 2 lần gây lỗi tua video)
    if (resolvedVideoId && !ytPlayer.queue.current) {
      console.log(`[Queue Fallback] queue.current trống, chủ động kích hoạt phát video mới: ${resolvedVideoId}`);
      const updatedIds = ytPlayer.queue.videoIds;
      const idx = updatedIds.indexOf(resolvedVideoId);
      const newTarget = {
        id: resolvedVideoId,
        client,
        context: {
          playlistId: p.listId || ytPlayer.queue.id || `PPSV_${resolvedVideoId}`,
          index: idx >= 0 ? idx : (Number(p.currentIndex) || 0)
        }
      };
      await ytPlayer.play(newTarget, parseInt(p.currentTime, 10) || 0);
    }
    return res;
  } else if (message?.name === 'updatePlaylist') {
    if (isStandby && resolvedVideoId) {
      exitStandbyMode('Nhận video mới từ updatePlaylist');
    }
    if (!p.listId && (p.videoIds || resolvedVideoId || ytPlayer.queue.id)) {
      p.listId = ytPlayer.queue.id || `PPSV_${resolvedVideoId || currentVideo.videoId}`;
    }
    if (!p.videoIds && resolvedVideoId) {
      p.videoIds = resolvedVideoId;
    }

    // Nếu người dùng chọn phát một video mới trong danh sách chờ (VIDEO_SELECTED)
    if (eventType === 'VIDEO_SELECTED' && eventVideoId) {
      exitStandbyMode('Nhận VIDEO_SELECTED từ updatePlaylist');
      await origUpdateByMessage(message, client);
      const updatedIds = ytPlayer.queue.videoIds;
      const idx = updatedIds.indexOf(eventVideoId);
      const selectedVideo = {
        id: eventVideoId,
        client,
        context: {
          playlistId: p.listId || ytPlayer.queue.id || `PPSV_${eventVideoId}`,
          index: idx >= 0 ? idx : 0
        }
      };
      await ytPlayer.play(selectedVideo, 0);
      return;
    }
  }

  return await origUpdateByMessage(message, client);
};

const ytReceiver = new YouTubeCastReceiver(ytPlayer, {
  device: {
    name: DEVICE_NAME,
    screenName: DEVICE_NAME
  },
  dial: {
    corsAllowOrigins: true,
    bindToAddresses: [localIp]
  } as any,
  app: {
    enableAutoplayOnConnect: true,
    playlistRequestHandler: new FastPlaylistRequestHandler() as any,
    resetPlayerOnDisconnectPolicy: Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_EXPLICITLY_DISCONNECTED
  },
  dataStore: persistentStore as any,
  logLevel: 'warn'
});

// Khởi tạo nhận diện màn hình và cấu hình vị trí cửa sổ đã lưu ngay khi bật server
detectDisplays().then(() => getTargetDisplay()).then((target) => {
  updateChromeProfilePlacement(target);
  console.log(`[Display Manager] Màn hình khởi động đã chọn: Màn hình ${target.id} (${target.deviceName}) [${target.x},${target.y} ${target.width}x${target.height}]`);
}).catch(() => {});

ytReceiver.on('senderConnect', async (sender: any) => {
  const senderName = sender?.name || 'iPhone';
  console.log(`[YouTube Cast] Connected to sender: ${senderName}. Kích hoạt đưa cửa sổ TV lên trên cùng màn hình!`);
  broadcastControl({ action: 'senderConnected', senderName });
  // Đưa ngay cửa sổ TV lên trên cùng màn hình và thoát chế độ ẩn khi điện thoại kết nối lại
  await exitStandbyMode(`Điện thoại kết nối lại (${senderName})`);
});

ytReceiver.on('senderDisconnect', (sender: any, implicit?: boolean) => {
  const senderName = sender?.name || 'Thiết bị';
  console.log(`[YouTube Cast] Sender disconnected: ${senderName} (implicit: ${implicit})`);
  // GIỮ NGUYÊN VIDEO ĐANG CHẠY: Rớt connect vẫn cho phép video tiếp tục chạy bình thường trên TV!
  // Tuyệt đối không dừng video và không ẩn TV khi mất kết nối từ điện thoại.
});

// WebSocket connection for the TV screen and iPhone Remote
wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws);
  ws.send(JSON.stringify({ 
    type: 'cast_video', 
    video: currentVideo,
    isStandby,
    pairingCode: formatPairingCode(realPairingCode),
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted,
    preferredQuality,
    subtitlesEnabled,
    subtitlesLang
  }));

  // Đảm bảo cửa sổ Kiosk tự động di chuyển đúng sang màn hình đã lưu khi vừa mở (nếu đang không ở chế độ ẩn)
  if (!isStandby) {
    getTargetDisplay().then((target) => {
      moveKioskWindowToDisplay(target).catch(() => {});
    }).catch(() => {});
  }

  ws.on('message', async (raw: Buffer | string) => {
    try {
      const data = JSON.parse(raw.toString());

      // Đồng bộ thời gian thực (position, duration, seekableStart, seekableEnd, playerState) từ YouTube IFrame Player trên PC gửi về
      if (data.type === 'player_sync') {
        if (data.videoId && data.videoId !== currentVideo.videoId) {
          return;
        }
        // Chặn tuyệt đối dữ liệu tồn đọng từ video cũ nếu YouTube IFrame trên PC chưa kịp chuyển sang video mới
        if (data.verifiedVideoId && data.verifiedVideoId !== currentVideo.videoId) {
          return;
        }

        let shouldNotifyLounge = Boolean(data.forceResync);
        let durationChanged = false;

        currentSeekableStartTime = 0;
        const incomingSeekEnd = typeof data.seekableEnd === 'number' && data.seekableEnd > 0 ? Math.round(data.seekableEnd) : 0;
        const incomingDur = typeof data.duration === 'number' && data.duration > 0 ? Math.round(data.duration) : 0;

        // Cập nhật vị trí giây thực tế (bỏ qua trong 1.2s đầu sau khi người dùng vừa bấm tua để tránh giật ngược)
        if (typeof data.position === 'number' && data.position >= 0) {
          if (data.forceResync || Date.now() - lastSeekTimestamp > 1200) {
            // Tính độ lệch thực tế (drift) giữa đồng hồ dự đoán trên iPhone và giây phát thực trên PC
            const iphonePredictedPos = lastLoungeSyncPlaying
              ? lastLoungeSyncPosition + (Date.now() - lastLoungeSyncTime) / 1000
              : lastLoungeSyncPosition;
            const drift = Math.abs(data.position - iphonePredictedPos);

            currentPositionSeconds = data.position;
            positionLastUpdated = Date.now();

            // Nếu đồng hồ trên iPhone lệch >= 1.5s so với video thực trên PC, hoặc sau mỗi 4s định kỳ -> ép đồng bộ lại ngay
            if (drift >= 1.5 || Date.now() - lastLoungeSyncTime >= 4000) {
              shouldNotifyLounge = true;
            }
          }
        }

        // Cập nhật thời lượng thực (không dùng Math.max tích lũy qua nhiều bài để tránh kẹt duration của video dài trước đó)
        const nextDur = Math.max(incomingDur, incomingSeekEnd);
        if (nextDur > 0) {
          // Bảo vệ: Chỉ cập nhật nếu backend chưa có duration hoặc client phát hiện duration lớn hơn (tránh bị gói tin lẻ/chương/tồn đọng nhỏ hơn ghi đè)
          if (currentVideoDuration <= 0 || nextDur > currentVideoDuration) {
            currentVideoDuration = nextDur;
            currentSeekableEndTime = nextDur;
            currentDurationVideoId = currentVideo.videoId;
          }

          const isLiveTick = lastNotifiedDuration > 0 && Math.abs(currentVideoDuration - lastNotifiedDuration) <= 3;
          if (
            lastNotifiedDuration === 0 ||
            (!isLiveTick && Math.abs(currentVideoDuration - lastNotifiedDuration) >= 1) ||
            (isLiveTick && Math.abs(currentVideoDuration - lastNotifiedDuration) >= 15 && Date.now() - lastDurationNotifyTime > 10000)
          ) {
            durationChanged = true;
            shouldNotifyLounge = true;
            lastNotifiedDuration = currentVideoDuration;
            lastDurationNotifyTime = Date.now();
            console.log(`[Player Sync] Đã đồng bộ thời lượng thực của video (${currentVideo.videoId}): ${currentVideoDuration}s (pos=${Math.floor(currentPositionSeconds)}s)`);
          }

          if (pendingDurationResolver) {
            const r = pendingDurationResolver;
            pendingDurationResolver = null;
            r(currentVideoDuration);
          }
        }

        // Đồng bộ trạng thái Đang phát / Tạm dừng / Kết thúc từ trình phát YouTube
        if (typeof data.playerState === 'number') {
          if (data.playerState === 1) {
            cancelAutoStandby();
            if (!isVideoPlaying) {
              isVideoPlaying = true;
              positionLastUpdated = Date.now();
              shouldNotifyLounge = true;
            }
          } else if (data.playerState === 2 && isVideoPlaying && Date.now() - lastSeekTimestamp > 1200) {
            isVideoPlaying = false;
            shouldNotifyLounge = true;
          } else if (data.playerState === 0) {
            // Video kết thúc: Chỉ xử lý khi video đã phát ổn định (> 2.5s từ lúc nạp bài)
            if (!isStandby && Date.now() - lastVideoLoadTimestamp > 2500) {
              isVideoPlaying = false;
              currentVideo.isPlaying = false;
              const queueIds = ytPlayer.queue.videoIds || [];
              const curIdx = queueIds.indexOf(currentVideo.videoId);
              const hasNextInQueue = queueIds.length > 1 && curIdx >= 0 && curIdx < queueIds.length - 1;
              if (hasNextInQueue) {
                console.log(`[Player Sync] Video (${currentVideo.videoId}) kết thúc -> Tự động phát bài tiếp theo trong hàng đợi...`);
                ytPlayer.next().catch(() => {});
              } else if (!autoStandbyTimer) {
                console.log(`[Player Sync] Video (${currentVideo.videoId}) đã kết thúc và không còn bài tiếp theo. Tự động về Chế độ chờ sau 1s...`);
                ytPlayer.stop().catch(() => {});
                scheduleAutoStandby('Hết video và không có bài tiếp theo', 1000);
              }
            }
            return;
          }
        }

        // Báo cho ứng dụng YouTube trên iPhone cập nhật thanh thời gian & tổng thời lượng chính xác (gửi nguyên khối NowPlaying + OnStateChange, không dùng trạng thái LOADING giả)
        if (
          currentVideoDuration > 0 &&
          (durationChanged || data.forceResync || (Date.now() - lastSeekTimestamp > 1200 && shouldNotifyLounge && Date.now() - lastExternalNotifyTime > 700))
        ) {
          lastExternalNotifyTime = Date.now();
          lastLoungeSyncPosition = currentPositionSeconds;
          lastLoungeSyncTime = Date.now();
          lastLoungeSyncPlaying = isVideoPlaying;
          const targetStatus = isVideoPlaying
            ? Constants.PLAYER_STATUSES.PLAYING
            : Constants.PLAYER_STATUSES.PAUSED;
          if (ytPlayer.status === Constants.PLAYER_STATUSES.PLAYING || ytPlayer.status === Constants.PLAYER_STATUSES.PAUSED || ytPlayer.status === Constants.PLAYER_STATUSES.LOADING) {
            await (ytPlayer as any).notifyExternalStateChange(targetStatus, true).catch(() => {});
          }
        }
        return;
      }

      if (data.type === 'video_ended') {
        if (!isStandby && Date.now() - lastVideoLoadTimestamp > 2500) {
          if (!data.videoId || data.videoId === currentVideo.videoId) {
            isVideoPlaying = false;
            currentVideo.isPlaying = false;
            const queueIds = ytPlayer.queue.videoIds || [];
            const curIdx = queueIds.indexOf(currentVideo.videoId);
            const hasNextInQueue = queueIds.length > 1 && curIdx >= 0 && curIdx < queueIds.length - 1;
            if (hasNextInQueue) {
              console.log(`[Video Ended] Video (${currentVideo.videoId}) kết thúc -> Tự động phát bài tiếp theo trong hàng đợi...`);
              ytPlayer.next().catch(() => {});
            } else if (!autoStandbyTimer) {
              console.log(`[Video Ended] Video (${currentVideo.videoId}) đã kết thúc -> Tự động về Chế độ chờ sau 1s...`);
              ytPlayer.stop().catch(() => {});
              scheduleAutoStandby('Hết video và không có bài tiếp theo', 1000);
            }
          }
        }
        return;
      }

      if (data.type === 'standby' || (data.type === 'control' && data.action === 'standby')) {
        await enterStandbyMode('Yêu cầu từ Remote/Client');
        return;
      }

      if (data.type === 'wake' || (data.type === 'control' && data.action === 'wake')) {
        await exitStandbyMode('Yêu cầu từ Remote/Client');
        return;
      }

      if (data.type === 'control') {
        if (data.action === 'setVolume' && typeof data.value === 'number') {
          currentVolumeLevel = Math.max(0, Math.min(100, Math.round(data.value)));
          isVolumeMuted = false;
          handleVolumeAutomation(currentVolumeLevel, false, 'Remote WebSocket');
        } else if (data.action === 'mute') {
          isVolumeMuted = true;
          handleVolumeAutomation(currentVolumeLevel, true, 'Remote WebSocket');
        } else if (data.action === 'unMute') {
          isVolumeMuted = false;
          handleVolumeAutomation(currentVolumeLevel, false, 'Remote WebSocket');
        } else if (data.action === 'seekRelative' && typeof data.value === 'number') {
          let basePos = currentPositionSeconds;
          if (isVideoPlaying && Date.now() - lastSeekTimestamp > 1200) {
            basePos += (Date.now() - positionLastUpdated) / 1000;
          }
          let target = Math.max(0, Math.round(basePos + data.value));
          const maxDur = Math.max(currentVideoDuration, currentSeekableEndTime);
          if (maxDur > 0 && target > maxDur) {
            target = Math.max(0, maxDur - 1);
          }
          currentPositionSeconds = target;
          positionLastUpdated = Date.now();
          lastSeekTimestamp = Date.now();
          lastLoungeSyncPosition = target;
          lastLoungeSyncTime = Date.now();
          data.action = 'seekTo';
          data.value = target;
          (ytPlayer as any).notifyExternalStateChange(undefined, true).catch(() => {});
          if (currentVideo.videoId) {
            schedulePostLoadResyncs(currentVideo.videoId);
          }
        } else if (data.action === 'seekTo' && typeof data.value === 'number') {
          const target = Math.max(0, Math.floor(data.value));
          currentPositionSeconds = target;
          positionLastUpdated = Date.now();
          lastSeekTimestamp = Date.now();
          lastLoungeSyncPosition = target;
          lastLoungeSyncTime = Date.now();
          (ytPlayer as any).notifyExternalStateChange(undefined, true).catch(() => {});
          if (currentVideo.videoId) {
            schedulePostLoadResyncs(currentVideo.videoId);
          }
        } else if (data.action === 'resync') {
          broadcastControl({ action: 'requestSync' });
          setTimeout(() => {
            forceLoungeTimelineResync('Manual / Remote Resync').catch(() => {});
          }, 150);
          return;
        } else if (data.action === 'setQuality' && typeof data.value === 'string') {
          preferredQuality = data.value;
          persistentStore.set('tv.preferredQuality', preferredQuality).catch(() => {});
          console.log(`[Player Settings] Đã chỉnh độ phân giải ưu tiên: ${preferredQuality}`);
        } else if (data.action === 'setSubtitles') {
          subtitlesEnabled = Boolean(data.enabled);
          if (typeof data.lang === 'string' && data.lang) {
            subtitlesLang = data.lang;
            persistentStore.set('tv.subtitlesLang', subtitlesLang).catch(() => {});
          }
          persistentStore.set('tv.subtitlesEnabled', subtitlesEnabled).catch(() => {});
          console.log(`[Player Settings] Đã chỉnh phụ đề: ${subtitlesEnabled ? `BẬT (${subtitlesLang})` : 'TẮT'}`);
        } else if (data.action === 'toggleSubtitles') {
          subtitlesEnabled = !subtitlesEnabled;
          if (typeof data.lang === 'string' && data.lang) {
            subtitlesLang = data.lang;
            persistentStore.set('tv.subtitlesLang', subtitlesLang).catch(() => {});
          }
          persistentStore.set('tv.subtitlesEnabled', subtitlesEnabled).catch(() => {});
          data.action = 'setSubtitles';
          data.enabled = subtitlesEnabled;
          data.lang = subtitlesLang;
          console.log(`[Player Settings] Chuyển đổi phụ đề: ${subtitlesEnabled ? `BẬT (${subtitlesLang})` : 'TẮT'}`);
        }

        // Forward control commands to TV screen & remotes
        connectedClients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } else if (data.type === 'cast') {
        const vid = data.videoId;
        if (vid) {
          currentVideoDuration = 0;
          currentSeekableStartTime = 0;
          currentSeekableEndTime = 0;
          lastDurationNotifyTime = 0;
          lastNotifiedDuration = 0;
          lastSeekTimestamp = 0;
          currentPositionSeconds = 0;
          positionLastUpdated = Date.now();
          broadcastVideo({
            videoId: vid,
            title: data.title || `Video YouTube (${vid})`,
            isPlaying: true,
            startSeconds: 0,
            timestamp: Date.now(),
            source: 'iPhone Remote Control'
          });
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

const pairingService = ytReceiver.getPairingCodeRequestService();
pairingService.on('response', (code: string) => {
  console.log(`[YouTube Official TV Code]: ${code}`);
  realPairingCode = code;
  broadcastPairingCode(code);
});

pairingService.on('error', (err: any) => {
  console.log('[YouTube Pairing Code Error]:', err.message);
  // Auto restart pairing service if it stopped
  setTimeout(() => {
    try { pairingService.start(); } catch {}
  }, 5000);
});

// Start YouTube Cast receiver services
async function initCastReceiver() {
  try {
    await ytReceiver.start();
    pairingService.start();
    console.log(`[YouTube Cast Engine] Running with DIAL on LAN! Ready for iPhone Cast.`);
  } catch (err: any) {
    console.log('[YouTube Cast Receiver Init]:', err.message);
  }
}

initCastReceiver();

// ==========================================
// HTTP ENDPOINTS
// ==========================================

// Dedicated Mobile Web Remote endpoint for iPhone
app.get('/remote', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'remote.html'));
});

// REST API for direct cast
app.post('/api/cast', async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  }
  const url = body?.url || (typeof req.body === 'string' ? req.body : '');
  let targetId = body?.videoId || '';

  if (url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (match && match[1]) targetId = match[1];
    else {
      const anyMatch = url.match(/([a-zA-Z0-9_-]{11})/);
      if (anyMatch) targetId = anyMatch[1];
    }
  }

  if (targetId) {
    if (isStandby) {
      await exitStandbyMode('Cast từ Web / iPhone');
    }

    let resolvedTitle = body?.title;
    if (!resolvedTitle || resolvedTitle.startsWith('Video') || resolvedTitle.startsWith('YouTube Video')) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${targetId}&format=json`);
        if (oembedRes.ok) {
          const oData = (await oembedRes.json()) as any;
          if (oData.title) resolvedTitle = oData.title;
        }
      } catch {}
    }

    currentDurationVideoId = targetId;
    currentVideoDuration = 0;
    currentSeekableStartTime = 0;
    currentSeekableEndTime = 0;
    lastDurationNotifyTime = 0;
    lastNotifiedDuration = 0;
    lastSeekTimestamp = 0;
    currentPositionSeconds = 0;
    positionLastUpdated = Date.now();

    resolveVideoMetadataAsync(targetId);

    broadcastVideo({
      videoId: targetId,
      title: resolvedTitle || `YouTube Video (${targetId})`,
      isPlaying: true,
      startSeconds: 0,
      timestamp: Date.now(),
      source: body?.source || 'Cast từ Web / iPhone'
    });
    return res.json({ success: true, videoId: targetId, title: resolvedTitle });
  }

  return res.status(400).json({ error: 'Video ID or URL invalid' });
});

app.get('/api/status', (req, res) => {
  return res.json({
    localIp,
    port: PORT,
    deviceName: DEVICE_NAME,
    pairingCode: formatPairingCode(realPairingCode),
    rawPairingCode: realPairingCode,
    isLoungeConnected: (ytReceiver.status as string) === 'running',
    isStandby,
    currentVideo,
    position: Math.floor(currentPositionSeconds),
    duration: Math.max(currentVideoDuration, currentSeekableEndTime),
    seekableStartTime: currentSeekableStartTime,
    seekableEndTime: Math.max(currentSeekableEndTime, currentVideoDuration),
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted,
    preferredQuality,
    subtitlesEnabled,
    subtitlesLang,
    connectedScreenClients: connectedClients.size
  });
});

// Chuyển đổi thủ công Chế độ chờ (Standby) từ API / Web / Remote
app.post('/api/standby', async (req, res) => {
  const { standby } = req.body || {};
  if (standby === false) {
    await exitStandbyMode('Yêu cầu bật từ API / Web');
    if (!currentVideo.videoId) {
      currentVideo.videoId = 'LXb3EKWsInQ';
      currentVideo.title = 'Thiên Nhiên 4K Ultra HD';
      currentVideo.source = 'Bật từ Chế độ chờ';
      broadcastVideo(currentVideo);
    }
  } else {
    await enterStandbyMode('Yêu cầu Chế độ chờ từ API / Web');
  }
  return res.json({ success: true, isStandby });
});

// 1-Tap endpoints cho iOS Shortcut / Siri / Home Screen Widget / Webhook (hỗ trợ cả GET và POST)
app.get('/api/hide', async (req, res) => {
  await enterStandbyMode('Yêu cầu từ iOS Shortcut / Webhook (/api/hide)');
  return res.json({ success: true, isStandby: true });
});

app.post('/api/hide', async (req, res) => {
  await enterStandbyMode('Yêu cầu từ iOS Shortcut / Webhook (/api/hide)');
  return res.json({ success: true, isStandby: true });
});

app.get('/api/wake', async (req, res) => {
  await exitStandbyMode('Yêu cầu từ iOS Shortcut / Webhook (/api/wake)');
  return res.json({ success: true, isStandby: false });
});

app.post('/api/wake', async (req, res) => {
  await exitStandbyMode('Yêu cầu từ iOS Shortcut / Webhook (/api/wake)');
  return res.json({ success: true, isStandby: false });
});

app.get('/api/toggle', async (req, res) => {
  if (isStandby) {
    await exitStandbyMode('Toggle từ iOS Shortcut / Webhook');
  } else {
    await enterStandbyMode('Toggle từ iOS Shortcut / Webhook');
  }
  return res.json({ success: true, isStandby });
});

app.post('/api/toggle', async (req, res) => {
  if (isStandby) {
    await exitStandbyMode('Toggle từ iOS Shortcut / Webhook');
  } else {
    await enterStandbyMode('Toggle từ iOS Shortcut / Webhook');
  }
  return res.json({ success: true, isStandby });
});

// Refresh pairing code endpoint
app.post('/api/refresh-code', async (req, res) => {
  try {
    pairingService.stop();
    pairingService.start();
  } catch {}
  return res.json({ 
    success: true, 
    pairingCode: formatPairingCode(realPairingCode) 
  });
});

// Đồng bộ lại thời gian thực (Timeline Resync) giữa PC IFrame và iPhone YouTube App
app.post('/api/resync', async (req, res) => {
  broadcastControl({ action: 'requestSync' });
  await new Promise(r => setTimeout(r, 200));
  await forceLoungeTimelineResync('API /api/resync');
  return res.json({
    success: true,
    videoId: currentVideo.videoId,
    position: Math.floor(currentPositionSeconds),
    duration: currentVideoDuration,
    isPlaying: isVideoPlaying
  });
});

// Lấy danh sách màn hình kết nối và màn hình đang được chọn lưu
app.get('/api/displays', async (req, res) => {
  const displays = await detectDisplays();
  const target = await getTargetDisplay();
  return res.json({
    displays,
    selectedDeviceName: target.deviceName,
    selectedDisplay: target
  });
});

// Trả về cờ vị trí màn hình cho start.bat (--window-position=X,Y --window-size=W,H)
app.get('/api/display-flags', async (req, res) => {
  const target = await getTargetDisplay();
  updateChromeProfilePlacement(target);
  res.type('text/plain').send(`--window-position=${target.x},${target.y} --window-size=${target.width},${target.height}`);
});

// Kiểm tra xem cửa sổ Kiosk Chrome/Edge đã đang mở hay chưa (tránh mở nhiều cửa sổ trùng lặp)
app.get('/api/is-kiosk-running', async (req, res) => {
  const running = await isKioskRunning();
  return res.json({ running });
});

// Chọn và lưu màn hình hiển thị TV (chuyển cửa sổ ngay lập tức & lưu cho lần khởi động sau)
app.post('/api/displays/select', async (req, res) => {
  const { deviceName, id } = req.body || {};
  const displays = await detectDisplays();
  const target = displays.find(d => (deviceName && d.deviceName === deviceName) || (id && d.id === Number(id)));
  if (!target) {
    return res.status(400).json({ error: 'Display not found' });
  }

  preferredDisplayDeviceName = target.deviceName;
  await persistentStore.set('tv.preferredDisplay', target.deviceName);
  console.log(`[Display Manager] Đã lưu cài đặt màn hình: Màn hình ${target.id} (${target.deviceName}) [${target.x},${target.y}]`);

  await moveKioskWindowToDisplay(target);

  broadcastControl({
    action: 'displayChanged',
    selectedDeviceName: target.deviceName,
    selectedDisplay: target
  });

  return res.json({
    success: true,
    selectedDeviceName: target.deviceName,
    selectedDisplay: target,
    displays
  });
});

// Lấy cấu hình tự động hóa & custom actions
app.get('/api/settings/automation', async (req, res) => {
  const onZeroVolume = (await persistentStore.get('automation.onZeroVolume')) || '';
  const onWake = (await persistentStore.get('automation.onWake')) || '';
  const collapseOnZeroVolume = (await persistentStore.get('automation.collapseOnZeroVolume')) !== false;
  const restoreOnWake = (await persistentStore.get('automation.restoreOnWake')) !== false;

  return res.json({
    onZeroVolume,
    onWake,
    collapseOnZeroVolume,
    restoreOnWake
  });
});

// Lưu cấu hình tự động hóa & custom actions
app.post('/api/settings/automation', async (req, res) => {
  const { onZeroVolume, onWake, collapseOnZeroVolume, restoreOnWake } = req.body || {};
  if (typeof onZeroVolume === 'string') {
    await persistentStore.set('automation.onZeroVolume', onZeroVolume.trim());
  }
  if (typeof onWake === 'string') {
    await persistentStore.set('automation.onWake', onWake.trim());
  }
  if (typeof collapseOnZeroVolume === 'boolean') {
    await persistentStore.set('automation.collapseOnZeroVolume', collapseOnZeroVolume);
  }
  if (typeof restoreOnWake === 'boolean') {
    await persistentStore.set('automation.restoreOnWake', restoreOnWake);
  }

  console.log('[Automation Settings] Đã cập nhật cài đặt tự động hóa thành công:', {
    onZeroVolume,
    onWake,
    collapseOnZeroVolume,
    restoreOnWake
  });

  return res.json({ success: true, message: 'Đã lưu cấu hình tự động hóa thành công!' });
});

// Chạy thử (Test Run) lệnh tự động hóa ngay từ UI
app.post('/api/settings/automation/test', async (req, res) => {
  const { command, trigger } = req.body || {};
  const targetTrigger = trigger || 'zero_volume';
  const result = await runCustomAutomation(targetTrigger, command);
  return res.json(result);
});

// Quit app endpoint (Đóng Kiosk TV & tắt máy chủ từ chế độ Fullscreen)
app.post('/api/quit', async (req, res) => {
  console.log('[System] Nhận lệnh Tắt ứng dụng từ giao diện...');
  broadcastControl({ action: 'quit' });
  res.json({ success: true });

  setTimeout(() => {
    try {
      server.close();
    } catch {}

    // Đóng cửa sổ trình duyệt Kiosk được mở bởi start.bat (YouTubeTV_Profile) mà không ảnh hưởng trình duyệt cá nhân
    if (process.platform === 'win32') {
      exec(
        `powershell -WindowStyle Hidden -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*YouTubeTV_Profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`,
        { windowsHide: true },
        () => {
          process.exit(0);
        }
      );
      setTimeout(() => process.exit(0), 1200);
    } else {
      process.exit(0);
    }
  }, 300);
});

// ==========================================
// Vite / Static Frontend
// ==========================================
const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const assetsDir = path.resolve(distDir, 'assets');

  if (!isProd || !fs.existsSync(path.resolve(distDir, 'index.html'))) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Tự động ánh xạ file bundle .js / .css mới nhất nếu trình duyệt còn lưu cache tên hash cũ (chống tuyệt đối lỗi màn hình trắng)
    app.use('/assets', (req, res, next) => {
      const requestedFile = path.join(assetsDir, path.basename(req.path));
      if (fs.existsSync(requestedFile)) {
        return next();
      }
      try {
        if (fs.existsSync(assetsDir)) {
          const files = fs.readdirSync(assetsDir);
          if (req.path.endsWith('.js')) {
            const latestJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
            if (latestJs) {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
              res.type('application/javascript');
              return res.sendFile(path.join(assetsDir, latestJs));
            }
          } else if (req.path.endsWith('.css')) {
            const latestCss = files.find(f => f.startsWith('index-') && f.endsWith('.css'));
            if (latestCss) {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
              res.type('text/css');
              return res.sendFile(path.join(assetsDir, latestCss));
            }
          }
        }
      } catch {}
      next();
    });

    app.use(express.static(distDir, {
      etag: false,
      lastModified: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    app.use((req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Cast Receiver running on http://${localIp}:${PORT} (Local PC mode ready)`);
  });
}

startServer();
