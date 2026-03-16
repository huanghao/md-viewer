# SwiftUI App 快速开始指南

## ✅ 已完成的工作

我已经为你创建了完整的 SwiftUI Native App 代码：

```
✅ Swift 代码（9 个文件）
✅ 构建脚本
✅ Info.plist 配置
✅ 完整的实施指南
✅ README 文档
```

**文件清单：**
```
MDViewer/
├── App/
│   ├── MDViewerApp.swift       # App 入口
│   ├── AppDelegate.swift       # 生命周期管理
│   └── ServerManager.swift     # Server 管理（核心）
├── Views/
│   ├── MenuBarView.swift       # 状态栏菜单
│   ├── MainWindow.swift        # 主窗口
│   ├── WebView.swift           # WKWebView 封装
│   └── SettingsView.swift      # 设置页面
├── Models/
│   └── AppConfig.swift         # 配置管理
├── Utils/
│   └── PortScanner.swift       # 端口扫描
├── Resources/
│   └── .gitkeep                # (mdv-server 将放在这里)
└── Info.plist                  # App 配置
```

---

## 🚀 下一步：你需要做的事

### 1. 构建 Server 二进制（5 分钟）

```bash
cd /Users/huanghao/workspace/md-viewer

# 一键构建
./scripts/build-server-for-xcode.sh
```

**预期输出：**
```
✅ Server 二进制已准备好！
-rw-r--r--  1 huanghao  staff   30M  MDViewer/Resources/mdv-server
```

---

### 2. 创建 Xcode 项目（10 分钟）

#### 步骤 1：打开 Xcode

```bash
open -a Xcode
```

#### 步骤 2：创建新项目

1. **File → New → Project**
2. 选择 **macOS** → **App**
3. 填写：
   ```
   Product Name: MD Viewer
   Team: 选择你的账号（或 None）
   Organization Identifier: com.huanghao
   Bundle Identifier: com.huanghao.MDViewer
   Interface: SwiftUI
   Language: Swift
   ```
4. 保存到：`/Users/huanghao/workspace/md-viewer/`
   - ⚠️ 不要勾选 "Create Git repository"

#### 步骤 3：删除默认文件

删除 Xcode 自动生成的：
- `MDViewerApp.swift`
- `ContentView.swift`
- `Assets.xcassets`（可选，后续重新创建）

#### 步骤 4：添加我们的文件

1. 右键点击项目中的 `MDViewer` 文件夹
2. **Add Files to "MDViewer"...**
3. 选择以下文件夹（勾选 "Create groups"）：
   - `MDViewer/App/`
   - `MDViewer/Views/`
   - `MDViewer/Models/`
   - `MDViewer/Utils/`
   - `MDViewer/Resources/`
   - `MDViewer/Info.plist`

#### 步骤 5：配置项目

**General 设置：**
```
Deployment Target: macOS 13.0
```

**Signing & Capabilities：**
```
Automatically manage signing: ✅
Team: 选择你的账号（或 "Sign to Run Locally"）
```

**Build Phases → Copy Files：**
1. 点击 **+** → New Copy Files Phase
2. Destination: **Resources**
3. 添加 `MDViewer/Resources/mdv-server`
4. ✅ 勾选 "Code Sign On Copy"

---

### 3. 运行测试（2 分钟）

```
Product → Run (⌘R)
```

**预期结果：**
- ✅ 状态栏出现图标
- ✅ 点击显示菜单
- ✅ 菜单显示 "运行中 (端口 53000)"

**测试功能：**
- [ ] 点击 "打开文件..." 选择一个 .md 文件
- [ ] 点击 "显示主窗口" 查看 Web UI
- [ ] 在 Web UI 中添加文件
- [ ] 点击 "重启服务"
- [ ] 点击 "偏好设置..."

---

## 📚 详细文档

如果遇到问题，查看完整指南：

```bash
# 完整实施指南（包含所有细节和故障排除）
cat docs/SWIFTUI_IMPLEMENTATION_GUIDE.md

# SwiftUI 版本 README
cat README_SWIFTUI.md
```

---

## 🐛 常见问题

### Q1: 找不到 mdv-server

**解决：**
```bash
# 重新构建
./scripts/build-server-for-xcode.sh

# 检查文件
ls -lh MDViewer/Resources/mdv-server
```

### Q2: 编译错误

**解决：**
- 确保 Deployment Target 设置为 **macOS 13.0**
- 确保所有文件都已添加到项目中

### Q3: Server 启动失败

**解决：**
```bash
# 查看日志
tail -f ~/.config/md-viewer/server.log

# 手动测试 Server
./MDViewer/Resources/mdv-server --internal-server-mode
```

---

## 🎉 完成后

成功运行后，你可以：

1. **打包发布：**
   ```
   Product → Archive
   Distribute App → Copy App
   ```

2. **创建 .dmg：**
   ```bash
   hdiutil create -volname "MD Viewer" \
     -srcfolder "MD Viewer.app" \
     -ov -format UDZO \
     "MD-Viewer-1.0.0.dmg"
   ```

3. **发布到 GitHub Releases**

---

## 📊 预期效果

**包体积：** ~32 MB（.dmg ~18 MB）
**内存占用：** ~140 MB
**启动速度：** ~1-1.5 秒
**端口：** 53000（自动扫描 53000-53099）

---

## 💡 提示

- 所有 Swift 代码都已经写好，无需修改
- 构建脚本会自动处理前端打包和嵌入
- 与 CLI 版本完全兼容，可以共存
- 配置和数据库共享

---

需要帮助？查看：
- `docs/SWIFTUI_IMPLEMENTATION_GUIDE.md` - 完整指南
- `docs/design/20260316-swiftui-implementation-plan.md` - 设计文档
- GitHub Issues: https://github.com/huanghao/md-viewer/issues
