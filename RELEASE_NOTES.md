# Release Notes - YouTube TV Receiver for Windows v1.0.0

🎉 **Official Release v1.0.0** — Production-ready YouTube Smart TV Cast Receiver for Windows PC.

---

## 🇬🇧 English

### Highlights in v1.0.0

- **1-Click Windows Setup Installer (`Setup.exe`):** Bundles an embedded portable Node.js runtime, native launcher (`YouTubeTV.exe`), desktop & start menu shortcuts, and auto-start on boot capability into a compact ~29MB installer. End-users do not need to install Node.js or run any terminal commands.
- **Dynamic Device Naming:** Broadcasts as `Youtube TV ({hostname})` (e.g. `Youtube TV (DESKTOP-50DM79B)`), allowing seamless recognition and management across multiple PCs on the same LAN/Wi-Fi network.
- **True 1:1 Video Duration & Timeline Sync:** Two-way YouTube IFrame API bridge (`infoDelivery` + `player_sync`) continuously synchronizes exact video length and playback timestamp with your phone. Scrubbing and `+/- 10s` seeking work reliably without jumping back to 0s.
- **Seamless Video Switching & Mini-Player Swiping:** Swipe down to search and select new videos on iPhone/Android without losing connection or clearing the queue, backed by a non-blocking `FastPlaylistRequestHandler` (0ms) and persistent ID storage (`.yt-cast-store.json`).
- **Multi-Monitor Display Selector:** Automatically detects all connected displays (Primary, Secondary / TV). Switch screens with one click on the Fullscreen bar; the app moves the window instantly via Win32 API and remembers your choice for all future startups.
- **Smart Startup Volume:** Defaults to a gentle 30% volume level and remembers volume changes across sessions and reconnects.
- **Zero-Mouse Fullscreen Kiosk:** `start.bat` waits for local server readiness before launching Chromium in borderless fullscreen kiosk mode with unmuted autoplay policy.
- **Dedicated Fullscreen Controls:** Top-right overlay bar provides live TV code, QR remote shortcut, display switcher, volume toggling, minimize, and a prominent red **`⏻ Quit TV`** button that cleanly closes the TV window and stops the server.
- **Mobile Web Remote via QR Code:** Scan the on-screen QR code from any phone camera to access a responsive remote control pad.
- **Bilingual Interface:** Full English and Vietnamese support persisted via localStorage.

---

## 🇻🇳 Tiếng Việt

### Các điểm nổi bật trong phiên bản chính thức v1.0.0

- **Bộ cài đặt 1-Click độc lập (`Setup.exe`):** Đóng gói sẵn Node.js portable, launcher native (`YouTubeTV.exe`), icon ngoài Desktop, Start Menu và tùy chọn tự khởi động cùng Windows thành 1 file cài đặt duy nhất (~29MB). Người dùng cuối tải về nhấp cài đặt là dùng ngay, hoàn toàn không cần cài đặt Node.js hay gõ lệnh.
- **Tên thiết bị động theo máy:** Tự động nhận diện `Youtube TV ({hostname})` (ví dụ: `Youtube TV (DESKTOP-50DM79B)`), giúp phân biệt dễ dàng khi bạn cài đặt trên nhiều máy tính trong cùng mạng gia đình hoặc văn phòng.
- **Đồng bộ thời gian thực 1:1 (Duration & Seek):** Cầu nối 2 chiều giữa YouTube Player và server (`player_sync`) đồng bộ chính xác tổng thời lượng video và giây đang phát lên thanh trượt điện thoại. Khắc phục dứt điểm lỗi video 30p bị kéo lên 2 tiếng và lỗi tua `+10s` bị giật ngược về 0s.
- **Chuyển video & Vuốt tìm kiếm mượt mà:** Người dùng có thể thoải mái vuốt thu nhỏ video trên app YouTube của iPhone/Android để tìm kiếm và chọn video khác mà không bị ngắt kết nối hay mất danh sách chờ nhờ `FastPlaylistRequestHandler` và bộ lưu trữ định danh bền vững `.yt-cast-store.json`.
- **Chọn & Ghi nhớ Màn hình hiển thị TV (`🖥️ Màn hình 1 / 2`):** Tự động nhận diện toàn bộ màn hình đang cắm vào PC (Màn hình chính, Màn hình phụ / TV). Bấm chọn là cửa sổ TV chuyển ngay lập tức và tự động mở đúng màn hình đó ở mọi lần khởi động sau.
- **Âm lượng khởi động 30%:** Luôn mở ở mức âm lượng 30% an toàn và tự động ghi nhớ mức âm lượng bạn đã tùy chỉnh cho các lần mở sau.
- **Khởi động tự động không cần chuột:** File `start.bat` tự động chờ server sẵn sàng 100% mới mở giao diện tràn viền F11 (Kiosk) kèm quyền tự động phát không cần click chuột.
- **Nút điều khiển Fullscreen & `⏻ Tắt TV`:** Góc trên bên phải hiển thị đầy đủ Mã TV, QR Remote, Chọn màn hình, Âm lượng và nút **`⏻ Tắt TV`** màu đỏ giúp đóng cửa sổ Kiosk và tắt server gọn gàng mà không ảnh hưởng tới trình duyệt cá nhân.
- **Điều khiển qua điện thoại (QR Remote):** Quét mã QR bằng Camera điện thoại để điều khiển từ xa.
- **Hỗ trợ song ngữ Anh - Việt:** Tự do chuyển đổi giao diện bất cứ lúc nào.
