//
//  AppDelegate.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import Cocoa
import SwiftUI

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // 单实例保护：检查是否已有实例在运行
        let runningApps = NSWorkspace.shared.runningApplications
        let bundleId = Bundle.main.bundleIdentifier ?? "com.huanghao.MDViewer"
        let instances = runningApps.filter { $0.bundleIdentifier == bundleId }

        if instances.count > 1 {
            print("⚠️ 检测到已有 MD Viewer 实例在运行，退出当前实例")
            // 激活已有实例
            if let existingApp = instances.first(where: { $0.processIdentifier != ProcessInfo.processInfo.processIdentifier }) {
                existingApp.activate(options: .activateIgnoringOtherApps)
            }
            // 延迟退出，确保激活完成
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                NSApp.terminate(nil)
            }
            return
        }

        // 显示 Dock 图标
        NSApp.setActivationPolicy(.regular)

        // 启动 Server
        Task {
            await ServerManager.shared.start()
        }

        print("✅ MD Viewer 启动完成")
    }

    func applicationWillTerminate(_ notification: Notification) {
        // 停止 Server
        ServerManager.shared.stop()
        print("👋 MD Viewer 退出")
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // 关闭窗口不退出 App，只是隐藏窗口
        return false
    }
}
