# MD Viewer - Native macOS App

原生 macOS 应用版本，使用 SwiftUI 构建，提供极致的性能和用户体验。

## 🚀 一键构建和安装

```bash
# 从源码构建并安装到 /Applications
./scripts/build-and-install.sh
```

**就这么简单！** 脚本会自动完成所有工作。

完成后启动：
```bash
open -a 'MD Viewer'
```

---

## ✨ 特性

- ✅ **100% 原生体验** - 纯 SwiftUI，无 Electron
- ✅ **状态栏常驻** - 随时可用，不占 Dock
- ✅ **自动服务管理** - App 启动即启动 Server
- ✅ **智能端口选择** - 自动扫描 53000-53099
- ✅ **极致性能** - 内存 ~140MB，启动 <1.5秒
- ✅ **小巧体积** - 仅 ~32MB
- ✅ **与 CLI 兼容** - 数据和配置共享

---

## 📦 系统要求

- **macOS:** 13.0 (Ventura) 或更高
- **架构:** Apple Silicon (M1/M2/M3) 或 Intel

---

## 🛠️ 从源码构建

### 准备工作

```bash
# 安装 Xcode Command Line Tools（如果还没有）
xcode-select --install

# 安装 Bun（用于构建 Server）
curl -fsSL https://bun.sh/install | bash
```

### 构建

```bash
# 克隆仓库
git clone https://github.com/huanghao/md-viewer.git
cd md-viewer

# 安装依赖
bun install

# 一键构建并安装
./scripts/build-and-install.sh
```

### 手动构建（可选）

如果需要更细粒度的控制：

```bash
# 1. 构建 Server 二进制
./scripts/build-server-for-xcode.sh

# 2. 构建 App（带 DMG）
./scripts/build/build_app_bundle.sh

# 或者：快速构建并安装（跳过 DMG）
./scripts/build/build_app_bundle.sh --install --skip-dmg

# 或者：使用 ad-hoc 签名（无需开发者账号）
./scripts/build/build_app_bundle.sh --ad-hoc
```

---

## 📖 使用方法

### 基础操作

1. **启动 App**
   - 双击 `MD Viewer.app`
   - 或命令行：`open -a 'MD Viewer'`

2. **打开文件**
   - 点击状态栏图标 → "打开文件..."
   - 或拖拽 `.md` 文件到 Dock 图标

3. **查看主窗口**
   - 点击状态栏图标 → "显示主窗口"
   - 或按快捷键 `⌘O`

### 状态栏菜单

```
┌─────────────────────────────┐
│ 🟢 运行中 (端口 53000)      │
│ ─────────────────────────── │
│ 📄 打开文件...       ⌘O     │
│ 🪟 显示主窗口               │
│ 🔄 重启服务                 │
│ ─────────────────────────── │
│ ⚙️  偏好设置...      ⌘,     │
│ 📊 查看日志                 │
│ ❓ 关于 MD Viewer           │
│ ─────────────────────────── │
│ ❌ 退出              ⌘Q     │
└─────────────────────────────┘
```

### 快捷键

- `⌘O` - 打开文件
- `⌘W` - 关闭当前标签
- `⌘,` - 打开偏好设置
- `⌘Q` - 退出应用

---

## 🏗️ 技术架构

### Swift Package Manager

项目使用 SPM 而非 Xcode 项目文件：

```
md-viewer/
├── Package.swift               # SPM 配置
├── MDViewer/                   # Swift 源码
│   ├── App/                    # 应用核心
│   ├── Views/                  # SwiftUI 视图
│   ├── Models/                 # 数据模型
│   ├── Utils/                  # 工具函数
│   └── Resources/
│       └── mdv-server          # Server 二进制（内嵌 Web UI）
└── scripts/
    ├── build-server-for-xcode.sh
    ├── build-and-install.sh
    └── build/
        ├── config.sh
        └── build_app_bundle.sh
```

### 核心组件

1. **ServerManager** - 管理 Server 生命周期
   - 自动查找可用端口（53000-53099）
   - 健康检查和自动重启
   - 日志管理

2. **MenuBarView** - 状态栏界面
   - 显示服务状态
   - 快速操作菜单

