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
