import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
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
const DEVICE_NAME = 'PC Windows (YouTube TV)';

// Store current casted video and connected clients
let currentVideo = {
  videoId: 'LXb3EKWsInQ', // Default 4K Nature relaxation
  title: 'Thiên Nhiên 4K Ultra HD',
  isPlaying: true,
  startSeconds: 0,
  timestamp: Date.now(),
  source: 'Chế độ chờ (Standby)'
};

let realPairingCode = '';
const connectedClients = new Set<WebSocket>();

// Biến theo dõi âm lượng, vị trí và thời lượng thực tế của video đang phát
let currentVolumeLevel = 30; // Mặc định 30% khi khởi động
let isVolumeMuted = false;
let currentPositionSeconds = 0;
let currentVideoDuration = 0; // Thời lượng thực của video (giây) đồng bộ từ YouTube IFrame Player
let positionLastUpdated = Date.now();
let isVideoPlaying = true;
let lastSeekTimestamp = 0; // Chống nhảy ngược về 0s khi đang tua
let lastExternalNotifyTime = 0;

// Resolver chờ thời lượng thực từ trình phát khi bắt đầu video mới
let pendingDurationResolver: ((dur: number) => void) | null = null;

function broadcastVideo(videoData: typeof currentVideo) {
  currentVideo = videoData;
  const message = JSON.stringify({
    type: 'cast_video',
    video: currentVideo,
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted
  });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
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

// Fetch tiêu đề video chạy ngầm không làm chậm luồng phát
async function resolveVideoTitleAsync(videoId: string) {
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedRes.ok) {
      const oData = (await oembedRes.json()) as any;
      if (oData?.title && currentVideo.videoId === videoId) {
        currentVideo.title = oData.title;
        broadcastControl({ action: 'updateTitle', videoId, title: oData.title });
      }
    }
  } catch {}
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
  protected async doPlay(video: any, position: number): Promise<boolean> {
    const startSec = Math.max(0, Math.floor(Number(position) || 0));
    console.log(`[YouTube Cast Received from iPhone] Video ID: ${video.id}, Position: ${startSec}s`);
    currentPositionSeconds = startSec;
    positionLastUpdated = Date.now();
    lastSeekTimestamp = Date.now();
    isVideoPlaying = true;

    // Đặt lại thời lượng khi đổi sang video khác
    if (currentVideo.videoId !== video.id) {
      currentVideoDuration = 0;
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

    if (!video.title) {
      resolveVideoTitleAsync(video.id);
    }

    // Chờ tối đa 800ms để trình phát YouTube trên PC gửi về thời lượng thực (duration) của video
    // Giúp thanh tua trên iPhone hiển thị đúng ngay lập tức khi bắt đầu phát
    if (currentVideoDuration <= 0 && connectedClients.size > 0) {
      await new Promise<number>((resolve) => {
        pendingDurationResolver = resolve;
        setTimeout(() => {
          if (pendingDurationResolver === resolve) {
            pendingDurationResolver = null;
            resolve(currentVideoDuration);
          }
        }, 800);
      });
    }

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
    positionLastUpdated = Date.now();
    isVideoPlaying = true;
    broadcastControl({ action: 'play' });
    return true;
  }

  protected async doStop(): Promise<boolean> {
    console.log('[YouTube Cast from iPhone] Stop/Transition command');
    isVideoPlaying = false;
    // Không gửi lệnh dừng cứng màn hình để việc vuốt xuống tìm video khác hoặc chuyển bài diễn ra mượt mà
    return true;
  }

  protected async doSeek(position: number): Promise<boolean> {
    let target = Math.max(0, Math.floor(Number(position) || 0));
    if (currentVideoDuration > 0 && target > currentVideoDuration) {
      target = Math.max(0, currentVideoDuration - 1);
    }
    console.log(`[YouTube Cast Tua] iPhone yêu cầu tua tới: ${target}s (Duration: ${currentVideoDuration}s)`);
    currentPositionSeconds = target;
    positionLastUpdated = Date.now();
    lastSeekTimestamp = Date.now();
    broadcastControl({ action: 'seekTo', value: target });
    return true;
  }

  protected async doSetVolume(volume: { level: number; muted: boolean }): Promise<boolean> {
    console.log(`[YouTube Cast from iPhone] Set volume: ${volume.level}%, muted: ${volume.muted}`);
    currentVolumeLevel = Math.max(0, Math.min(100, Math.round(volume.level)));
    isVolumeMuted = Boolean(volume.muted);
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
    if (currentVideoDuration > 0 && current > currentVideoDuration) {
      current = currentVideoDuration;
    }
    return Math.max(0, Math.floor(current));
  }

  protected async doGetDuration(): Promise<number> {
    // Trả về chính xác thời lượng thực của video từ YouTube Player trên PC
    return currentVideoDuration > 0 ? Math.round(currentVideoDuration) : 0;
  }
}

