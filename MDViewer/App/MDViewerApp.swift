//
//  MDViewerApp.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI

@main
struct MDViewerApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var serverManager = ServerManager.shared

    var body: some Scene {
        // 主窗口
        WindowGroup("MD Viewer") {
            MainWindow()
                .environmentObject(serverManager)
                .frame(minWidth: 1000, idealWidth: 1400, maxWidth: CGFloat.infinity,
                       minHeight: 700, idealHeight: 900, maxHeight: CGFloat.infinity)
        }
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("打开文件...") {
                    openFileDialog()
                }
                .keyboardShortcut("o", modifiers: .command)
            }
            CommandGroup(after: .toolbar) {
                Button("刷新") {
                    NotificationCenter.default.post(name: .reloadWebView, object: nil)
                }
                .keyboardShortcut("r", modifiers: .command)
            }
        }

        // 设置窗口
        Settings {
            SettingsView()
                .environmentObject(serverManager)
        }
    }

    private func openFileDialog() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.plainText, .data]
        panel.allowsOtherFileTypes = true

        if panel.runModal() == .OK, let url = panel.url {
            Task {
                await ServerManager.shared.openFile(path: url.path)
            }
        }
    }
}
