import React from 'react';
import { 
  Bookmark, Play, Trash2, Clock, HardDrive, 
  Film, Sparkles, CheckCircle2, Tv 
} from 'lucide-react';
import { SavedRecording, Channel, Program } from '../types/tv';

interface LibraryViewProps {
  recordings: SavedRecording[];
  onPlayRecording: (recording: SavedRecording) => void;
  onRemoveRecording: (recordingId: string) => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel, program?: Program) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  recordings,
  onPlayRecording,
  onRemoveRecording,
  channels,
  onSelectChannel
}) => {
  return (
    <div className="space-y-6">
      {/* Cloud DVR Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-slate-900 to-[#121626] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Thư Viện & Cloud DVR Của Bạn</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-semibold border border-red-500/30">
                DUNG LƯỢNG KHÔNG GIỚI HẠN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Các chương trình và phim đã ghi sẽ được lưu trữ đám mây tự động trong 9 tháng và có thể xem lại bất kỳ lúc nào trên máy tính.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs tabular-nums text-slate-300">
          <div className="text-right">
            <div className="text-slate-500 text-[10px] uppercase">Số bản ghi DVR</div>
            <div className="text-lg font-bold text-white">{recordings.length} chương trình</div>
          </div>
        </div>
      </div>

      {/* Recorded Programs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-red-500" />
            <span>Chương Trình Đã Ghi (Cloud Recordings)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {recordings.length} mục
          </span>
        </div>

        {recordings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center">
            <Film className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-200">Chưa có chương trình nào được lưu</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
              Nhấn vào nút "+ Lưu vào DVR" khi xem kênh hoặc trên Lịch phát sóng (Guide) để ghi lại các bộ phim và trận đấu yêu thích.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((item) => (
              <div 
                key={item.id}
                className="group rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-red-500/50 overflow-hidden transition-all duration-200 flex flex-col justify-between"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.programTitle} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Channel Tag */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-200 font-semibold border border-white/10">
                    {item.channelName}
                  </span>

                  {/* Play Action Button Overlay */}
                  <button
                    onClick={() => onPlayRecording(item)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-red-600/40 scale-95 group-hover:scale-100"
                    title="Phát lại chương trình này"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300">
                    {item.durationMinutes} phút
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                      <span>Đã ghi: {item.recordedAt}</span>
                      <span className="uppercase text-red-400 font-semibold">{item.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                      {item.programTitle}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => onPlayRecording(item)}
                      className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Xem lại</span>
                    </button>
                    <button
                      onClick={() => onRemoveRecording(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Xóa khỏi thư viện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Channels to Explore */}
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Tv className="w-4 h-4 text-red-500" />
          <span>Kênh Truyền Hình Nổi Bật Dành Cho Bạn</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch)}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-left transition-all group flex flex-col items-start justify-between min-h-[96px]"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white mb-2 ${ch.logoBg}`}>
                {ch.logoText}
              </div>
              <div className="w-full">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-red-400 truncate">
                  {ch.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {ch.quality}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
