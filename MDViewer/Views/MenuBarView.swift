//
//  MenuBarView.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI

struct MenuBarView: View {
    @EnvironmentObject var serverManager: ServerManager
    @Environment(\.openWindow) var openWindow

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 服务状态
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 8, height: 8)
                Text(statusText)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            if let error = serverManager.error {
                Text(error)
                    .font(.system(size: 11))
                    .foregroundColor(.red)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 8)
            }

            Divider()

            // 打开文件
            Button(action: openFile) {
                Label("打开文件...", systemImage: "doc.badge.plus")
            }
            .keyboardShortcut("o", modifiers: .command)

            Divider()

            // 显示主窗口
            Button(action: {
                openWindow(id: "main")
                NSApp.activate(ignoringOtherApps: true)
            }) {
                Label("显示主窗口", systemImage: "macwindow")
            }

            // 重启服务
            Button(action: {
                Task {
                    await serverManager.restart()
                }
            }) {
                Label("重启服务", systemImage: "arrow.clockwise")
            }
            .disabled(!serverManager.isRunning)

            Divider()

            // 设置
            Button(action: {
                NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
            }) {
                Label("偏好设置...", systemImage: "gearshape")
            }
            .keyboardShortcut(",", modifiers: .command)

            // 查看日志
            Button(action: openLogFile) {
                Label("查看日志", systemImage: "doc.text.magnifyingglass")
            }

            Divider()

            // 关于
            Button(action: {
                NSApp.orderFrontStandardAboutPanel()
            }) {
                Label("关于 MD Viewer", systemImage: "info.circle")
            }

            // 退出
            Button(action: {
                NSApp.terminate(nil)
            }) {
                Label("退出 MD Viewer", systemImage: "power")
            }
            .keyboardShortcut("q", modifiers: .command)
        }
        .frame(width: 220)
    }

    private var statusColor: Color {
        if serverManager.isStarting {
            return .yellow
        } else if serverManager.isRunning {
            return .green
        } else {
            return .red
        }
    }

    private var statusText: String {
        if serverManager.isStarting {
            return "启动中..."
        } else if serverManager.isRunning, let port = serverManager.port {
            return "运行中 (端口 \(port))"
        } else {
            return "已停止"
        }
    }

    private func openFile() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.plainText, .data]
        panel.allowsOtherFileTypes = true
        panel.message = "选择要打开的 Markdown 文件"

        if panel.runModal() == .OK, let url = panel.url {
            Task {
                await serverManager.openFile(path: url.path)
            }
        }
    }

    private func openLogFile() {
        let logPath = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".config/md-viewer/server.log")

        if FileManager.default.fileExists(atPath: logPath.path) {
            NSWorkspace.shared.open(logPath)
        } else {
            print("⚠️ 日志文件不存在")
        }
    }
}
