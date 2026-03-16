# SwiftUI Native App 实施方案

## 核心问题解决

### 1. 端口选择策略

**问题：**
- 默认端口 3000 容易与其他开发工具冲突（如 React、Next.js）
- 需要一个不易冲突的端口

**解决方案：**

#### 方案 A：使用高位端口（推荐）

```swift
// 使用 50000+ 的端口，冲突概率极低
let DEFAULT_PORT = 53000  // 5-3-0-0-0 (MD = 53)
```

**端口范围选择：**
- 0-1023: 系统保留端口
- 1024-49151: 注册端口（常见服务）
- 49152-65535: 动态/私有端口

**推荐端口：53000**
- 理由：
  - ✅ 在动态端口范围内
  - ✅ 53 = MD（Markdown 的缩写）
  - ✅ 容易记忆
  - ✅ 冲突概率极低

#### 方案 B：动态端口分配

```swift
// 让系统自动分配可用端口
func findAvailablePort(starting: Int = 53000) -> Int {
    for port in starting..<(starting + 100) {
        if isPortAvailable(port) {
            return port
        }
    }
    return starting // fallback
}

func isPortAvailable(_ port: Int) -> Bool {
    let socketFD = socket(AF_INET, SOCK_STREAM, 0)
    guard socketFD != -1 else { return false }
    defer { close(socketFD) }

    var addr = sockaddr_in()
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = in_port_t(port).bigEndian
    addr.sin_addr.s_addr = INADDR_ANY

    let bindResult = withUnsafePointer(to: &addr) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
            bind(socketFD, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
    }

    return bindResult == 0
}
```

**最终方案：**
```swift
// 配置文件：~/.config/md-viewer/config.json
{
  "server": {
    "port": 53000,  // 默认端口
    "portRange": [53000, 53099],  // 端口搜索范围
    "host": "127.0.0.1"
  }
}

// Swift 启动逻辑
let config = loadConfig()
let port = findAvailablePort(starting: config.server.port)
startServer(port: port)
```

---

### 2. 静态资源打包策略

**问题：**
- Web UI 包含 HTML、CSS、JS（~214 KB）
- 需要打包进 App Bundle
- Server 需要能访问这些资源

**当前架构：**
```
现有方案（CLI）：
1. bun run build:client → dist/client.js
2. scripts/embed-client.ts → src/client/embedded-client.ts
3. bun build --compile → 二进制文件（内嵌代码）
```

**SwiftUI App 方案：**

#### 方案 A：内嵌到 Server 二进制（推荐）

**优点：**
- ✅ 保持现有构建流程
- ✅ Server 二进制自包含
- ✅ 无需修改 Server 代码

**构建流程：**
```bash
# 1. 构建前端
bun run build:client
# → dist/client.js (214 KB)

# 2. 嵌入到 TypeScript
bun run scripts/embed-client.ts
# → src/client/embedded-client.ts (嵌入为字符串常量)

# 3. 编译 Server 二进制
bun build --compile --target=bun-darwin-aarch64 --outfile=mdv-server src/server.ts
# → mdv-server (二进制，包含嵌入的 client.js)

# 4. 复制到 Xcode 项目
cp mdv-server MDViewer/Resources/mdv-server
```

**Xcode 项目结构：**
```
MDViewer.xcodeproj
├── MDViewer/
│   ├── App/
│   │   ├── MDViewerApp.swift          # App 入口
│   │   ├── AppDelegate.swift          # App 生命周期
│   │   └── ServerManager.swift        # 服务管理
│   ├── Views/
│   │   ├── MenuBarView.swift          # 状态栏
│   │   ├── MainWindow.swift           # 主窗口
│   │   ├── WebView.swift              # WKWebView 封装
│   │   └── SettingsView.swift         # 设置页面
│   ├── Models/
│   │   ├── Config.swift               # 配置模型
│   │   └── RecentFile.swift           # 最近文件
│   ├── Utils/
│   │   ├── PortScanner.swift          # 端口扫描
│   │   └── ProcessRunner.swift        # 进程管理
│   └── Resources/
│       ├── mdv-server                 # Server 二进制（内嵌 Web UI）
│       ├── Assets.xcassets/
│       │   ├── AppIcon.appiconset/
│       │   └── TrayIcon.imageset/
│       └── Info.plist
└── MDViewerTests/
```

