# MD Viewer - SwiftUI Native App

原生 macOS 应用版本，提供更好的性能和用户体验。

## 快速开始

### 从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/huanghao/md-viewer.git
cd md-viewer

# 2. 安装依赖
bun install

# 3. 构建 Server 二进制
./scripts/build-server-for-xcode.sh

# 4. 打开 Xcode 项目
open MDViewer.xcodeproj

# 5. 在 Xcode 中按 ⌘R 运行
```

### 从 Release 下载

```bash
# 下载 .dmg 文件
# 双击安装
# 拖拽到 Applications 文件夹
```

## 特性

- ✅ **原生 macOS 体验** - 100% SwiftUI
- ✅ **状态栏常驻** - 随时可用
- ✅ **自动服务管理** - 无需手动启动
- ✅ **智能端口选择** - 自动避免冲突（53000-53099）
- ✅ **极致性能** - 内存占用 ~140MB，启动 <1.5秒
- ✅ **小巧体积** - 仅 ~32MB
- ✅ **与 CLI 版本兼容** - 数据共享

## 系统要求

- macOS 13.0 (Ventura) 或更高
- Apple Silicon (M1/M2/M3) 或 Intel

## 架构

```
MD Viewer.app
├── 状态栏图标（常驻）
│   ├── 打开文件
│   ├── 显示主窗口
│   ├── 重启服务
│   └── 偏好设置
├── 主窗口（WKWebView）
│   └── 加载 http://127.0.0.1:53000
└── 内嵌 Server（子进程）
    ├── mdv-server 二进制
    └── 包含完整 Web UI
```

## 开发

详见 [SWIFTUI_IMPLEMENTATION_GUIDE.md](docs/SWIFTUI_IMPLEMENTATION_GUIDE.md)

## 与 CLI 版本对比

| 特性 | CLI 版本 | SwiftUI App |
|------|---------|-------------|
| 启动方式 | `mdv server start` | 双击 App |
| 端口 | 3000 | 53000 |
| 状态栏 | ❌ | ✅ |
| 开机自启动 | 手动配置 | 设置中开关 |
| 包体积 | ~30MB | ~32MB |
| 内存占用 | ~200MB | ~140MB |
| 启动速度 | ~2-3秒 | ~1-1.5秒 |

## License

MIT
