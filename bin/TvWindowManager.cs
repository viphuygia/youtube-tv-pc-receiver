using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Automation;

public class TvWindowManager {
  public static int DetectedProcessCount = 0;
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenWindowStation(string lpszWinSta, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetProcessWindowStation(IntPtr hWinSta);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetThreadDesktop(IntPtr hDesktop);

  [DllImport("user32.dll")]
  public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

  [DllImport("user32.dll")]
  public static extern bool IsWindowVisible(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

  [DllImport("user32.dll")]
  public static extern bool BringWindowToTop(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

  [DllImport("kernel32.dll")]
  public static extern uint GetCurrentThreadId();

  public static IntPtr AttachToDefaultDesktop() {
    try {
      IntPtr hWinSta = OpenWindowStation("WinSta0", false, 0x037F);
      if (hWinSta != IntPtr.Zero) SetProcessWindowStation(hWinSta);
      IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
      if (hDesk == IntPtr.Zero) {
        hDesk = OpenDesktop("Default", 0, false, 0x0040 | 0x0001);
      }
      if (hDesk != IntPtr.Zero) {
        SetThreadDesktop(hDesk);
      }
      return hDesk;
    } catch {
      return IntPtr.Zero;
    }
  }

  // Tự động tìm và chọn đúng Tab "YouTube TV" nếu người dùng đang mở trong trình duyệt có nhiều tab
  public static void FocusExactTab(IntPtr hWnd) {
    try {
      AutomationElement windowElem = AutomationElement.FromHandle(hWnd);
      if (windowElem == null) return;

      Condition tabItemCond = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.TabItem);
      AutomationElementCollection tabs = windowElem.FindAll(TreeScope.Descendants, tabItemCond);
      if (tabs != null && tabs.Count > 0) {
        foreach (AutomationElement tab in tabs) {
          string name = tab.Current.Name ?? "";
          if (name.IndexOf("YouTube TV", StringComparison.OrdinalIgnoreCase) >= 0 ||
              name.IndexOf("Trải Nghiệm TV Leanback", StringComparison.OrdinalIgnoreCase) >= 0) {
            object patternObj;
            if (tab.TryGetCurrentPattern(SelectionItemPattern.Pattern, out patternObj)) {
              ((SelectionItemPattern)patternObj).Select();
              return;
            }
            if (tab.TryGetCurrentPattern(InvokePattern.Pattern, out patternObj)) {
              ((InvokePattern)patternObj).Invoke();
              return;
            }
          }
        }
      }
    } catch {}
  }

  public static List<IntPtr> FindTargetWindows() {
    IntPtr hDesk = AttachToDefaultDesktop();
    List<IntPtr> list = new List<IntPtr>();

    // 1. Quét tìm PID của trình duyệt chạy với profile riêng YouTubeTV_Profile
    HashSet<uint> profilePids = new HashSet<uint>();
    try {
      using (var searcher = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'chrome.exe' OR Name = 'msedge.exe'")) {
        foreach (ManagementObject obj in searcher.Get()) {
          object cmdObj = obj["CommandLine"];
          if (cmdObj != null) {
            string cmdLine = cmdObj.ToString();
            if (cmdLine.IndexOf("YouTubeTV_Profile", StringComparison.OrdinalIgnoreCase) >= 0) {
              profilePids.Add(Convert.ToUInt32(obj["ProcessId"]));
            }
          }
        }
      }
    } catch {}
    DetectedProcessCount = profilePids.Count;

    try {
      EnumWindowsProc checkWindow = (hWnd, lParam) => {
        try {
          StringBuilder sbCls = new StringBuilder(256);
          GetClassName(hWnd, sbCls, 256);
          string cls = sbCls.ToString();

          if (cls == "CabinetWClass" || cls == "Progman" || cls == "Shell_TrayWnd") {
            return true;
          }

          StringBuilder sbTitle = new StringBuilder(512);
          GetWindowText(hWnd, sbTitle, 512);
          string title = sbTitle.ToString();

          if (string.IsNullOrEmpty(title)) return true;

          if (title.IndexOf("Antigravity", StringComparison.OrdinalIgnoreCase) >= 0 || 
              title.IndexOf("Visual Studio", StringComparison.OrdinalIgnoreCase) >= 0 ||
              title.IndexOf("Command Prompt", StringComparison.OrdinalIgnoreCase) >= 0 ||
              title.IndexOf("PowerShell", StringComparison.OrdinalIgnoreCase) >= 0) {
            return true;
          }

          uint winPid;
          GetWindowThreadProcessId(hWnd, out winPid);

          bool match = false;
          if (profilePids.Count > 0) {
            // Khi có profile YouTubeTV_Profile đang chạy, chỉ bắt chính xác cửa sổ của profile này
            match = profilePids.Contains(winPid);
          } else {
            // Khi không tìm thấy profile, chỉ khớp tiêu đề chính xác của ứng dụng TV
            match = title.IndexOf("YouTube TV trên máy tính Windows", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    title.IndexOf("Trải Nghiệm TV Leanback PC", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    (title.IndexOf("YouTube TV", StringComparison.OrdinalIgnoreCase) >= 0 && 
                     title.IndexOf("Google Chrome", StringComparison.OrdinalIgnoreCase) < 0 && 
                     title.IndexOf("Edge", StringComparison.OrdinalIgnoreCase) < 0);
          }

          if (match && !list.Contains(hWnd)) {
            list.Add(hWnd);
          }
        } catch {}
        return true;
      };

      if (hDesk != IntPtr.Zero) {
        EnumDesktopWindows(hDesk, checkWindow, IntPtr.Zero);
      }
      EnumWindows(checkWindow, IntPtr.Zero);
    } catch {}

    // Quét bổ sung qua Process.GetProcesses()
    try {
      foreach (var proc in Process.GetProcesses()) {
        try {
          string pName = proc.ProcessName.ToLower();
          if (pName == "chrome" || pName == "msedge") {
            IntPtr h = proc.MainWindowHandle;
            if (h != IntPtr.Zero && !list.Contains(h)) {
              uint pId = (uint)proc.Id;
              bool match = false;
              if (profilePids.Count > 0) {
                match = profilePids.Contains(pId);
              } else {
                StringBuilder sb = new StringBuilder(512);
                GetWindowText(h, sb, 512);
                string title = sb.ToString();
                match = title.IndexOf("YouTube TV trên máy tính Windows", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        title.IndexOf("Trải Nghiệm TV Leanback PC", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        (title.IndexOf("YouTube TV", StringComparison.OrdinalIgnoreCase) >= 0 && 
                         title.IndexOf("Google Chrome", StringComparison.OrdinalIgnoreCase) < 0 && 
                         title.IndexOf("Edge", StringComparison.OrdinalIgnoreCase) < 0);
              }
              if (match) {
                list.Add(h);
              }
            }
          }
        } catch {}
      }
    } catch {}

    return list;
  }

  public static void Minimize(IntPtr hWnd) {
    if (hWnd == IntPtr.Zero) return;
    SetWindowPos(hWnd, new IntPtr(-2), 0, 0, 0, 0, 0x0003); // HWND_NOTOPMOST, SWP_NOSIZE | SWP_NOMOVE
    ShowWindow(hWnd, 6); // 6 = SW_MINIMIZE
  }

  public static void BringToFront(IntPtr hWnd, int x, int y, int w, int h) {
    if (hWnd == IntPtr.Zero) return;

    // 1. Khôi phục từ trạng thái thu nhỏ và phóng to toàn màn hình
    ShowWindow(hWnd, 9); // SW_RESTORE
    ShowWindow(hWnd, 3); // SW_MAXIMIZE

    // 2. Chuyển sang đúng tab YouTube TV nếu người dùng mở trong cửa sổ đa tab
    FocusExactTab(hWnd);

    // 3. Khóa cờ HWND_TOPMOST (-1) bao phủ toàn màn hình che mọi app khác
    SetWindowPos(hWnd, new IntPtr(-1), x, y, w, h, 0x0040 | 0x0020);

    // 4. Đồng bộ tiêu điểm bàn phím & chuột bằng AttachThreadInput (không dùng phím Alt giả lập)
    try {
      IntPtr fg = GetForegroundWindow();
      if (fg != IntPtr.Zero && fg != hWnd) {
        uint dummyPid;
        uint fgThread = GetWindowThreadProcessId(fg, out dummyPid);
        uint curThread = GetCurrentThreadId();
        if (fgThread != 0 && fgThread != curThread) {
          AttachThreadInput(curThread, fgThread, true);
          SetForegroundWindow(hWnd);
          BringWindowToTop(hWnd);
          AttachThreadInput(curThread, fgThread, false);
        }
      }
      SetForegroundWindow(hWnd);
      BringWindowToTop(hWnd);
    } catch {}

    // 5. Kích hoạt trực tiếp cửa sổ mà KHÔNG tạo hiệu ứng Alt-Tab (fAltTab = false)
    try {
      SwitchToThisWindow(hWnd, false);
    } catch {}

    // 6. Củng cố cờ HWND_TOPMOST (-1) để đảm bảo cửa sổ luôn ở đỉnh
    try {
      SetWindowPos(hWnd, new IntPtr(-1), x, y, w, h, 0x0040);
    } catch {}
  }

  public static void Main(string[] args) {
    string cmd = args.Length > 0 ? args[0].ToLower() : "status";
    var hwnds = FindTargetWindows();

    if (cmd == "minimize" || cmd == "hide") {
      foreach (var hwndItem in hwnds) {
        Minimize(hwndItem);
      }
      Console.WriteLine("MINIMIZED:" + hwnds.Count);
    } else if (cmd == "restore" || cmd == "show" || cmd == "topmost") {
      int posX = args.Length > 1 ? int.Parse(args[1]) : 0;
      int posY = args.Length > 2 ? int.Parse(args[2]) : 0;
      int width = args.Length > 3 ? int.Parse(args[3]) : 1920;
      int height = args.Length > 4 ? int.Parse(args[4]) : 1080;
      foreach (var hwndItem in hwnds) {
        BringToFront(hwndItem, posX, posY, width, height);
      }
      Console.WriteLine("RESTORED:" + hwnds.Count);
    } else if (cmd == "dump") {
      IntPtr hDesk = AttachToDefaultDesktop();
      EnumWindowsProc dumpProc = (hWnd, lParam) => {
        StringBuilder sbCls = new StringBuilder(256);
        GetClassName(hWnd, sbCls, 256);
        StringBuilder sbTitle = new StringBuilder(512);
        GetWindowText(hWnd, sbTitle, 512);
        string t = sbTitle.ToString();
        if (!string.IsNullOrEmpty(t)) {
          Console.WriteLine(sbCls.ToString() + " | " + t);
        }
        return true;
      };
      if (hDesk != IntPtr.Zero) EnumDesktopWindows(hDesk, dumpProc, IntPtr.Zero);
      EnumWindows(dumpProc, IntPtr.Zero);
    } else {
      Console.WriteLine("FOUND:" + hwnds.Count);
      Console.WriteLine("PROCS:" + DetectedProcessCount);
      foreach (var hwndItem in hwnds) {
        StringBuilder sbTitle = new StringBuilder(256);
        GetWindowText(hwndItem, sbTitle, 256);
        Console.WriteLine("HWND: " + hwndItem + " | " + sbTitle);
      }
    }
  }
}
