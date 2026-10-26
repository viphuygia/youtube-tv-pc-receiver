import React, { useState } from 'react';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Home, CornerUpLeft, Volume2, VolumeX, Maximize2, 
  Tv, List, Keyboard, X, Sparkles 
} from 'lucide-react';

interface VirtualRemoteProps {
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right' | 'select' | 'back') => void;
  onHome: () => void;
  onGuide: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onChannelStep: (delta: number) => void;
  currentChannelNumber: number;
}

export const VirtualRemote: React.FC<VirtualRemoteProps> = ({
  onNavigate,
  onHome,
  onGuide,
  onToggleFullscreen,
  onToggleMute,
  isMuted,
  onChannelStep,
  currentChannelNumber
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showKeyGuide, setShowKeyGuide] = useState<boolean>(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Keyboard Shortcuts Floating Tip */}
      {showKeyGuide && (
        <div className="mb-3 p-4 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl text-xs max-w-xs backdrop-blur-md text-slate-300">
          <div className="flex items-center justify-between font-bold text-white mb-2 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-red-500" />
              Phím tắt Windows PC
            </span>
            <button onClick={() => setShowKeyGuide(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center"><span className="text-slate-400">↑ ↓ ← →</span> <span>Di chuyển danh mục & kênh</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400">Enter</span> <span>Chọn kênh / Xác nhận</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400">Space</span> <span>Tạm dừng / Tiếp tục</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400">Esc / Backspace</span> <span>Quay lại Trang chủ</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400">Phím F / F11</span> <span>Bật/Tắt Toàn màn hình</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-400">Phím M</span> <span>Bật/Tắt âm thanh (Mute)</span></div>
          </div>
        </div>
      )}

      {/* Expanded Remote Control Device */}
      {isOpen ? (
        <div className="w-64 bg-[#141622]/95 border border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-slate-200">
          {/* Remote Top Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wider">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>YOUTUBE TV REMOTE</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onHome}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-600 hover:text-white transition-colors flex flex-col items-center gap-1 text-[10px]"
              title="Về Trang chủ"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={onGuide}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-600 hover:text-white transition-colors flex flex-col items-center gap-1 text-[10px]"
              title="Lịch phát sóng EPG"
            >
              <List className="w-4 h-4" />
              <span>Guide</span>
            </button>
            <button
              onClick={() => onNavigate('back')}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors flex flex-col items-center gap-1 text-[10px]"
              title="Quay lại"
            >
              <CornerUpLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* D-Pad Controller Circle */}
          <div className="relative w-44 h-44 mx-auto bg-slate-900 rounded-full border border-slate-700/80 shadow-inner flex items-center justify-center p-2">
            {/* Up */}
            <button
              onClick={() => onNavigate('up')}
              className="absolute top-2 left-1/2 -translate-x-1/2 p-2 rounded-full hover:bg-slate-700 active:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Lên trên"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* Down */}
            <button
              onClick={() => onNavigate('down')}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 rounded-full hover:bg-slate-700 active:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Xuống dưới"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* Left */}
            <button
              onClick={() => onNavigate('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-700 active:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Sang trái"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right */}
            <button
              onClick={() => onNavigate('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-700 active:bg-red-600 text-slate-300 hover:text-white transition-colors"
              title="Sang phải"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Center OK Button */}
            <button
              onClick={() => onNavigate('select')}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center transition-all"
              title="OK / Chọn"
            >
              OK
            </button>
          </div>

          {/* Channel and Volume Rockers */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Channel Rocker */}
            <div className="bg-slate-800/80 rounded-2xl p-2 flex flex-col items-center justify-between border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CH {currentChannelNumber}</span>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => onChannelStep(1)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 transition-colors"
                  title="Kênh tiếp theo"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onChannelStep(-1)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600 transition-colors"
                  title="Kênh trước đó"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio & Display Rocker */}
            <div className="bg-slate-800/80 rounded-2xl p-2 flex flex-col items-center justify-between border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AUDIO & TV</span>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={onToggleMute}
                  className={`p-1.5 rounded-lg transition-colors ${isMuted ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                  title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={onToggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                  title="Toàn màn hình TV"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard Helper Toggle */}
          <button
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="text-[11px] text-slate-400 hover:text-slate-200 text-center flex items-center justify-center gap-1.5 py-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Xem phím tắt máy tính</span>
          </button>
        </div>
      ) : (
        /* Floating Trigger Button */
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyGuide(!showKeyGuide)}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-full shadow-lg border border-slate-700 transition-all hover:scale-105"
            title="Phím tắt bàn phím Windows"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-xl shadow-red-600/30 transition-all hover:scale-105 font-medium text-xs tracking-wide"
            title="Mở Remote ảo điều khiển TV"
          >
            <Tv className="w-4 h-4" />
            <span>Remote ảo TV</span>
          </button>
        </div>
      )}
    </div>
  );
};
