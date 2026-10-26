import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Play, Tv, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Channel, Program } from '../types/tv';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel, program?: Program) => void;
  onPlayCustomUrl: (urlOrId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  channels,
  onSelectChannel,
  onPlayCustomUrl
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search in channels and programs
  const matchingChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(trimmed) ||
    ch.number.toString().includes(trimmed) ||
    ch.category.toLowerCase().includes(trimmed) ||
    ch.description.toLowerCase().includes(trimmed)
  );

  const matchingPrograms: { program: Program; channel: Channel }[] = [];
  channels.forEach(ch => {
    const list = [ch.currentProgram, ...ch.upcomingPrograms];
    list.forEach(p => {
      if (
        p.title.toLowerCase().includes(trimmed) ||
        p.description.toLowerCase().includes(trimmed) ||
        p.category.toLowerCase().includes(trimmed)
      ) {
        matchingPrograms.push({ program: p, channel: ch });
      }
    });
  });

  const isUrlOrId = trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || (trimmed.length === 11 && !trimmed.includes(' '));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#121420] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Field */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-red-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm kênh, phim, bóng đá, thời sự hoặc dán link YouTube..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && isUrlOrId) {
                onPlayCustomUrl(query);
                onClose();
              }
            }}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm sm:text-base font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Paste Play Action */}
          {isUrlOrId && (
            <div 
              onClick={() => {
                onPlayCustomUrl(query);
                onClose();
              }}
              className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 hover:bg-red-900/40 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Phát luồng YouTube tùy chỉnh</div>
                  <div className="text-xs text-slate-300 font-mono truncate max-w-md">{query}</div>
                </div>
              </div>
              <CornerDownLeft className="w-4 h-4 text-red-400" />
            </div>
          )}

          {/* Channels List */}
          {matchingChannels.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Kênh truyền hình ({matchingChannels.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onSelectChannel(ch);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${ch.logoBg}`}>
                        {ch.logoText}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-red-400 truncate">
                          {ch.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Kênh {ch.number} · {ch.quality}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Programs List */}
          {matchingPrograms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Chương trình & Phim ({matchingPrograms.length})
              </h4>
              <div className="space-y-2">
                {matchingPrograms.slice(0, 6).map(({ program, channel }) => (
                  <div
                    key={program.id}
                    onClick={() => {
                      onSelectChannel(channel, program);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-0.5">
                        <span className="text-red-400 font-semibold">{channel.name}</span>
                        <span>·</span>
                        <span>{program.startTime} - {program.endTime}</span>
                        <span>·</span>
                        <span className="uppercase">{program.category}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-red-400 truncate">
                        {program.title}
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-slate-600 group-hover:text-red-500 shrink-0 ml-3 fill-current" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {trimmed && matchingChannels.length === 0 && matchingPrograms.length === 0 && !isUrlOrId && (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không tìm thấy kết quả nào cho &quot;{query}&quot;. Thử tìm &quot;VTV&quot;, &quot;ESPN&quot;, &quot;HBO&quot;, &quot;phim&quot; hoặc dán link YouTube.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
