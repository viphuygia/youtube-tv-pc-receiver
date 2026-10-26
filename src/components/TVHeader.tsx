import React from 'react';
import { Tv, Search, Laptop, MonitorPlay, Cast } from 'lucide-react';
import { ViewTab } from '../types/tv';

interface TVHeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenSearch: () => void;
  onQuickFullscreen: () => void;
  recordingCount: number;
  onOpenPhonePair: () => void;
  connectedPhonesCount: number;
}

export const TVHeader: React.FC<TVHeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onQuickFullscreen,
  recordingCount,
  onOpenPhonePair,
  connectedPhonesCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0c0d12]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2 text-white font-extrabold text-lg sm:text-xl tracking-tight whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Tv className="w-4 h-4 fill-current" />
          </div>
          <span className="font-display">YouTube <span className="text-red-500">TV</span></span>
        </button>

        {/* Zone 2: 4–5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onTabChange('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'home' 
                ? 'text-white font-semibold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onTabChange('live')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'live' 
                ? 'text-white font-semibold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trực tiếp
          </button>
          <button
            onClick={() => onTabChange('guide')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'guide' 
                ? 'text-white font-semibold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lịch phát sóng (Guide)
          </button>
          <button
            onClick={() => onTabChange('library')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              currentTab === 'library' 
                ? 'text-white font-semibold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Thư viện DVR</span>
            {recordingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full font-mono font-bold">
                {recordingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('cast-mode')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              currentTab === 'cast-mode' 
                ? 'text-red-400 font-semibold border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Cast className="w-3.5 h-3.5" />
            <span>Cast từ App Phone</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Phone / Search affordances */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Phone Remote Connect Button */}
          <button
            onClick={onOpenPhonePair}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              connectedPhonesCount > 0 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Dùng điện thoại cùng mạng Wi-Fi làm Remote điều khiển"
          >
            <div className={`w-2 h-2 rounded-full ${connectedPhonesCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
            <span className="hidden sm:inline">Dùng điện thoại</span>
            <span className="sm:hidden">Remote</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Tìm kiếm kênh và chương trình (hoặc dán link)"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <button
            onClick={onQuickFullscreen}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/25 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chế độ TV (F11)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
