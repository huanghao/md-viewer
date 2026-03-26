//
//  WebView.swift
//  MD Viewer
//
//  Created by Claude on 2026-03-16.
//

import SwiftUI
import WebKit

// 子类化 WKWebView，拦截 Cmd+F 触发原生 Find in Page
class FindableWebView: WKWebView {
    override func keyDown(with event: NSEvent) {
        // Cmd+F → 触发 find panel
        if event.modifierFlags.contains(.command) && event.charactersIgnoringModifiers == "f" {
            if let findAction = NSClassFromString("NSTextFinderAction") {
                _ = findAction
            }
            // 直接调用 WKWebView 内部的 find panel selector
            let sel = NSSelectorFromString("_showFindUI:")
            if self.responds(to: sel) {
                self.perform(sel, with: nil)
                return
            }
        }
        super.keyDown(with: event)
    }
}

struct WebView: NSViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    @Binding var refreshTrigger: Int

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // 启用开发者工具
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let webView = FindableWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
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

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: WebView
        var lastRefreshTrigger: Int = 0

        init(_ parent: WebView) {
            self.parent = parent
        }

        // 拦截导航：外部链接用系统浏览器打开
        @MainActor func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            let isLocal = url.host == "127.0.0.1" || url.host == "localhost"

            // 外部链接：用系统默认浏览器打开
            if !isLocal && (url.scheme == "http" || url.scheme == "https") {
                NSWorkspace.shared.open(url)
                decisionHandler(.cancel)
                print("🌍 外部链接用系统浏览器打开: \(url)")
                return
            }

            decisionHandler(.allow)
        }

        // 处理 window.open() / target="_blank"：同样用系统浏览器打开
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url {
                NSWorkspace.shared.open(url)
                print("🌍 window.open 用系统浏览器打开: \(url)")
            }
            return nil
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
