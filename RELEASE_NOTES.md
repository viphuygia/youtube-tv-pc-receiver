# Release Notes - YouTube TV Receiver for Windows v1.4.0

🎉 **Release v1.4.0** — Exact Video Duration Resolution for Long Videos (> 3-4h), Hidden Terminal Native Launcher, Full Clean Session Restart, Ultra-Smooth Video Seeking, Video Quality & Subtitles Controls, DVR Rewind on Premieres/Live, and Auto-Standby on Video End.

### 📦 Download Installer (Tải bộ cài đặt):
- [⬇️ **Download YouTube-TV-Receiver-Setup-v1.4.0.exe**](https://github.com/viphuygia/youtube-tv-pc-receiver/releases/download/v1.4.0/YouTube-TV-Receiver-Setup-v1.4.0.exe) (~29.1 MB)

---

## 🇬🇧 English

### Highlights in v1.4.0

- ⏱️ **Exact Video Duration Resolution & Cross-Video Sync:**
  - Resolved the bug where long videos (> 3 to 4 hours) were capped at the duration of the previous video (e.g., 44 minutes).
  - Integrated ultra-fast (~250ms) background YouTube metadata resolution (`resolveVideoMetadataAsync`) extracting true `approxDurationMs` so the mobile seek bar expands to the full video length (e.g., 4h 27m) instantly upon casting.
  - Video ID binding (`currentDurationVideoId`): strictly prevents chapter timestamps or residual telemetry from previous videos from contaminating new playback sessions.
- 👻 **100% Hidden Terminal / Zero-Console Launch (`YouTubeTV.exe` & `start.bat`):**
  - Replaced visible CMD/PowerShell terminal windows with a silent native Windows GUI launcher (`YouTubeTV.exe`, `/target:winexe`) and auto-hidden `start.bat` (`WindowStyle Hidden`), so no black terminal window ever appears or covers your screen.
  - Added `windowsHide: true` to all background helper spawns (`TvWindowManager.exe`, PowerShell, and Kiosk browser processes) for zero console flash during Standby / Wake transitions.
- 🔄 **Full Clean Session Restart (Self-Healing Launcher):**
  - Both `YouTubeTV.exe` and `start.bat` automatically locate and cleanly terminate stale background receiver processes, free up port `8547`, and flush Chrome Kiosk HTTP asset caches on startup. Eliminates blank white screen issues caused by Vite bundle hash mismatches.
- ⏩ **Rock-Solid Video Seeking & Instant `+10s / -10s` Skip:**
  - Eliminated fake `LOADING` state transitions during `Player.seek()`, sending direct `onStateChange(PLAYING)` updates to the phone so consecutive `+10s` double-taps and seek-bar scrubbing never stutter or reset.
  - Added PC keyboard shortcuts `ArrowLeft` (`-10s`) and `ArrowRight` (`+10s`) alongside `-30s / -10s / +10s / +30s` buttons on the Web Remote.
- 🎬 **Video Resolution / Quality Selector (`4K`, `2K`, `1080p`, `720p`, `480p`, `Auto`):**
  - Choose and persist your preferred playback resolution directly from the TV screen or Mobile Web Remote (`/remote`).
- 💬 **Full Subtitles / Closed Captions (CC) Control:**
  - Subtitles are off by default (`cc_load_policy=0`) with active module unloading (`captions` / `cc`) so even creator-forced captions stay off when disabled.
  - Full support for toggling CC directly from the iPhone YouTube app (`setSubtitlesTrack`), TV UI (`CC` button or `C` key), and Web Remote (`OFF` / `Vietnamese` / `English`).
- 📡 **Live Stream & Premiere DVR Rewind Support:**
  - Synchronizes `seekableStartTime` and `seekableEndTime` from YouTube `progressState` so you can rewind Live streams and Premieres freely.
- 🌙 **Reliable Auto-Standby on Video End:**
  - Automatically returns to Standby Mode and minimizes the TV window 1 second after a video finishes when no next video is queued.

---

## 🇻🇳 Tiếng Việt

### Các Nâng Cấp Nổi Bật Trong v1.4.0

- ⏱️ **Tự Động Nhận Diện Thời Lượng Chuẩn Cho Mọi Video (Bao Gồm Video Dài 3–4+ Tiếng):**
  - Sửa dứt điểm hiện tượng video dài (> 3 tiếng) bị giới hạn thanh tua ở mức 44 phút do nhận nhầm thời lượng của video trước đó.
  - Tích hợp cơ chế tải trước siêu dữ liệu từ YouTube siêu tốc (~250ms) bằng `resolveVideoMetadataAsync`, đọc trực tiếp `approxDurationMs` giúp thanh tua trên điện thoại mở rộng đầy đủ 100% (ví dụ video 4 giờ 27 phút) ngay khi bấm phát.
  - Cơ chế ràng buộc thời lượng theo ID video (`currentDurationVideoId`): Chống rò rỉ thời lượng giữa các video liên tiếp và ngăn chặn các gói tin chương lẻ (Chapter/Tập) ghi đè làm tụt thời lượng tổng.
- 👻 **Ẩn Hoàn Toàn Cửa Sổ Terminal / CMD Khi Chạy App (`YouTubeTV.exe` & `start.bat`):**
  - Tích hợp trình khởi chạy Native GUI (`YouTubeTV.exe`, `/target:winexe`) ngay tại thư mục gốc và tự động đóng/ẩn cửa sổ `start.bat` (`WindowStyle Hidden`), giúp mở TV êm ru mà không bao giờ hiện cửa sổ CMD đen đè lên màn hình.
  - Gắn cờ `windowsHide: true` cho toàn bộ tiến trình nền (`TvWindowManager.exe`, PowerShell, trình duyệt Kiosk) để không nháy cửa sổ dòng lệnh khi ẩn/hiện TV.
- 🔄 **Khởi Động Sạch Sẽ (Full Clean Session Restart):**
  - Cả `YouTubeTV.exe` và `start.bat` đều tự động kiểm tra và dọn dẹp các session cũ, giải phóng cổng `8547` và xóa sạch bộ nhớ đệm HTTP của Chrome Kiosk trước khi mở lại. Loại bỏ triệt để hiện tượng trắng màn hình do lệch mã băm bundle Vite.
- ⏩ **Tua Video & Nhảy Nhanh `+10s / -10s` Siêu Mượt & Ổn Định Tuyệt Đối:**
  - Loại bỏ trạng thái `LOADING` giả lập khi tua (`Player.seek()`), gửi trực tiếp phản hồi `onStateChange(PLAYING)` về điện thoại giúp thao tác bấm đúp `+10s` liên tiếp hoặc kéo thanh trượt mượt mà 100%, không bị giật lùi hay mất bộ đếm.
  - Bổ sung phím tắt bàn phím PC `Mũi tên Trái / Phải` (`-10s / +10s`) bên cạnh cụm nút `-30s / -10s / +10s / +30s` trên Web Remote.
- 🎬 **Tùy Chỉnh Độ Phân Giải Video (`4K`, `2K`, `1080p`, `720p`, `480p`, `Auto`):**
  - Chọn và ghi nhớ độ phân giải ưu tiên ngay trên giao diện TV hoặc trên trang điều khiển điện thoại (`/remote`).
- 💬 **Bật / Tắt Phụ Đề (CC / Subtitles) Chủ Động:**
  - Mặc định tắt phụ đề (`cc_load_policy=0`) và tự động gỡ module `captions` khi ở chế độ Tắt.
  - Hỗ trợ bật/tắt phụ đề trực tiếp từ nút **CC trên app YouTube của iPhone**, nút **CC** trên màn hình TV (phím tắt `C`), hoặc trên Web Remote (`Tắt` / `Tiếng Việt` / `English`).
- 📡 **Hỗ Trợ Tua Ngược (DVR Rewind) Cho Video Công Chiếu & Trực Tiếp:**
  - Đồng bộ dải `seekableStartTime` và `seekableEndTime` giúp kéo lùi trên luồng Livestream / Premiere không bị văng về Live Head.
- 🌙 **Tự Động Về Chế Độ Chờ (Standby) Khi Hết Video:**
  - Tự động chuyển về màn hình Chế độ chờ và thu nhỏ cửa sổ TV sau 1 giây khi phát hết video và không còn bài tiếp theo trong hàng đợi.
