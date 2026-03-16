# SwiftUI Native App 实施指南

## 📋 完成状态

✅ **已完成：**
- [x] 创建完整的 Swift 代码
- [x] 项目目录结构
- [x] 构建脚本

⏳ **待完成：**
- [ ] 创建 Xcode 项目
- [ ] 配置 Info.plist
- [ ] 添加 App 图标
- [ ] 首次构建和测试
- [ ] 代码签名
- [ ] 打包发布

---

## 🚀 实施步骤

### 第一步：准备 Server 二进制

在开始之前，先构建 Server 二进制：

```bash
cd /Users/huanghao/workspace/md-viewer

# 构建 Server 二进制（包含 Web UI）
./scripts/build-server-for-xcode.sh
```

**预期输出：**
```
🔨 构建 Server 二进制用于 Xcode...

1️⃣  构建前端资源...
✅ 客户端构建完成

2️⃣  嵌入客户端脚本...
✅ 客户端脚本已嵌入

3️⃣  编译 Server (arm64)...
4️⃣  编译 Server (x64)...
5️⃣  创建通用二进制...
6️⃣  复制到 Xcode 项目...
7️⃣  清理临时文件...

✅ Server 二进制已准备好！
-rw-r--r--  1 huanghao  staff    30M  Mar 16 10:00 MDViewer/Resources/mdv-server
```

**验证：**
```bash
# 检查文件是否存在
ls -lh MDViewer/Resources/mdv-server

# 检查是否为通用二进制
file MDViewer/Resources/mdv-server
# 应该显示: Mach-O universal binary with 2 architectures
```

---

### 第二步：创建 Xcode 项目

1. **打开 Xcode**（需要 Xcode 14+ 和 macOS 13+）

2. **创建新项目：**
   - File → New → Project
   - 选择 **macOS** → **App**
   - 点击 **Next**

3. **填写项目信息：**
   ```
   Product Name: MD Viewer
   Team: 选择你的开发者账号（或 None）
   Organization Identifier: com.huanghao
   Bundle Identifier: com.huanghao.MDViewer
   Interface: SwiftUI
   Language: Swift
   ✅ Use Core Data: 不勾选
   ✅ Include Tests: 可选
   ```

4. **保存位置：**
   ```
   /Users/huanghao/workspace/md-viewer/
   ```
   - ⚠️ **重要：** 不要勾选 "Create Git repository"（已有 Git）
   - 保存后会创建 `MDViewer.xcodeproj`

5. **删除默认文件：**
   - 删除 Xcode 自动生成的以下文件：
     - `MDViewerApp.swift`（我们已经创建了更好的版本）
     - `ContentView.swift`（不需要）
     - `Assets.xcassets`（稍后重新创建）

6. **添加我们的文件：**
   - 在 Xcode 左侧项目导航器中，右键点击 `MDViewer` 文件夹
   - 选择 **Add Files to "MDViewer"...**
   - 选择以下文件夹（勾选 "Create groups"）：
     - `MDViewer/App/`
     - `MDViewer/Views/`
     - `MDViewer/Models/`
     - `MDViewer/Utils/`
     - `MDViewer/Resources/`

7. **验证文件结构：**
   ```
   MDViewer (项目)
   ├── App
   │   ├── MDViewerApp.swift
   │   ├── AppDelegate.swift
   │   └── ServerManager.swift
   ├── Views
   │   ├── MenuBarView.swift
   │   ├── MainWindow.swift
   │   ├── WebView.swift
   │   └── SettingsView.swift
   ├── Models
   │   └── AppConfig.swift
   ├── Utils
   │   └── PortScanner.swift
   └── Resources
       └── mdv-server
   ```

---

### 第三步：配置项目设置

#### 1. General 设置

在 Xcode 中选择项目 → Target: MD Viewer → General：

```
Display Name: MD Viewer
Bundle Identifier: com.huanghao.MDViewer
Version: 1.0.0
Build: 1

Deployment Info:
  macOS 13.0 (最低支持版本)

Category: Productivity
```