**在 Xcode 中配置：**
```xml
<!-- Info.plist -->
<key>CFBundleExecutable</key>
<string>$(EXECUTABLE_NAME)</string>

<!-- Build Settings → Copy Bundle Resources -->
<!-- 添加 mdv-server 到 Copy Files -->
```

**Swift 代码访问：**
```swift
// ServerManager.swift
class ServerManager: ObservableObject {
    @Published var isRunning = false
    @Published var port: Int?

    private var serverProcess: Process?

    func start() {
        // 1. 获取内嵌的 mdv-server 路径
        guard let serverPath = Bundle.main.path(forResource: "mdv-server", ofType: nil) else {
            print("❌ 找不到 mdv-server")
            return
        }

        // 2. 确保可执行权限
        let fileManager = FileManager.default
        try? fileManager.setAttributes(
            [.posixPermissions: 0o755],
            ofItemAtPath: serverPath
        )

        // 3. 查找可用端口
        let port = PortScanner.findAvailablePort(starting: 53000)

        // 4. 启动 Server
        let process = Process()
        process.executableURL = URL(fileURLWithPath: serverPath)
        process.arguments = ["--internal-server-mode"]
        process.environment = [
            "PORT": "\(port)",
            "HOST": "127.0.0.1"
        ]

        // 5. 重定向输出到日志
        let logPath = getLogPath()
        let logFile = FileHandle(forWritingAtPath: logPath)
        process.standardOutput = logFile
        process.standardError = logFile

        try? process.run()

        self.serverProcess = process
        self.port = port
        self.isRunning = true

        print("✅ Server 启动于 http://127.0.0.1:\(port)")
    }

    func stop() {
        serverProcess?.terminate()
        serverProcess = nil
        isRunning = false
        print("🛑 Server 已停止")
    }

    private func getLogPath() -> String {
        let logDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")
        try? FileManager.default.createDirectory(at: logDir, withIntermediateDirectories: true)
        return logDir.appendingPathComponent("server.log").path
    }
}
```

#### 方案 B：资源文件方式

**如果不想内嵌到二进制，可以单独打包静态资源：**

```
MDViewer/Resources/
├── mdv-server              # Server 二进制（不含 Web UI）
└── web/
    ├── index.html          # 主页面
    ├── client.js           # 前端脚本
    └── favicon.svg         # 图标
```

**修改 Server 代码：**
```typescript
// src/server.ts
import { join } from "path";

// 检测是否在 App Bundle 中运行
const isInAppBundle = process.env.APP_BUNDLE === "true";
const resourcePath = isInAppBundle
  ? process.env.RESOURCE_PATH
  : join(__dirname, "../dist");

app.get("/", (c) => {
  const htmlPath = join(resourcePath, "index.html");
  const html = readFileSync(htmlPath, "utf-8");
  return c.html(html);
});

app.get("/client.js", (c) => {
  const jsPath = join(resourcePath, "client.js");
  const js = readFileSync(jsPath, "utf-8");
  c.header("Content-Type", "application/javascript");
  return c.body(js);
});
```

**Swift 启动：**
```swift
let resourcePath = Bundle.main.resourcePath! + "/web"
process.environment = [
    "APP_BUNDLE": "true",
    "RESOURCE_PATH": resourcePath
]
```

**对比：**
| 方案 | 优点 | 缺点 |
|------|------|------|
| A: 内嵌二进制 | ✅ 简单，保持现有流程 | ❌ 二进制较大 |
| B: 资源文件 | ✅ 二进制小，资源独立 | ❌ 需要修改 Server 代码 |

**推荐：方案 A（内嵌二进制）**

---

### 3. App 启动流程

**完整启动流程：**

```
用户双击 MD Viewer.app
         ↓
App 启动（MDViewerApp.swift）
         ↓
初始化 ServerManager
         ↓
扫描可用端口（53000-53099）
         ↓
启动 mdv-server 子进程
         ↓
等待 Server 就绪（轮询 HTTP）
         ↓
创建状态栏图标
         ↓
（可选）创建主窗口
         ↓
App 进入运行状态
```

**代码实现：**

