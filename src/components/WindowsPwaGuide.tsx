import React, { useState } from 'react';
import { 
  Laptop, Monitor, Tv, Gamepad2, Volume2, ShieldCheck, 
  ExternalLink, CheckCircle2, ChevronRight, Download, Sparkles, Sliders
} from 'lucide-react';
import { WINDOWS_TIPS } from '../data/channelsData';

export const WindowsPwaGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('pwa-install');
  const [copiedTip, setCopiedTip] = useState<string | null>(null);

  const selectedTip = WINDOWS_TIPS.find(t => t.id === activeTab) || WINDOWS_TIPS[0];

  const handleCopyShortcut = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTip(text);
    setTimeout(() => setCopiedTip(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner for Windows PC */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/60 via-[#161a29] to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold mb-3 border border-red-500/30">
            <Laptop className="w-3.5 h-3.5" />
            <span>Tối ưu chuyên sâu cho Windows 10 & Windows 11</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hướng Dẫn Thưởng Thức YouTube TV Trọn Vẹn Trên Máy Tính Windows
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Biến chiếc máy tính để bàn hoặc laptop của bạn thành một trung tâm truyền hình thông minh cao cấp. Cài đặt không cần giả lập, điều khiển bằng bàn phím hoặc tay cầm game, xuất 4K HDR sang màn hình TV lớn không giật lag.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button 
              onClick={() => handleCopyShortcut('chrome://apps')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Cài đặt ứng dụng PWA</span>
            </button>
            <div className="text-xs text-slate-400 font-mono">
              Phím tắt nhanh: <kbd className="px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700">Win + P</kbd> để chiếu TV
            </div>
          </div>
        </div>

        {/* Ambient subtle illustration aura */}
        <div 
          aria-hidden="true" 
          className="absolute -right-10 -bottom-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
        />
      </div>

      {/* Guide Interactive Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Topic Tabs */}
        <div className="lg:col-span-4 space-y-2">
          {WINDOWS_TIPS.map((tip) => {
            const isActive = tip.id === activeTab;
            return (
              <button
                key={tip.id}
                onClick={() => setActiveTab(tip.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isActive 
                    ? 'bg-slate-800/90 border-red-500/80 shadow-lg shadow-red-950/40 text-white' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tip.id === 'pwa-install' && <Download className="w-5 h-5" />}
                  {tip.id === 'tv-screen-cast' && <Tv className="w-5 h-5" />}
                  {tip.id === 'keyboard-remote' && <Gamepad2 className="w-5 h-5" />}
                  {tip.id === 'sound-hdr-settings' && <Sliders className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {tip.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick Hardware Diagnostic Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121522] border border-slate-800 text-xs text-slate-300 space-y-2.5 mt-4">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kiểm tra khả năng tương thích PC</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] tabular-nums">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Trình duyệt khuyến nghị:</span>
                <span className="text-emerald-400">Microsoft Edge / Chrome</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Codec giải mã GPU:</span>
                <span className="text-indigo-400">AV1 / VP9 (Tăng tốc HW)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Độ phân giải tối đa:</span>
                <span className="text-amber-400">4K Ultra HD @ 60fps</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Độ trễ phản hồi phím:</span>
                <span className="text-emerald-400">&lt; 16ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-Step Instructions */}
        <div className="lg:col-span-8 bg-[#10131e] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {selectedTip.title}
              </h3>
              <span className="text-xs text-red-400 font-mono font-medium">
                Bước 1 đến {selectedTip.steps.length}
              </span>
            </div>

            <div className="space-y-4">
              {selectedTip.steps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="w-7 h-7 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center text-xs font-bold shrink-0">
                    {sIdx + 1}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Helpful Windows Command Box */}
          <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400">Địa chỉ YouTube TV chuẩn trên trình duyệt:</span>
              <div className="text-xs font-mono font-bold text-red-400 mt-0.5">
                tv.youtube.com · youtube.com/tv
              </div>
            </div>
            <button
              onClick={() => handleCopyShortcut('tv.youtube.com')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              {copiedTip === 'tv.youtube.com' ? 'Đã sao chép link!' : 'Sao chép địa chỉ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
