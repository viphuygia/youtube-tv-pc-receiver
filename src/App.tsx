import React, { useState, useEffect, useRef } from 'react';
import { 
  Cast, Wifi, Smartphone, Monitor, Play, Maximize2, Minimize2, 
  Volume2, VolumeX, CheckCircle2, Copy, Sparkles, ExternalLink,
  Laptop, RefreshCw, Terminal, HelpCircle, QrCode, Globe
} from 'lucide-react';
import QRCode from 'qrcode';
import { translations, Lang } from './i18n';

interface CastedVideo {
  videoId: string;
  title: string;
  isPlaying: boolean;
  timestamp: number;
  source: string;
}

export default function App() {
  const [video, setVideo] = useState<CastedVideo>({
    videoId: 'LXb3EKWsInQ', // Default 4K Nature relaxation
    title: 'Thiên Nhiên 4K Ultra HD',
    isPlaying: true,
    timestamp: Date.now(),
    source: 'Chế độ chờ (Standby)'
  });

  const [initialVideoId] = useState<string>(video.videoId);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('tv') === '1' || params.get('fullscreen') === '1';
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yt_receiver_volume');
      if (saved !== null) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
      }
    }
    return 30; // Mặc định 30% khi khởi động theo yêu cầu của người dùng
  });
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('yt_receiver_lang') as Lang) || 'vi';
    }
    return 'vi';
  });

  const t = translations[lang];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_lang', lang);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_volume', String(volume));
    }
  }, [volume]);

  // Set initial volume 30% to iframe once ready
  useEffect(() => {
    const t = setTimeout(() => {
      sendIframeCommand('setVolume', [volume]);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const [statusInfo, setStatusInfo] = useState<{ 
    localIp: string; 
    port: number; 
    deviceName: string;
    pairingCode?: string;
    isLoungeConnected?: boolean;
  }>({
    localIp: '127.0.0.1',
    port: 8547,
    deviceName: 'PC Windows (YouTube TV)',
    pairingCode: 'Đang tải mã...',
    isLoungeConnected: false
  });
  const [testInput, setTestInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedRemoteUrl, setCopiedRemoteUrl] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showLocalGuide, setShowLocalGuide] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Generate QR code for mobile remote control
  useEffect(() => {
    if (statusInfo.localIp) {
      const remoteUrl = `http://${statusInfo.localIp}:${statusInfo.port}/remote`;
      QRCode.toDataURL(remoteUrl, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(() => {});
    }
  }, [statusInfo.localIp, statusInfo.port]);

  // Fetch local server status including Google Lounge pairing code
  useEffect(() => {
    const fetchStatus = () => {
      fetch('/api/status')
        .then(res => res.json())
        .then(data => {
          if (data.localIp) {
            setStatusInfo({
              localIp: data.localIp,
              port: data.port,
              deviceName: data.deviceName,
              pairingCode: data.pairingCode,
              isLoungeConnected: data.isLoungeConnected
            });
          }
        })
        .catch(() => {});
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshCode = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh-code', { method: 'POST' });
      const data = await res.json();
      if (data.pairingCode) {
        setStatusInfo(prev => ({ ...prev, pairingCode: data.pairingCode }));
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  const sendIframeCommand = (func: string, args: any[] = []) => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func,
        args
      }), '*');
    }
  };

  // Connect WebSocket to receive real-time cast commands from iPhone / server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let reconnectTimer: any;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'cast_video' && data.video?.videoId) {
              setVideo(data.video);
              if (typeof data.volume === 'number') {
                setVolume(data.volume);
              }
              if (typeof data.isMuted === 'boolean') {
                setIsMuted(data.isMuted);
              }
              // Sử dụng API loadVideoById của YouTube để video mới tự động phát 100% kèm âm thanh
              sendIframeCommand('loadVideoById', [data.video.videoId, 0]);
              setTimeout(() => {
                sendIframeCommand('playVideo', []);
              }, 250);
            } else if (data.type === 'pairing_code' && data.pairingCode) {
              setStatusInfo(prev => ({ ...prev, pairingCode: data.pairingCode }));
            } else if (data.type === 'control') {
              if (data.action === 'play') {
                sendIframeCommand('playVideo', []);
                setVideo(prev => ({ ...prev, isPlaying: true }));
              } else if (data.action === 'pause') {
                sendIframeCommand('pauseVideo', []);
                setVideo(prev => ({ ...prev, isPlaying: false }));
              } else if (data.action === 'togglePlay') {
                setVideo(prev => {
                  const next = !prev.isPlaying;
                  sendIframeCommand(next ? 'playVideo' : 'pauseVideo', []);
                  return { ...prev, isPlaying: next };
                });
              } else if (data.action === 'mute') {
                setIsMuted(true);
                sendIframeCommand('mute', []);
              } else if (data.action === 'unMute') {
                setIsMuted(false);
                sendIframeCommand('unMute', []);
              } else if (data.action === 'toggleMute') {
                setIsMuted(prev => {
                  const next = !prev;
                  sendIframeCommand(next ? 'mute' : 'unMute', []);
                  return next;
                });
              } else if (data.action === 'volumeUp') {
                setVolume(prev => {
                  const next = Math.min(100, prev + 10);
                  setIsMuted(false);
                  sendIframeCommand('unMute', []);
                  sendIframeCommand('setVolume', [next]);
                  return next;
                });
              } else if (data.action === 'volumeDown') {
                setVolume(prev => {
                  const next = Math.max(0, prev - 10);
                  sendIframeCommand('setVolume', [next]);
                  return next;
                });
              } else if (data.action === 'setVolume') {
                const vol = Math.max(0, Math.min(100, Number(data.value ?? data.volume) || 0));
                setVolume(vol);
                setIsMuted(false);
                sendIframeCommand('unMute', []);
                sendIframeCommand('setVolume', [vol]);
              } else if (data.action === 'seek') {
                const offset = Number(data.value ?? data.offset) || 10;
                sendIframeCommand('seekTo', [offset, true]);
              } else if (data.action === 'toggleFullscreen') {
                toggleFullscreen();
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcuts (F for fullscreen, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unified video cast helper: updates local screen AND syncs to server so iPhone Remote updates
  const castVideoOnScreen = (videoId: string, title?: string, source: string = 'Màn hình PC') => {
    // 1. Immediately update UI locally and send loadVideoById
    setVideo({
      videoId,
      title: title || `YouTube Video (${videoId})`,
      isPlaying: true,
      timestamp: Date.now(),
      source
    });

    sendIframeCommand('loadVideoById', [videoId, 0]);
    setTimeout(() => {
      sendIframeCommand('playVideo', []);
    }, 250);

    // 2. Broadcast to server so all iPhone Remotes and connected devices sync immediately!
    fetch('/api/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, title, source })
    })
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          setVideo(prev => ({ ...prev, title: data.title }));
        }
      })
      .catch(() => {});
  };

  // Manual test cast submit
  const handleManualCast = (e: React.FormEvent) => {
    e.preventDefault();
    const input = testInput.trim();
    if (!input) return;

    // Immediately extract 11-char ID client-side so UI reacts instantly
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|youtu\.be\/|^)([\w-]{11})/);
    const videoId = match ? match[1] : (input.length === 11 ? input : null);

    if (videoId) {
      castVideoOnScreen(videoId, undefined, 'Nhập trên PC');
      setTestInput('');
    } else {
      fetch('/api/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.videoId) {
            setTestInput('');
            castVideoOnScreen(data.videoId, data.title, 'Nhập trên PC');
          }
        })
        .catch(() => {});
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`http://${statusInfo.localIp}:${statusInfo.port}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Banner Lưu Ý Kết Nối iPhone Nổi Bật Đầu Trang */}
      <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs md:text-sm text-amber-200 shadow-sm z-30">
        <span className="text-base leading-none">💡</span>
        <span>
          <strong className="text-amber-300 font-bold">{t.topNoticeStrong}</strong> {t.topNoticeText}
        </span>
      </div>

      {/* Top Header Bar */}
      <header className="border-b border-slate-900 bg-[#0d0f16]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Cast className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t.appTitle}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 font-semibold border border-red-800/40">
                {t.appBadge}
              </span>
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-emerald-400 font-medium">{t.readyCast}</span>
              <span>·</span>
              <span>{t.deviceLabel}: &quot;{statusInfo.deviceName}&quot;</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher Button */}
          <button
            onClick={() => setLang(l => l === 'vi' ? 'en' : 'vi')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 border border-red-500/30"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.scanRemoteBtn}</span>
          </button>
          <button
            onClick={() => setShowLocalGuide(!showLocalGuide)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">{t.runOnWindowsBtn}</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? t.exitFullscreenBtn : t.fullscreenBtn}</span>
          </button>
        </div>
      </header>

      {/* Main Cast Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Local Run Guide Drawer */}
        {showLocalGuide && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-700 shadow-2xl text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Laptop className="w-4 h-4 text-red-500" />
                <span>{t.runGuideTitle}</span>
              </div>
              <button onClick={() => setShowLocalGuide(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {t.runGuideDesc}
            </p>
            <div className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1">
              <div>{t.runGuideStep1}</div>
              <div>{t.runGuideStep2}</div>
              <div className="text-slate-200">npm install</div>
              <div className="text-slate-200">npm run dev</div>
            </div>
            <div className="text-slate-400 text-[11px]">
              {t.runGuideTip}
            </div>
          </div>
        )}

        {/* Top Quick Bar: QR Code Remote & Ma TV Dua Len Dau Trang (Tien loi khong can cuon chuot) */}
        {!isFullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#0d101d] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            {/* Left: TV Pairing Code */}
            <div className="md:col-span-7 flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-left space-y-1">
                <div className="text-[11px] font-mono uppercase text-red-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t.tvCodeHeader}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-widest">
                  {statusInfo.pairingCode || t.generatingCode}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t.tvCodeSub}
                </div>
              </div>
            </div>

            {/* Right: QR Code for Remote (DUA LEN TREN DE TIEN QUET) */}
            <div className="md:col-span-5 flex items-center justify-center md:justify-end gap-3.5 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div 
                onClick={() => setShowQrModal(true)} 
                className="bg-white p-1.5 rounded-xl shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                title={t.zoomQrTip}
              >
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code Remote" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center text-[10px] text-slate-500">{t.refreshing}</div>
                )}
              </div>
              <div className="text-left space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.turnPhoneToRemote}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {t.scanQrHelp}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Master Video Display Box */}
        <div 
          ref={containerRef}
          className={
            isFullscreen 
              ? 'fixed inset-0 w-screen h-screen z-[99999] bg-black rounded-none border-0 overflow-hidden flex items-center justify-center'
              : 'relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl transition-all duration-300'
          }
        >
          {/* Ambient light glow behind screen */}
          {!isFullscreen && (
            <div 
              aria-hidden="true" 
              className="absolute -top-12 -left-12 -right-12 -bottom-12 pointer-events-none opacity-20 blur-3xl z-0 bg-gradient-to-r from-red-600 via-indigo-600 to-purple-600"
            />
          )}

          {/* Real YouTube Player Embed (Khong dung dynamic key/src de giu iframe ton tai lau dai, giup Autoplay va phien ket noi luon on dinh) */}
          <iframe
            src={`https://www.youtube.com/embed/${initialVideoId}?autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 select-none relative z-10"
          />

          {/* Floating Source Tag Badge */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[220px]">
              {video.source}
            </span>
          </div>

          {/* Fullscreen control overlay */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {/* TV Code badge when Fullscreen right next to QR icon */}
            <div 
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 text-xs shadow-lg cursor-pointer hover:border-amber-400/60"
              title={lang === 'vi' ? 'Mã liên kết TV (Bấm để xem chi tiết)' : 'TV Pairing Code (Click to view)'}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold uppercase text-[10px]">
                {lang === 'vi' ? 'Mã TV' : 'TV Code'}:
              </span>
              <span className="font-mono font-black text-amber-300 tracking-wider text-xs sm:text-sm">
                {statusInfo.pairingCode || '...'}
              </span>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs shadow-lg hover:border-red-500/50"
              title="Quét mã QR để điều khiển từ xa bằng iPhone"
            >
              <QrCode className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-semibold text-slate-100 hidden sm:inline">QR Remote</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs">
              <button
                onClick={() => {
                  setIsMuted(prev => {
                    const next = !prev;
                    sendIframeCommand(next ? 'mute' : 'unMute', []);
                    return next;
                  });
                }}
                className="hover:text-red-400 transition-colors"
                title={isMuted ? 'Bật tiếng (M)' : 'Tắt tiếng (M)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <span className="font-mono text-[11px] font-bold text-slate-300">
                {isMuted ? t.mutedLabel : `${volume}%`}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-colors"
              title={isFullscreen ? t.exitFullscreenBtn : t.fullscreenBtn}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-red-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Floating exit fullscreen button */}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-5 left-5 z-[100000] px-4 py-2 bg-black/85 hover:bg-black text-white text-xs font-semibold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 shadow-2xl"
            >
              <Minimize2 className="w-4 h-4 text-red-500" />
              <span>{lang === 'vi' ? 'Thu nhỏ (Bấm ESC hoặc F)' : 'Exit Fullscreen (ESC / F)'}</span>
            </button>
          )}
        </div>

        {/* Receiver Instructions & Fast Cast Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: 3 Simple Steps for iPhone */}
          <div className="md:col-span-7 bg-[#0d0f18] border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Smartphone className="w-4 h-4 text-red-500" />
              <span>{t.howToConnectTitle}:</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {t.step1}
                  <div className="text-[11px] text-amber-300/90 mt-1">
                    💡 <em>{t.step1Note}</em>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {t.step2}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-slate-300 leading-relaxed flex-1">
                  {t.step3} <strong>&quot;{statusInfo.deviceName}&quot;</strong>.
                </div>
              </div>

              {/* Official Google TV Code Box for Instant Fix */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-slate-900 to-[#121424] border border-red-500/50 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold">
                      {t.tvCodeHeader}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleRefreshCode}
                      disabled={isRefreshing}
                      className="text-[10px] font-medium text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                      title={t.refreshCode}
                    >
                      <RefreshCw className={`w-3 h-3 text-red-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? t.refreshing : t.refreshCode}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (statusInfo.pairingCode) {
                          navigator.clipboard.writeText(statusInfo.pairingCode.replace(/\s+/g, ''));
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }
                      }}
                      className="text-[10px] font-medium text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      {copiedCode ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? t.copied : t.copy}</span>
                    </button>
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-widest text-center py-2 bg-black/60 rounded-xl border border-white/10 shadow-inner">
                  {statusInfo.pairingCode || t.generatingCode}
                </div>

                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>{t.fixLoungeIssueTitle}</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>{t.fixLounge1}</li>
                    <li>{t.fixLounge2}</li>
                    <li>{t.fixLounge3}</li>
                    <li>{t.fixLounge4}</li>
                  </ol>
                  <div className="text-emerald-400 text-[10px] font-medium pt-0.5">
                    {t.fixLoungeSuccess}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: iPhone Remote QR Code & Manual Fast Cast */}
          <div className="md:col-span-5 space-y-5">
            {/* Super QR Code Card for iPhone Remote */}
            <div className="bg-gradient-to-br from-[#121626] via-[#0d101d] to-[#0a0c16] border-2 border-red-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t.turnPhoneToRemote.toUpperCase()}</span>
                  </span>
                </div>
                <span className="text-[10px] bg-red-600/20 text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-500/30">
                  {t.recommendedBadge}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* QR Code Container */}
                <div className="bg-white p-2 rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code Remote" className="w-28 h-28 object-contain" />
                  ) : (
                    <div className="w-28 h-28 flex items-center justify-center text-xs text-slate-500">
                      {t.refreshing}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs flex-1 text-center sm:text-left">
                  <div className="font-bold text-white text-sm leading-snug">
                    {t.turnPhoneToRemote}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {t.scanQrHelp}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`http://${statusInfo.localIp}:${statusInfo.port}/remote`);
                        setCopiedRemoteUrl(true);
                        setTimeout(() => setCopiedRemoteUrl(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      {copiedRemoteUrl ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedRemoteUrl ? t.copiedRemote : t.copyRemoteLink}</span>
                    </button>
                    <a
                      href="/remote"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-medium transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t.openRemote}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Fast Cast Box & Sample buttons */}
            <div className="bg-[#0d0f18] border border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-xs mb-1.5">
                  <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                  <span>{t.pasteDirectLink}</span>
                </div>

                <form onSubmit={handleManualCast} className="space-y-2">
                  <input
                    type="text"
                    placeholder={t.pastePlaceholder}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                  >
                    <Cast className="w-3.5 h-3.5" />
                    <span>{t.playOnPcBtn}</span>
                  </button>
                </form>
              </div>

              {/* Quick Sample Video Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{t.sampleVideos}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => castVideoOnScreen('LXb3EKWsInQ', '4K Costa Rica Nature & Wildlife', 'Video mẫu 4K')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px]"
                  >
                    {t.nature4k}
                  </button>
                  <button
                    onClick={() => castVideoOnScreen('jNQXAC9IVRw', 'Me at the zoo', 'Video mẫu Test')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px]"
                  >
                    Me at the zoo
                  </button>
                  <button
                    onClick={() => castVideoOnScreen('M7lc1UVf-VE', 'YouTube Developers Demo', 'Demo Video')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px]"
                  >
                    YouTube Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Phong To QR Code Cho iPhone Remote (Dung duoc ca khi Toan man hinh) */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-[#0f1422] border-2 border-red-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wider">
              <QrCode className="w-4 h-4" />
              <span>{t.remoteModalTitle}</span>
            </div>

            <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-2xl border-4 border-slate-900">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code Remote" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-500">{t.refreshing}</div>
              )}
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {t.remoteModalDesc}
            </p>

            <div className="text-[11px] font-mono text-emerald-400 bg-slate-900/80 py-2 px-3 rounded-xl border border-slate-800 break-all select-all">
              http://{statusInfo.localIp}:{statusInfo.port}/remote
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#08090d] text-slate-500 py-4 px-6 text-xs text-center">
        <span>{t.footerText}</span>
      </footer>
    </div>
  );
}
