export interface Program {
  id: string;
  channelId: string;
  title: string;
  subTitle?: string;
  category: 'sports' | 'news' | 'movies' | 'tech' | 'music' | 'kids';
  startTime: string; // e.g. "19:00"
  endTime: string;   // e.g. "20:30"
  durationMinutes: number;
  description: string;
  rating: string; // TV-14, PG-13, Live
  isLiveNow?: boolean;
  progressPercent: number; // 0 - 100
  youtubeVideoId: string;
  thumbnailUrl: string;
  badge?: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  category: 'sports' | 'news' | 'movies' | 'tech' | 'music' | 'kids';
  logoText: string;
  logoBg: string;
  description: string;
  currentProgram: Program;
  upcomingPrograms: Program[];
  isFavorite?: boolean;
  quality: '4K HDR' | '1080p 60fps' | '1080p HD';
  audio: 'Dolby 5.1' | 'Stereo' | 'Spatial Audio';
}

export type ViewTab = 'home' | 'live' | 'guide' | 'library' | 'windows-guide' | 'cast-mode';

export interface SavedRecording {
  id: string;
  programTitle: string;
  channelName: string;
  category: string;
  youtubeVideoId: string;
  recordedAt: string;
  durationMinutes: number;
  thumbnailUrl: string;
}
