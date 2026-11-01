# 📺 YouTube TV Receiver for Windows (PC Leanback Cast)

[![Version](https://img.shields.io/badge/Version-v1.1.0-red.svg)](https://github.com/viphuygia/youtube-tv-pc-receiver/releases)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue.svg)](https://www.microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20Ti%E1%BA%BFng%20Vi%E1%BB%87t-purple.svg)](#-tiếng-việt)

> **Language Navigation:** [🇬🇧 English Version](#-english) | [🇻🇳 Phiên Bản Tiếng Việt](#-tiếng-việt)

---

<a id="english"></a>
## 🇬🇧 English

Transform any Windows PC or laptop into a dedicated **YouTube Smart TV Cast Receiver**. Cast videos directly from the **official YouTube app on iPhone or Android** over local Wi-Fi (DIAL/SSDP protocol) or link using official 12-digit Google TV Codes. Engineered for a true zero-mouse living room TV experience with 1:1 timeline synchronization, multi-monitor memory, single-instance protection, and instant Phone-to-PC Standby controls.

### 🌟 What's New in v1.1.0

- 🫥 **Hidden / Standby Mode (100% Screen Release):** Put the TV into hidden mode anytime to free up your entire PC screen. Video playback and data streams stop completely (zero internet traffic, zero CPU/GPU overhead), and the Kiosk window automatically minimizes down to the Windows Taskbar while keeping background Cast listeners active on your local network.
- ⚡ **Auto-Wake on Cast:** As soon as you cast any video from your phone or web remote, the TV automatically unminimizes, maximizes to full screen on your designated display, and starts playing instantly!
- 📱 **Practical Phone Triggers to Hide TV:**
  1. **Seek to End inside YouTube app:** Just drag the video scrub bar to the very end (0:00 remaining) from the YouTube app on your phone. The TV automatically stops and hides down to the taskbar!
  2. **Apple iOS Shortcuts / Siri / Control Center:** Instant 1-tap HTTP endpoints (`GET /api/hide`, `GET /api/wake`, `GET /api/toggle`). Easily bind to an iPhone Lock Screen Widget, Control Center, Siri voice command (*"Hey Siri, Hide TV"*), or iPhone Back Tap (double-tap back of phone).
  3. **Auto-Sleep Timer:** Automatically minimizes and hides the TV when the current video finishes and no upcoming items exist in the queue.
  4. **PWA Mobile Remote:** Open `http://<PC_IP>:8547/remote` on your phone with a prominent `🌙 Hide TV` button.
- 🛡️ **Single-Instance Protection:** Launching the app multiple times never opens duplicate Chrome windows. It automatically detects the existing instance, brings it out of standby, and restores it.
- 🎬 **Uninterrupted Video Playback on Disconnect:** If your phone sleeps, drops Wi-Fi, or you browse other videos on your phone, the video currently playing on the TV continues seamlessly without stopping or exiting.

---

### ✨ Key Features

- 📡 **Native YouTube Cast (iOS & Android):** Automatic discovery over local Wi-Fi via DIAL/SSDP protocol with dynamic device naming **`Youtube TV (<PC-Hostname>)`** (easy to distinguish when installed on multiple PCs), plus instant pairing via official 12-digit YouTube TV code.
- ⏱️ **True 1:1 Duration & Timeline Sync:** Two-way YouTube IFrame Widget API bridge (`infoDelivery` + `player_sync`) synchronizes the exact video length and real-time playback position with your phone's scrub bar and `+/- 10s` seek buttons.
- 🔄 **Seamless Video Switching & Queue Browsing:** Swipe down the mini-player on your iPhone to search and select new videos freely without losing connection or resetting the queue, powered by a 0ms non-blocking `FastPlaylistRequestHandler` and persistent device identity (`.yt-cast-store.json`).
- 🖥️ **Multi-Monitor Selector with Persistent Memory:** Automatically detects all monitors connected to your Windows PC (`Primary` / `Secondary / TV`). Switch the fullscreen TV window to any monitor with 1 click and automatically open on that saved monitor on every future startup.
- 🔊 **Smart Volume Memory (30% Startup Default):** Initializes at a comfortable `30%` volume level and remembers your custom volume setting across sessions and reconnections.
- 📱 **Mobile Web Remote via QR Code:** Scan the on-screen QR code with your phone camera to control volume, mute, relative seeking (`-10s` / `+10s`), fullscreen toggle, or paste direct YouTube links.
- ⏻ **Zero-Mouse Kiosk Mode & Fullscreen Quit Button:** `start.bat` waits until the local server is 100% ready before launching borderless fullscreen Kiosk mode, and includes a dedicated **`⏻ Quit TV`** button right on the Fullscreen overlay to cleanly exit Kiosk mode and stop the server.
- 🌐 **Built-in Bilingual Support:** Toggle between English and Vietnamese anytime with 1 click.

---

### 🚀 Quick Start (Windows)

#### Option 1: Standalone Windows Installer (Recommended for End-Users)
> [!TIP]
> **No Node.js or command line required!** The installer bundles an embedded portable Node.js runtime and native launcher.
1. Download **`YouTube-TV-Receiver-Setup-v1.1.0.exe`** from the [Releases](https://github.com/viphuygia/youtube-tv-pc-receiver/releases) section.
2. Run the installer and click **Next > Install**.
3. Choose whether to create a Desktop icon and whether to **Auto-start on Windows boot**.
4. Double-click the **YouTube TV Receiver** Desktop icon anytime to launch directly into Fullscreen Kiosk mode!

#### Option 2: Run from Source / Developer Mode (`start.bat`)
1. **Clone this repository:**
   ```bash
   git clone https://github.com/viphuygia/youtube-tv-pc-receiver.git
   cd youtube-tv-pc-receiver
   ```
2. **Launch:** Double-click on **`start.bat`**.
   * Requires Node.js v18+.
   * Automatically installs dependencies on first run and opens in Kiosk mode.

#### 📦 Building the Installer Yourself:
Simply double-click **`build-installer.bat`**. It compiles the React frontend, bundles the backend, builds the C# native launcher, and generates `dist-installer\YouTube-TV-Receiver-Setup-v1.1.0.exe` using Inno Setup.

---

### 📲 Setting up 1-Tap iOS Shortcuts (Apple Shortcuts)

You can hide or toggle the TV with 1 tap from anywhere on your iPhone:

1. Open the **Shortcuts (Phím tắt)** app on iPhone ➔ Tap **+** to create a new shortcut.
2. Name it **"Hide TV"** (or **"Ẩn TV"**).
3. Add action: **"Get Contents of URL"** (Lấy nội dung của URL) and enter:
   ```text
   http://<YOUR_PC_IP>:8547/api/hide
   ```
4. Now you can:
   * Add a widget to your **iPhone Lock Screen** or **Home Screen**.
   * Add it to the **iOS Control Center** (swipe down from top right corner).
   * Configure **Back Tap** (Settings ➔ Accessibility ➔ Touch ➔ Back Tap ➔ Double Tap ➔ select "Hide TV").
   * Say: *"Hey Siri, Hide TV"*.

---

### 🖥️ Fullscreen Controls & Multi-Monitor Setup

When running in Fullscreen Kiosk mode, the top-right control bar provides quick access to:
* **TV Code Badge (`TV Code: XXX XXX XXX XXX`):** View your live 12-digit YouTube pairing code at a glance.
* **QR Remote:** Open the scannable QR code modal for phone remote control.
* **Standby Mode (`🌙 Standby`):** Manually put the TV to sleep; stops video and displays the ambient clock or minimizes while keeping Cast listeners active.
* **Display Selector (`🖥️ Display 1 / 2`):** Choose which connected monitor/TV displays the app. The window moves immediately via Win32 API and saves your monitor preference for future startups.
* **Volume Indicator (`30%`):** Click to mute/unmute; adjusts in real time from your phone.
* **Minimize / Exit Fullscreen (`ESC` / `F`):** Switch between windowed and fullscreen view.
* **Quit TV (`⏻ Quit TV`):** Closes the Kiosk browser window and shuts down the background server cleanly without affecting your personal browser windows.

---

### ⚠️ Important Notes & Best Practices

#### 🎬 1. Always launch via `start.bat` or Desktop Shortcut
> [!IMPORTANT]
> Modern web browsers block unmuted media autoplay without user interaction. The launcher initiates Chromium with `--autoplay-policy=no-user-gesture-required`, saved monitor coordinates (`--window-position` / `--window-size`), and an isolated profile (`YouTubeTV_Profile`) to guarantee instant playback on your chosen screen.

#### 🌐 2. Local Wi-Fi & Firewall Configuration
* Both your PC and phone **must be connected to the same local Wi-Fi router**.
* Ensure your Windows network profile is set to **Private Network** (Windows Settings > Network & Internet > Wi-Fi > Private network) so Windows Firewall allows DIAL UDP `1900` and TCP `3000`/`8547` discovery packets.
* For instant cloud pairing regardless of router multicast settings, open the YouTube app on your phone ➔ **Settings** ➔ **Watch on TV** ➔ **Link with TV code** and enter the 12-digit code shown on screen.

---

<br />
<hr />
<br />

<a id="tiếng-việt"></a>
## 🇻🇳 Tiếng Việt

Biến bất kỳ máy tính Windows nào thành một chiếc **Smart TV thu sóng YouTube** chuyên nghiệp không cần dùng chuột. Truyền video (Cast) trực tiếp từ ứng dụng **YouTube trên iPhone / Android** sang máy tính qua mạng Wi-Fi hoặc mã liên kết TV 12 chữ số chính thức. Đồng bộ chuẩn xác 1:1 thanh thời gian thực của từng video, hỗ trợ chọn và ghi nhớ màn hình phụ/TV, tính năng Chế độ ẩn TV giải phóng màn hình PC cùng bộ kích hoạt phím tắt linh hoạt từ điện thoại.

### 🌟 Tính Năng Mới Trên Phiên Bản v1.1.0

- 🫥 **Chế Độ Ẩn TV (Standby giải phóng 100% màn hình PC):** Khi muốn làm việc hoặc dùng màn hình cho việc khác, bạn có thể kích hoạt Chế độ ẩn trực tiếp từ điện thoại. Video ngắt stream hoàn toàn (không tốn băng thông internet, 0% CPU/GPU), cửa sổ Kiosk tự động thu nhỏ ẩn xuống Taskbar. Máy chủ local vẫn chạy ngầm trên Wi-Fi sẵn sàng lắng nghe lệnh kết nối tiếp theo.
- ⚡ **Tự Động Đánh Thức & Phóng To Fullscreen Khi Cast:** Ngay khi bạn chọn phát bất kỳ video mới nào từ YouTube điện thoại hoặc Web Remote, TV tự động mở lại, phóng to toàn màn hình trên đúng màn hình đã lưu và phát ngay lập tức!
- 📱 **3 Cách Tiện Lợi Kích Hoạt Ẩn TV Từ iPhone/Điện thoại:**
  1. **Tua về cuối video trong app YouTube (Seek to End):** Chỉ cần kéo thanh đỏ tua về cuối bài (còn 0:00) ngay trên app YouTube điện thoại. TV tự động hiểu là kết thúc xem và ẩn xuống Taskbar!
  2. **Phím tắt iOS (Apple Shortcut) – 1 chạm từ Control Center / Màn hình khóa / Siri:** Cung cấp API 1 chạm cực nhanh (`GET /api/hide`, `GET /api/wake`, `GET /api/toggle`). Bạn có thể tạo 1 Phím tắt đưa ra Trung tâm điều khiển, Màn hình khóa, gọi Siri (*"Hey Siri, Ẩn TV"*) hoặc gõ 2 lần mặt lưng iPhone (Back Tap).
  3. **Tự động ẩn khi hết video (Auto-Sleep):** Khi phát hết video mà danh sách chờ không còn bài tiếp theo, sau vài giây TV sẽ tự động thu nhỏ ẩn đi mà bạn không cần chạm vào máy tính.
  4. **Web Remote (PWA) trên điện thoại:** Truy cập `http://<IP_MÁY_TÍNH>:8547/remote` với nút bấm **`🌙 Ẩn TV`** / **`☀️ Bật TV`** nổi bật.
- 🛡️ **Bảo Vệ Đơn Tiến Trình (Single-Instance Protection):** Bật lại ứng dụng không bao giờ bị mở nhiều cửa sổ Chrome trùng lặp; hệ thống tự phát hiện cửa sổ đang chạy để đánh thức và đưa lên trước.
- 🎬 **Video Tiếp Tục Chiếu Khi Rớt Kết Nối:** Khi điện thoại bị mất sóng, tắt màn hình hoặc ngắt kết nối sender, video đang chiếu trên PC vẫn tiếp tục phát mượt mà không bị ngắt ngang.

---

### ✨ Tính Năng Nổi Bật

- 📡 **Cast trực tiếp từ app YouTube (iOS & Android):** Tự động tìm thấy qua Wi-Fi bằng chuẩn DIAL/SSDP với tên thiết bị động **`Youtube TV (<Tên-máy-tính>)`** (dễ dàng phân biệt khi cài trên nhiều máy tính trong cùng mạng), hoặc liên kết qua mã TV 12 số.
- ⏱️ **Đồng Bộ Thời Gian Thực 1:1 (Duration & Seek Sync):** Cầu nối hai chiều với YouTube IFrame Player (`infoDelivery` + `player_sync`) đồng bộ chính xác tổng thời lượng thật và giây đang phát của từng video lên thanh trượt iPhone — tua `+10s/-10s` hoặc kéo thanh thời gian tới bất kỳ đâu đều mượt mà, không bao giờ bị nhảy về `0s`.
- 🔄 **Chuyển Video & Vuốt Tìm Kiếm Không Ngắt Kết Nối:** Thoải mái vuốt thu nhỏ video trên iPhone để tìm kiếm và chọn phát video mới mà không bị văng kết nối nhờ bộ xử lý hàng đợi tức thì `FastPlaylistRequestHandler` (0ms) và cơ chế lưu định danh TV cố định (`.yt-cast-store.json`).
- 🖥️ **Chọn & Tự Động Ghi Nhớ Màn Hình Hiển Thị (`🖥️ Màn hình 1 / 2`):** Tự động nhận diện tất cả màn hình đang cắm vào PC (Màn hình Chính / Màn hình Phụ / TV). Bấm chọn màn hình nào là cửa sổ TV nhảy ngay sang màn hình đó và tự động mở đúng trên màn hình đó ở mọi lần khởi động sau.
- 🔊 **Âm Lượng Thông Minh (Mặc định 30% & Tự ghi nhớ):** Khởi động ở mức âm lượng `30%` dễ chịu và tự động lưu lại mức âm lượng bạn đã chỉnh cho các lần mở hoặc kết nối tiếp theo.
- 📱 **Mobile Web Remote (Quét QR điều khiển từ xa):** Quét mã QR trên màn hình để chỉnh âm lượng, tắt tiếng, tua `+/- 10s`, bật/tắt toàn màn hình hoặc dán link YouTube phát ngay.
- ⏻ **Khởi Động Kiosk Tự Động & Nút `⏻ Tắt TV` Trên Fullscreen:** File `start.bat` tự động kiểm tra đợi máy chủ sẵn sàng 100% mới mở trình duyệt Kiosk tràn viền (không bao giờ bị lỗi Not Found khi khởi động), kèm nút **`⏻ Tắt TV`** màu đỏ ngay góc phải màn hình Fullscreen để đóng nhanh ứng dụng mà không cần bàn phím hay chuột.
- 🌐 **Hỗ trợ song ngữ Việt - Anh:** Chuyển đổi ngôn ngữ trực tiếp ngay trên thanh công cụ.

---

### 🚀 Cài Đặt & Khởi Chạy (Windows)

#### Cách 1: Tải bộ cài đặt 1-Click (Khuyên dùng cho người dùng cuối)
> [!TIP]
> **Không cần cài đặt Node.js hay mở dòng lệnh!** Bộ cài đặt đã nhúng sẵn Node.js portable và launcher native siêu nhẹ.
1. Tải file **`YouTube-TV-Receiver-Setup-v1.1.0.exe`** từ mục [Releases](https://github.com/viphuygia/youtube-tv-pc-receiver/releases).
2. Chạy file cài đặt, bấm **Next ➔ Install**.
3. Bạn có thể tick chọn **Tạo biểu tượng ngoài Desktop** và **Khởi động cùng Windows khi bật máy**.
4. Nhấp đúp vào icon **YouTube TV Receiver** ngoài Desktop để mở TV xem ngay!

#### Cách 2: Chạy trực tiếp từ mã nguồn (`start.bat`)
1. **Tải mã nguồn về máy:**
   ```bash
   git clone https://github.com/viphuygia/youtube-tv-pc-receiver.git
   cd youtube-tv-pc-receiver
   ```
2. **Khởi chạy ứng dụng:** Nhấp đúp chuột vào file **`start.bat`** (yêu cầu máy có sẵn Node.js v18+).

#### 📦 Tự đóng gói file cài đặt Setup.exe:
Chỉ cần nhấp đúp file **`build-installer.bat`**, hệ thống sẽ tự build frontend, bundle server và tạo ra file cài đặt `dist-installer\YouTube-TV-Receiver-Setup-v1.1.0.exe` thông qua Inno Setup.

---

### 📲 Hướng Dẫn Cài Phím Tắt 1 Chạm Trên iPhone (Apple Shortcuts)

Bạn có thể ẩn hoặc bật TV chỉ với 1 chạm từ bất kỳ đâu trên iPhone:

1. Mở ứng dụng **Phím tắt (Shortcuts)** trên iPhone ➔ Bấm dấu **+** tạo phím tắt mới.
2. Đổi tên thành **"Ẩn TV"**.
3. Thêm tác vụ: **"Lấy nội dung của URL"** (Get Contents of URL) và điền địa chỉ:
   ```text
   http://<IP_MÁY_TÍNH>:8547/api/hide
   ```
4. Sau đó bạn có thể:
   * Thêm tiện ích (Widget) ra **Màn hình chính** hoặc **Màn hình khóa**.
   * Thêm vào **Trung tâm điều khiển (Control Center)** (vuốt từ góc trên xuống).
   * Cài đặt **Gõ mặt lưng 2 lần (Back Tap)**: Cài đặt ➔ Trợ năng ➔ Cảm ứng ➔ Chạm vào mặt sau ➔ Chạm 2 lần ➔ chọn "Ẩn TV".
   * Hoặc nói: *"Hey Siri, Ẩn TV"*.

---

### 🖥️ Thanh Điều Khiển Khi Toàn Màn Hình (Fullscreen)

Khi đang ở chế độ Toàn màn hình, góc phải phía trên màn hình cung cấp đầy đủ các nút điều khiển nhanh:
* **Mã TV (`MÃ TV: XXX XXX XXX XXX`):** Hiển thị trực tiếp mã liên kết YouTube 12 số kế bên nút QR.
* **QR Remote:** Phóng to mã QR để quét bằng Camera iPhone.
* **Chế độ chờ (`🌙 Chế độ chờ`):** Chuyển TV sang chế độ chờ thủ công; dừng video và giải phóng màn hình trong khi vẫn lắng nghe kết nối Cast.
* **Chọn Màn Hình (`🖥️ Màn hình 1 / 2`):** Chuyển ngay cửa sổ TV sang màn hình phụ/TV và tự động lưu lại cho những lần mở máy sau.
* **Âm lượng (`30%`):** Bấm để bật/tắt tiếng nhanh; đồng bộ trực tiếp khi chỉnh từ iPhone.
* **Thu nhỏ (`ESC` / `F`):** Thoát chế độ toàn màn hình về giao diện quản lý.
* **Nút `⏻ Tắt TV`:** Đóng ngay cửa sổ Kiosk TV và tắt máy chủ chạy ngầm gọn gàng (không làm đóng các cửa sổ Chrome cá nhân khác của bạn).

---

### ⚠️ Lưu Ý Quan Trọng Cho Người Dùng

#### 🎬 1. Luôn khởi động bằng `start.bat` hoặc biểu tượng ngoài Desktop
> [!IMPORTANT]
> Trình duyệt Chrome và Edge chặn tự động phát video có tiếng nếu mở tab thông thường. Bộ khởi động đã được cấu hình cờ `--autoplay-policy=no-user-gesture-required`, tự động truyền tọa độ màn hình đã lưu (`--window-position`, `--window-size`) và khởi tạo profile riêng biệt (`YouTubeTV_Profile`) để đảm bảo video luôn tự phát 100% trên đúng màn hình TV.

#### 🌐 2. Kết nối mạng Wi-Fi & Mã liên kết TV
* Đảm bảo **máy tính và điện thoại kết nối chung một mạng Wi-Fi** và mạng Wi-Fi trên Windows đang đặt ở chế độ **Private Network** (Mạng riêng tư).
* **Mẹo kết nối siêu tốc:** Trong app YouTube trên iPhone, vào **Cài đặt** ➔ **Xem trên TV** ➔ **Nhập mã TV** và điền 12 chữ số hiển thị trên màn hình PC. Sau khi liên kết một lần, điện thoại và PC sẽ nhận diện nhau tức thì qua máy chủ Google!

---

## 🛠️ Công Nghệ & Kiến Trúc (Architecture)

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Two-Way YouTube IFrame Widget API Bridge.
* **Backend:** Node.js, Express, WebSocket (`ws`), Windows Multi-Monitor Win32 / PowerShell Display Manager.
* **Native Integration:** C# Win32 Single-Instance Kiosk Launcher (`Launcher.cs`), Inno Setup 6 Installer.
* **Cast Engine:** `yt-cast-receiver`, Google Lounge Protocol, DIAL (Discovery and Launch) / SSDP UPnP, Persistent JSON DataStore.

---

## 📄 License
Released under the [MIT License](LICENSE) · Phát hành theo giấy phép [MIT License](LICENSE).
