# WebView 空白问题调试

## 问题现象

主窗口打开后显示空白，偶尔闪现"刷新"字样。

## 已确认正常的部分

1. ✅ Server 正常运行 (端口 53000)
2. ✅ HTTP 请求返回 200
3. ✅ Safari 可以正常访问 http://127.0.0.1:53000/
4. ✅ 窗口已创建（osascript 可以检测到）

## 可能的原因

### 1. WKWebView 配置问题

**测试过的配置：**
- ❌ `.nonPersistent()` 数据存储 - 可能导致加载失败
- ✅ `.default()` 数据存储 - 应该正常

### 2. 加载时机问题

**测试过的方案：**
- 延迟 0.5 秒加载
- 立即加载
- 都没有解决问题

### 3. 缓存策略问题

**测试过的策略：**
- `.reloadIgnoringLocalAndRemoteCacheData`
- `.reloadIgnoringLocalCacheData`
- `.returnCacheDataElseLoad`

## 下一步调试

### 方案 1: 检查 Console.app 日志

```bash
# 查看 MD Viewer 的详细日志
log stream --predicate 'process == "MD Viewer"' --level debug
```

### 方案 2: 在 Safari 中测试

```bash
open http://127.0.0.1:53000/
# 如果 Safari 能正常显示，说明是 WKWebView 配置问题
```

### 方案 3: 简化 WebView 到最小配置

```swift
func makeNSView(context: Context) -> WKWebView {
    let webView = WKWebView()
    webView.load(URLRequest(url: url))
    return webView
}
```

### 方案 4: 检查是否有 JavaScript 错误

在 WebView 中添加 JavaScript 错误监听：

```swift
config.userContentController.add(self, name: "errorHandler")
```

### 方案 5: 使用 NSWindow 直接显示

临时方案：不使用 SwiftUI，直接用 AppKit 创建窗口和 WKWebView。

## 临时解决方案

用户可以：
1. 点击状态栏图标
2. 选择"显示主窗口"
3. 如果空白，手动在 Safari 中打开：http://127.0.0.1:53000/

## 需要测试

1. 在 Safari 中是否正常显示？
2. Console.app 中是否有错误信息？
3. WKWebView 的 didFail 回调是否被触发？
