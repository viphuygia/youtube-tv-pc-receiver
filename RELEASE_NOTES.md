# Release Notes - YouTube TV Receiver for Windows v1.2.0

🎉 **Release v1.2.0** — Custom Automation Actions, Precise Tab Targeting, Zero-Flicker Focus, and Core Bug Fixes.

---

## 🇬🇧 English

### Highlights in v1.2.0

- ⚙️ **Custom Action & Automation Settings (Phone Volume Trigger):**
  - **Volume = 0% / Mute Trigger:** Easily configure any application, batch script, or executable (`.exe`, `.bat`, PowerShell, terminal) to launch automatically when you lower volume to 0% or tap Mute from your phone.
  - **Wake / Volume > 0% Trigger:** Optionally execute a custom script or application when the TV is woken up, volume is restored, or a new video is cast.
  - **Auto-Collapse Toggle:** Turn on/off whether the TV window minimizes down to the Windows Taskbar when volume is muted.
  - **Interactive Test Run:** Convenient "Test Run" button in the Settings modal allows immediate verification of command execution directly from the PC interface.
  - **Persistent Settings:** Fully persisted via the `/api/settings/automation` REST API into `.yt-cast-store.json`.
- 🎯 **Precise YouTube Tab Targeting (Windows UI Automation):**
  - Integrated native `System.Windows.Automation` into `TvWindowManager.exe`. When running in a multi-tab browser, it scans the UI tree and automatically invokes `SelectionItemPattern.Select()` on the exact "YouTube TV" tab, ensuring you are never stuck on an unrelated work tab.
  - Switched `start.bat` and native launcher to dedicated app mode (`--app="http://localhost:8547?tv=1"`), creating an isolated, single-instance app window that never mixes with regular browsing tabs.
- 🪟 **Zero-Flicker Direct Focus (Eliminated Alt-Tab Flash):**
  - Replaced `SwitchToThisWindow(hWnd, true)` with `SwitchToThisWindow(hWnd, false)` and removed simulated `VK_MENU` (Alt key) taps. The window now comes smoothly to the foreground without any Alt-Tab switcher overlay or visual flicker.
- 🐛 **Bug Fix: `start.bat` Inaction & API False-Positive:**
  - Resolved an issue where `/api/is-kiosk-running` included background WebSocket client connections (`connectedClients.size > 0`), causing `start.bat` to falsely assume the Kiosk window was already open and skip browser launch.
- 🐛 **Bug Fix: Multi-Process Chrome Crash on Launch:**
  - Removed an aggressive `Stop-Process` loop in `server.ts` that previously mistook Chrome's multi-process architecture (GPU, Renderer, Network) for duplicate instances and terminated helper processes, crashing the browser.
- 🛡️ **Session Crash Popup Bypass:**
  - Added `--disable-session-crashed-bubble`, `--profile-directory=Default`, and `--disable-features=ProfilePicker` to guarantee Chrome always starts directly into full screen without "Restore pages?" prompts.
- ⚡ **High-Performance Native Window Manager (`bin/TvWindowManager.exe`):**
  - Standalone compiled C# native binary (~15ms execution) connected to interactive desktop `WinSta0\Default`, guaranteeing ultra-fast minimize, restore (`HWND_TOPMOST`), and window status queries.

---

## 🇻🇳 Tiếng Việt

### Các điểm nổi bật trong phiên bản v1.2.0

- ⚙️ **Hệ thống Cài đặt Hành động Tùy chỉnh & Tự động hóa (Trigger Âm lượng iPhone):**
  - **Kích hoạt khi Âm lượng về 0% hoặc Bấm Mute (Ẩn TV):** Tùy chỉnh bất kỳ ứng dụng, file thực thi hoặc script nào (ví dụ: `calc.exe`, `notepad.exe`, `C:\Tools\script.bat`, `wt.exe`) để tự động bật lên khi bạn kéo âm lượng về 0 hoặc bấm Tắt tiếng từ iPhone.
  - **Kích hoạt khi Đánh thức / Tăng âm lượng lại:** Tùy chọn chạy một lệnh hoặc app khi TV mở lại hoặc có video mới cast tới.
  - **Tùy chọn Khép TV xuống Taskbar:** Cho phép bật/tắt hành vi tự động khép TV xuống Taskbar khi âm lượng về 0%.
  - **Nút "Chạy thử (Test)":** Kiểm tra chạy ngay app trên màn hình để kiểm chứng đường dẫn trước khi lưu.
  - **Lưu trữ bền vững:** Tự động lưu cấu hình vĩnh viễn qua API `/api/settings/automation` vào `.yt-cast-store.json`.
- 🎯 **Mở lại chính xác Tab YouTube TV (Windows UI Automation):**
  - Tích hợp `System.Windows.Automation` trực tiếp vào `TvWindowManager.exe`. Khi người dùng mở TV trong một cửa sổ trình duyệt có nhiều tab, hệ thống tự động quét cây UI và gọi `Select()` đúng tab "YouTube TV", không để bạn bị kẹt ở các tab làm việc khác.
  - Khởi động cửa sổ dạng App độc lập (`--app="http://localhost:8547?tv=1"`), tách biệt 100% với các tab duyệt web cá nhân.
- 🪟 **Kích hoạt trực tiếp êm ru (Loại bỏ triệt để hiệu ứng Alt-Tab):**
  - Chuyển `SwitchToThisWindow(hWnd, false)` và gỡ bỏ phím Alt ảo (`VK_MENU`). Cửa sổ TV được đưa lên đầu màn hình (`HWND_TOPMOST`) một cách trực tiếp, êm ru và không còn chớp giao diện Alt-Tab.
- 🐛 **Sửa lỗi `start.bat` không hiện gì:**
  - Khắc phục lỗi API `/api/is-kiosk-running` tính cả kết nối WebSocket ngầm khiến `start.bat` tưởng TV đã mở và bỏ qua việc mở trình duyệt.
- 🐛 **Sửa lỗi Chrome tự tắt ngay sau khi mở:**
  - Loại bỏ hoàn toàn đoạn mã `Stop-Process` kill nhầm các tiến trình con thiết yếu của Chrome (GPU process, Renderer).
- 🛡️ **Bỏ qua hộp thoại hỏi khôi phục phiên crash:**
  - Bổ sung `--disable-session-crashed-bubble`, `--profile-directory=Default`, và `--disable-features=ProfilePicker` giúp Chrome luôn mở mượt mà vào toàn màn hình, không bị treo ở hộp thoại "Restore pages?".
- ⚡ **Bộ điều khiển cửa sổ Native siêu tốc (`bin/TvWindowManager.exe`):**
  - Biên dịch nhị phân C# chạy chỉ trong 15ms, gắn kết trực tiếp desktop tương tác `WinSta0\Default`, kiểm soát cửa sổ chính xác tuyệt đối.
