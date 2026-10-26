import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  Settings, Info, Tv, ExternalLink, BookmarkPlus, BookmarkCheck,
  Sparkles, Monitor
} from 'lucide-react';
import { Channel, Program } from '../types/tv';

interface LeanbackPlayerProps {
  channel: Channel;
  program: Program;
  isSaved: boolean;
  onToggleSave: () => void;
  onCustomVideoChange?: (videoId: string) => void;
}

export const LeanbackPlayer: React.FC<LeanbackPlayerProps> = ({
  channel,
  program,
  isSaved,
  onToggleSave,
  onCustomVideoChange
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [ambientLighting, setAmbientLighting] = useState<boolean>(true);
  const [customInputOpen, setCustomInputOpen] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>(program.youtubeVideoId);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when program changes
  useEffect(() => {
    setCurrentVideoId(program.youtubeVideoId);
  }, [program.youtubeVideoId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const extractYoutubeId = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('?')) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(customUrl);
    if (id) {
      setCurrentVideoId(id);
      if (onCustomVideoChange) onCustomVideoChange(id);
      setCustomInputOpen(false);
      setCustomUrl('');
    } else {
      alert('Vui lòng nhập link YouTube hoặc Video ID 11 ký tự hợp lệ.');
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-black flex flex-col justify-center' : 'bg-[#0f1118] border border-slate-800/80 shadow-2xl'
      }`}
    >
      {/* Ambient Lighting Glow Behind Screen */}
      {ambientLighting && !isFullscreen && (
        <div 
          aria-hidden="true" 
          className="absolute -top-10 -left-10 -right-10 -bottom-10 pointer-events-none opacity-25 blur-3xl z-0 transition-opacity duration-700 bg-gradient-to-r from-red-600/30 via-indigo-600/20 to-purple-600/30"
        />
      )}

      {/* Main Video Viewport */}
      <div className={`relative w-full aspect-video bg-black z-10 ${isFullscreen ? 'max-h-screen' : ''}`}>
        <iframe
          key={currentVideoId}
          src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={program.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 select-none"
        />

        {/* Live Channel Floating Watermark */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
          <div className={`px-2 py-0.5 text-[11px] font-bold text-white rounded ${channel.logoBg}`}>
            {channel.logoText}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[200px]">
              {channel.name}
            </span>
            <span className="text-[10px] text-red-400 font-mono tracking-wider font-semibold">
              KÊNH {channel.number} · {channel.quality}
            </span>
          </div>
        </div>

        {/* Stats for Nerds Panel Overlay */}
        {showStats && (
          <div className="absolute top-16 right-4 z-30 bg-black/90 text-xs font-mono p-4 rounded-xl border border-slate-700 shadow-xl max-w-sm backdrop-blur-md text-slate-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-white">
              <span>Thông số phát sóng (Windows PC)</span>
              <button 
                onClick={() => setShowStats(false)}
                className="text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-[11px] tabular-nums">
              <div className="flex justify-between"><span className="text-slate-400">Video ID:</span> <span>{currentVideoId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Độ phân giải:</span> <span className="text-emerald-400">{channel.quality}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Âm thanh:</span> <span className="text-indigo-400">{channel.audio}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Hardware Accel:</span> <span>Active (Direct3D 11)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Bộ đệm Buffer:</span> <span>18.4s / 1080p60</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Khung hình dropped:</span> <span>0 / 1420 (0.0%)</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Leanback Under-Player Control Bar */}
      <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-b from-[#13151f] to-[#0c0d12] border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Program Information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-red-500 uppercase tracking-wider">{program.rating}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{program.startTime} - {program.endTime} ({program.durationMinutes} phút)</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{channel.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {program.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 line-clamp-1 mt-0.5">
              {program.description}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Record / Save DVR */}
            <button
              onClick={onToggleSave}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSaved 
                  ? 'bg-red-950/80 text-red-300 border border-red-700/60' 
                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/80'
              }`}
              title={isSaved ? 'Đã lưu vào Thư viện DVR' : 'Ghi vào Thư viện DVR (Không giới hạn)'}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-red-400" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              <span className="whitespace-nowrap">{isSaved ? 'Đã ghi DVR' : '+ Lưu vào DVR'}</span>
            </button>

            {/* Ambient Mode Toggle */}
            <button
              onClick={() => setAmbientLighting(!ambientLighting)}
              className={`p-2 rounded-lg text-xs transition-colors border ${
                ambientLighting 
                  ? 'bg-amber-950/50 text-amber-300 border-amber-600/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Đèn nền Ambilight rạp phim"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Custom URL Input Trigger */}
            <button
              onClick={() => setCustomInputOpen(!customInputOpen)}
              className="px-2.5 py-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Phát link YouTube tùy chọn"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Phát link khác</span>
            </button>

            {/* Stats for nerds */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded-lg text-xs border transition-colors ${
                showStats 
                  ? 'bg-blue-950/60 text-blue-300 border-blue-600/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Thông số kỹ thuật video"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Fullscreen TV Mode */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all"
              title="Xem toàn màn hình (Phím tắt F hoặc F11)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F)'}</span>
            </button>
          </div>
        </div>

        {/* Custom YouTube URL Popup Drawer */}
        {customInputOpen && (
          <form 
            onSubmit={handleApplyCustomUrl}
            className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-2 items-center"
          >
            <div className="flex-1 w-full text-xs">
              <input
                type="text"
                placeholder="Dán link YouTube (ví dụ: https://www.youtube.com/watch?v=...) hoặc Video ID 11 ký tự"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setCustomInputOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg whitespace-nowrap"
              >
                Tải lên TV
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
