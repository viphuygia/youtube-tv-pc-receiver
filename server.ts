import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
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
  timestamp: Date.now(),
  source: 'Chế độ chờ (Standby)'
};

let realPairingCode = '';
const connectedClients = new Set<WebSocket>();

function broadcastVideo(videoData: typeof currentVideo) {
  currentVideo = videoData;
  const message = JSON.stringify({ type: 'cast_video', video: currentVideo });
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

  ws.on('message', (raw: Buffer | string) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === 'control') {
        if (data.action === 'setVolume' && typeof data.value === 'number') {
          currentVolumeLevel = Math.max(0, Math.min(100, Math.round(data.value)));
          isVolumeMuted = false;
        } else if (data.action === 'mute') {
          isVolumeMuted = true;
        } else if (data.action === 'unMute') {
          isVolumeMuted = false;
        }

        // Forward control commands (togglePlay, play, pause, toggleMute, toggleFullscreen, seek, setVolume)
        connectedClients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } else if (data.type === 'cast') {
        const vid = data.videoId;
        if (vid) {
          broadcastVideo({
            videoId: vid,
            title: data.title || `Video YouTube (${vid})`,
            isPlaying: true,
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

// ==========================================
// OFFICIAL YOUTUBE CAST ENGINE (yt-cast-receiver)
// Handles true Google Lounge connection, DIAL, and Link with TV code
// ==========================================
class MemoryDataStore {
  map = new Map<string, any>();
  async get(key: string) { return this.map.get(key); }
  async set(key: string, val: any) { this.map.set(key, val); }
  setLogger() {}
}

// Biến theo dõi âm lượng, vị trí và thời gian phát video thực tế cho iPhone
let currentVolumeLevel = 30; // Mặc định 30% khi khởi động theo yêu cầu của người dùng
let isVolumeMuted = false;
let currentPositionSeconds = 0;
let positionLastUpdated = Date.now();
let isVideoPlaying = true;

class WebCastPlayer extends Player {
  protected async doPlay(video: any, position: number): Promise<boolean> {
    console.log(`[YouTube Cast Received from iPhone] Video ID: ${video.id}, Title: ${video.title || ''}, Position: ${position || 0}s`);
    currentPositionSeconds = Number(position) || 0;
    positionLastUpdated = Date.now();
    isVideoPlaying = true;

    let title = video.title;
    if (!title) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.id}&format=json`);
        if (oembedRes.ok) {
          const oData = (await oembedRes.json()) as any;
          if (oData.title) title = oData.title;
        }
      } catch {}
    }
    broadcastVideo({
      videoId: video.id,
      title: title || `YouTube Video (${video.id})`,
      isPlaying: true,
      timestamp: Date.now(),
      source: 'iPhone YouTube App'
    });
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
    currentPositionSeconds = 0;
    // Không gửi lệnh pause khi đổi video để tránh làm gián đoạn chuyển bài
    return true;
  }

  protected async doSeek(position: number): Promise<boolean> {
    const target = Math.max(0, Math.floor(Number(position) || 0));
    console.log(`[YouTube Cast Tua] iPhone yêu cầu tua tới: ${target}s`);
    currentPositionSeconds = target;
    positionLastUpdated = Date.now();
    broadcastControl({ action: 'seek', value: target });
    return true;
  }

  protected async doSetVolume(volume: { level: number; muted: boolean }): Promise<boolean> {
    console.log(`[YouTube Cast from iPhone] Set volume: ${volume.level}%, muted: ${volume.muted}`);
    currentVolumeLevel = Math.max(0, Math.min(100, Math.round(volume.level)));
    isVolumeMuted = Boolean(volume.muted);
    if (volume.muted) {
      broadcastControl({ action: 'mute' });
    } else {
      broadcastControl({ action: 'setVolume', value: volume.level });
    }
    return true;
  }

  protected async doGetVolume() {
    return { level: currentVolumeLevel, muted: isVolumeMuted };
  }

  protected async doGetPosition(): Promise<number> {
    let current = currentPositionSeconds;
    if (isVideoPlaying) {
      current += (Date.now() - positionLastUpdated) / 1000;
    }
    return Math.max(0, Math.floor(current));
  }

  protected async doGetDuration(): Promise<number> {
    return 7200; // 2 giờ để iPhone luôn thoải mái kéo thanh tua
  }
}

const ytPlayer = new WebCastPlayer();
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
  dataStore: new MemoryDataStore(),
  logLevel: 'warn'
});

// Giữ phiên Lounge không bị ngắt khi iPhone chuyển video (chỉ ngắt khi người dùng bấm ngắt kết nối rõ ràng)
ytReceiver.setResetPlayerOnDisconnectPolicy(Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_EXPLICITLY_DISCONNECTED);

ytReceiver.on('senderConnect', (sender: any) => {
  console.log(`[YouTube Cast] Connected to sender: ${sender?.name || 'iPhone'}`);
  broadcastControl({ action: 'senderConnected', senderName: sender?.name });
});

ytReceiver.on('senderDisconnect', (sender: any) => {
  console.log(`[YouTube Cast] Disconnected from sender: ${sender?.name || 'iPhone'}`);
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

    broadcastVideo({
      videoId: targetId,
      title: resolvedTitle || `YouTube Video (${targetId})`,
      isPlaying: true,
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
