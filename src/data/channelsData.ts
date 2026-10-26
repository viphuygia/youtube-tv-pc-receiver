import { Channel } from '../types/tv';

export const CHANNELS_DATA: Channel[] = [
  {
    id: 'ch-news-vtv',
    number: 101,
    name: 'VTV Digital & Tin Tức 24/7',
    category: 'news',
    logoText: 'VTV',
    logoBg: 'bg-red-700',
    description: 'Kênh tin tức thời sự chính luận, cập nhật tin tức Việt Nam và quốc tế 24/7.',
    quality: '1080p 60fps',
    audio: 'Stereo',
    currentProgram: {
      id: 'pr-vtv-01',
      channelId: 'ch-news-vtv',
      title: 'Bản Tin Thời Sự Quốc Tế & Kinh Tế',
      subTitle: 'Cập nhật diễn biến thế giới trong ngày',
      category: 'news',
      startTime: '19:00',
      endTime: '20:00',
      durationMinutes: 60,
      description: 'Tổng hợp các sự kiện nóng về tài chính, công nghệ, ngoại giao và đời sống xã hội toàn cầu với bình luận chuyên sâu.',
      rating: 'Live',
      isLiveNow: true,
      progressPercent: 65,
      youtubeVideoId: 'dp8PhLsUcFE', // Bloomberg Global News Live feed
      thumbnailUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      badge: 'TRỰC TIẾP'
    },
    upcomingPrograms: [
      {
        id: 'pr-vtv-02',
        channelId: 'ch-news-vtv',
        title: 'Tiêu Điểm Kinh Tế Số & AI',
        category: 'news',
        startTime: '20:00',
        endTime: '20:45',
        durationMinutes: 45,
        description: 'Tác động của trí tuệ nhân tạo và máy tính lượng tử đối với doanh nghiệp và thị trường lao động.',
        rating: 'TV-PG',
        progressPercent: 0,
        youtubeVideoId: '5qap5aO4i9A',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'pr-vtv-03',
        channelId: 'ch-news-vtv',
        title: 'Thế Giới 24 Giờ Qua',
        category: 'news',
        startTime: '20:45',
        endTime: '21:30',
        durationMinutes: 45,
        description: 'Góc nhìn đa chiều về các chuyển động địa chính trị và khoa học công nghệ quốc tế.',
        rating: 'TV-14',
        progressPercent: 0,
        youtubeVideoId: '21X5lGlDOfg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ch-sports-espn',
    number: 204,
    name: 'ESPN & Premier League TV',
    category: 'sports',
    logoText: 'ESPN',
    logoBg: 'bg-red-600',
    description: 'Thế giới thể thao đỉnh cao: Ngoại hạng Anh, Champions League, NBA và F1.',
    quality: '4K HDR',
    audio: 'Dolby 5.1',
    currentProgram: {
      id: 'pr-sp-01',
      channelId: 'ch-sports-espn',
      title: 'Trực Tiếp Ngoại Hạng Anh: Đại Chiến Top 4',
      subTitle: 'Super Sunday - Vòng đấu đỉnh cao',
      category: 'sports',
      startTime: '19:30',
      endTime: '21:30',
      durationMinutes: 120,
      description: 'Trận cầu tâm điểm với tốc độ nghẹt thở, phân tích chiến thuật đồ họa 3D trước và sau trận đấu từ sân vận động Wembley.',
      rating: 'Live',
      isLiveNow: true,
      progressPercent: 48,
      youtubeVideoId: 'u43t12j67eU', // Real Premier League highlights/action
      thumbnailUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
      badge: '4K HDR'
    },
    upcomingPrograms: [
      {
        id: 'pr-sp-02',
        channelId: 'ch-sports-espn',
        title: 'NBA Action & Top Plays of the Week',
        category: 'sports',
        startTime: '21:30',
        endTime: '22:30',
        durationMinutes: 60,
        description: 'Những pha úp rổ ngoạn mục và các cú ném buzzer-beater đẳng cấp tuần qua.',
        rating: 'TV-G',
        progressPercent: 0,
        youtubeVideoId: 'K4TOrB7at0Y',
        thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'
      },
      {
        id: 'pr-sp-03',
        channelId: 'ch-sports-espn',
        title: 'F1 Grand Prix Highlights & Onboard Cam',
        category: 'sports',
        startTime: '22:30',
        endTime: '23:30',
        durationMinutes: 60,
        description: 'Khoảnh khắc vượt mặt thót tim trên đường đua tốc độ cao với âm thanh động cơ V6 Turbo Hybrid.',
        rating: 'TV-PG',
        progressPercent: 0,
        youtubeVideoId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ch-cinema-paramount',
    number: 305,
    name: 'Paramount Cinema & HBO Plus',
    category: 'movies',
    logoText: 'HBO',
    logoBg: 'bg-purple-900',
    description: 'Kênh bom tấn điện ảnh Hollywood, phim 4K Ultra HD và series giải thưởng Emmy.',
    quality: '4K HDR',
    audio: 'Dolby 5.1',
    currentProgram: {
      id: 'pr-mv-01',
      channelId: 'ch-cinema-paramount',
      title: 'Interstellar: Hố Đen Tử Thần (4K IMAX)',
      subTitle: 'Đạo diễn Christopher Nolan - Âm thanh Hans Zimmer',
      category: 'movies',
      startTime: '18:30',
      endTime: '21:15',
      durationMinutes: 165,
      description: 'Chuyến du hành xuyên không gian tìm kiếm hành tinh cư trú mới cho nhân loại qua hố sâu không-thời gian kỳ vĩ.',
      rating: 'PG-13',
      isLiveNow: true,
      progressPercent: 78,
      youtubeVideoId: 'zSWdZVtXT7E', // Interstellar official trailer/showcase 4K
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      badge: 'IMAX 4K'
    },
    upcomingPrograms: [
      {
        id: 'pr-mv-02',
        channelId: 'ch-cinema-paramount',
        title: 'Dune: Hành Tinh Cát (Phần 2)',
        category: 'movies',
        startTime: '21:15',
        endTime: '23:45',
        durationMinutes: 150,
        description: 'Cuộc chiến khốc liệt giành quyền kiểm soát nguồn hương liệu Spice trên sa mạc Arrakis.',
        rating: 'PG-13',
        progressPercent: 0,
        youtubeVideoId: 'Way9Dexny3w',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ch-tech-pc',
    number: 412,
    name: 'Windows Tech & PC Master',
    category: 'tech',
    logoText: 'WIN',
    logoBg: 'bg-blue-600',
    description: 'Chuyên kênh công nghệ máy tính, phần cứng PC, Windows 11, card đồ họa RTX và mẹo tối ưu.',
    quality: '4K HDR',
    audio: 'Stereo',
    currentProgram: {
      id: 'pr-tc-01',
      channelId: 'ch-tech-pc',
      title: 'Tối Ưu Máy Tính Windows Thành Trạm Giải Trí TV 4K',
      subTitle: 'Hướng dẫn thiết lập HDMI 2.1, HDR & Âm thanh vòm',
      category: 'tech',
      startTime: '19:00',
      endTime: '20:15',
      durationMinutes: 75,
      description: 'Bí quyết biến chiếc laptop hoặc PC để bàn Windows 10/11 thành cỗ máy Smart TV siêu mượt, không giật lag.',
      rating: 'TV-G',
      isLiveNow: true,
      progressPercent: 55,
      youtubeVideoId: '1O_M2xG1tU0', // High quality Windows/Tech setup
      thumbnailUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
      badge: 'PC TECH'
    },
    upcomingPrograms: [
      {
        id: 'pr-tc-02',
        channelId: 'ch-tech-pc',
        title: 'Đánh Giá Card Đồ Họa Mới Nhất & Trải Nghiệm DLSS 3.5',
        category: 'tech',
        startTime: '20:15',
        endTime: '21:15',
        durationMinutes: 60,
        description: 'Thử nghiệm hiệu năng chơi game 4K 120fps trên màn hình OLED phòng khách.',
        rating: 'TV-G',
        progressPercent: 0,
        youtubeVideoId: '9bZkp7q19f0',
        thumbnailUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ch-natgeo-discovery',
    number: 520,
    name: 'National Geographic & Earth 4K',
    category: 'movies',
    logoText: 'NAT',
    logoBg: 'bg-amber-600',
    description: 'Khám phá thiên nhiên hoang dã, đại dương kỳ bí và vũ trụ bao la với hình ảnh 4K Ultra HD.',
    quality: '4K HDR',
    audio: 'Dolby 5.1',
    currentProgram: {
      id: 'pr-ng-01',
      channelId: 'ch-natgeo-discovery',
      title: 'Hành Tinh Trái Đất: Bí Ẩn Rạn San Hô & Biển Sâu',
      subTitle: 'Thước phim 4K sinh vật phát quang dưới đáy biển',
      category: 'movies',
      startTime: '19:15',
      endTime: '20:45',
      durationMinutes: 90,
      description: 'Theo chân các nhà hải dương học lặn sâu 3.000m vào rãnh Mariana khám phá thế giới sinh vật phát sáng kỳ lạ.',
      rating: 'TV-G',
      isLiveNow: true,
      progressPercent: 40,
      youtubeVideoId: 'LXb3EKWsInQ', // 4K Nature footage Costa Rica / Ocean
      thumbnailUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      badge: '4K UHD'
    },
    upcomingPrograms: [
      {
        id: 'pr-ng-02',
        channelId: 'ch-natgeo-discovery',
        title: 'Vũ Trụ Vô Tận: Kính Thiên Văn James Webb',
        category: 'movies',
        startTime: '20:45',
        endTime: '22:00',
        durationMinutes: 75,
        description: 'Những bức ảnh nguyên thủy nhất về thời kỳ bình minh vũ trụ cách đây 13 tỷ năm.',
        rating: 'TV-G',
        progressPercent: 0,
        youtubeVideoId: '21X5lGlDOfg',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'ch-music-lofi',
    number: 608,
    name: 'Lofi Chill Live & Relax TV',
    category: 'music',
    logoText: 'LOFI',
    logoBg: 'bg-emerald-700',
    description: 'Giai điệu thư giãn 24/7 để học tập, làm việc trên máy tính và tận hưởng không gian phòng.',
    quality: '1080p HD',
    audio: 'Spatial Audio',
    currentProgram: {
      id: 'pr-ms-01',
      channelId: 'ch-music-lofi',
      title: 'Lofi Hip Hop Radio - Beats to Relax / Study to',
      subTitle: 'Phát trực tiếp 24/7 không ngắt quãng',
      category: 'music',
      startTime: '00:00',
      endTime: '23:59',
      durationMinutes: 1440,
      description: 'Luồng âm nhạc Lofi nổi tiếng thế giới, hòa âm êm dịu giúp tăng cường sự tập trung và thư giãn sau giờ làm việc.',
      rating: 'TV-G',
      isLiveNow: true,
      progressPercent: 62,
      youtubeVideoId: 'jfKfPfyJRdk', // Lofi Girl 24/7 live
      thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
      badge: '24/7 LIVE'
    },
    upcomingPrograms: [
      {
        id: 'pr-ms-02',
        channelId: 'ch-music-lofi',
        title: 'Synthwave & Cyberpunk Ambient Lounge',
        category: 'music',
        startTime: '22:00',
        endTime: '02:00',
        durationMinutes: 240,
        description: 'Giai điệu điện tử phong cách retro thập niên 80 với ánh đèn neon êm dịu.',
        rating: 'TV-G',
        progressPercent: 0,
        youtubeVideoId: '4xDzrJKXOOY',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'
      }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'Tất cả kênh', labelEn: 'All Channels' },
  { id: 'sports', label: 'Thể thao', labelEn: 'Sports' },
  { id: 'news', label: 'Tin tức & Thời sự', labelEn: 'News' },
  { id: 'movies', label: 'Phim & Điện ảnh', labelEn: 'Movies' },
  { id: 'tech', label: 'Công nghệ & PC', labelEn: 'Tech & PC' },
  { id: 'music', label: 'Âm nhạc & Chill', labelEn: 'Music' }
];

export const WINDOWS_TIPS = [
  {
    id: 'pwa-install',
    title: 'Cài đặt thành Ứng dụng Desktop (PWA) trên Windows',
    shortDesc: 'Biến YouTube TV thành ứng dụng độc lập trên thanh Taskbar Windows 10/11.',
    steps: [
      'Mở trình duyệt Microsoft Edge hoặc Google Chrome trên máy tính.',
      'Nhìn lên thanh địa chỉ (Address Bar) ở góc phải, nhấn vào biểu tượng [Cài đặt ứng dụng / Install App] hoặc nhấn menu ba chấm > Ứng dụng (Apps) > Cài đặt trang này dưới dạng ứng dụng.',
      'Đặt tên "YouTube TV" và nhấn [Cài đặt / Install].',
      'Ứng dụng sẽ mở trong cửa sổ riêng biệt không viền tab. Bạn có thể nhấp chuột phải vào biểu tượng trên Taskbar và chọn "Ghim vào thanh tác vụ" (Pin to Taskbar) để mở nhanh bất cứ lúc nào.'
    ]
  },
  {
    id: 'tv-screen-cast',
    title: 'Kết nối máy tính Windows ra Màn hình TV lớn',
    shortDesc: 'Xuất tín hiệu 4K HDR và âm thanh không dây hoặc qua cáp HDMI.',
    steps: [
      'Nhấn tổ hợp phím [Windows + P] trên bàn phím máy tính.',
      'Chọn "Second screen only" (Chỉ màn hình thứ hai) hoặc "Duplicate" (Nhân bản) để toàn màn hình chiếu sang TV.',
      'Nếu kết nối không dây: Nhấn [Windows + K] để mở tính năng Cast (Chiếu màn hình) và chọn Smart TV của bạn trong cùng mạng Wi-Fi.',
      'Nhấn phím [F11] trên bàn phím hoặc nút [Toàn màn hình] trên ứng dụng để trải nghiệm giao diện TV không viền tuyệt đỉnh.'
    ]
  },
  {
    id: 'keyboard-remote',
    title: 'Điều khiển bằng Bàn phím & Tay cầm Game (Xbox / PS)',
    shortDesc: 'Điều hướng bằng phím mũi tên hoặc Remote ảo mà không cần đụng chuột.',
    steps: [
      'Phím mũi tên (↑ ↓ ← →): Di chuyển qua các kênh và danh mục.',
      'Phím Enter hoặc Space: Chọn kênh / Phát / Tạm dừng video.',
      'Phím Esc hoặc Backspace: Quay lại màn hình trước.',
      'Phím M: Tắt / Bật tiếng (Mute) tức thì.',
      'Phím F hoặc F11: Chuyển đổi chế độ toàn màn hình TV Leanback.',
      'Mẹo nâng cao: Cắm tay cầm Xbox One / Series X qua cổng USB hoặc Bluetooth, sử dụng D-pad để điều khiển như đầu thu TV Box.'
    ]
  },
  {
    id: 'sound-hdr-settings',
    title: 'Bật HDR 4K & Âm thanh vòm Dolby trên Windows',
    shortDesc: 'Tối ưu độ sâu màu sắc và chất lượng âm thanh rạp hát tại gia.',
    steps: [
      'Vào Settings (Cài đặt) > System > Display > bật công tắc "Use HDR".',
      'Nhấp chuột phải vào biểu tượng Loa ở khay hệ thống (góc dưới bên phải Windows) > Spatial sound (Âm thanh vòm) > Chọn "Windows Sonic for Headphones" hoặc "Dolby Atmos for home theater".',
      'Đảm bảo trình duyệt kích hoạt tính năng "Hardware Acceleration" (Tăng tốc phần cứng) để xem mượt mà video 4K 60fps không bị nghẽn CPU.'
    ]
  }
];
