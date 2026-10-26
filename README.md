# 📺 YouTube TV Receiver for Windows (PC Leanback Cast)

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue.svg)](https://www.microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20Ti%E1%BA%BFng%20Vi%E1%BB%87t-purple.svg)](#-tiếng-việt)

> **Language Navigation:** [🇬🇧 English Version](#-english) | [🇻🇳 Phiên Bản Tiếng Việt](#-tiếng-việt)

---

<a id="english"></a>
## 🇬🇧 English

Transform any Windows PC or laptop into a dedicated **YouTube Smart TV Cast Receiver**. Cast videos directly from the **official YouTube app on iPhone or Android** over local Wi-Fi (DIAL/SSDP protocol) or link using official 12-digit Google TV Codes. Features zero-click autoplay, real-time double-tap 10s seeking, and a mobile web remote via QR code.

### ✨ Key Features

- 📡 **Native YouTube Cast (iOS & Android):** Discovers automatically over local Wi-Fi via DIAL/SSDP protocol, or connects via official 12-digit YouTube TV pairing code.
- ⚡ **Zero-Click Instant Autoplay:** Uses YouTube IFrame API `loadVideoById` to play videos immediately with full audio — no manual clicking on red play buttons required!
- ⏩ **Real-Time Seeking (+/- 10s):** Full support for iPhone YouTube app double-tap 10-second skip forward/backward based on real-time playback position.
- 📱 **Mobile Web Remote via QR Code:** Scan the on-screen QR code with your phone camera to control volume, mute, seek, toggle fullscreen (F11), or paste direct video links.
- 📺 **Automated Kiosk Fullscreen Mode:** Launches directly in borderless fullscreen via `start.bat` for mouse-free PC setups (ideal for living room TV PCs and Windows Startup).
- 🌐 **Built-in Bilingual Support:** Easily toggle between English and Vietnamese right from the UI.

---

### 🚀 1-Click Quick Start (Windows)

#### Prerequisites:
* **Operating System:** Windows 10 or Windows 11.
* **Node.js:** v18 or later ([Download Node.js](https://nodejs.org/)).
* **Browser:** Google Chrome or Microsoft Edge.

#### Steps:
1. **Clone this repository:**
   ```bash
   git clone https://github.com/your-username/YouTube-TV-on-Windows.git
   cd YouTube-TV-on-Windows
   ```

2. **Launch:**
   * **Simply double-click on `start.bat`**.
   * The script automatically installs dependencies (first run only), starts the backend server, and opens the TV receiver in borderless fullscreen mode with full autoplay permissions.

---

### ⚠️ Important Notes & Best Practices

#### 💡 1. First-Time Connection (Lounge Handshake)
> [!TIP]
> **Recommended initial connect workflow:**
> 1. Open the YouTube app on your phone, tap the **Cast icon**, and select **`PC Windows (YouTube TV)`**.
> 2. The active video on your phone will minimize to establish the initial DIAL/Lounge session.
> 3. **Tap the video once more on your phone to resume playback.**
> 
> 👉 **From this moment on:** The session remains permanently connected. You can change videos, queue up playlists, seek, and adjust volume without any interruptions.

#### 🎬 2. Always launch via `start.bat` for Autoplay
> [!IMPORTANT]
> Modern web browsers block unmuted media autoplay without user interaction. `start.bat` launches with Chromium's `--autoplay-policy=no-user-gesture-required` and an isolated profile to guarantee instant playback on startup.
>
> If you open the web app manually via a regular browser tab at `http://localhost:8547`, you must click anywhere on the page once to grant audio permissions.

#### 🌐 3. Local Wi-Fi & Firewall Configuration
* Both your PC and phone **must be connected to the same local Wi-Fi router**.
* Ensure your Windows network profile is set to **Private Network** (Windows Settings > Network & Internet > Wi-Fi > Private network) so the firewall permits DIAL UDP 1900 and TCP 3000/8547 discovery packets.
* If you previously paired another device with the same name: Go to YouTube Settings > **Watch on TV** > **Delete TVs**, then force-close and reopen YouTube.

---

<br />
<hr />
<br />

<a id="tiếng-việt"></a>
## 🇻🇳 Tiếng Việt

Biến bất kỳ máy tính Windows nào thành một chiếc **Smart TV thu sóng YouTube** chuyên nghiệp. Cho phép bạn truyền video (Cast) trực tiếp từ ứng dụng **YouTube trên iPhone / Android** sang máy tính qua cùng mạng Wi-Fi, hỗ trợ mã liên kết TV chính thức, điều khiển âm lượng, tua video thời gian thực và biến điện thoại thành remote thông minh qua mã QR.

### ✨ Tính Năng Nổi Bật

- 📡 **Cast trực tiếp từ app YouTube (iOS & Android):** Nhận diện tự động qua Wi-Fi bằng chuẩn DIAL/SSDP chính thức hoặc ghép nối bằng mã TV 12 chữ số.
- ⚡ **Tự Động Phát Video 100% (Zero-Click Autoplay):** Chuyển video mượt mà qua YouTube IFrame API `loadVideoById`, không bao giờ bị dừng hay đòi click chuột vào nút Play đỏ.
- ⏩ **Tua Video Chuẩn Xác (Double-Tap 10s):** Hỗ trợ đầy đủ cử chỉ nhấp đúp 10s tua tới/lui trên ứng dụng YouTube điện thoại theo thời gian thực (không bị nhảy về 0s).
- 📱 **Mobile Web Remote (Điều khiển qua điện thoại):** Quét mã QR trên màn hình TV để mở giao diện remote: Tăng/giảm âm lượng, Tắt tiếng (Mute), Bật/tắt toàn màn hình (F11), Tua video, Dán link YouTube phát ngay.
- 🖥️ **Giao diện Kiosk Toàn màn hình tự động:** Tự động mở tràn viền F11 không cần dùng chuột, tối ưu cho máy tính phòng khách chạy tự động khi mở máy.
- 🌐 **Hỗ trợ song ngữ Anh - Việt:** Chuyển đổi ngôn ngữ trực tiếp chỉ bằng một cú nhấp chuột.

---

### 🚀 Cài Đặt & Khởi Chạy (1-Click)

#### Yêu cầu hệ thống:
* **Hệ điều hành:** Windows 10 hoặc Windows 11.
* **Node.js:** Phiên bản 18 trở lên (Tải tại [nodejs.org](https://nodejs.org/)).
* **Trình duyệt:** Google Chrome hoặc Microsoft Edge.

#### Các bước thực hiện:
1. **Tải mã nguồn về máy:**
   ```bash
   git clone https://github.com/your-username/YouTube-TV-on-Windows.git
   cd YouTube-TV-on-Windows
   ```

2. **Khởi chạy ứng dụng:**
   * **Cách đơn giản nhất:** Nhấp đúp chuột vào file **`start.bat`**.
   * File sẽ tự động cài đặt thư viện cần thiết (lần đầu), chạy máy chủ nền và mở màn hình TV tràn viền tự động phát video.

---

### ⚠️ Lưu Ý Quan Trọng Cho Người Dùng

#### 💡 1. Mẹo kết nối lần đầu từ iPhone / Android
> [!TIP]
> **Quy trình kết nối chuẩn lần đầu:**
> 1. Trên điện thoại, mở app **YouTube**, bấm biểu tượng **Cast** ➔ Chọn thiết bị **`PC Windows (YouTube TV)`**.
> 2. Video trên điện thoại sẽ co lại (để hoàn tất phiên bắt tay Lounge đầu tiên với máy tính).
> 3. Bạn chỉ cần **bấm vào video đó để phát lại một lần nữa** trên điện thoại.
> 
> 👉 **Từ lúc này trở đi:** Phiên kết nối đã được giữ cố định. Bạn có thể thoải mái đổi video, thêm vào danh sách chờ (Queue), tăng giảm âm lượng hoặc tua nhanh mà không cần bấm lại lần nào nữa.

#### 🎬 2. Luôn khởi động bằng `start.bat` để Video tự động phát (Autoplay)
> [!IMPORTANT]
> Trình duyệt Chrome và Edge có chính sách bảo mật chặn tự động phát video có tiếng nếu trang web mở thông thường. File `start.bat` đã được cấu hình cờ chuyên dụng `--autoplay-policy=no-user-gesture-required` và profile riêng biệt để đảm bảo video luôn tự phát 100%.

#### 🌐 3. Mạng Wi-Fi & Xử lý khi không tìm thấy TV
* Đảm bảo **máy tính và điện thoại đang kết nối chung một mạng Wi-Fi**.
* Đảm bảo cấu hình mạng Wi-Fi trên Windows đang ở chế độ **Private Network** (Mạng riêng tư).
* Nếu trên iPhone từng lưu các thiết bị TV cũ bị kẹt: Vào **Cài đặt YouTube** > **Xem trên TV** > Chọn **Xóa TV** rồi mở lại app YouTube.

---

## 🛠️ Công Nghệ & Kiến Trúc (Architecture)

* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, YouTube IFrame API.
* **Backend:** Node.js, Express, WebSocket (`ws`).
* **Cast Engine:** `yt-cast-receiver`, Google Lounge Protocol, DIAL (Discovery and Launch) / SSDP UPnP.

---

## 📄 License
Phát hành theo giấy phép [MIT License](LICENSE).
