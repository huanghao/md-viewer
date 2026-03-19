//
//  WebView.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI
import WebKit

struct WebView: NSViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var refreshTrigger: Int

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // 启用开发者工具
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        // 立即加载（只在创建时执行一次）
        print("🌐 WebView initializing with URL: \(url)")
        webView.load(URLRequest(url: url))

        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        // 刷新触发
        if context.coordinator.lastRefreshTrigger != refreshTrigger {
            context.coordinator.lastRefreshTrigger = refreshTrigger
            print("🔄 WebView reload triggered")
            webView.reload()
            return
        }

        // 只在 URL 真正改变时才重新加载
        // 规范化 URL（去除末尾斜杠）进行比较
        let currentURLString = webView.url?.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) ?? ""
        let newURLString = url.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        guard currentURLString != newURLString else {
            // URL 没有改变，不做任何操作
            return
        }

        print("🔄 WebView URL changed from \(currentURLString) to \(newURLString)")
        webView.load(URLRequest(url: url))
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView
        var lastRefreshTrigger: Int = 0

        init(_ parent: WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
            print("🌐 WebView started loading")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            print("✅ WebView finished loading: \(webView.url?.absoluteString ?? "unknown")")
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            print("❌ WebView 加载失败: \(error.localizedDescription)")
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            print("❌ WebView 预加载失败: \(error.localizedDescription)")
            print("   URL: \(webView.url?.absoluteString ?? "none")")
        }
    }
}
