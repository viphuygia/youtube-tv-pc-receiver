import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Wifi, CheckCircle2, Copy, ExternalLink, X, QrCode } from 'lucide-react';

interface PhonePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairCode: string;
  connectedPhonesCount: number;
  onOpenLocalTestTab: () => void;
}

export const PhonePairModal: React.FC<PhonePairModalProps> = ({
  isOpen,
  onClose,
  pairCode,
  connectedPhonesCount,
  onOpenLocalTestTab
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute remote URL
  const remoteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?remote=1&code=${pairCode}`
    : '';

  useEffect(() => {
    if (remoteUrl) {
      QRCode.toDataURL(remoteUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f1118',
          light: '#ffffff'
        }
      })
        .then(setQrDataUrl)
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [remoteUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#121422] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Dùng Điện Thoại Điều Khiển YouTube TV
            </h3>
            <p className="text-xs text-slate-400">
              Kết nối điện thoại cùng mạng Wi-Fi để làm Remote điều khiển từ xa
            </p>
          </div>
        </div>

        {/* Connection Status Badge */}
        <div className={`p-3 rounded-2xl border mb-6 flex items-center justify-between transition-colors ${
          connectedPhonesCount > 0 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
            : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <div className={`w-2.5 h-2.5 rounded-full ${connectedPhonesCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
            <span>
              {connectedPhonesCount > 0 
                ? `Đã kết nối ${connectedPhonesCount} điện thoại! Sẵn sàng điều khiển` 
                : 'Đang chờ điện thoại quét mã kết nối...'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>Cùng mạng Wi-Fi</span>
          </div>
        </div>

        {/* QR Code and Code Display */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 mb-6">
          {/* QR Code */}
          <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code điều khiển YouTube TV" className="w-40 h-40 rounded-xl" />
            ) : (
              <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-xl" />
            )}
          </div>

          {/* Pairing Code info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider font-semibold">
                MÃ KẾT NỐI TV (PAIR CODE)
              </span>
              <div className="text-3xl font-black font-mono text-red-500 tracking-widest mt-1">
                {pairCode.slice(0, 3)}-{pairCode.slice(3)}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mở ứng dụng <strong>Camera</strong> trên điện thoại Android hoặc iPhone, hướng vào mã QR để mở Remote ngay lập tức.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Đã sao chép link Remote!' : 'Sao chép link cho điện thoại'}</span>
            </button>
            <button
              onClick={onOpenLocalTestTab}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-red-600/30"
              title="Mở tab điều khiển thử nghiệm ngay trên máy tính"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở thử Remote trên tab mới</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center font-mono pt-1">
            Mẹo: Khi bấm phím trên điện thoại, máy tính sẽ chuyển kênh và chỉnh âm lượng tức thì.
          </div>
        </div>
      </div>
    </div>
  );
};