#### 2. Signing & Capabilities

```
Signing:
  Automatically manage signing: ✅ (勾选)
  Team: 选择你的 Apple Developer 账号
        （如果没有，选择 "Add an Account..."）

或者：
  Automatically manage signing: ❌ (不勾选)
  Signing Certificate: Sign to Run Locally
```

#### 3. Build Settings

搜索并修改以下设置：

```
Product Name: MD Viewer
Product Bundle Identifier: com.huanghao.MDViewer

Deployment:
  macOS Deployment Target: 13.0

Architectures:
  Architectures: Standard Architectures (arm64, x86_64)
  Build Active Architecture Only:
    Debug: Yes
    Release: No
```

#### 4. Info.plist 配置

在项目导航器中找到 `Info.plist`，添加以下键值：

```xml
<key>LSUIElement</key>
<false/>
<!-- 设置为 true 可以隐藏 Dock 图标，只在状态栏显示 -->

<key>NSHumanReadableCopyright</key>
<string>Copyright © 2026 Huang Hao. All rights reserved.</string>

<key>CFBundleDocumentTypes</key>
<array>
    <dict>
        <key>CFBundleTypeName</key>
        <string>Markdown Document</string>
        <key>CFBundleTypeRole</key>
        <string>Viewer</string>
        <key>LSHandlerRank</key>
        <string>Alternate</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>net.daringfireball.markdown</string>
            <string>public.plain-text</string>
        </array>
    </dict>
</array>
```

#### 5. 添加 mdv-server 到 Copy Files

1. 选择 Target: MD Viewer → Build Phases
2. 点击 **+** → New Copy Files Phase
3. 配置：
   ```
   Destination: Resources
   Subpath: (留空)
   ```
4. 点击 **+** 添加文件
5. 选择 `MDViewer/Resources/mdv-server`
6. ✅ 勾选 "Code Sign On Copy"

---

### 第四步：创建 App 图标

#### 方法 1：使用 SF Symbols（快速）

1. 在 Xcode 中，右键点击项目导航器
2. New File → Asset Catalog → 命名为 `Assets`
3. 在 Assets.xcassets 中，右键 → New macOS App Icon
4. 暂时使用默认图标（稍后可以替换）

#### 方法 2：自定义图标（推荐）

创建一个简单的图标：

```bash
# 创建临时图标目录
mkdir -p /tmp/mdviewer-icon

# 使用 SF Symbols 或设计工具创建以下尺寸的图标：
# 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024

# 或者使用在线工具：
# https://www.appicon.co/
# 上传一张 1024x1024 的图片，生成 macOS 图标
```

将生成的 `AppIcon.appiconset` 拖拽到 `Assets.xcassets` 中。

**临时方案：** 可以先使用系统默认图标，后续再替换。

---

### 第五步：首次构建

#### 1. 构建项目

```
Product → Build (⌘B)
```

**可能的错误和解决方案：**

**错误 1：找不到 mdv-server**
```
解决：确保已运行 ./scripts/build-server-for-xcode.sh
```

**错误 2：代码签名失败**
```
解决：在 Signing & Capabilities 中选择 "Sign to Run Locally"
```

**错误 3：macOS 版本不兼容**
```
解决：确保 Deployment Target 设置为 13.0 或更低
```

#### 2. 运行项目

```
Product → Run (⌘R)
```

**预期结果：**
- ✅ 状态栏出现 MD Viewer 图标
- ✅ 点击图标显示菜单
- ✅ 控制台输出：
  ```
  ✅ MD Viewer 启动完成
  🚀 Server 进程已启动 (PID: 12345)
  ✅ Server 启动成功: http://127.0.0.1:53000
  ```

#### 3. 测试功能

**测试清单：**

- [ ] 状态栏图标显示正常
- [ ] 点击图标显示菜单
- [ ] 菜单显示 "运行中 (端口 53000)"
- [ ] 点击 "打开文件..." 可以选择文件
- [ ] 点击 "显示主窗口" 打开窗口
- [ ] 主窗口显示 Web UI
- [ ] 可以在 Web UI 中添加文件
- [ ] 点击 "重启服务" 可以重启
- [ ] 点击 "偏好设置..." 打开设置
- [ ] 退出 App 后 Server 停止