```swift
// MDViewerApp.swift
import SwiftUI

@main
struct MDViewerApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var serverManager = ServerManager.shared

    var body: some Scene {
        // 状态栏 App，不显示 Dock 图标
        MenuBarExtra {
            MenuBarView()
        } label: {
            Image(systemName: serverManager.isRunning ? "doc.fill" : "doc")
        }
    }
}

// AppDelegate.swift
import Cocoa

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // 隐藏 Dock 图标（纯状态栏 App）
        NSApp.setActivationPolicy(.accessory)

        // 启动 Server
        Task {
            await ServerManager.shared.start()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        // 停止 Server
        ServerManager.shared.stop()
    }
}

// ServerManager.swift
import Foundation
import Combine

class ServerManager: ObservableObject {
    static let shared = ServerManager()

    @Published var isRunning = false
    @Published var port: Int?
    @Published var error: String?

    private var serverProcess: Process?
    private var healthCheckTimer: Timer?

    func start() async {
        // 1. 查找可用端口
        let port = PortScanner.findAvailablePort(starting: 53000, range: 100)
        guard port != nil else {
            self.error = "无法找到可用端口"
            return
        }

        // 2. 获取 Server 二进制路径
        guard let serverPath = Bundle.main.path(forResource: "mdv-server", ofType: nil) else {
            self.error = "找不到 mdv-server"
            return
        }

        // 3. 确保可执行权限
        try? FileManager.default.setAttributes(
            [.posixPermissions: 0o755],
            ofItemAtPath: serverPath
        )

        // 4. 启动进程
        let process = Process()
        process.executableURL = URL(fileURLWithPath: serverPath)
        process.arguments = ["--internal-server-mode"]
        process.environment = [
            "PORT": "\(port!)",
            "HOST": "127.0.0.1"
        ]

        // 5. 重定向日志
        let logPath = getLogPath()
        if let logHandle = FileHandle(forWritingAtPath: logPath) {
            process.standardOutput = logHandle
            process.standardError = logHandle
        }

        // 6. 启动
        do {
            try process.run()
            self.serverProcess = process
            self.port = port

            // 7. 等待 Server 就绪
            let ready = await waitForServer(port: port!)
            if ready {
                self.isRunning = true
                startHealthCheck()
                print("✅ Server 启动成功: http://127.0.0.1:\(port!)")
            } else {
                self.error = "Server 启动超时"
                process.terminate()
            }
        } catch {
            self.error = "启动失败: \(error.localizedDescription)"
        }
    }

    func stop() {
        healthCheckTimer?.invalidate()
        serverProcess?.terminate()
        serverProcess = nil
        isRunning = false
        port = nil
    }

    func restart() async {
        stop()
        try? await Task.sleep(nanoseconds: 500_000_000) // 等待 0.5 秒
        await start()
    }

    // 等待 Server 就绪（最多 10 秒）
    private func waitForServer(port: Int) async -> Bool {
        let maxAttempts = 100
        let interval: UInt64 = 100_000_000 // 0.1 秒

        for _ in 0..<maxAttempts {
            if await checkServerHealth(port: port) {
                return true
            }
            try? await Task.sleep(nanoseconds: interval)
        }
        return false
    }

    // 检查 Server 健康状态
    private func checkServerHealth(port: Int) async -> Bool {
        guard let url = URL(string: "http://127.0.0.1:\(port)/") else {
            return false
        }

        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            if let httpResponse = response as? HTTPURLResponse {
                return httpResponse.statusCode == 200
            }
        } catch {
            // 忽略错误
        }
        return false
    }

    // 定期健康检查（每 30 秒）
    private func startHealthCheck() {
        healthCheckTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            guard let self = self, let port = self.port else { return }

            Task {
                let healthy = await self.checkServerHealth(port: port)
                if !healthy {
                    print("⚠️ Server 健康检查失败，尝试重启")
                    await self.restart()
                }
            }
        }
    }

    private func getLogPath() -> String {
        let logDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")
        try? FileManager.default.createDirectory(at: logDir, withIntermediateDirectories: true)
        return logDir.appendingPathComponent("server.log").path
    }
}

// PortScanner.swift
import Foundation

struct PortScanner {
    static func findAvailablePort(starting: Int, range: Int = 100) -> Int? {
        for port in starting..<(starting + range) {
            if isPortAvailable(port) {
                return port
            }
        }
        return nil
    }

    static func isPortAvailable(_ port: Int) -> Bool {
        let socketFD = socket(AF_INET, SOCK_STREAM, 0)
        guard socketFD != -1 else { return false }
        defer { close(socketFD) }

        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = in_port_t(port).bigEndian
        addr.sin_addr.s_addr = INADDR_ANY

        let bindResult = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(socketFD, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }

        return bindResult == 0
    }
}
```

