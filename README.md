# 📺 YouTube TV Receiver for Windows (PC Leanback Cast)

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue.svg)](https://www.microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20Ti%E1%BA%BFng%20Vi%E1%BB%87t-purple.svg)](#-tiếng-việt)

> **Language Navigation:** [🇬🇧 English Version](#-english) | [🇻🇳 Phiên Bản Tiếng Việt](#-tiếng-việt)

---

<a id="english"></a>
## 🇬🇧 English

Transform any Windows PC or laptop into a dedicated **YouTube Smart TV Cast Receiver**. Cast videos directly from the **official YouTube app on iPhone or Android** over local Wi-Fi (DIAL/SSDP protocol) or link using official 12-digit Google TV Codes. Engineered for a true zero-mouse living room TV experience with 1:1 timeline synchronization, multi-monitor memory, and one-click Kiosk controls.

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
1. Download **`YouTube-TV-Receiver-Setup-v1.0.0.exe`** from the [Releases](https://github.com/viphuygia/youtube-tv-pc-receiver/releases) section.
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
Simply double-click **`build-installer.bat`**. It compiles the React frontend, bundles the backend, builds the C# native launcher, and generates `dist-installer\YouTube-TV-Receiver-Setup-v1.0.0.exe` using Inno Setup.

---

### 🖥️ Fullscreen Controls & Multi-Monitor Setup

When running in Fullscreen Kiosk mode, the top-right control bar provides quick access to:
* **TV Code Badge (`TV Code: XXX XXX XXX XXX`):** View your live 12-digit YouTube pairing code at a glance.
* **QR Remote:** Open the scannable QR code modal for phone remote control.
* **Display Selector (`🖥️ Display 1 / 2`):** Choose which connected monitor/TV displays the app. The window moves immediately via Win32 API and saves your monitor preference for future startups.
* **Volume Indicator (`30%`):** Click to mute/unmute; adjusts in real time from your phone.
* **Minimize / Exit Fullscreen (`ESC` / `F`):** Switch between windowed and fullscreen view.
* **Quit TV (`⏻ Quit TV`):** Closes the Kiosk browser window and shuts down the background server cleanly without affecting your personal browser windows.

---

### ⚠️ Important Notes & Best Practices

#### 🎬 1. Always launch via `start.bat` for Autoplay & Multi-Monitor Placement
> [!IMPORTANT]
> Modern web browsers block unmuted media autoplay without user interaction. `start.bat` launches with Chromium's `--autoplay-policy=no-user-gesture-required`, saved monitor coordinates (`--window-position` / `--window-size`), and an isolated profile (`YouTubeTV_Profile`) to guarantee instant playback on your chosen screen.

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

Biến bất kỳ máy tính Windows nào thành một chiếc **Smart TV thu sóng YouTube** chuyên nghiệp không cần dùng chuột. Truyền video (Cast) trực tiếp từ ứng dụng **YouTube trên iPhone / Android** sang máy tính qua mạng Wi-Fi hoặc mã liên kết TV 12 chữ số chính thức. Đồng bộ chuẩn xác 1:1 thanh thời gian thực của từng video, hỗ trợ chọn và ghi nhớ màn hình phụ/TV, cùng nút tắt ứng dụng trực tiếp trên màn hình Fullscreen.

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
1. Tải file **`YouTube-TV-Receiver-Setup-v1.0.0.exe`** từ mục [Releases](https://github.com/viphuygia/youtube-tv-pc-receiver/releases).
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
Chỉ cần nhấp đúp file **`build-installer.bat`**, hệ thống sẽ tự build frontend, bundle server và tạo ra file cài đặt `dist-installer\YouTube-TV-Receiver-Setup-v1.0.0.exe` thông qua Inno Setup.

---

### 🖥️ Thanh Điều Khiển Khi Toàn Màn Hình (Fullscreen)

Khi đang ở chế độ Toàn màn hình, góc phải phía trên màn hình cung cấp đầy đủ các nút điều khiển nhanh:
* **Mã TV (`MÃ TV: XXX XXX XXX XXX`):** Hiển thị trực tiếp mã liên kết YouTube 12 số kế bên nút QR.
* **QR Remote:** Phóng to mã QR để quét bằng Camera iPhone.
* **Chọn Màn Hình (`🖥️ Màn hình 1 / 2`):** Chuyển ngay cửa sổ TV sang màn hình phụ/TV và tự động lưu lại cho những lần mở máy sau.
* **Âm lượng (`30%`):** Bấm để bật/tắt tiếng nhanh; đồng bộ trực tiếp khi chỉnh từ iPhone.
* **Thu nhỏ (`ESC` / `F`):** Thoát chế độ toàn màn hình về giao diện quản lý.
* **Nút `⏻ Tắt TV`:** Đóng ngay cửa sổ Kiosk TV và tắt máy chủ chạy ngầm gọn gàng (không làm đóng các cửa sổ Chrome cá nhân khác của bạn).

---

### ⚠️ Lưu Ý Quan Trọng Cho Người Dùng

#### 🎬 1. Luôn khởi động bằng `start.bat`
> [!IMPORTANT]
> Trình duyệt Chrome và Edge chặn tự động phát video có tiếng nếu mở tab thông thường. File `start.bat` đã được cấu hình cờ `--autoplay-policy=no-user-gesture-required`, tự động truyền tọa độ màn hình đã lưu (`--window-position`, `--window-size`) và khởi tạo profile riêng biệt (`YouTubeTV_Profile`) để đảm bảo video luôn tự phát 100% trên đúng màn hình TV.

#### 🌐 2. Kết nối mạng Wi-Fi & Mã liên kết TV
* Đảm bảo **máy tính và điện thoại kết nối chung một mạng Wi-Fi** và mạng Wi-Fi trên Windows đang đặt ở chế độ **Private Network** (Mạng riêng tư).
* **Mẹo kết nối siêu tốc:** Trong app YouTube trên iPhone, vào **Cài đặt** ➔ **Xem trên TV** ➔ **Nhập mã TV** và điền 12 chữ số hiển thị trên màn hình PC. Sau khi liên kết một lần, điện thoại và PC sẽ nhận diện nhau tức thì qua máy chủ Google!

---

## 🛠️ Công Nghệ & Kiến Trúc (Architecture)

* **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Two-Way YouTube IFrame Widget API Bridge.
* **Backend:** Node.js, Express, WebSocket (`ws`), Windows Multi-Monitor Win32 / PowerShell Display Manager.
* **Cast Engine:** `yt-cast-receiver`, Google Lounge Protocol, DIAL (Discovery and Launch) / SSDP UPnP, Persistent JSON DataStore.

---

## 📄 License
Released under the [MIT License](LICENSE) · Phát hành theo giấy phép [MIT License](LICENSE).