const ytPlayer = new WebCastPlayer();
const persistentStore = new PersistentDataStore();

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
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: 6000 }, (err, stdout) => {
      if (err) return resolve('');
      resolve((stdout || '').trim());
    });
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
    const defaultDir = path.join(tempDir, 'YouTubeTV_Profile', 'Default');
    fs.mkdirSync(defaultDir, { recursive: true });
    const prefFile = path.join(defaultDir, 'Preferences');
    let prefs: any = {};
    if (fs.existsSync(prefFile)) {
      try {
        prefs = JSON.parse(fs.readFileSync(prefFile, 'utf8'));
      } catch {}
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

// Di chuyển ngay lập tức cửa sổ TV Kiosk đang mở sang màn hình được chọn bằng Win32 API
async function moveKioskWindowToDisplay(display: DisplayInfo) {
  updateChromeProfilePlacement(display);
  if (process.platform !== 'win32') return;

  const ps = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32TvMover {
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*YouTubeTV_Profile*' }
foreach ($p in $procs) {
  try {
    $procObj = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
    if ($procObj -and $procObj.MainWindowHandle -ne 0) {
      $h = $procObj.MainWindowHandle
      [Win32TvMover]::ShowWindow($h, 9) | Out-Null
      [Win32TvMover]::SetWindowPos($h, [IntPtr]::Zero, ${display.x}, ${display.y}, ${display.width}, ${display.height}, 0x0040) | Out-Null
      [Win32TvMover]::ShowWindow($h, 3) | Out-Null
      [Win32TvMover]::SetWindowPos($h, [IntPtr]::Zero, ${display.x}, ${display.y}, ${display.width}, ${display.height}, 0x0040) | Out-Null
    }
  } catch {}
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
      p.videoId = resolvedVideoId;
      if (!p.videoIds) {
        p.videoIds = resolvedVideoId;
      } else if (!videoIdsList.includes(resolvedVideoId)) {
        p.videoIds = [resolvedVideoId, ...videoIdsList].join(',');
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

    // Đảm bảo YouTubeApp luôn nhận diện có sự thay đổi để gọi player.play() cho video được chọn
    if (ytPlayer.queue.current?.context && resolvedVideoId) {
      ytPlayer.queue.current.context.index = -999;
    }
  } else if (message?.name === 'updatePlaylist') {
    if (!p.listId && (p.videoIds || resolvedVideoId || ytPlayer.queue.id)) {
      p.listId = ytPlayer.queue.id || `PPSV_${resolvedVideoId || currentVideo.videoId}`;
    }
    if (!p.videoIds && resolvedVideoId) {
      p.videoIds = resolvedVideoId;
    }

    // Nếu người dùng chọn phát một video mới trong danh sách chờ (VIDEO_SELECTED)
    if (eventType === 'VIDEO_SELECTED' && eventVideoId) {
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
    friendlyName: DEVICE_NAME,
    corsAllowOrigins: true,
    bindToAddresses: [localIp]
  },
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

ytReceiver.on('senderConnect', (sender: any) => {
  console.log(`[YouTube Cast] Connected to sender: ${sender?.name || 'iPhone'}`);
  broadcastControl({ action: 'senderConnected', senderName: sender?.name });
});

ytReceiver.on('senderDisconnect', (sender: any) => {
  console.log(`[YouTube Cast] Disconnected from sender: ${sender?.name || 'iPhone'}`);
});

// WebSocket connection for the TV screen and iPhone Remote
wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws);
  ws.send(JSON.stringify({ 
    type: 'cast_video', 
    video: currentVideo,
    pairingCode: formatPairingCode(realPairingCode),
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted
  }));

  // Đảm bảo cửa sổ Kiosk tự động di chuyển đúng sang màn hình đã lưu khi vừa mở
  getTargetDisplay().then((target) => {
    moveKioskWindowToDisplay(target).catch(() => {});
  }).catch(() => {});

  ws.on('message', (raw: Buffer | string) => {
    try {
      const data = JSON.parse(raw.toString());

      // Đồng bộ thời gian thực (position, duration, playerState) từ YouTube IFrame Player trên PC gửi về
      if (data.type === 'player_sync') {
        if (data.videoId && data.videoId !== currentVideo.videoId) {
          return;
        }

        let shouldNotifyLounge = false;

        // Cập nhật thời lượng thực của video
        if (typeof data.duration === 'number' && data.duration > 0) {
          const roundedDur = Math.round(data.duration);
          if (Math.abs(roundedDur - currentVideoDuration) >= 1) {
            currentVideoDuration = roundedDur;
            shouldNotifyLounge = true;
            console.log(`[Player Sync] Đã đồng bộ thời lượng thực của video (${currentVideo.videoId}): ${currentVideoDuration}s`);
          }
          if (pendingDurationResolver) {
            const r = pendingDurationResolver;
            pendingDurationResolver = null;
            r(currentVideoDuration);
          }
        }

        // Cập nhật vị trí giây thực tế (bỏ qua trong 1.5s đầu sau khi người dùng vừa bấm tua để tránh giật ngược)
        if (typeof data.position === 'number' && data.position >= 0) {
          if (Date.now() - lastSeekTimestamp > 1500) {
            const prevPos = Math.floor(currentPositionSeconds);
            currentPositionSeconds = data.position;
            positionLastUpdated = Date.now();
            if (Math.abs(Math.floor(data.position) - prevPos) >= 2) {
              shouldNotifyLounge = true;
            }
          }
        }

        // Đồng bộ trạng thái Đang phát / Tạm dừng / Kết thúc từ trình phát YouTube
        if (typeof data.playerState === 'number') {
          if (data.playerState === 1 && !isVideoPlaying) {
            isVideoPlaying = true;
            positionLastUpdated = Date.now();
            shouldNotifyLounge = true;
          } else if (data.playerState === 2 && isVideoPlaying && Date.now() - lastSeekTimestamp > 1500) {
            isVideoPlaying = false;
            shouldNotifyLounge = true;
          } else if (data.playerState === 0 && currentVideoDuration > 0 && currentPositionSeconds >= currentVideoDuration - 3) {
            // Video kết thúc -> tự động chuyển bài tiếp theo trong hàng đợi
            ytPlayer.next().catch(() => {});
          }
        }

        // Báo cho ứng dụng YouTube trên iPhone cập nhật thanh thời gian chính xác
        if (shouldNotifyLounge && Date.now() - lastExternalNotifyTime > 800) {
          lastExternalNotifyTime = Date.now();
          const targetStatus = isVideoPlaying
            ? Constants.PLAYER_STATUSES.PLAYING
            : Constants.PLAYER_STATUSES.PAUSED;
          if (ytPlayer.status === Constants.PLAYER_STATUSES.PLAYING || ytPlayer.status === Constants.PLAYER_STATUSES.PAUSED || ytPlayer.status === Constants.PLAYER_STATUSES.LOADING) {
            ytPlayer.notifyExternalStateChange(targetStatus).catch(() => {});
          }
        }
        return;
      }

      if (data.type === 'control') {
        if (data.action === 'setVolume' && typeof data.value === 'number') {
          currentVolumeLevel = Math.max(0, Math.min(100, Math.round(data.value)));
          isVolumeMuted = false;
        } else if (data.action === 'mute') {
          isVolumeMuted = true;
        } else if (data.action === 'unMute') {
          isVolumeMuted = false;
        } else if (data.action === 'seekRelative' && typeof data.value === 'number') {
          let target = Math.max(0, Math.floor(currentPositionSeconds + data.value));
          if (currentVideoDuration > 0 && target > currentVideoDuration) {
            target = Math.max(0, currentVideoDuration - 1);
          }
          currentPositionSeconds = target;
          positionLastUpdated = Date.now();
          lastSeekTimestamp = Date.now();
          data.action = 'seekTo';
          data.value = target;
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

    currentVideoDuration = 0;
    currentPositionSeconds = 0;
    positionLastUpdated = Date.now();

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
    currentVideo,
    position: Math.floor(currentPositionSeconds),
    duration: currentVideoDuration,
    volume: currentVolumeLevel,
    isMuted: isVolumeMuted,
    connectedScreenClients: connectedClients.size
  });
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

// Quit app endpoint (Đóng Kiosk TV & tắt máy chủ từ chế độ Fullscreen)
app.post('/api/quit', async (req, res) => {
  console.log('[System] Nhận lệnh Tắt ứng dụng từ màn hình Fullscreen...');
  broadcastControl({ action: 'quit' });
  res.json({ success: true });

  setTimeout(() => {
    // Đóng cửa sổ trình duyệt Kiosk được mở bởi start.bat (YouTubeTV_Profile) mà không ảnh hưởng trình duyệt cá nhân
    if (process.platform === 'win32') {
      exec(
        `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*YouTubeTV_Profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"`,
        () => {
          process.exit(0);
        }
      );
      setTimeout(() => process.exit(0), 1500);
    } else {
      process.exit(0);
    }
  }, 300);
});

// ==========================================
// Vite / Static Frontend
// ==========================================
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube Cast Receiver running on http://${localIp}:${PORT} (Local PC mode ready)`);
  });
}

startServer();
