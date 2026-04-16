//
//  ServerManager.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import Foundation
import Combine

@MainActor
class ServerManager: ObservableObject {
    static let shared = ServerManager()

    @Published var isRunning = false
    @Published var port: Int?
    @Published var error: String?
    @Published var isStarting = false

    private var serverProcess: Process?
    private var healthCheckTimer: Timer?
    private let config: AppConfig

    private init() {
        self.config = AppConfig.load()
    }

    // MARK: - Server 控制

    func start() async {
        guard !isRunning && !isStarting else {
            print("⚠️ Server 已经在运行或正在启动")
            return
        }

        print("🔵 开始启动 Server...")
        isStarting = true
        error = nil

        do {
            // 1. 查找可用端口
            print("🔍 查找可用端口...")
            guard let port = PortScanner.findAvailablePort(
                starting: config.serverPort,
                range: 100
            ) else {
                throw ServerError.noAvailablePort
            }
            print("✓ 找到可用端口: \(port)")

            // 2. 获取 Server 二进制路径
            print("🔍 查找 Server 二进制...")
            guard let serverPath = getServerPath() else {
                throw ServerError.serverNotFound
            }
            print("✓ Server 路径: \(serverPath)")

            // 3. 确保可执行权限
            try FileManager.default.setAttributes(
                [.posixPermissions: 0o755],
                ofItemAtPath: serverPath
            )

            // 4. 启动进程
            let process = Process()
            process.executableURL = URL(fileURLWithPath: serverPath)
            process.arguments = ["--internal-server-mode"]
            // 继承当前进程的 PATH，并补充常见工具路径
            // macOS App 默认 PATH 很短，需要手动补充 Go/Homebrew 等路径
            let currentPath = ProcessInfo.processInfo.environment["PATH"] ?? ""
            let extraPaths = [
                "/usr/local/bin",
                "/opt/homebrew/bin",
                NSHomeDirectory() + "/go/bin",
                NSHomeDirectory() + "/.local/bin",
            ].filter { FileManager.default.fileExists(atPath: $0) }
            let fullPath = (extraPaths + [currentPath])
                .filter { !$0.isEmpty }
                .joined(separator: ":")

            process.environment = [
                "PORT": "\(port)",
                "HOST": "127.0.0.1",
                "PATH": fullPath,
                "HOME": NSHomeDirectory(),
            ]

            // 5. 重定向日志
            let logPath = getLogPath()
            if let logHandle = FileHandle(forWritingAtPath: logPath) {
                _ = try? logHandle.seekToEnd()
                process.standardOutput = logHandle
                process.standardError = logHandle
            }

            // 6. 启动
            print("🚀 启动 Server 进程...")
            try process.run()
            self.serverProcess = process
            self.port = port

            print("✓ Server 进程已启动 (PID: \(process.processIdentifier), Port: \(port))")

            // 7. 等待 Server 就绪
            print("⏳ 等待 Server 就绪...")
            let ready = await waitForServer(port: port)
            if ready {
                self.isRunning = true
                writePortFile(port: port)
                startHealthCheck()
                print("✅ Server 启动成功: http://127.0.0.1:\(port)")
            } else {
                throw ServerError.startTimeout
            }

        } catch {
            self.error = error.localizedDescription
            print("❌ Server 启动失败: \(error)")

            // 清理
            serverProcess?.terminate()
            serverProcess = nil
            port = nil
        }

        isStarting = false
        print("🔵 Server 启动流程结束 (isRunning: \(isRunning))")
    }

    func stop() {
        healthCheckTimer?.invalidate()
        healthCheckTimer = nil

        if let process = serverProcess {
            process.terminate()
            print("🛑 Server 已停止 (PID: \(process.processIdentifier))")
        }

        serverProcess = nil
        isRunning = false
        port = nil
        removePortFile()
    }

    func restart() async {
        print("🔄 重启 Server...")
        stop()
        try? await Task.sleep(nanoseconds: 500_000_000) // 等待 0.5 秒
        await start()
    }

    // MARK: - 文件操作

    func openFile(path: String) async {
        guard let port = port, isRunning else {
            print("⚠️ Server 未运行，无法打开文件")
            return
        }

        guard let url = URL(string: "http://127.0.0.1:\(port)/api/open-file") else {
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = ["path": path, "focus": true]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let filename = json["filename"] as? String {
                    print("✅ 文件已打开: \(filename)")
                }
            } else {
                print("❌ 打开文件失败: HTTP \((response as? HTTPURLResponse)?.statusCode ?? 0)")
            }
        } catch {
            print("❌ 打开文件失败: \(error)")
        }
    }

    // MARK: - 健康检查

    private func waitForServer(port: Int) async -> Bool {
        let maxAttempts = 300
        let interval: UInt64 = 100_000_000 // 0.1 秒

        for attempt in 0..<maxAttempts {
            if await checkServerHealth(port: port) {
                print("✅ Server 就绪 (尝试 \(attempt + 1)/\(maxAttempts))")
                return true
            }
            try? await Task.sleep(nanoseconds: interval)
        }

        print("❌ Server 启动超时")
        return false
    }

    private func checkServerHealth(port: Int) async -> Bool {
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/health") else {
            return false
        }

        do {
            let (_, response) = try await URLSession.shared.data(from: url)
            if let httpResponse = response as? HTTPURLResponse {
                return httpResponse.statusCode == 200
            }
        } catch {
            // 忽略错误（Server 可能还未就绪）
        }
        return false
    }

    private func startHealthCheck() {
        healthCheckTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            guard let self = self else { return }

            Task { @MainActor in
                guard let port = self.port else { return }
                let healthy = await self.checkServerHealth(port: port)
                if !healthy {
                    print("⚠️ Server 健康检查失败，尝试重启")
                    await self.restart()
                }
            }
        }
    }

    // MARK: - 路径管理

    private func getServerPath() -> String? {
        // 1. 尝试从 Bundle 中获取（发布版本）
        if let bundlePath = Bundle.main.path(forResource: "mdv-server", ofType: nil) {
            return bundlePath
        }

        // 2. 尝试从项目目录获取（开发版本）
        let projectPath = URL(fileURLWithPath: #file)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("dist/mdv")
            .path

        if FileManager.default.fileExists(atPath: projectPath) {
            return projectPath
        }

        print("❌ 找不到 mdv-server 二进制文件")
        return nil
    }

    private func getPortFilePath() -> String {
        let configDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")
        return configDir.appendingPathComponent("server.port").path
    }

    private func writePortFile(port: Int) {
        let path = getPortFilePath()
        try? "\(port)".write(toFile: path, atomically: true, encoding: .utf8)
    }

    private func removePortFile() {
        let path = getPortFilePath()
        try? FileManager.default.removeItem(atPath: path)
    }

    private func getLogPath() -> String {
        let logDir = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer")

        try? FileManager.default.createDirectory(
            at: logDir,
            withIntermediateDirectories: true
        )

        return logDir.appendingPathComponent("server.log").path
    }
}

// MARK: - 错误类型

enum ServerError: LocalizedError {
    case noAvailablePort
    case serverNotFound
    case startTimeout

    var errorDescription: String? {
        switch self {
        case .noAvailablePort:
            return "无法找到可用端口（53000-53099 均被占用）"
        case .serverNotFound:
            return "找不到 mdv-server 二进制文件"
        case .startTimeout:
            return "Server 启动超时（30秒内未响应）"
        }
    }
}
