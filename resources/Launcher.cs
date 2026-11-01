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
        static void Main()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            Environment.CurrentDirectory = appDir;

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

            string serverScript = Path.Combine(appDir, "server.mjs");
            if (!File.Exists(serverScript))
            {
                serverScript = Path.Combine(appDir, "dist-server", "server.mjs");
            }

            // 2. Check if server is already running on port 8547
            bool serverRunning = IsServerReady();
            Process nodeProc = null;

            if (!serverRunning && File.Exists(serverScript))
            {
                try
                {
                    ProcessStartInfo psiNode = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = "\"" + serverScript + "\"",
                        WorkingDirectory = appDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    psiNode.EnvironmentVariables["NODE_ENV"] = "production";
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

            // 3.5 Check if Kiosk browser is already running (Single-Instance Protection)
            if (serverRunning)
            {
                bool kioskAlreadyRunning = false;
                try
                {
                    HttpWebRequest kReq = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8547/api/is-kiosk-running");
                    kReq.Timeout = 1200;
                    using (HttpWebResponse kRes = (HttpWebResponse)kReq.GetResponse())
                    using (StreamReader reader = new StreamReader(kRes.GetResponseStream()))
                    {
                        string resp = reader.ReadToEnd();
                        if (resp.Contains("\"running\":true"))
                        {
                            kioskAlreadyRunning = true;
                        }
                    }
                }
                catch { }

                if (kioskAlreadyRunning)
                {
                    // Cửa sổ đã mở trước đó -> Đánh thức và khôi phục hiển thị, KHÔNG mở thêm cửa sổ mới!
                    try
                    {
                        HttpWebRequest wakeReq = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:8547/api/standby");
                        wakeReq.Method = "POST";
                        wakeReq.ContentType = "application/json";
                        wakeReq.Timeout = 1200;
                        using (StreamWriter sw = new StreamWriter(wakeReq.GetRequestStream()))
                        {
                            sw.Write("{\"standby\":false}");
                        }
                        using (wakeReq.GetResponse()) { }
                    }
                    catch { }
                    return;
                }
            }

            // 4. Find Chrome or Edge
            string browserPath = FindBrowser();
            if (string.IsNullOrEmpty(browserPath))
            {
                Process.Start("http://localhost:8547?tv=1");
                return;
            }

            string tempProfile = Path.Combine(Path.GetTempPath(), "YouTubeTV_Profile");
            string chromeArgs = "--user-data-dir=\"" + tempProfile + "\" --profile-directory=Default --no-first-run --no-default-browser-check --disable-features=ProfilePicker --disable-session-crashed-bubble " + displayFlags + " --autoplay-policy=no-user-gesture-required --start-fullscreen --app=\"http://localhost:8547?tv=1\"";

            ProcessStartInfo psiBrowser = new ProcessStartInfo
            {
                FileName = browserPath,
                Arguments = chromeArgs,
                UseShellExecute = false
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