**调试技巧：**

1. **查看日志：**
   ```bash
   tail -f ~/.config/md-viewer/server.log
   ```

2. **检查端口：**
   ```bash
   lsof -i :53000
   ```

3. **测试 Server：**
   ```bash
   curl http://127.0.0.1:53000/
   ```

4. **在 Xcode 中查看控制台输出：**
   - View → Debug Area → Activate Console (⌘⇧Y)

---

### 第六步：优化和完善

#### 1. 添加开机自启动

在 `SettingsView.swift` 中，"开机自启动" 功能需要额外实现：

```swift
// 需要添加 ServiceManagement framework
import ServiceManagement

// 在 SettingsView 中：
.onChange(of: config.launchAtLogin) { newValue in
    if newValue {
        try? SMAppService.mainApp.register()
    } else {
        try? SMAppService.mainApp.unregister()
    }
}
```

#### 2. 添加 Dock 图标切换

在 `AppDelegate.swift` 中已实现，通过设置中的开关控制。

#### 3. 添加文件关联

在 `Info.plist` 中已配置，用户可以：
- 右键 `.md` 文件 → 打开方式 → MD Viewer
- 设置为默认打开方式

#### 4. 添加快捷键

在 `MDViewerApp.swift` 中已添加：
- ⌘O: 打开文件
- ⌘,: 偏好设置
- ⌘Q: 退出

---

### 第七步：打包发布

#### 1. Archive 构建

```
Product → Archive
```

等待构建完成（约 1-2 分钟）。

#### 2. 导出 App

1. 构建完成后，Xcode 会自动打开 Organizer
2. 选择刚才的 Archive
3. 点击 **Distribute App**
4. 选择 **Copy App**
5. 点击 **Next** → **Export**
6. 选择保存位置（如 `~/Desktop/MD Viewer.app`）

#### 3. 测试导出的 App

```bash
# 移动到 Applications
cp -r ~/Desktop/MD\ Viewer.app /Applications/

# 运行
open /Applications/MD\ Viewer.app
```

#### 4. 创建 .dmg 安装包

```bash
cd ~/Desktop

# 创建临时目录
mkdir -p "MD Viewer Installer"
cp -r "MD Viewer.app" "MD Viewer Installer/"
ln -s /Applications "MD Viewer Installer/Applications"

# 创建 .dmg
hdiutil create -volname "MD Viewer" \
  -srcfolder "MD Viewer Installer" \
  -ov -format UDZO \
  "MD-Viewer-1.0.0.dmg"

# 清理
rm -rf "MD Viewer Installer"

echo "✅ DMG 创建完成: MD-Viewer-1.0.0.dmg"
```

#### 5. 代码签名和公证（可选）

**需要 Apple Developer 账号（$99/年）**

```bash
# 1. 签名 App
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  "MD Viewer.app"

# 2. 签名 DMG
codesign --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  "MD-Viewer-1.0.0.dmg"

# 3. 公证（Notarization）
xcrun notarytool submit "MD-Viewer-1.0.0.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "YOUR_TEAM_ID" \
  --wait

# 4. 装订公证票据
xcrun stapler staple "MD-Viewer-1.0.0.dmg"
```

**如果没有开发者账号：**
- 用户首次打开时会提示 "无法验证开发者"
- 用户需要右键 → 打开 → 确认打开
- 或者在 系统设置 → 隐私与安全性 中允许

---

## 📦 发布方式

### 方式 1：GitHub Releases

```bash
# 1. 创建 Release
gh release create v1.0.0 \
  --title "MD Viewer 1.0.0" \
  --notes "首次发布 SwiftUI Native App"

# 2. 上传 DMG
gh release upload v1.0.0 MD-Viewer-1.0.0.dmg
```

### 方式 2：Homebrew Cask