---

## 完整项目结构

```
md-viewer/
├── MDViewer.xcodeproj              # Xcode 项目
├── MDViewer/
│   ├── App/
│   │   ├── MDViewerApp.swift       # App 入口
│   │   ├── AppDelegate.swift       # 生命周期管理
│   │   └── ServerManager.swift     # Server 管理（核心）
│   ├── Views/
│   │   ├── MenuBarView.swift       # 状态栏菜单
│   │   ├── MainWindow.swift        # 主窗口
│   │   ├── WebView.swift           # WKWebView 封装
│   │   ├── SettingsView.swift      # 设置页面
│   │   └── AboutView.swift         # 关于页面
│   ├── Models/
│   │   ├── Config.swift            # 配置模型
│   │   ├── RecentFile.swift        # 最近文件
│   │   └── AppState.swift          # 全局状态
│   ├── Utils/
│   │   ├── PortScanner.swift       # 端口扫描
│   │   ├── FileManager+Ext.swift   # 文件管理扩展
│   │   └── URLSession+Ext.swift    # 网络请求扩展
│   └── Resources/
│       ├── mdv-server              # Server 二进制（内嵌 Web UI）
│       ├── Assets.xcassets/
│       │   ├── AppIcon.appiconset/
│       │   └── TrayIcon.imageset/
│       └── Info.plist
├── src/                            # 现有 Server 代码（保持不变）
├── scripts/
│   ├── build-all.sh                # 构建 Server 二进制
│   └── copy-to-xcode.sh            # 复制到 Xcode 项目
└── docs/
    └── design/
        └── 20260316-swiftui-implementation-plan.md
```

---

## 构建流程

### 1. 准备 Server 二进制

```bash
#!/bin/bash
# scripts/build-server-for-xcode.sh

set -euo pipefail

echo "🔨 构建 Server 二进制..."

# 1. 构建前端
bun run build:client

# 2. 嵌入客户端
bun run scripts/embed-client.ts

# 3. 编译 Server（Apple Silicon）
bun build --compile \
  --target=bun-darwin-aarch64 \
  --outfile=mdv-server-arm64 \
  src/server.ts

# 4. 编译 Server（Intel）
bun build --compile \
  --target=bun-darwin-x64 \
  --outfile=mdv-server-x64 \
  src/server.ts

# 5. 创建通用二进制（Universal Binary）
lipo -create \
  mdv-server-arm64 \
  mdv-server-x64 \
  -output mdv-server

# 6. 复制到 Xcode 项目
cp mdv-server MDViewer/Resources/mdv-server

# 7. 清理临时文件
rm mdv-server-arm64 mdv-server-x64

echo "✅ Server 二进制已准备好"
ls -lh MDViewer/Resources/mdv-server
```

### 2. Xcode 构建设置

**Build Phases → Run Script:**
```bash
# 在构建前自动更新 Server 二进制
cd "$SRCROOT/.."
./scripts/build-server-for-xcode.sh
```

### 3. 发布构建

```bash
# 1. 构建 Server
./scripts/build-server-for-xcode.sh

# 2. 在 Xcode 中 Archive
# Product → Archive

# 3. 导出 .app
# Window → Organizer → Distribute App → Copy App

# 4. 创建 .dmg
hdiutil create -volname "MD Viewer" \
  -srcfolder "MD Viewer.app" \
  -ov -format UDZO \
  "MD-Viewer-1.0.0.dmg"
```

---

## 关键技术点

### 1. 端口配置持久化

```swift
// Config.swift
struct ServerConfig: Codable {
    var port: Int = 53000
    var portRange: ClosedRange<Int> = 53000...53099
    var host: String = "127.0.0.1"

    // 保存到 ~/.config/md-viewer/config.json
    func save() {
        let configDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")
        try? FileManager.default.createDirectory(at: configDir, withIntermediateDirectories: true)

        let configPath = configDir.appendingPathComponent("config.json")
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted

        if let data = try? encoder.encode(self) {
            try? data.write(to: configPath)
        }
    }

    static func load() -> ServerConfig {
        let configPath = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer/config.json")

        guard let data = try? Data(contentsOf: configPath),
              let config = try? JSONDecoder().decode(ServerConfig.self, from: data) else {
            return ServerConfig()
        }
        return config
    }
}
```

