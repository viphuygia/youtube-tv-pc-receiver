# 🚀 YouTube TV Receiver for Windows - Release v1.4.0

### 📦 Tải bộ cài đặt:
- **Tập tin cài đặt:** [`YouTube-TV-Receiver-Setup-v1.4.0.exe`](dist-installer/YouTube-TV-Receiver-Setup-v1.4.0.exe) (~113 MB)
- **Hệ điều hành hỗ trợ:** Windows 10, Windows 11 (64-bit)
- **Yêu cầu phần cứng:** Không cần cài đặt Node.js hay dòng lệnh (đã nhúng sẵn runtime portable).

---

## 🌟 Những nâng cấp nổi bật trong v1.4.0

### 1. ⏱️ Khắc phục triệt để lỗi thời lượng cho video dài (> 3 - 4+ tiếng)
- **Vấn đề đã xử lý:** Trước đây, khi chuyển từ một video ngắn sang video dài 3 - 4 tiếng (như video tóm tắt anime, livestream dài), thanh tua trên iPhone bị giới hạn ở thời lượng của video trước đó (ví dụ 44 phút).
- **Giải pháp:** Tích hợp bộ giải quyết siêu dữ liệu YouTube chạy ngầm siêu tốc (~250ms), tự động đọc giá trị `approxDurationMs` chuẩn từ YouTube ngay khi bài được chọn.
- **Ràng buộc theo ID (`currentDurationVideoId`):** Khóa chặt thời lượng theo ID video, ngăn ngừa mọi gói tin chương lẻ (Chapter/Tập) hay telemetry tồn đọng của video cũ ghi đè làm giảm tổng thời lượng.

### 2. 👻 Ẩn hoàn toàn cửa sổ Terminal / CMD (Zero-Console Launch)
- Thay thế toàn bộ cửa sổ CMD đen bằng bộ khởi chạy Native GUI C# độc lập (`YouTubeTV.exe`, `/target:winexe`).
- File `start.bat` tự động phát hiện và chuyển sang chế độ nền (`WindowStyle Hidden`), không còn nhấp nháy hay đè cửa sổ dòng lệnh lên màn hình.
- Tất cả tiến trình con nền (`TvWindowManager.exe`, PowerShell, Chrome Kiosk) đều được cấu hình `windowsHide: true`.

### 3. 🔄 Khởi động sạch sẽ & Tự sửa lỗi (Full Clean Session Restart)
- Mỗi lần khởi động, launcher tự động tìm và đóng sạch các phiên cũ chạy ngầm, giải phóng cổng `8547` và dọn dẹp bộ nhớ đệm HTTP của Chrome Kiosk.
- Khắc phục triệt để lỗi **trắng màn hình** do trình duyệt Kiosk lưu cache `index.html` cũ trỏ tới mã hash bundle Vite không còn tồn tại.

### 4. ⏩ Tua video `+10s / -10s` & Kéo thanh trượt siêu mượt
- Loại bỏ trạng thái `LOADING` giả lập khi tua (`Player.seek()`), gửi trực tiếp sự kiện `onStateChange(PLAYING)` về điện thoại, giúp thao tác bấm đúp liên tục `+10s` trên iPhone mượt mà, không bị giật lùi hay đứng hình.
- Bổ sung phím tắt bàn phím PC `Mũi tên Trái / Phải` (`-10s / +10s`) cùng cụm nút tua nhanh trên Web Remote.

### 5. 🎬 Tùy chỉnh độ phân giải & Phụ đề (CC)
- Hỗ trợ chọn độ phân giải: `4K (2160p)`, `2K (1440p)`, `1080p`, `720p`, `480p`, `Auto`.
- Bật/tắt phụ đề chủ động từ nút **CC trên app iPhone**, nút **CC** trên TV hoặc qua Web Remote (`Tắt` / `Tiếng Việt` / `English`).

### 6. 📡 Hỗ trợ tua ngược (DVR Rewind) trên Video Trực tiếp & Công chiếu
- Đồng bộ chuẩn `seekableStartTime` và `seekableEndTime` từ YouTube `progressState` giúp kéo lùi trên video trực tiếp không bị văng về đầu luồng phát.

### 7. 🌙 Tự động về Chế độ chờ (Standby) khi hết video
- Tự động chuyển về màn hình Chế độ chờ và thu nhỏ cửa sổ TV sau 1 giây khi phát hết video và không còn bài tiếp theo trong hàng đợi.

---

## 🛡️ Kiểm tra An toàn & Pháp lý (Security & Legal Audit)

- **Bảo mật mạng nội bộ 100%:** Toàn bộ giao tiếp Cast (DIAL/SSDP, Lounge token, WebSocket) diễn ra trực tiếp trong mạng Wi-Fi gia đình giữa điện thoại và PC. Không có telemetry hay dữ liệu người dùng nào bị gửi ra ngoài.
- **Không lưu trữ tài khoản:** Ứng dụng không yêu cầu đăng nhập tài khoản Google trên PC và không lưu cookie/mật khẩu cá nhân.
- **Tuyên bố pháp lý:** Tuân thủ đầy đủ Điều khoản dịch vụ của YouTube bằng cách sử dụng Trình phát nhúng YouTube IFrame Player (`youtube.com/embed`) chính thức và chuẩn mở DIAL/UPnP; không bẻ khóa DRM hay can thiệp luồng phát video.
- **Bản quyền & Giấy phép:** Phát hành theo giấy phép nguồn mở [MIT License](LICENSE). YouTube và YouTube TV là nhãn hiệu của Google LLC.
