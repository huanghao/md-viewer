//
//  MainWindow.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI
import WebKit
import AppKit

struct MainWindow: View {
    @EnvironmentObject var serverManager: ServerManager
    @State private var isLoading = false
    @State private var webViewURL: URL?
    @State private var refreshTrigger = 0

    var body: some View {
        ZStack {
            if let url = webViewURL {
                // WebView 已创建，URL 不会改变（除非端口变化）
                WebView(
                    url: url,
                    isLoading: $isLoading,
                    refreshTrigger: $refreshTrigger
                )

                if isLoading {
                    VStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("加载中...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(NSColor.windowBackgroundColor).opacity(0.8))
                }
            } else if serverManager.isStarting {
                VStack(alignment: .leading, spacing: 20) {
                    Text("启动服务中...")
                        .font(.headline)
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(serverManager.startupSteps.enumerated()), id: \.offset) { _, step in
                            HStack(spacing: 10) {
                                Group {
                                    if step.done == nil {
                                        ProgressView().scaleEffect(0.7)
                                    } else if step.done == true {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                    } else {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                    }
                                }
                                .frame(width: 18, height: 18)
                                Text(step.label)
                                    .font(.body)
                                    .foregroundColor(step.done == false ? .red : .primary)
                            }
                        }
                    }
                }
                .padding(32)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.orange)

                    Text("服务未运行")
                        .font(.headline)

                    if let error = serverManager.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                    Button("启动服务") {
                        Task {
                            await serverManager.start()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .onAppear {
            print("📍 MainWindow: onAppear (port=\(serverManager.port?.description ?? "nil"), isRunning=\(serverManager.isRunning))")
            // 窗口出现时，如果服务已经在运行，设置 URL
            if let port = serverManager.port, serverManager.isRunning {
                let newURL = URL(string: "http://127.0.0.1:\(port)")!
                print("📍 MainWindow: 设置 WebView URL: \(newURL)")
                webViewURL = newURL
            }
        }
        .onDisappear {
            print("📍 MainWindow: onDisappear")
            // 窗口消失时不清理 URL，保持状态
        }
        .onChange(of: serverManager.port) { _ in
            print("📍 MainWindow: onChange port=\(serverManager.port?.description ?? "nil")")
            // 只在端口真正改变时更新 URL
            if let port = serverManager.port, serverManager.isRunning {
                let newURL = URL(string: "http://127.0.0.1:\(port)")!
                if webViewURL != newURL {
                    print("📍 MainWindow: 更新 WebView URL: \(newURL)")
                    webViewURL = newURL
                }
            }
        }
        .onChange(of: serverManager.isRunning) { _ in
            print("📍 MainWindow: onChange isRunning=\(serverManager.isRunning)")
            // 服务状态改变时，更新 URL
            if serverManager.isRunning, let port = serverManager.port {
                let newURL = URL(string: "http://127.0.0.1:\(port)")!
                if webViewURL != newURL {
                    print("📍 MainWindow: 服务启动，设置 WebView URL: \(newURL)")
                    webViewURL = newURL
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .reloadWebView)) { _ in
            refreshTrigger += 1
        }
        .onReceive(NotificationCenter.default.publisher(for: .showFindBar)) { _ in
            if let webView = NSApp.keyWindow?.contentView?.findSubview(ofType: WKWebView.self) {
                webView.evaluateJavaScript("window.__showFindBar && window.__showFindBar()", completionHandler: nil)
            }
        }
        .toolbar {
            ToolbarItem(placement: .navigation) {
                Button(action: { refreshTrigger += 1 }) {
                    Image(systemName: "arrow.clockwise")
                }
                .help("刷新 (⌘R)")
                .disabled(webViewURL == nil)
            }
        }
    }
}

extension Notification.Name {
    static let reloadWebView = Notification.Name("reloadWebView")
    static let showFindBar = Notification.Name("showFindBar")
}
