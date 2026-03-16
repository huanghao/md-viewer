# SwiftUI Native App 构建指南

## 🚀 一键构建和安装

```bash
# 从源码一键构建并安装
./scripts/build-and-install.sh
```

**就这么简单！** 脚本会自动：
1. 构建 Server 二进制（包含 Web UI）
2. 编译 Swift 代码
3. 创建 .app bundle
4. 安装到 /Applications

完成后直接运行：
```bash
open -a 'MD Viewer'
```

---

## 📦 分步构建

如果需要更细粒度的控制：

### 1. 构建 Server 二进制

```bash
./scripts/build-server-for-xcode.sh
```

**输出：** `MDViewer/Resources/mdv-server` (Universal Binary, ~30MB)

### 2. 构建 App Bundle

```bash
# 构建并创建 DMG
./scripts/build/build_app_bundle.sh

# 或者：快速构建并安装（跳过 DMG）
./scripts/build/build_app_bundle.sh --install --skip-dmg

# 或者：使用 ad-hoc 签名（无需开发者账号）
./scripts/build/build_app_bundle.sh --ad-hoc
```

**输出：**
- `dist/MD Viewer.app` - 应用程序
- `dist/MD-Viewer-1.0.0.dmg` - 安装包（可选）

---

## 🛠️ 技术架构

### Swift Package Manager

项目使用 SPM 而非 Xcode 项目文件：

```swift
// Package.swift
Package(
    name: "MDViewer",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "MDViewer", targets: ["MDViewer"])
    ],
    targets: [
        .executableTarget(
            name: "MDViewer",
            path: "MDViewer",
            resources: [.copy("Resources/mdv-server")]
        )
    ]
)
```

**优点：**
- ✅ 无需 Xcode 项目文件（`.xcodeproj`）
- ✅ 纯命令行构建
- ✅ 更简洁的版本控制
- ✅ 脚本完全自动化

### 项目结构

```
md-viewer/
├── Package.swift                   # SPM 配置
├── MDViewer/                       # Swift 源码
│   ├── App/
│   │   ├── MDViewerApp.swift       # App 入口
│   │   ├── AppDelegate.swift       # 生命周期
│   │   └── ServerManager.swift     # Server 管理
│   ├── Views/                      # SwiftUI 视图
│   ├── Models/                     # 数据模型
│   ├── Utils/                      # 工具函数
│   └── Resources/
│       └── mdv-server              # Server 二进制（构建生成）
├── scripts/
│   ├── build-server-for-xcode.sh   # 构建 Server
│   ├── build-and-install.sh        # 一键构建安装
│   └── build/
│       ├── config.sh               # 构建配置
│       └── build_app_bundle.sh     # 构建 App Bundle
└── dist/                           # 构建输出
    ├── MD Viewer.app
    └── MD-Viewer-1.0.0.dmg
```

---

## 🔧 开发工作流

### 开发模式

```bash
# 1. 构建 Server（首次或 Server 代码改变时）
./scripts/build-server-for-xcode.sh

# 2. 运行 Swift 代码（快速迭代）
swift run

# 或者在 Xcode 中打开（可选）
open Package.swift
# 然后按 ⌘R 运行
```

### 测试构建

```bash
# 快速构建并安装（跳过 DMG）
./scripts/build/build_app_bundle.sh --install --skip-dmg

# 运行
open -a 'MD Viewer'
```

### 发布构建

```bash
# 完整构建（包含 DMG）
./scripts/build/build_app_bundle.sh

# 输出：
# - dist/MD Viewer.app
# - dist/MD-Viewer-1.0.0.dmg
```

---

## 📋 系统要求

- **macOS:** 13.0 (Ventura) 或更高
- **Xcode:** 14.0+ （仅需 Command Line Tools）
- **Swift:** 6.0+
- **Bun:** 最新版本（用于构建 Server）

### 安装依赖

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Bun（如果还没有）
curl -fsSL https://bun.sh/install | bash