3. **MainWindow** - 主窗口
   - WKWebView 加载 Web UI
   - 完整的 Markdown 查看功能

4. **mdv-server** - 内嵌 Server
   - Bun 编译的独立二进制
   - 包含完整 Web UI（~214KB）
   - 端口 53000（默认）

---

## 📊 性能指标

| 指标 | 数值 |
|------|------|
| App 大小 | ~32 MB |
| DMG 大小 | ~18 MB |
| 内存占用 | ~140 MB |
| 启动速度 | ~1-1.5 秒 |
| CPU 占用（空闲） | <1% |
| 默认端口 | 53000 |

---

## 🔧 配置

### 配置文件

```bash
~/.config/md-viewer/
├── app-config.json     # App 配置（端口、启动选项）
├── config.json         # Server 配置（与 CLI 共享）
└── server.log          # Server 日志
```

### 偏好设置

在 App 中：`状态栏图标 → 偏好设置...`

- **默认端口** - 修改 Server 端口（需重启）
- **开机自启动** - 自动启动 App
- **显示 Dock 图标** - 在 Dock 中显示图标

---

## 🐛 故障排除

### Server 无法启动

```bash
# 查看日志
tail -f ~/.config/md-viewer/server.log

# 检查端口占用
lsof -i :53000

# 手动测试 Server
./MDViewer/Resources/mdv-server --internal-server-mode
```

### App 无法打开

```bash
# 右键点击 App → 打开
# 或在系统设置中允许

# 如果是权限问题
xattr -cr /Applications/MD\ Viewer.app
```

### 重新构建

```bash
# 清理缓存
rm -rf .build dist

# 重新构建
./scripts/build-and-install.sh
```

---

## 🚢 发布

### 构建发布版本

```bash
# 完整构建（包含 DMG）
./scripts/build/build_app_bundle.sh

# 输出：
# - dist/MD Viewer.app
# - dist/MD-Viewer-1.0.0.dmg
```

### 发布到 GitHub Releases

```bash
gh release create v1.0.0 \
  --title "MD Viewer 1.0.0" \
  --notes "首次发布 SwiftUI Native App"

gh release upload v1.0.0 dist/MD-Viewer-1.0.0.dmg
```

### Homebrew Cask

```bash
brew install huanghao/tap/md-viewer-app
```

---

## 📚 文档

- [构建指南](BUILD_SWIFTUI.md) - 详细的构建说明
- [实施指南](docs/SWIFTUI_IMPLEMENTATION_GUIDE.md) - 完整的实施步骤
- [设计文档](docs/design/20260316-swiftui-implementation-plan.md) - 技术设计

---

## 🆚 与 CLI 版本对比

| 特性 | CLI 版本 | SwiftUI App |
|------|---------|-------------|
| 启动方式 | `mdv server start` | 双击 App |
| 端口 | 3000 | 53000 |
| 状态栏 | ❌ | ✅ |
| 自动启动 | 手动配置 | 设置中开关 |
| 包体积 | ~30MB | ~32MB |
| 内存占用 | ~200MB | ~140MB |
| 启动速度 | ~2-3秒 | ~1-1.5秒 |
| 用户体验 | 90% 原生 | 100% 原生 |

**两者可以共存：**
- CLI Server: `http://localhost:3000`
- App Server: `http://127.0.0.1:53000`
- 配置和数据共享

---

## 🤝 贡献

欢迎贡献代码！

```bash
# Fork 并克隆仓库
git clone https://github.com/your-username/md-viewer.git

# 创建分支
git checkout -b feature/your-feature

# 提交代码
git commit -am "Add your feature"
git push origin feature/your-feature

# 创建 Pull Request
```

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢

- [Bun](https://bun.sh) - JavaScript 运行时
- [Hono](https://hono.dev) - Web 框架
- [Marked](https://marked.js.org) - Markdown 解析器
- [highlight.js](https://highlightjs.org) - 代码高亮

---

**需要帮助？**
- 查看日志：`~/.config/md-viewer/server.log`
- 提交 Issue：https://github.com/huanghao/md-viewer/issues
- 讨论区：https://github.com/huanghao/md-viewer/discussions
