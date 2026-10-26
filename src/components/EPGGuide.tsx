import React, { useState } from 'react';
import { Play, Radio, BookmarkPlus, BookmarkCheck, Clock, Eye } from 'lucide-react';
import { Channel, Program } from '../types/tv';

interface EPGGuideProps {
  channels: Channel[];
  selectedChannel: Channel;
  onSelectChannel: (channel: Channel, program?: Program) => void;
  savedProgramIds: string[];
  onToggleSaveProgram: (program: Program, channel: Channel) => void;
}

export const EPGGuide: React.FC<EPGGuideProps> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  savedProgramIds,
  onToggleSaveProgram
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredProgram, setHoveredProgram] = useState<{ program: Program; channel: Channel } | null>(null);

  const timeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

  const filteredChannels = activeCategory === 'all'
    ? channels
    : channels.filter(c => c.category === activeCategory);

  return (
    <div className="bg-[#10121a] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Guide Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Lịch Phát Sóng Trực Tiếp (Live EPG Grid)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chọn kênh để xem ngay hoặc ghi lại chương trình vào Thư viện DVR
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'sports', label: 'Thể thao' },
            { id: 'news', label: 'Tin tức' },
            { id: 'movies', label: 'Phim ảnh' },
            { id: 'tech', label: 'Công nghệ' },
            { id: 'music', label: 'Âm nhạc' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Interactive Grid Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          {/* Time Header Row */}
          <div className="grid grid-cols-12 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="col-span-3 p-3 font-semibold text-slate-300 border-r border-slate-800 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span>KÊNH & NGUỒN PHÁT</span>
            </div>
            <div className="col-span-9 grid grid-cols-8 divide-x divide-slate-800/60 relative">
              {/* "NOW" vertical red badge indicator */}
              <div className="absolute top-0 bottom-0 left-[22%] w-0.5 bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                <span className="absolute -top-1 -left-4 bg-red-600 text-[9px] font-bold text-white px-1 rounded uppercase tracking-wider">
                  Hiện tại
                </span>
              </div>
              {timeSlots.map((time, idx) => (
                <div key={idx} className="p-3 text-center truncate">
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Channel Rows */}
          <div className="divide-y divide-slate-800/60">
            {filteredChannels.map((ch) => {
              const isCurrentSelected = selectedChannel.id === ch.id;
              const allPrograms = [ch.currentProgram, ...ch.upcomingPrograms];

              return (
                <div 
                  key={ch.id} 
                  className={`grid grid-cols-12 transition-colors ${
                    isCurrentSelected ? 'bg-red-950/20' : 'hover:bg-slate-900/40'
                  }`}
                >
                  {/* Channel Column */}
                  <div 
                    onClick={() => onSelectChannel(ch)}
                    className="col-span-3 p-3.5 border-r border-slate-800/80 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${ch.logoBg}`}>
                        {ch.logoText}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-red-400 transition-colors truncate">
                          {ch.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Kênh {ch.number} · {ch.quality}
                        </div>
                      </div>
                    </div>
                    {isCurrentSelected && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 ml-1" />
                    )}
                  </div>

                  {/* Programs Slots */}
                  <div className="col-span-9 grid grid-cols-8 p-1.5 gap-1.5 items-stretch">
                    {/* Live Show (Takes 3 columns) */}
                    <div 
                      onClick={() => onSelectChannel(ch, ch.currentProgram)}
                      onMouseEnter={() => setHoveredProgram({ program: ch.currentProgram, channel: ch })}
                      className="col-span-3 rounded-lg p-2.5 bg-slate-800/70 hover:bg-slate-700/90 border border-slate-700/60 cursor-pointer relative overflow-hidden group transition-all"
                    >
                      {/* Live Progress Bar Underneath */}
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all"
                        style={{ width: `${ch.currentProgram.progressPercent}%` }}
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-mono text-red-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping" />
                          ĐANG PHÁT
                        </span>
                        <span className="font-mono">{ch.currentProgram.startTime} - {ch.currentProgram.endTime}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-white truncate">
                        {ch.currentProgram.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ch.currentProgram.subTitle || ch.currentProgram.description}
                      </p>
                    </div>

                    {/* Upcoming Shows */}
                    {ch.upcomingPrograms.map((prog, pIdx) => {
                      const isProgSaved = savedProgramIds.includes(prog.id);
                      return (
                        <div
                          key={prog.id}
                          onClick={() => onSelectChannel(ch, prog)}
                          onMouseEnter={() => setHoveredProgram({ program: prog, channel: ch })}
                          className={`col-span-2.5 rounded-lg p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer group transition-all ${
                            pIdx > 1 ? 'hidden lg:block' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5 font-mono">
                            <span>{prog.startTime}</span>
                            <span>{prog.durationMinutes}m</span>
                          </div>
                          <h4 className="text-xs font-medium text-slate-300 group-hover:text-slate-100 truncate">
                            {prog.title}
                          </h4>
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="text-slate-500 uppercase">{prog.category}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSaveProgram(prog, ch);
                              }}
                              className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                                isProgSaved ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title={isProgSaved ? 'Đã lưu trong DVR' : 'Lưu lại để xem sau (DVR)'}
                            >
                              {isProgSaved ? <BookmarkCheck className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program Inspector Bar on Hover/Selection */}
      {hoveredProgram && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded text-white text-[10px] font-bold ${hoveredProgram.channel.logoBg}`}>
              {hoveredProgram.channel.logoText}
            </div>
            <div>
              <div className="text-slate-200 font-semibold">
                {hoveredProgram.program.title} <span className="text-slate-400 font-normal">({hoveredProgram.program.startTime} - {hoveredProgram.program.endTime})</span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-1 max-w-xl">
                {hoveredProgram.program.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectChannel(hoveredProgram.channel, hoveredProgram.program)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Xem chương trình này</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