### 2. WKWebView 集成

```swift
// WebView.swift
import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled") // 启用开发者工具

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            print("❌ WebView 加载失败: \(error)")
        }
    }
}

// 使用
struct MainWindow: View {
    @StateObject private var serverManager = ServerManager.shared
    @State private var isLoading = false

    var body: some View {
        Group {
            if let port = serverManager.port, serverManager.isRunning {
                WebView(
                    url: URL(string: "http://127.0.0.1:\(port)")!,
                    isLoading: $isLoading
                )
            } else {
                VStack {
                    ProgressView("启动中...")
                    if let error = serverManager.error {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
        }
        .frame(minWidth: 800, minHeight: 600)
    }
}
```

### 3. 状态栏菜单

```swift
// MenuBarView.swift
import SwiftUI

struct MenuBarView: View {
    @StateObject private var serverManager = ServerManager.shared
    @State private var showingMainWindow = false
    @State private var showingSettings = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 服务状态
            Button(action: {}) {
                HStack {
                    Circle()
                        .fill(serverManager.isRunning ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text("服务状态: \(serverManager.isRunning ? "运行中" : "已停止")")
                }
            }
            .disabled(true)

            Divider()

            // 打开文件
            Button("打开文件...") {
                openFile()
            }
            .keyboardShortcut("o", modifiers: .command)

            Divider()

            // 显示主窗口
            Button("显示主窗口") {
                showingMainWindow = true
            }

            // 重启服务
            Button("重启服务") {
                Task {
                    await serverManager.restart()
                }
            }

            Divider()

            // 设置
            Button("偏好设置...") {
                showingSettings = true
            }
            .keyboardShortcut(",", modifiers: .command)

            // 关于
            Button("关于 MD Viewer") {
                NSApp.orderFrontStandardAboutPanel()
            }

            Divider()

            // 退出
            Button("退出 MD Viewer") {
                NSApp.terminate(nil)
            }
            .keyboardShortcut("q", modifiers: .command)
        }
        .padding(.vertical, 8)
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
    }

    private func openFile() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.plainText, .markdown]

        if panel.runModal() == .OK, let url = panel.url {
            openFileInServer(path: url.path)
        }
    }

    private func openFileInServer(path: String) {
        guard let port = serverManager.port else { return }

        let url = URL(string: "http://127.0.0.1:\(port)/api/open-file")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["path": path, "focus": true]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("❌ 打开文件失败: \(error)")
            } else {
                print("✅ 文件已打开: \(path)")
            }
        }.resume()
    }
}
```

---

## 与 CLI 版本共存

**配置文件共享：**
```
~/.config/md-viewer/
├── config.json          # 共享配置
├── server.pid           # CLI 版本的 PID（App 不使用）
└── server.log           # 共享日志

~/.local/share/md-viewer/
├── sync.db              # 同步数据库（共享）
└── annotations.db       # 评论数据库（共享）
```

**端口冲突处理：**
```swift
// 如果 CLI 版本占用了 53000，App 会自动使用 53001
let port = PortScanner.findAvailablePort(starting: 53000)
```

**CLI 和 App 可以同时运行：**
- CLI Server: `http://localhost:3000`（默认）
- App Server: `http://127.0.0.1:53000`（默认）
- 数据库共享，互不干扰

---

## 总结

### 核心决策

1. **端口：53000**（5-3 = MD，动态端口范围，冲突概率低）
2. **静态资源：内嵌到 Server 二进制**（保持现有构建流程）
3. **启动流程：App 启动 → 扫描端口 → 启动 Server → 创建 UI**

### 优势

- ✅ 用户无需关心端口配置
- ✅ 自动处理端口冲突
- ✅ Server 二进制自包含（无需额外资源文件）
- ✅ 与 CLI 版本完全兼容
- ✅ 配置和数据共享

### 下一步

需要我提供：
1. **完整的 Xcode 项目模板**？
2. **Swift 学习路径**（针对这个项目）？
3. **详细的开发步骤**（一步步实施）？