# 验证
swift --version
bun --version
```

---

## 🐛 故障排除

### 问题 1: 找不到 mdv-server

```bash
# 解决：重新构建 Server
./scripts/build-server-for-xcode.sh
```

### 问题 2: Swift 编译失败

```bash
# 清理构建缓存
rm -rf .build

# 重新构建
swift build -c release
```

### 问题 3: 代码签名失败

```bash
# 使用 ad-hoc 签名（无需开发者账号）
./scripts/build/build_app_bundle.sh --ad-hoc
```

### 问题 4: App 无法启动

```bash
# 检查日志
tail -f ~/.config/md-viewer/server.log

# 手动测试 Server
./MDViewer/Resources/mdv-server --internal-server-mode
```

---

## 📊 构建产物

### App Bundle 结构

```
MD Viewer.app/
├── Contents/
│   ├── MacOS/
│   │   └── MD Viewer              # Swift 可执行文件
│   ├── Resources/
│   │   ├── mdv-server             # Server 二进制（内嵌 Web UI）
│   │   └── AppIcon.icns           # 图标（可选）
│   └── Info.plist                 # App 配置
```

### 大小

- **MD Viewer.app:** ~32 MB
- **MD-Viewer-1.0.0.dmg:** ~18 MB（压缩后）

---

## 🚢 发布流程

### 1. 构建发布版本

```bash
# 完整构建
./scripts/build/build_app_bundle.sh
```

### 2. 测试

```bash
# 安装并测试
./scripts/build/build_app_bundle.sh --install
open -a 'MD Viewer'
```

### 3. 发布到 GitHub Releases

```bash
# 创建 Release
gh release create v1.0.0 \
  --title "MD Viewer 1.0.0" \
  --notes "首次发布 SwiftUI Native App"

# 上传 DMG
gh release upload v1.0.0 dist/MD-Viewer-1.0.0.dmg
```

### 4. Homebrew Cask

```ruby
# Formula/md-viewer-app.rb
cask "md-viewer-app" do
  version "1.0.0"
  sha256 "..."  # shasum -a 256 dist/MD-Viewer-1.0.0.dmg

  url "https://github.com/huanghao/md-viewer/releases/download/v#{version}/MD-Viewer-#{version}.dmg"
  name "MD Viewer"
  desc "Markdown viewer - Native macOS App"
  homepage "https://github.com/huanghao/md-viewer"

  app "MD Viewer.app"

  zap trash: [
    "~/.config/md-viewer",
    "~/.local/share/md-viewer"
  ]
end
```

---

## 💡 与 CLI 版本对比

| 特性 | CLI 版本 | SwiftUI App |
|------|---------|-------------|
| 构建方式 | Bun compile | Swift Package Manager |
| 启动方式 | `mdv server start` | 双击 App |
| 端口 | 3000 | 53000 |
| 状态栏 | ❌ | ✅ |
| 包体积 | ~30MB | ~32MB |
| 内存占用 | ~200MB | ~140MB |
| 启动速度 | ~2-3秒 | ~1-1.5秒 |

---

## 🎯 核心特性

- ✅ **纯脚本构建** - 无需手动操作 Xcode
- ✅ **Swift Package Manager** - 无需 .xcodeproj 文件
- ✅ **一键安装** - `./scripts/build-and-install.sh`
- ✅ **自动签名** - 自动检测开发者证书或使用 ad-hoc
- ✅ **Universal Binary** - 支持 Intel 和 Apple Silicon
- ✅ **完全自动化** - 适合 CI/CD

---

## 📚 参考

- [Swift Package Manager 文档](https://swift.org/package-manager/)
- [App Bundle 结构](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html)
- [Code Signing](https://developer.apple.com/support/code-signing/)

---

需要帮助？
- 查看日志：`~/.config/md-viewer/server.log`
- 提交 Issue：https://github.com/huanghao/md-viewer/issues