创建 `Formula/md-viewer-app.rb`：

```ruby
cask "md-viewer-app" do
  version "1.0.0"
  sha256 "..."  # 使用 shasum -a 256 MD-Viewer-1.0.0.dmg

  url "https://github.com/huanghao/md-viewer/releases/download/v#{version}/MD-Viewer-#{version}.dmg"
  name "MD Viewer"
  desc "Markdown viewer with live reload - Native App"
  homepage "https://github.com/huanghao/md-viewer"

  app "MD Viewer.app"

  zap trash: [
    "~/Library/Application Support/md-viewer",
    "~/Library/Preferences/com.huanghao.MDViewer.plist",
    "~/.config/md-viewer/app-config.json"
  ]
end
```

安装：
```bash
brew install --cask huanghao/tap/md-viewer-app
```

### 方式 3：App Store（未来）

需要额外工作：
1. 沙盒化（Sandboxing）
2. 审核准备
3. App Store Connect 配置

---

## 🐛 常见问题

### Q1: Server 启动失败

**检查：**
```bash
# 1. 检查 mdv-server 是否存在
ls -l MDViewer/Resources/mdv-server

# 2. 检查是否有执行权限
chmod +x MDViewer/Resources/mdv-server

# 3. 手动测试 Server
MDViewer/Resources/mdv-server --internal-server-mode
```

### Q2: 端口被占用

**解决：**
- App 会自动扫描 53000-53099
- 如果全部被占用，在设置中修改默认端口

### Q3: WebView 显示空白

**检查：**
```bash
# 1. Server 是否运行
lsof -i :53000

# 2. 访问 Server
curl http://127.0.0.1:53000/

# 3. 查看 WebView 控制台
# 在 App 中，右键 WebView → 检查元素
```

### Q4: 构建失败

**常见错误：**

1. **"No such module 'SwiftUI'"**
   - 解决：确保 Deployment Target ≥ 13.0

2. **"Cannot find 'MenuBarExtra' in scope"**
   - 解决：确保 Deployment Target ≥ 13.0

3. **"Signing for 'MD Viewer' requires a development team"**
   - 解决：在 Signing & Capabilities 中选择 Team

---

## 📊 性能指标

**预期性能：**

```
包体积:
  MD Viewer.app: ~32 MB
  压缩后 .dmg: ~18 MB

内存占用:
  启动时: ~140 MB
  空闲时: ~120 MB
  打开 10 个文件: ~180 MB

启动速度:
  冷启动: 1-1.5 秒
  热启动: 0.5-1 秒

CPU 占用:
  空闲时: <1%
  渲染 Markdown: 3-5%
```

---

## ✅ 验收标准

完成以下所有测试后，即可发布：

### 基础功能
- [ ] App 可以正常启动
- [ ] 状态栏图标显示正常
- [ ] Server 自动启动（端口 53000）
- [ ] 可以打开 Markdown 文件
- [ ] Web UI 显示正常
- [ ] 可以切换文件
- [ ] 实时刷新功能正常

### 窗口管理
- [ ] 主窗口可以打开/关闭
- [ ] 窗口大小可以调整
- [ ] 窗口位置会记忆

### 设置功能
- [ ] 可以修改默认端口
- [ ] 开机自启动开关有效
- [ ] Dock 图标显示开关有效

### 稳定性
- [ ] Server 崩溃后自动重启
- [ ] 端口冲突时自动切换
- [ ] 退出 App 时 Server 正常停止
- [ ] 无内存泄漏

### 兼容性
- [ ] 与 CLI 版本共存
- [ ] 配置文件共享
- [ ] 数据库共享

---

## 🎉 完成！

恭喜！你已经成功创建了一个原生的 macOS App。

**下一步：**
1. 收集用户反馈
2. 迭代优化
3. 添加更多功能（如 iOS 版本）

**需要帮助？**
- 查看日志：`~/.config/md-viewer/server.log`
- 查看 Xcode 控制台
- 提交 Issue：https://github.com/huanghao/md-viewer/issues
