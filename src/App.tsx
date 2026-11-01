import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Cast, Smartphone, Play, Maximize2, Minimize2, 
  Volume2, VolumeX, CheckCircle2, Copy, ExternalLink,
  Laptop, RefreshCw, Terminal, QrCode, Globe, Power, Monitor,
  Moon, Clock, Sparkles, Tv, Settings
} from 'lucide-react';
import QRCode from 'qrcode';
import { translations, Lang } from './i18n';

interface CastedVideo {
  videoId: string;
  title: string;
  isPlaying: boolean;
  startSeconds?: number;
  timestamp: number;
  source: string;
}

interface DisplayInfo {
  id: number;
  deviceName: string;
  primary: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function App() {
  const [isStandby, setIsStandby] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [video, setVideo] = useState<CastedVideo>({
    videoId: '', // Rỗng khi ở chế độ chờ
    title: 'Chế độ chờ (Standby)',
    isPlaying: false,
    startSeconds: 0,
    timestamp: Date.now(),
    source: 'Chế độ chờ (Standby)'
  });

  const [initialVideoId] = useState<string>('LXb3EKWsInQ');
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
  const [showDisplayModal, setShowDisplayModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [preferredQuality, setPreferredQuality] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yt_receiver_quality') || 'hd1080';
    }
    return 'hd1080';
  });
  const [activeQuality, setActiveQuality] = useState<string>('');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yt_receiver_subtitles') === 'true';
    }
    return false; // Mặc định tắt phụ đề
  });
  const [subtitlesLang, setSubtitlesLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yt_receiver_subtitles_lang') || 'vi';
    }
    return 'vi';
  });
  const [automationSettings, setAutomationSettings] = useState({
    onZeroVolume: '',
    onWake: '',
    collapseOnZeroVolume: true,
    restoreOnWake: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string>('');
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<DisplayInfo | null>(null);
  const [isSwitchingDisplay, setIsSwitchingDisplay] = useState<boolean>(false);
  const [isAppClosed, setIsAppClosed] = useState<boolean>(false);
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('yt_receiver_lang') as Lang) || 'vi';
    }
    return 'vi';
  });

  const t = translations[lang];

  // Refs để đồng bộ chính xác với YouTube IFrame Player và WebSocket
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isStandbyRef = useRef<boolean>(isStandby);
  const currentVideoIdRef = useRef<string>(video.videoId);
  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  const playerTimeRef = useRef<number>(0);
  const playerDurationRef = useRef<number>(0);
  const playerSeekableStartRef = useRef<number>(0);
  const playerSeekableEndRef = useRef<number>(0);
  const lastClientSeekRef = useRef<number>(0);
  const playerStateRef = useRef<number>(-1);
  const lastSyncSentRef = useRef<number>(0);
  const hasConnectedWsOnceRef = useRef<boolean>(false);
  const preferredQualityRef = useRef<string>(preferredQuality);
  const subtitlesEnabledRef = useRef<boolean>(subtitlesEnabled);
  const subtitlesLangRef = useRef<string>(subtitlesLang);

  useEffect(() => {
    preferredQualityRef.current = preferredQuality;
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_quality', preferredQuality);
    }
  }, [preferredQuality]);

  useEffect(() => {
    subtitlesEnabledRef.current = subtitlesEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_subtitles', String(subtitlesEnabled));
    }
  }, [subtitlesEnabled]);

  useEffect(() => {
    subtitlesLangRef.current = subtitlesLang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_subtitles_lang', subtitlesLang);
    }
  }, [subtitlesLang]);

  useEffect(() => {
    isStandbyRef.current = isStandby;
  }, [isStandby]);

  useEffect(() => {
    currentVideoIdRef.current = video.videoId;
  }, [video.videoId]);

  useEffect(() => {
    volumeRef.current = volume;
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_volume', String(volume));
    }
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yt_receiver_lang', lang);
    }
  }, [lang]);

  // Kích hoạt kết nối hai chiều (listening handshake) với YouTube Embed IFrame
  const activateYouTubeBridge = useCallback(() => {
    const iframe = iframeRef.current || containerRef.current?.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
        '*'
      );
    }
  }, []);

  // Gửi lệnh điều khiển chuẩn tới YouTube IFrame API (loadVideoById, seekTo, playVideo, pauseVideo, setVolume...)
  const sendIframeCommand = useCallback((func: string, args: any[] = []) => {
    const iframe = iframeRef.current || containerRef.current?.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      // Luôn gửi gói listening trước để đảm bảo YouTube IFrame đã mở kênh nhận lệnh
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
        '*'
      );
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' }),
        '*'
      );
    }
  }, []);

  // Áp dụng độ phân giải (chất lượng video) lên YouTube IFrame Player
  const applyQualityToIframe = useCallback((quality: string) => {
    if (!quality || quality === 'auto' || quality === 'default') {
      sendIframeCommand('setPlaybackQualityRange', ['default', 'highres']);
      sendIframeCommand('setPlaybackQuality', ['default']);
    } else {
      sendIframeCommand('setPlaybackQualityRange', [quality, quality]);
      sendIframeCommand('setPlaybackQuality', [quality]);
    }
  }, [sendIframeCommand]);

  // Áp dụng bật / tắt phụ đề (Closed Captions) lên YouTube IFrame Player
  const applySubtitlesToIframe = useCallback((enabled: boolean, subLang: string = 'vi') => {
    if (!enabled) {
      // Tắt hoàn toàn phụ đề và gỡ module captions/cc để không tự hiện lại
      sendIframeCommand('setOption', ['captions', 'track', {}]);
      sendIframeCommand('setOption', ['cc', 'track', {}]);
      sendIframeCommand('unloadModule', ['captions']);
      sendIframeCommand('unloadModule', ['cc']);
    } else {
      sendIframeCommand('loadModule', ['captions']);
      sendIframeCommand('loadModule', ['cc']);
      setTimeout(() => {
        sendIframeCommand('setOption', ['captions', 'track', { languageCode: subLang || 'vi' }]);
        sendIframeCommand('setOption', ['cc', 'track', { languageCode: subLang || 'vi' }]);
      }, 180);
    }
  }, [sendIframeCommand]);

  // Lắng nghe sự kiện thời gian thực (currentTime, duration, progressState, playerState, playbackQuality) từ YouTube IFrame trả về
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com')) return;
      if (typeof event.data !== 'string') return;

      try {
        const data = JSON.parse(event.data);

        // Khi trình phát YouTube sẵn sàng -> thiết lập ngay âm lượng, độ phân giải và trạng thái phụ đề
        if (data.event === 'onReady' || data.event === 'initialDelivery') {
          sendIframeCommand('setVolume', [volumeRef.current]);
          if (isMutedRef.current) {
            sendIframeCommand('mute', []);
          } else {
            sendIframeCommand('unMute', []);
          }
          applyQualityToIframe(preferredQualityRef.current);
          applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
        }

        if (data.event === 'infoDelivery' || data.event === 'initialDelivery' || data.event === 'onStateChange') {
          const info = data.info;
          let forceImmediateSync = false;

          if (info && typeof info === 'object') {
            if (typeof info.playbackQuality === 'string' && info.playbackQuality && info.playbackQuality !== 'unknown') {
              setActiveQuality(info.playbackQuality);
            }

            if (info.progressState && typeof info.progressState === 'object') {
              if (typeof info.progressState.seekableStart === 'number' && !isNaN(info.progressState.seekableStart)) {
                playerSeekableStartRef.current = info.progressState.seekableStart;
              }
              if (typeof info.progressState.seekableEnd === 'number' && info.progressState.seekableEnd > 0) {
                playerSeekableEndRef.current = Math.max(playerSeekableEndRef.current, info.progressState.seekableEnd);
              }
            }

            // Bỏ qua cập nhật currentTime cũ trong 2.2s đầu sau khi người dùng bấm tua (giúp tua ngược video Công chiếu / Trực tiếp mượt mà)
            if (typeof info.currentTime === 'number' && !isNaN(info.currentTime)) {
              if (Date.now() - lastClientSeekRef.current > 2200) {
                playerTimeRef.current = info.currentTime;
              }
            }

            const rawDur = Math.max(
              typeof info.duration === 'number' && !isNaN(info.duration) ? info.duration : 0,
              playerSeekableEndRef.current,
              typeof info.progressState?.duration === 'number' ? info.progressState.duration : 0,
              typeof info.currentTime === 'number' && !isNaN(info.currentTime) ? Math.ceil(info.currentTime) : 0
            );
            if (rawDur > 0) {
              const nextDur = Math.max(playerDurationRef.current, rawDur);
              if (playerDurationRef.current === 0 || Math.abs(nextDur - playerDurationRef.current) >= 5) {
                forceImmediateSync = true;
              }
              playerDurationRef.current = nextDur;
            }

            if (typeof info.playerState === 'number') {
              if (info.playerState !== playerStateRef.current) {
                forceImmediateSync = true;
                // Khi video vừa chuyển sang trạng thái Đang phát (1), khóa lại độ phân giải và tắt/bật phụ đề theo đúng ý người dùng
                if (info.playerState === 1) {
                  applyQualityToIframe(preferredQualityRef.current);
                  applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
                }
              }
              playerStateRef.current = info.playerState;
            }
          } else if (data.event === 'onStateChange' && typeof info === 'number') {
            if (info !== playerStateRef.current) {
              forceImmediateSync = true;
              if (info === 1) {
                applyQualityToIframe(preferredQualityRef.current);
                applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
              }
            }
            playerStateRef.current = info;
          }

          const now = Date.now();
          if (forceImmediateSync || now - lastSyncSentRef.current >= 500) {
            lastSyncSentRef.current = now;
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'player_sync',
                  videoId: currentVideoIdRef.current,
                  position: playerTimeRef.current,
                  duration: playerDurationRef.current,
                  seekableStart: playerSeekableStartRef.current,
                  seekableEnd: Math.max(playerSeekableEndRef.current, playerDurationRef.current),
                  playerState: playerStateRef.current
                })
              );
            }
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);

    // Định kỳ kích hoạt cầu nối với YouTube IFrame để đảm bảo không bao giờ mất kết nối sự kiện
    const bridgeInterval = setInterval(() => {
      activateYouTubeBridge();
    }, 1000);

    // Thiết lập âm lượng khởi tạo
    const volInitTimer = setTimeout(() => {
      activateYouTubeBridge();
      sendIframeCommand('setVolume', [volumeRef.current]);
      applyQualityToIframe(preferredQualityRef.current);
      applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
    }, 1200);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(bridgeInterval);
      clearTimeout(volInitTimer);
    };
  }, [activateYouTubeBridge, sendIframeCommand, applyQualityToIframe, applySubtitlesToIframe]);

  const [statusInfo, setStatusInfo] = useState<{ 
    localIp: string; 
    port: number; 
    deviceName: string;
    pairingCode?: string;
    isLoungeConnected?: boolean;
  }>({
    localIp: '127.0.0.1',
    port: 8547,
    deviceName: 'Youtube TV (PC)',
    pairingCode: 'Đang tải mã...',
    isLoungeConnected: false
  });
  const [testInput, setTestInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedRemoteUrl, setCopiedRemoteUrl] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showLocalGuide, setShowLocalGuide] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

    const fetchDisplays = () => {
      fetch('/api/displays')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.displays)) {
            setDisplays(data.displays);
          }
          if (data.selectedDisplay) {
            setSelectedDisplay(data.selectedDisplay);
          }
        })
        .catch(() => {});
    };

    fetchStatus();
    fetchDisplays();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDisplayModal = () => {
    setShowDisplayModal(true);
    fetch('/api/displays')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.displays)) setDisplays(data.displays);
        if (data.selectedDisplay) setSelectedDisplay(data.selectedDisplay);
      })
      .catch(() => {});
  };

  const fetchAutomationSettings = () => {
    fetch('/api/settings/automation')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setAutomationSettings({
            onZeroVolume: data.onZeroVolume || '',
            onWake: data.onWake || '',
            collapseOnZeroVolume: data.collapseOnZeroVolume !== false,
            restoreOnWake: data.restoreOnWake !== false,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAutomationSettings();
  }, []);

  const handleOpenSettingsModal = () => {
    fetchAutomationSettings();
    setSettingsNotice('');
    setShowSettingsModal(true);
  };

  const handleSaveAutomation = async () => {
    setIsSavingSettings(true);
    setSettingsNotice('');
    try {
      const res = await fetch('/api/settings/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsNotice(t.savedSuccess);
        setTimeout(() => setSettingsNotice(''), 3000);
      }
    } catch {
      setSettingsNotice('Lỗi lưu cấu hình');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestCommand = async (command: string, trigger: string) => {
    if (!command.trim()) return;
    try {
      const res = await fetch('/api/settings/automation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, trigger }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsNotice(t.testSuccess + ` (${command})`);
      } else {
        setSettingsNotice(t.testError + ' ' + (data.error || data.reason));
      }
      setTimeout(() => setSettingsNotice(''), 4000);
    } catch (e: any) {
      setSettingsNotice(t.testError + ' ' + e.message);
      setTimeout(() => setSettingsNotice(''), 4000);
    }
  };

  const handleSelectDisplay = async (display: DisplayInfo) => {
    setIsSwitchingDisplay(true);
    try {
      const res = await fetch('/api/displays/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: display.deviceName, id: display.id })
      });
      const data = await res.json();
      if (data.selectedDisplay) {
        setSelectedDisplay(data.selectedDisplay);
      }
      if (Array.isArray(data.displays)) {
        setDisplays(data.displays);
      }
      setShowDisplayModal(false);
    } catch {} finally {
      setIsSwitchingDisplay(false);
    }
  };

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

  // Tắt ứng dụng từ màn hình Fullscreen
  const handleQuitApp = async () => {
    try {
      await fetch('/api/quit', { method: 'POST' });
    } catch {}
    setIsAppClosed(true);
    try {
      window.open('', '_self');
      window.close();
    } catch {}
  };

  // Chuyển đổi qua lại giữa Chế độ chờ (Standby) và Phát video
  const handleToggleStandby = async () => {
    const next = !isStandby;
    setIsStandby(next);
    if (next) {
      sendIframeCommand('stopVideo', []);
      setVideo(prev => ({ ...prev, isPlaying: false }));
    }
    try {
      await fetch('/api/standby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standby: next })
      });
    } catch {}
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

            if (data.type === 'standby_state') {
              const nextStandby = Boolean(data.isStandby);
              setIsStandby(nextStandby);
              if (nextStandby) {
                sendIframeCommand('stopVideo', []);
                setVideo(prev => ({ ...prev, isPlaying: false }));
              }
              if (data.video) {
                setVideo(data.video);
              }
              return;
            }

            if (data.type === 'cast_video') {
              try { window.focus(); } catch {}
              const incomingStandby = data.isStandby !== undefined ? Boolean(data.isStandby) : !Boolean(data.video?.videoId);

              if (typeof data.pairingCode === 'string' && data.pairingCode) {
                setStatusInfo(prev => ({ ...prev, pairingCode: data.pairingCode }));
              }
              if (typeof data.preferredQuality === 'string' && data.preferredQuality) {
                setPreferredQuality(data.preferredQuality);
                preferredQualityRef.current = data.preferredQuality;
              }
              if (typeof data.subtitlesEnabled === 'boolean') {
                setSubtitlesEnabled(data.subtitlesEnabled);
                subtitlesEnabledRef.current = data.subtitlesEnabled;
              }
              if (typeof data.subtitlesLang === 'string' && data.subtitlesLang) {
                setSubtitlesLang(data.subtitlesLang);
                subtitlesLangRef.current = data.subtitlesLang;
              }

              if (incomingStandby) {
                isStandbyRef.current = true;
                setIsStandby(true);
                sendIframeCommand('stopVideo', []);
                if (data.video) {
                  setVideo({ ...data.video, isPlaying: false });
                }
              } else if (data.video?.videoId) {
                const incomingVid = data.video.videoId;
                const startSec = Number(data.video.startSeconds) || 0;
                isStandbyRef.current = false;
                setIsStandby(false);
                currentVideoIdRef.current = incomingVid;
                setVideo(data.video);

                playerTimeRef.current = startSec;
                playerDurationRef.current = 0;
                playerSeekableStartRef.current = 0;
                playerSeekableEndRef.current = 0;
                activateYouTubeBridge();
                if (startSec > 0) {
                  sendIframeCommand('loadVideoById', [incomingVid, startSec]);
                } else {
                  sendIframeCommand('loadVideoById', [incomingVid]);
                }
                setTimeout(() => {
                  activateYouTubeBridge();
                  sendIframeCommand('playVideo', []);
                  sendIframeCommand('setVolume', [volumeRef.current]);
                  if (isMutedRef.current) {
                    sendIframeCommand('mute', []);
                  } else {
                    sendIframeCommand('unMute', []);
                  }
                  applyQualityToIframe(preferredQualityRef.current);
                  applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
                }, 200);
              } else if (data.video) {
                setVideo(data.video);
              }
            } else if (data.type === 'pairing_code' && data.pairingCode) {
              setStatusInfo(prev => ({ ...prev, pairingCode: data.pairingCode }));
            } else if (data.type === 'control') {
              if (data.action === 'standby') {
                setIsStandby(true);
                sendIframeCommand('stopVideo', []);
                setVideo(prev => ({ ...prev, isPlaying: false }));
              } else if (data.action === 'wake') {
                try { window.focus(); } catch {}
                setIsStandby(false);
              } else if (data.action === 'updateTitle' && data.title) {
                setVideo(prev => (prev.videoId === data.videoId ? { ...prev, title: data.title } : prev));
              } else if (data.action === 'play') {
                setIsStandby(false);
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
              } else if (data.action === 'seekTo' || data.action === 'seek') {
                const target = Math.max(0, Number(data.value ?? data.offset) || 0);
                lastClientSeekRef.current = Date.now();
                playerTimeRef.current = target;
                sendIframeCommand('seekTo', [target, true]);
              } else if (data.action === 'seekRelative') {
                const delta = Number(data.value ?? data.offset) || 0;
                const target = Math.max(0, playerTimeRef.current + delta);
                lastClientSeekRef.current = Date.now();
                playerTimeRef.current = target;
                sendIframeCommand('seekTo', [target, true]);
              } else if (data.action === 'setQuality' && typeof data.value === 'string') {
                setPreferredQuality(data.value);
                preferredQualityRef.current = data.value;
                applyQualityToIframe(data.value);
              } else if (data.action === 'setSubtitles') {
                const nextEnabled = Boolean(data.enabled);
                const nextLang = typeof data.lang === 'string' && data.lang ? data.lang : subtitlesLangRef.current;
                setSubtitlesEnabled(nextEnabled);
                subtitlesEnabledRef.current = nextEnabled;
                setSubtitlesLang(nextLang);
                subtitlesLangRef.current = nextLang;
                applySubtitlesToIframe(nextEnabled, nextLang);
              } else if (data.action === 'toggleFullscreen') {
                toggleFullscreen();
              } else if (data.action === 'displayChanged' && data.selectedDisplay) {
                setSelectedDisplay(data.selectedDisplay);
              } else if (data.action === 'quit') {
                setIsAppClosed(true);
                try {
                  window.open('', '_self');
                  window.close();
                } catch {}
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 2000);
        };
      } catch {
        reconnectTimer = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [activateYouTubeBridge, sendIframeCommand]);

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
      if (document.fullscreenElement) {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleSelectQuality = (q: string) => {
    setPreferredQuality(q);
    preferredQualityRef.current = q;
    applyQualityToIframe(q);
    setShowQualityModal(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'control', action: 'setQuality', value: q }));
    }
  };

  // Chuyển đổi nhanh Phụ đề: TẮT -> Tiếng Việt (VI) -> Tiếng Anh (EN) -> TẮT
  const handleCycleSubtitles = () => {
    let nextEnabled = false;
    let nextLang = subtitlesLangRef.current;
    if (!subtitlesEnabledRef.current) {
      nextEnabled = true;
      nextLang = 'vi';
    } else if (subtitlesLangRef.current === 'vi') {
      nextEnabled = true;
      nextLang = 'en';
    } else {
      nextEnabled = false;
      nextLang = 'vi';
    }
    setSubtitlesEnabled(nextEnabled);
    subtitlesEnabledRef.current = nextEnabled;
    setSubtitlesLang(nextLang);
    subtitlesLangRef.current = nextLang;
    applySubtitlesToIframe(nextEnabled, nextLang);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'control', action: 'setSubtitles', enabled: nextEnabled, lang: nextLang }));
    }
  };

  const getQualityBadgeLabel = (q: string) => {
    const map: Record<string, string> = {
      highres: '4K+',
      hd2160: '4K',
      hd1440: '2K',
      hd1080: '1080p',
      hd720: '720p',
      large: '480p',
      medium: '360p',
      small: '240p',
      tiny: '144p',
      auto: 'Auto',
      default: 'Auto'
    };
    return map[q] || '1080p';
  };

  // Keyboard shortcuts (F for fullscreen, M for mute, C for captions/subtitles)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => {
          const next = !prev;
          sendIframeCommand(next ? 'mute' : 'unMute', []);
          return next;
        });
      }
      if (e.key === 'c' || e.key === 'C') {
        const nextEnabled = !subtitlesEnabledRef.current;
        setSubtitlesEnabled(nextEnabled);
        subtitlesEnabledRef.current = nextEnabled;
        applySubtitlesToIframe(nextEnabled, subtitlesLangRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendIframeCommand, applySubtitlesToIframe]);

  // Unified video cast helper: updates local screen AND syncs to server so iPhone Remote updates
  const castVideoOnScreen = (videoId: string, title?: string, source: string = 'Màn hình PC') => {
    setIsStandby(false);
    currentVideoIdRef.current = videoId;
    playerTimeRef.current = 0;
    playerDurationRef.current = 0;
    playerSeekableStartRef.current = 0;
    playerSeekableEndRef.current = 0;

    setVideo({
      videoId,
      title: title || `YouTube Video (${videoId})`,
      isPlaying: true,
      startSeconds: 0,
      timestamp: Date.now(),
      source
    });

    activateYouTubeBridge();
    sendIframeCommand('loadVideoById', [videoId]);
    setTimeout(() => {
      sendIframeCommand('playVideo', []);
      sendIframeCommand('setVolume', [volumeRef.current]);
      applyQualityToIframe(preferredQualityRef.current);
      applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
    }, 200);

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

  if (isAppClosed) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
          <Power className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">
          {lang === 'vi' ? 'Đã tắt YouTube TV Receiver' : 'YouTube TV Receiver Closed'}
        </h1>
        <p className="text-slate-400 text-sm">
          {lang === 'vi' ? 'Bạn có thể đóng cửa sổ trình duyệt này.' : 'You can safely close this browser window.'}
        </p>
      </div>
    );
  }

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
            onClick={handleOpenDisplayModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title={t.monitorModalTitle}
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {t.monitorBtn} {selectedDisplay ? selectedDisplay.id : 1}
            </span>
          </button>
          <button
            onClick={handleOpenSettingsModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title={t.settingsBtn}
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t.settingsBtn}</span>
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
          <button
            onClick={handleQuitApp}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 hover:border-red-500 transition-all flex items-center gap-1.5"
            title={t.quitAppTooltip}
          >
            <Power className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">{t.quitAppBtn}</span>
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

        {/* Top Quick Bar: QR Code Remote & Ma TV Dua Len Dau Trang */}
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
                  {statusInfo.pairingCode || t.refreshing}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t.tvCodeSub}
                </div>
              </div>
            </div>

            {/* Right: QR Code for Remote */}
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
              ? 'fixed inset-0 w-screen h-screen z-[99999] bg-[#05070d] rounded-none border-0 overflow-hidden flex items-center justify-center'
              : 'relative w-full aspect-video rounded-3xl overflow-hidden bg-[#05070d] border border-slate-800 shadow-2xl transition-all duration-300'
          }
        >
          {/* Ambient light glow behind screen */}
          {!isFullscreen && (
            <div 
              aria-hidden="true" 
              className="absolute -top-12 -left-12 -right-12 -bottom-12 pointer-events-none opacity-20 blur-3xl z-0 bg-gradient-to-r from-red-600 via-indigo-600 to-purple-600"
            />
          )}

          {/* Real YouTube Player Embed with Two-Way JS API Bridge (Luôn được giữ cố định trong DOM để cầu nối IFrame API & tua video mượt mà 100% như v1.0.0) */}
          <iframe
            ref={iframeRef}
            id="yt-tv-iframe"
            onLoad={() => {
              activateYouTubeBridge();
              setTimeout(() => {
                activateYouTubeBridge();
                sendIframeCommand('setVolume', [volumeRef.current]);
                applyQualityToIframe(preferredQualityRef.current);
                applySubtitlesToIframe(subtitlesEnabledRef.current, subtitlesLangRef.current);
                if (!isStandbyRef.current && currentVideoIdRef.current) {
                  if (playerTimeRef.current > 0) {
                    sendIframeCommand('loadVideoById', [currentVideoIdRef.current, playerTimeRef.current]);
                  } else {
                    sendIframeCommand('loadVideoById', [currentVideoIdRef.current]);
                  }
                  sendIframeCommand('playVideo', []);
                } else {
                  sendIframeCommand('stopVideo', []);
                }
              }, 400);
            }}
            src={`https://www.youtube.com/embed/${initialVideoId}?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={`w-full h-full border-0 select-none relative z-10 transition-opacity duration-200 ${isStandby ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          />

          {isStandby ? (
            <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 sm:p-8 md:p-12 z-30 bg-gradient-to-br from-[#080a14] via-[#040509] to-[#0a0d1a] text-white select-none">
              {/* Soft ambient glow */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-25 blur-3xl bg-radial from-red-600/30 via-indigo-600/20 to-transparent" />

              {/* Top Bar of Standby Screen */}
              <div className="relative z-20 flex items-center justify-between gap-3">
                {/* Listening Status Pill */}
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{t.standbyStatusListening}</span>
                </div>

                {/* Floating Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenDisplayModal}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs shadow-md"
                    title={t.monitorModalTitle}
                  >
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline font-semibold">{t.monitorBtn} {selectedDisplay ? selectedDisplay.id : 1}</span>
                  </button>

                  <button
                    onClick={handleOpenSettingsModal}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs shadow-md"
                    title={t.settingsBtn}
                  >
                    <Settings className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline font-semibold">{t.settingsBtn}</span>
                  </button>

                  <button
                    onClick={() => setLang(l => l === 'vi' ? 'en' : 'vi')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang.toUpperCase()}</span>
                  </button>

                  {isFullscreen && (
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/80 transition-all text-xs shadow-md"
                      title={t.exitFullscreenBtn}
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}

                  <button
                    onClick={handleQuitApp}
                    className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white backdrop-blur-md border border-red-400/40 transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-red-600/40"
                    title={t.quitAppTooltip}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{t.quitAppBtn}</span>
                  </button>
                </div>
              </div>

              {/* Center Stage: Clock, Date, Device Name & Pairing Cards */}
              <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center max-w-4xl mx-auto w-full">
                {/* Live Digital Clock */}
                <div className="font-mono text-4xl sm:text-7xl md:text-8xl font-black text-white tracking-widest drop-shadow-2xl">
                  {currentTime.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour12: false })}
                </div>

                {/* Localized Date */}
                <div className="text-slate-400 text-xs sm:text-base font-medium tracking-wide mt-1.5 sm:mt-2 capitalize">
                  {currentTime.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                {/* Device Name Badge */}
                <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-2xl bg-red-600/15 border border-red-500/30 text-white shadow-lg">
                  <Cast className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm tracking-tight">{statusInfo.deviceName}</span>
                </div>

                {/* Pairing Code & QR Remote Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 w-full max-w-2xl text-left">
                  {/* Pairing Code Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-red-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{t.tvCodeHeader}</span>
                      </div>
                      <div className="text-xl sm:text-3xl font-black font-mono text-amber-300 tracking-wider mt-1">
                        {statusInfo.pairingCode || t.refreshing}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {t.tvCodeSub}
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={handleRefreshCode}
                        disabled={isRefreshing}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-all"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
                        <span>{t.refreshCode}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Remote Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-xl flex items-center gap-3">
                    <div 
                      onClick={() => setShowQrModal(true)} 
                      className="bg-white p-1.5 rounded-xl shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      title={t.zoomQrTip}
                    >
                      {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="QR Code Remote" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-[10px] text-slate-500">{t.refreshing}</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-red-500" />
                        <span>{t.turnPhoneToRemote}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug line-clamp-2">
                        {t.scanQrHelp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Instructions & Quick Wake Button */}
              <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs">
                    {t.standbyStep3.replace('%s', statusInfo.deviceName)}
                  </span>
                </div>

                <button
                  onClick={() => castVideoOnScreen('LXb3EKWsInQ', 'Thiên Nhiên 4K Ultra HD', 'Phát thử từ Chế độ chờ')}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:border-emerald-400/50 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>{t.standbyWakeSampleBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Floating Source Tag Badge */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-white truncate max-w-[220px]">
                  {video.source}
                </span>
              </div>

              {/* Fullscreen control overlay (Top Right) */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {/* TV Code badge right next to QR icon */}
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

                {/* Nút chuyển sang Chế độ chờ (Standby) thủ công */}
                <button
                  onClick={handleToggleStandby}
                  className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-amber-300 backdrop-blur-md border border-amber-400/30 transition-all flex items-center gap-1.5 text-xs shadow-lg hover:border-amber-400/60"
                  title={t.standbyModeTitle}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold hidden sm:inline">{t.standbyEnterBtn}</span>
                </button>

                {/* Nút chọn Màn hình (Lưu tự động cho những lần mở sau) */}
                <button
                  onClick={handleOpenDisplayModal}
                  className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs shadow-lg hover:border-emerald-400/60"
                  title={t.monitorModalTitle}
                >
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-100">
                    {t.monitorBtn} {selectedDisplay ? selectedDisplay.id : 1}
                  </span>
                </button>

                {/* Nút chỉnh Độ phân giải (Chất lượng video) */}
                <button
                  onClick={() => setShowQualityModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs shadow-lg hover:border-cyan-400/60"
                  title={t.qualityModalTitle}
                >
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono font-bold text-cyan-300">
                    {getQualityBadgeLabel(activeQuality || preferredQuality)}
                  </span>
                </button>

                {/* Nút bật/tắt Phụ đề (CC) 1 chạm */}
                <button
                  onClick={handleCycleSubtitles}
                  className={`px-3 py-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center gap-1.5 text-xs shadow-lg ${
                    subtitlesEnabled
                      ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-400/50'
                      : 'bg-black/80 hover:bg-black text-slate-300 border-white/20 hover:border-slate-400/50'
                  }`}
                  title={lang === 'vi' ? 'Bấm để chuyển: Tắt phụ đề / Phụ đề Tiếng Việt / Phụ đề Tiếng Anh (Phím tắt: C)' : 'Click to cycle Subtitles: OFF / VI / EN (Shortcut: C)'}
                >
                  <span className="font-mono font-black text-[11px] px-1 rounded bg-white/10">CC</span>
                  <span className="font-semibold hidden sm:inline">
                    {subtitlesEnabled ? subtitlesLang.toUpperCase() : (lang === 'vi' ? 'Tắt' : 'OFF')}
                  </span>
                </button>

                <button
                  onClick={handleOpenSettingsModal}
                  className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 text-xs shadow-lg hover:border-blue-400/60"
                  title={t.settingsBtn}
                >
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-slate-100 hidden sm:inline">
                    {t.settingsBtn}
                  </span>
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

                {/* Nút Tắt App trực tiếp trên màn hình Fullscreen */}
                <button
                  onClick={handleQuitApp}
                  className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white backdrop-blur-md border border-red-400/40 transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-red-600/40"
                  title={t.quitAppTooltip}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{t.quitAppBtn}</span>
                </button>
              </div>

              {/* Floating exit fullscreen button (Top Left when Fullscreen) */}
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-5 left-5 z-[100000] px-4 py-2 bg-black/85 hover:bg-black text-white text-xs font-semibold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 shadow-2xl"
                >
                  <Minimize2 className="w-4 h-4 text-red-500" />
                  <span>{lang === 'vi' ? 'Thu nhỏ (Bấm ESC hoặc F)' : 'Exit Fullscreen (ESC / F)'}</span>
                </button>
              )}
            </>
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

              {/* Official Google TV Code Box */}
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
                  {statusInfo.pairingCode || t.refreshing}
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

      {/* Modal Phong To QR Code Cho iPhone Remote */}
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

      {/* Modal Cài Đặt Tự Động Hóa & Custom Actions */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-[#0f1422] border-2 border-blue-500/50 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm uppercase tracking-wider">
              <Settings className="w-5 h-5" />
              <span>{t.automationModalTitle}</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {t.automationModalDesc}
            </p>

            {settingsNotice && (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/50 text-blue-200 text-xs flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium">{settingsNotice}</span>
              </div>
            )}

            <div className="space-y-4 pt-1 max-h-[60vh] overflow-y-auto pr-1">
              {/* Cấu hình khi Âm lượng về 0 */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    <span>{t.onZeroVolumeLabel}</span>
                  </label>
                  <p className="text-[11px] text-slate-400">{t.onZeroVolumeHelp}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={automationSettings.onZeroVolume}
                    onChange={e => setAutomationSettings(s => ({ ...s, onZeroVolume: e.target.value }))}
                    placeholder={t.onZeroVolumePlaceholder}
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestCommand(automationSettings.onZeroVolume, 'zero_volume')}
                    disabled={!automationSettings.onZeroVolume.trim()}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                  >
                    {t.testBtn}
                  </button>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={automationSettings.collapseOnZeroVolume}
                    onChange={e => setAutomationSettings(s => ({ ...s, collapseOnZeroVolume: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-xs text-slate-300">{t.collapseOnZeroVolumeLabel}</span>
                </label>
              </div>

              {/* Cấu hình khi Đánh thức / Tăng âm lượng */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.onWakeLabel}</span>
                  </label>
                  <p className="text-[11px] text-slate-400">{t.onWakeHelp}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={automationSettings.onWake}
                    onChange={e => setAutomationSettings(s => ({ ...s, onWake: e.target.value }))}
                    placeholder={t.onWakePlaceholder}
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestCommand(automationSettings.onWake, 'wake')}
                    disabled={!automationSettings.onWake.trim()}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                  >
                    {t.testBtn}
                  </button>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={automationSettings.restoreOnWake}
                    onChange={e => setAutomationSettings(s => ({ ...s, restoreOnWake: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-xs text-slate-300">{t.restoreOnWakeLabel}</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
              <button
                type="button"
                onClick={handleSaveAutomation}
                disabled={isSavingSettings}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Độ Phân Giải & Phụ Đề (Video Quality & Subtitles Modal) */}
      {showQualityModal && (
        <div
          className="fixed inset-0 z-[100001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowQualityModal(false)}
        >
          <div
            className="bg-[#0f1422] border-2 border-cyan-500/50 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQualityModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm uppercase tracking-wider">
              <Tv className="w-5 h-5" />
              <span>{t.qualityModalTitle}</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {t.qualityModalDesc}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'highres', label: '4K / Cao nhất', badge: 'Ultra HD' },
                { id: 'hd2160', label: '4K (2160p)', badge: '2160p' },
                { id: 'hd1440', label: '2K (1440p)', badge: '1440p' },
                { id: 'hd1080', label: 'Full HD (1080p)', badge: '1080p' },
                { id: 'hd720', label: 'HD (720p)', badge: '720p' },
                { id: 'large', label: 'Chuẩn (480p)', badge: '480p' },
                { id: 'medium', label: 'Tiết kiệm (360p)', badge: '360p' },
                { id: 'auto', label: 'Tự động (Auto)', badge: 'Auto' }
              ].map(item => {
                const isSelected = preferredQuality === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectQuality(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.badge}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Phần điều khiển Phụ đề nhanh ngay trong hộp thoại */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>{lang === 'vi' ? 'Phụ đề video (Closed Captions):' : 'Subtitles (Closed Captions):'}</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {subtitlesEnabled ? (subtitlesLang === 'vi' ? 'Đang bật (Tiếng Việt)' : 'Đang bật (English)') : 'Đang tắt'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setSubtitlesEnabled(false);
                    subtitlesEnabledRef.current = false;
                    applySubtitlesToIframe(false, subtitlesLangRef.current);
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'control', action: 'setSubtitles', enabled: false, lang: subtitlesLangRef.current }));
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    !subtitlesEnabled
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🚫 {lang === 'vi' ? 'Tắt phụ đề' : 'Turn OFF'}
                </button>
                <button
                  onClick={() => {
                    setSubtitlesEnabled(true);
                    subtitlesEnabledRef.current = true;
                    setSubtitlesLang('vi');
                    subtitlesLangRef.current = 'vi';
                    applySubtitlesToIframe(true, 'vi');
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'control', action: 'setSubtitles', enabled: true, lang: 'vi' }));
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    subtitlesEnabled && subtitlesLang === 'vi'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  onClick={() => {
                    setSubtitlesEnabled(true);
                    subtitlesEnabledRef.current = true;
                    setSubtitlesLang('en');
                    subtitlesLangRef.current = 'en';
                    applySubtitlesToIframe(true, 'en');
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'control', action: 'setSubtitles', enabled: true, lang: 'en' }));
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    subtitlesEnabled && subtitlesLang === 'en'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chon Man Hinh Hien Thi (Tu dong nho cho lan khoi dong sau) */}
      {showDisplayModal && (
        <div
          className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowDisplayModal(false)}
        >
          <div
            className="bg-[#0f1422] border-2 border-emerald-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDisplayModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm uppercase tracking-wider">
              <Monitor className="w-5 h-5" />
              <span>{t.monitorModalTitle}</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {t.monitorModalDesc}
            </p>

            <div className="space-y-2.5 pt-1">
              {displays.map((d) => {
                const isSelected = selectedDisplay?.deviceName === d.deviceName;
                return (
                  <button
                    key={d.deviceName}
                    disabled={isSwitchingDisplay}
                    onClick={() => handleSelectDisplay(d)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <Monitor className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>
                          {t.monitorBtn} {d.id} ({d.primary ? t.monitorPrimary : t.monitorSecondary})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {d.width}×{d.height} · Vị trí ({d.x}, {d.y})
                      </div>
                      {isSelected && (
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.monitorSavedBadge}</span>
                        </div>
                      )}
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isSelected ? '✓' : (lang === 'vi' ? 'Chọn' : 'Select')}
                    </div>
                  </button>
                );
              })}
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
