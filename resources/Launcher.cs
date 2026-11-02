using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace YouTubeTVReceiver
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            string appDir = exeDir;

            // Hỗ trợ trường hợp chạy từ thư mục con resources\YouTubeTV.exe trong thư mục mã nguồn
            if (!File.Exists(Path.Combine(appDir, "server.mjs")) &&
                !File.Exists(Path.Combine(appDir, "server.ts")) &&
                File.Exists(Path.Combine(appDir, "..", "server.ts")))
            {
                appDir = Path.GetFullPath(Path.Combine(appDir, ".."));
            }

            Environment.CurrentDirectory = appDir;
            string tempProfile = Path.Combine(Path.GetTempPath(), "YouTubeTV_Profile");

            bool skipKill = false;
            if (args != null)
            {
                foreach (string a in args)
                {
                    if (string.Equals(a, "--skip-kill", StringComparison.OrdinalIgnoreCase))
                    {
                        skipKill = true;
                    }
                }
            }

            // 0. Dọn dẹp triệt để mọi phiên cũ (Full Restart) để tránh kẹt process hoặc trắng màn hình do cache cũ
            if (!skipKill)
            {
                KillExistingSessions(appDir, tempProfile);
            }
            else
            {
                ClearProfileHttpCache(tempProfile);
            }

            // 1. Locate Node.js (prefer local portable node.exe, then system node)
            string nodePath = Path.Combine(appDir, "node.exe");
            if (!File.Exists(nodePath))
            {
                nodePath = Path.Combine(appDir, "bin", "node.exe");
            }
            if (!File.Exists(nodePath))
            {
                nodePath = "node";
            }

            string serverArgs = "";
            string serverMjs = Path.Combine(appDir, "server.mjs");
            string distServerMjs = Path.Combine(appDir, "dist-server", "server.mjs");
            string tsxCli = Path.Combine(appDir, "node_modules", "tsx", "dist", "cli.mjs");
            string serverTs = Path.Combine(appDir, "server.ts");

            if (File.Exists(serverMjs))
            {
                serverArgs = "\"" + serverMjs + "\"";
            }
            else if (File.Exists(tsxCli) && File.Exists(serverTs))
            {
                serverArgs = "\"" + tsxCli + "\" \"" + serverTs + "\"";
            }
            else if (File.Exists(distServerMjs))
            {
                serverArgs = "\"" + distServerMjs + "\"";
            }

            // 2. Start fresh server on port 8547
            bool serverRunning = IsServerReady();
            Process nodeProc = null;

            if (!serverRunning && !string.IsNullOrEmpty(serverArgs))
            {
                try
                {
                    ProcessStartInfo psiNode = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = serverArgs,
                        WorkingDirectory = appDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    if (File.Exists(Path.Combine(appDir, "dist", "index.html")))
                    {
                        psiNode.EnvironmentVariables["NODE_ENV"] = "production";
                    }
                    nodeProc = Process.Start(psiNode);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Không thể khởi động máy chủ YouTube TV:\n" + ex.Message, "YouTube TV Receiver", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Wait up to 15 seconds for server to be ready
                int attempts = 0;
                while (!IsServerReady() && attempts < 30)
                {
                    Thread.Sleep(500);
                    attempts++;
                }

                if (!IsServerReady())
                {
                    MessageBox.Show("Máy chủ YouTube TV không phản hồi trong 15 giây. Vui lòng kiểm tra lại.", "YouTube TV Receiver", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
            }

            // 3. Get display flags from server
            string displayFlags = "";
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8547/api/display-flags");
                req.Timeout = 1500;
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                using (StreamReader reader = new StreamReader(res.GetResponseStream()))
                {
                    displayFlags = reader.ReadToEnd().Trim();
                }
            }
            catch { }

            // 4. Find Chrome or Edge
            string browserPath = FindBrowser();
            if (string.IsNullOrEmpty(browserPath))
            {
                Process.Start("http://localhost:8547?tv=1");
                return;
            }

            string chromeArgs = "--user-data-dir=\"" + tempProfile + "\" --profile-directory=Default --no-first-run --no-default-browser-check --disable-features=ProfilePicker --disable-session-crashed-bubble --disk-cache-size=1 --media-cache-size=1 " + displayFlags + " --autoplay-policy=no-user-gesture-required --start-fullscreen --app=\"http://localhost:8547?tv=1\"";

            ProcessStartInfo psiBrowser = new ProcessStartInfo
            {
                FileName = browserPath,
                Arguments = chromeArgs,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                Process.Start(psiBrowser);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khởi động trình duyệt Kiosk:\n" + ex.Message, "YouTube TV Receiver", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void KillExistingSessions(string appDir, string tempProfile)
        {
            // 1. Gửi tín hiệu tắt nhẹ nhàng cho máy chủ cũ (nếu đang chạy)
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8547/api/quit");
                req.Method = "POST";
                req.Timeout = 500;
                using (req.GetResponse()) { }
            }
            catch { }

            // 2. Đóng cửa sổ TV thông qua TvWindowManager nếu có
            try
            {
                string winMgr = Path.Combine(appDir, "bin", "TvWindowManager.exe");
                if (File.Exists(winMgr))
                {
                    ProcessStartInfo psiClose = new ProcessStartInfo
                    {
                        FileName = winMgr,
                        Arguments = "close",
                        WorkingDirectory = appDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    using (Process p = Process.Start(psiClose))
                    {
                        if (p != null) p.WaitForExit(1500);
                    }
                }
            }
            catch { }

            // 3. Dọn dẹp triệt để mọi tiến trình trình duyệt YouTubeTV_Profile và tiến trình giữ cổng 8547
            try
            {
                string cleanupCmd =
                    "Get-CimInstance Win32_Process | Where-Object { " +
                    "$_.CommandLine -like '*YouTubeTV_Profile*' -or " +
                    "($_.Name -eq 'node.exe' -and ($_.CommandLine -like '*server.ts*' -or $_.CommandLine -like '*server.mjs*')) " +
                    "} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; " +
                    "Get-NetTCPConnection -LocalPort 8547 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { " +
                    "if ($_.OwningProcess -gt 0) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } " +
                    "}";

                ProcessStartInfo psiKill = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -WindowStyle Hidden -Command \"" + cleanupCmd + "\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                using (Process p = Process.Start(psiKill))
                {
                    if (p != null) p.WaitForExit(4000);
                }
            }
            catch { }

            ClearProfileHttpCache(tempProfile);
            Thread.Sleep(300);
        }

        static void ClearProfileHttpCache(string tempProfile)
        {
            string[] cacheDirs = new string[]
            {
                Path.Combine(tempProfile, "Default", "Cache"),
                Path.Combine(tempProfile, "Default", "Code Cache"),
                Path.Combine(tempProfile, "Default", "GPUCache")
            };
            foreach (string dir in cacheDirs)
            {
                try
                {
                    if (Directory.Exists(dir))
                    {
                        Directory.Delete(dir, true);
                    }
                }
                catch { }
            }
        }

        static bool IsServerReady()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8547/api/status");
                req.Timeout = 1200;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        static string FindBrowser()
        {
            string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string progFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            string[] paths = new string[]
            {
                Path.Combine(progFiles, @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(progFilesX86, @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(localApp, @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(progFiles, @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(progFilesX86, @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string p in paths)
            {
                if (!string.IsNullOrEmpty(p) && File.Exists(p)) return p;
            }
            return null;
        }
    }
}
