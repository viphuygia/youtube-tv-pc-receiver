import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Volume2, VolumeX, Maximize2, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, Home, CornerUpLeft, Search, 
  Play, Pause, Radio, Wifi, Send, CheckCircle2, RotateCcw,
  Sparkles, ExternalLink
} from 'lucide-react';
import { CHANNELS_DATA } from '../data/channelsData';
import { Channel } from '../types/tv';

interface MobileRemoteViewProps {
  initialCode?: string;
  onExitRemote?: () => void;
}

export const MobileRemoteView: React.FC<MobileRemoteViewProps> = ({
  initialCode = '888123',
  onExitRemote
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tvState, setTvState] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Haptic feedback trigger for tactile phone feel
  const vibrate = (ms = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  // Send command to PC TV via WebSocket with fallback to BroadcastChannel & HTTP POST
  const sendCommand = (command: string, payload?: any) => {
    vibrate(30);
    setLastAction(command);
    setTimeout(() => setLastAction(''), 1500);

    const message = {
      type: 'command',
      role: 'phone',
      code,
      command,
      payload
    };

    // 1. WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }

    // 2. BroadcastChannel fallback (works if on same browser/window/tab)
    try {
      const bc = new BroadcastChannel(`youtube_tv_remote_${code}`);
      bc.postMessage({ command, payload });
      bc.close();
    } catch {
      // ignore
    }

    // 3. HTTP REST API fallback
    fetch('/api/remote/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, command, payload })
    }).catch(() => {});
  };

  // Connect WebSocket to server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    let pollInterval: any;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({
          type: 'register',
          role: 'phone',
          code
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync_state') {
            setTvState(data.state);
            setIsConnected(true);
          } else if (data.type === 'tv_status') {
            setIsConnected(data.connected);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }

    // HTTP polling fallback for TV state every 3 seconds
    pollInterval = setInterval(() => {
      fetch(`/api/remote/state?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.connected) {
            setIsConnected(true);
            if (data.state) setTvState(data.state);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      if (ws) ws.close();
      clearInterval(pollInterval);
    };
  }, [code]);

  const handleCastSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sendCommand('search-play', { query: searchQuery.trim() });
    setSearchQuery('');
  };

  const handleCastChannel = (channel: Channel) => {
    sendCommand('select-channel', { channelId: channel.id });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans max-w-md mx-auto shadow-2xl border-x border-slate-900 pb-12">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-[#0e1018]/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-red-600/30">
            <Tv className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>YouTube TV Remote</span>
              {lastAction && (
                <span className="text-[10px] text-red-400 font-mono animate-pulse">
                  [{lastAction}]
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isConnected ? 'Đã kết nối PC' : 'Đang kết nối TV...'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">Mã: {code}</span>
            </div>
          </div>
        </div>

        {onExitRemote && (
          <button
            onClick={onExitRemote}
            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
          >
            Về TV
          </button>
        )}
      </header>

      {/* Main Remote Controls */}
      <div className="flex-1 p-4 space-y-5">
        {/* Now Playing on Windows TV Screen Mini Card */}
        {tvState && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-[#121422] border border-slate-800/80 flex items-center gap-3">
            {tvState.thumbnailUrl && (
              <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                <img src={tvState.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-red-400 font-mono font-semibold uppercase truncate">
                ĐANG PHÁT TRÊN MÁY TÍNH
              </div>
              <div className="text-xs font-bold text-white truncate">
                {tvState.programTitle || 'Kênh truyền hình trực tiếp'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {tvState.channelName}
              </div>
            </div>
          </div>
        )}

        {/* Quick Search & Cast to PC Bar */}
        <form onSubmit={handleCastSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chiếu video / tìm phim lên PC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 shadow-md shadow-red-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Cast</span>
          </button>
        </form>

        {/* Top TV Navigation Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => sendCommand('nav-home')}
            className="py-3 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[11px] font-semibold active:scale-95 transition-all"
          >
            <Home className="w-4 h-4 text-slate-300" />
            <span>Trang chủ</span>
          </button>
          <button
            onClick={() => sendCommand('nav-guide')}
            className="py-3 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[11px] font-semibold active:scale-95 transition-all"
          >
            <Radio className="w-4 h-4 text-red-500" />
            <span>Lịch EPG</span>
          </button>
          <button
            onClick={() => sendCommand('nav-back')}
            className="py-3 px-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1 text-[11px] font-semibold active:scale-95 transition-all"
          >
            <CornerUpLeft className="w-4 h-4 text-slate-300" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Tactile Big Touch D-Pad */}
        <div className="py-2 flex justify-center">
          <div className="relative w-64 h-64 bg-slate-900/90 rounded-full border border-slate-800/90 shadow-2xl shadow-black/60 flex items-center justify-center p-3">
            {/* UP */}
            <button
              onClick={() => sendCommand('dpad-up')}
              className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-12 rounded-t-full bg-slate-800/80 active:bg-red-600 text-slate-200 active:text-white flex items-center justify-center transition-colors"
              title="Lên trên"
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* DOWN */}
            <button
              onClick={() => sendCommand('dpad-down')}
              className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-16 h-12 rounded-b-full bg-slate-800/80 active:bg-red-600 text-slate-200 active:text-white flex items-center justify-center transition-colors"
              title="Xuống dưới"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* LEFT */}
            <button
              onClick={() => sendCommand('dpad-left')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-12 h-16 rounded-l-full bg-slate-800/80 active:bg-red-600 text-slate-200 active:text-white flex items-center justify-center transition-colors"
              title="Sang trái"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* RIGHT */}
            <button
              onClick={() => sendCommand('dpad-right')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-16 rounded-r-full bg-slate-800/80 active:bg-red-600 text-slate-200 active:text-white flex items-center justify-center transition-colors"
              title="Sang phải"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* OK / SELECT CENTER */}
            <button
              onClick={() => sendCommand('dpad-select')}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-700 to-red-500 text-white font-extrabold text-base shadow-lg shadow-red-600/40 active:scale-95 flex items-center justify-center transition-transform"
            >
              OK
            </button>
          </div>
        </div>

        {/* Media & TV Control Strip */}
        <div className="grid grid-cols-4 gap-2">
          {/* Channel Up / Down */}
          <button
            onClick={() => sendCommand('channel-step', { delta: -1 })}
            className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95 transition-all"
          >
            <ChevronUp className="w-4 h-4 text-red-500" />
            <span>CH -</span>
          </button>
          <button
            onClick={() => sendCommand('channel-step', { delta: 1 })}
            className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95 transition-all"
          >
            <ChevronDown className="w-4 h-4 text-red-500" />
            <span>CH +</span>
          </button>

          {/* Volume Mute */}
          <button
            onClick={() => sendCommand('toggle-mute')}
            className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95 transition-all"
          >
            <VolumeX className="w-4 h-4 text-slate-300" />
            <span>Mute</span>
          </button>

          {/* Fullscreen TV */}
          <button
            onClick={() => sendCommand('toggle-fullscreen')}
            className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center gap-1 text-[10px] font-bold active:scale-95 transition-all text-red-400"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Toàn TV</span>
          </button>
        </div>

        {/* Fast Channel Casting Strip */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-white mb-2.5">
            <span>Chiếu Kênh Nhanh Lên PC (1 Chạm)</span>
            <span className="text-[10px] text-slate-500 font-mono">6 kênh</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS_DATA.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleCastChannel(ch)}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-red-500 text-left transition-all flex items-center gap-2.5 group active:scale-95"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${ch.logoBg}`}>
                  {ch.logoText}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-red-400 truncate">
                    {ch.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    CH {ch.number}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
