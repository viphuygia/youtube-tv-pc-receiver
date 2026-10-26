import React, { useState } from 'react';
import { 
  Tv, Cast, Smartphone, Monitor, CheckCircle2, 
  ExternalLink, Copy, Sparkles, ArrowRight, Play,
  Wifi, Sliders, ShieldAlert, Info
} from 'lucide-react';

interface CastReceiverViewProps {
  onPlayUrl: (urlOrId: string) => void;
}

export const CastReceiverView: React.FC<CastReceiverViewProps> = ({ onPlayUrl }) => {
  const [tvCode, setTvCode] = useState<string>('548 923 104 882');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'windows-wireless' | 'youtube-tv-code' | 'chromecast-receiver'>('windows-wireless');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tvCode.replace(/\s+/g, ''));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleQuickPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareLink.trim()) {
      onPlayUrl(shareLink.trim());
      setShareLink('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Smart TV Cast Receiver Standby Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-red-950/70 via-[#141829] to-[#0d0f17] border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold mb-3 border border-red-500/30">
              <Cast className="w-3.5 h-3.5 animate-pulse" />
              <span>Sẵn sàng nhận Cast từ ứng dụng YouTube trên điện thoại</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mở Ứng Dụng YouTube Trên Điện Thoại & Bấm Cast Lên PC
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Bạn có thể mở ứng dụng YouTube chính thức (iOS/Android) trên điện thoại và truyền video trực tiếp lên màn hình máy tính Windows này giống hệt như trên Smart TV Samsung, LG hay Sony.
            </p>

            {/* Quick Share Link Cast Input */}
            <form onSubmit={handleQuickPlay} className="mt-5 flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Dán link từ nút [Chia sẻ / Share] trên YouTube điện thoại..."
                value={shareLink}
                onChange={(e) => setShareLink(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shrink-0 shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chiếu lên màn hình</span>
              </button>
            </form>
          </div>

          {/* TV Pairing Code Box */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shrink-0 w-full lg:w-72 text-center backdrop-blur-md">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold mb-1">
              Mã liên kết TV (YouTube TV Code)
            </div>
            <div className="text-2xl font-black font-mono text-red-500 tracking-wider my-2">
              {tvCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã 12 số'}</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-2">
              Mở App YouTube &gt; Cài đặt &gt; Xem trên TV &gt; Nhập mã này
            </p>
          </div>
        </div>

        {/* Ambient Glow */}
        <div 
          aria-hidden="true" 
          className="absolute -right-10 -bottom-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"
        />
      </div>

      {/* 3 Real-World Solutions Explained */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-white">
            3 Cách Để Bấm Nút Cast Trên App YouTube Điện Thoại Nhận Diện Ngay PC
          </h3>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setActiveTab('windows-wireless')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'windows-wireless'
                ? 'bg-slate-800/90 border-red-500 shadow-lg text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold mb-2">
                KHUYÊN DÙNG (CÓ SẴN TRÊN WINDOWS)
              </div>
              <h4 className="text-sm font-bold text-slate-100">1. Tính năng &quot;Wireless Display&quot;</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Biến máy tính Windows 10/11 thành màn hình không dây nhận Cast từ điện thoại.
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('youtube-tv-code')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'youtube-tv-code'
                ? 'bg-slate-800/90 border-red-500 shadow-lg text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold mb-2">
                CHUẨN YOUTUBE TV
              </div>
              <h4 className="text-sm font-bold text-slate-100">2. Nhập Mã TV trên App YouTube</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Liên kết chính thức bằng mã TV qua YouTube on TV (youtube.com/tv).
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('chromecast-receiver')}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'chromecast-receiver'
                ? 'bg-slate-800/90 border-red-500 shadow-lg text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold mb-2">
                PHẦN MỀM CHUYÊN DỤNG
              </div>
              <h4 className="text-sm font-bold text-slate-100">3. Ứng Dụng Cast Receiver</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Biến PC thành Chromecast phần cứng ảo với AirServer hoặc CastReceiver.
              </p>
            </div>
          </button>
        </div>

        {/* Tab 1 Content: Windows Wireless Display */}
        {activeTab === 'windows-wireless' && (
          <div className="bg-[#10131e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  Cách 1: Kích hoạt tính năng &quot;Chiếu lên PC này&quot; (Wireless Display) trên Windows
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Không cần mua thêm thiết bị Chromecast, tích hợp sẵn hoàn toàn miễn phí trên Windows 10 và Windows 11.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs">1</div>
                  <span>Bật tính năng trên máy tính Windows</span>
                </div>
                <ul className="space-y-2 text-slate-300 leading-relaxed pl-8 list-disc">
                  <li>Mở <strong>Settings (Cài đặt)</strong> trên Windows &gt; chọn <strong>System</strong> &gt; chọn <strong>Projecting to this PC</strong> (Chiếu lên PC này).</li>
                  <li>Nếu thấy thông báo chưa cài đặt: Nhấn vào <strong>Optional features (Tính năng tùy chọn)</strong> &gt; Tìm kiếm và cài đặt <strong>&quot;Wireless Display&quot; (Màn hình không dây)</strong>.</li>
                  <li>Sau khi cài xong, nhấn <strong>&quot;Launch the Connect app to project to this PC&quot;</strong> (Khởi chạy ứng dụng Kết nối). Máy tính sẽ ở trạng thái sẵn sàng nhận truyền.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs">2</div>
                  <span>Thao tác trên điện thoại cùng Wi-Fi</span>
                </div>
                <ul className="space-y-2 text-slate-300 leading-relaxed pl-8 list-disc">
                  <li>Đảm bảo điện thoại và máy tính đang kết nối <strong>cùng một mạng Wi-Fi</strong>.</li>
                  <li><strong>Trên điện thoại Samsung</strong>: Vuốt từ trên xuống mở thanh cài đặt nhanh &gt; Bấm vào <strong>Smart View</strong> &gt; Chọn tên máy tính của bạn.</li>
                  <li><strong>Trên Xiaomi / Oppo / Realme / Pixel</strong>: Mở Cài đặt &gt; Kết nối &amp; Chia sẻ &gt; <strong>Truyền màn hình (Cast)</strong> &gt; Chọn máy tính.</li>
                  <li>Mở ứng dụng <strong>YouTube trên điện thoại</strong>: Video sẽ phát toàn màn hình với chất lượng cao và âm thanh vòm lên PC!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Official YouTube TV Code */}
        {activeTab === 'youtube-tv-code' && (
          <div className="bg-[#10131e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  Cách 2: Nhập Mã TV trực tiếp trong App YouTube điện thoại (Chuẩn YouTube TV)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phương thức này liên kết vĩnh viễn app YouTube trên điện thoại với máy tính qua tài khoản Google.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div className="text-slate-200 leading-relaxed">
                  <strong>Tại sao trên trình duyệt PC mặc định không có nút nhận Cast?</strong> Vì Google chặn giao diện TV nếu bạn truy cập bằng trình duyệt máy tính thông thường. Để mở giao diện YouTube TV chính thức, bạn cần truy cập trang <code className="text-red-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">youtube.com/tv</code> với User-Agent là Smart TV (bằng tiện ích mở rộng như <em>User-Agent Switcher</em>).
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div className="text-slate-200 leading-relaxed">
                  Khi giao diện TV mở ra, bạn vào mục <strong>Cài đặt (Settings) &gt; Liên kết bằng mã TV (Link with TV code)</strong>, màn hình sẽ hiển thị <strong>mã 12 chữ số</strong> màu xanh da trời.
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div className="text-slate-200 leading-relaxed">
                  Mở ứng dụng <strong>YouTube trên điện thoại</strong> &gt; Nhấn vào <strong>ảnh đại diện của bạn (hoặc biểu tượng Cast ở góc trên)</strong> &gt; Chọn <strong>Cài đặt</strong> &gt; <strong>Xem trên TV</strong> &gt; Nhấn <strong>Nhập mã TV</strong> và điền 12 chữ số vào.
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                <div className="text-slate-200 leading-relaxed">
                  <strong>Thành công!</strong> Từ bây giờ, mỗi khi mở app YouTube trên điện thoại, bạn nhấn vào biểu tượng <strong>Cast (hình chữ nhật có sóng Wi-Fi)</strong>, bạn sẽ thấy ngay tên PC của mình và có thể bấm Cast bất kỳ video nào lên máy tính!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Content: Chromecast Receiver */}
        {activeTab === 'chromecast-receiver' && (
          <div className="bg-[#10131e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  Cách 3: Cài đặt phần mềm giả lập Chromecast Receiver trên Windows
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Biến chiếc PC chạy ngầm như một thiết bị Google Chromecast thực thụ trong mạng gia đình.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-sm">Phần mềm CastReceiver / AirServer</h5>
                <p className="text-slate-300 leading-relaxed">
                  Cài đặt phần mềm <strong>AirServer</strong> hoặc <strong>CastReceiver</strong> lên máy tính Windows. Phần mềm sẽ lắng nghe giao thức Google Cast (DIAL / mDNS).
                </p>
                <div className="pt-2 text-slate-400">
                  Ưu điểm: Không cần mở trình duyệt trước. Chỉ cần máy tính đang bật, mở app YouTube điện thoại là icon Cast sáng lên ngay.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h5 className="font-bold text-white text-sm">Cách dùng sau khi cài đặt</h5>
                <p className="text-slate-300 leading-relaxed">
                  1. Mở ứng dụng YouTube chính thức trên điện thoại.<br />
                  2. Bấm vào biểu tượng Cast ở góc trên màn hình.<br />
                  3. Chọn tên PC của bạn (ví dụ: &quot;Living Room PC&quot;).<br />
                  4. Video trên điện thoại sẽ tự động truyền và phát mượt mà trên PC.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
