# macOS App 打包方案设计

## 背景

当前 MD Viewer 是一个 CLI 工具 + Web Server 架构，用户需要：
1. 手动启动 `mdv server start --daemon`
2. 使用 `mdv <file>` 打开文件
3. 在浏览器中查看

为了提供更好的用户体验，需要将其打包成 macOS App，提供：
- 状态栏图标（MenuBar App）
- 独立窗口
- 自动启动服务
- 文件关联

## 技术方案对比

### 方案 1：Electron App（推荐）

**架构：**
```
MD Viewer.app/
├── Contents/
│   ├── MacOS/
│   │   └── MD Viewer（Electron 主进程）
│   ├── Resources/
│   │   ├── app.asar（前端代码）
│   │   └── bin/
│   │       └── mdv（内嵌的 Server 二进制）
│   └── Info.plist
```

**优点：**
- ✅ 开发成本低，复用现有 Web UI
- ✅ 跨平台（未来可支持 Windows/Linux）
- ✅ 生态成熟（electron-builder、electron-updater）
- ✅ 支持状态栏、窗口管理、文件关联

**缺点：**
- ❌ 包体积较大（~50MB，主要是 Chromium）
- ❌ 内存占用相对较高

**包体积估算：**
- Electron 基础：~45MB
- mdv 二进制：~30MB（bun compile）
- Web 资源：~1MB
- 总计：~76MB（压缩后 .dmg 约 40MB）

### 方案 2：Tauri App

**优点：**
- ✅ 包体积小（~10MB）
- ✅ 性能好，使用系统 WebView

**缺点：**
- ❌ 需要 Rust 基础
- ❌ 生态不如 Electron 成熟
- ❌ 系统 WebView 兼容性问题

### 方案 3：SwiftUI Native App

**优点：**
- ✅ 100% 原生体验
- ✅ 包体积最小

**缺点：**
- ❌ 需要用 Swift 重写 UI
- ❌ 开发周期长
- ❌ 不跨平台

### 方案 4：保持 CLI + LaunchAgent

**优点：**
- ✅ 无需改动代码
- ✅ 保持轻量

**缺点：**
- ❌ 用户体验不够友好
- ❌ 需要手动配置

## 推荐方案：Electron App

### 核心功能设计

#### 1. 状态栏（Tray）

**菜单结构：**
```
┌─────────────────────────────┐
│ 📄 打开文件...       ⌘O     │
│ ─────────────────────────── │
│ 📋 最近文件          ▶      │
│   ├─ README.md              │
│   ├─ notes.md               │
│   └─ 清空历史               │
│ ─────────────────────────── │
│ 🟢 服务状态: 运行中         │
│ 🔄 重启服务                 │
│ ─────────────────────────── │
│ ⚙️  偏好设置...             │
│ 📊 运维统计...              │
│ ─────────────────────────── │
│ ❌ 退出 MD Viewer           │
└─────────────────────────────┘
```

**状态指示：**
- 🟢 绿色：服务运行中
- 🔴 红色：服务已停止
- 🟡 黄色：服务启动中

#### 2. 主窗口

**特性：**
- 无边框窗口（Frameless）+ 自定义标题栏
- 或使用标准窗口 + 原生标题栏
- 嵌入 `http://localhost:3000`
- 支持多标签（复用 Web UI 的标签功能）
- 窗口大小、位置自动保存

**快捷键：**
- `Cmd+O`：打开文件
- `Cmd+W`：关闭当前标签
- `Cmd+T`：新建标签
- `Cmd+R`：刷新当前文件
- `Cmd+,`：打开偏好设置
- `Cmd+Q`：退出应用

#### 3. 服务管理

**启动流程：**
```typescript
// 1. App 启动时
app.on('ready', async () => {
  // 检查端口是否被占用
  const port = await findAvailablePort(3000);

  // 启动内嵌的 mdv server
  const serverProcess = spawn(mdvBinaryPath, ['--internal-server-mode'], {
    env: { PORT: port }
  });

  // 等待服务就绪
  await waitForServer(`http://localhost:${port}`);

  // 创建状态栏和窗口
  createTray();
  createWindow(`http://localhost:${port}`);
});

// 2. App 退出时
app.on('before-quit', () => {
  // 优雅关闭服务
  serverProcess.kill('SIGTERM');
});
```

**端口冲突处理：**
- 默认尝试 3000
- 如果被占用，自动尝试 3001-3010
- 保存实际使用的端口到配置文件

#### 4. 文件关联

**注册文件类型：**
```json
// package.json
{
  "build": {
    "fileAssociations": [
      {
        "ext": "md",
        "name": "Markdown",
        "role": "Editor",
        "icon": "icons/markdown.icns"
      },
      {
        "ext": "markdown",
        "name": "Markdown",
        "role": "Editor"
      }
    ]
  }
}
```

**处理文件打开：**
```typescript
// 双击 .md 文件打开
app.on('open-file', async (event, path) => {
  event.preventDefault();
  await openFileInApp(path);
});

// 拖拽文件到 Dock 图标
app.on('open-file', async (event, path) => {
  event.preventDefault();
  await openFileInApp(path);
});
```

#### 5. 偏好设置

**设置项：**
- 服务端口（默认 3000）
- 开机自启动
- 主题（跟随系统/亮色/暗色）
- 默认窗口大小
- 最近文件数量限制
- 同步设置（学城相关）

**UI：**
- 独立的设置窗口
- 或在 Web UI 中增加设置页面

### 技术实现细节

#### 1. 项目结构

```
md-viewer/
├── electron/                   # Electron 代码
│   ├── main.ts                 # 主进程
│   ├── preload.ts              # 预加载脚本
│   ├── tray.ts                 # 状态栏管理
│   ├── server-manager.ts       # 服务管理
│   ├── file-handler.ts         # 文件关联处理
│   └── settings.ts             # 设置管理
├── src/                        # 现有代码
│   ├── client/                 # Web UI
│   ├── server.ts               # Server
│   └── cli.ts                  # CLI
├── scripts/
│   ├── build-electron.sh       # Electron 构建脚本
│   └── package-electron.sh     # 打包脚本
└── package.json
```

#### 2. 依赖安装

```bash
# Electron 相关
bun add -D electron electron-builder

# 工具库
bun add -D concurrently wait-on

# 类型定义
bun add -D @types/electron
```

#### 3. package.json 配置

```json
{
  "name": "md-viewer",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"bun run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "electron-builder",
    "electron:pack": "electron-builder --dir"
  },
  "build": {
    "appId": "com.huanghao.md-viewer",
    "productName": "MD Viewer",
    "directories": {
      "output": "release"
    },
    "files": [
      "electron/**/*",
      "dist/**/*"
    ],
    "extraResources": [
      {
        "from": "dist/mdv",
        "to": "bin/mdv"
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        {
          "target": "dmg",
          "arch": ["arm64", "x64"]
        }
      ],
      "icon": "assets/icon.icns"
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

#### 4. 主进程代码示例

```typescript
// electron/main.ts
import { app, BrowserWindow, Tray, Menu, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { findAvailablePort, waitForServer } from './utils';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort: number = 3000;

// 获取内嵌的 mdv 二进制路径
function getMdvBinaryPath(): string {
  if (app.isPackaged) {
    // 生产环境：从 app.asar.unpacked 中获取
    return path.join(process.resourcesPath, 'bin', 'mdv');
  } else {
    // 开发环境：使用项目中的构建产物
    return path.join(__dirname, '../dist/mdv');
  }
}

// 启动服务
async function startServer(): Promise<void> {
  const mdvPath = getMdvBinaryPath();
  serverPort = await findAvailablePort(3000);

  serverProcess = spawn(mdvPath, ['--internal-server-mode'], {
    env: {
      ...process.env,
      PORT: String(serverPort),
      HOST: 'localhost'
    }
  });

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[Server] ${data}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server Error] ${data}`);
  });

  // 等待服务就绪
  await waitForServer(`http://localhost:${serverPort}`);
}

// 停止服务
function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

// 创建主窗口
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'default', // 或 'hidden' 自定义标题栏
    show: false // 先隐藏，加载完成后显示
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建状态栏
function createTray(): void {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开文件...',
      accelerator: 'CmdOrCtrl+O',
      click: async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
          ]
        });
        if (!result.canceled && result.filePaths.length > 0) {
          // TODO: 调用 API 打开文件
        }
      }
    },
    { type: 'separator' },
    {
      label: '服务状态: 运行中',
      enabled: false
    },
    {
      label: '重启服务',
      click: async () => {
        stopServer();
        await startServer();
        mainWindow?.reload();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('MD Viewer');
}

// App 生命周期
app.on('ready', async () => {
  try {
    await startServer();
    createTray();
    createWindow();
  } catch (error) {
    console.error('Failed to start app:', error);
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

app.on('window-all-closed', () => {
  // macOS 上保持应用运行（状态栏常驻）
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 处理文件打开（文件关联）
app.on('open-file', async (event, filePath) => {
  event.preventDefault();
  // TODO: 调用 API 打开文件
  console.log('Open file:', filePath);
});
```

#### 5. 工具函数

```typescript
// electron/utils.ts
import net from 'net';

export async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 10; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error('No available port found');
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

export async function waitForServer(url: string, timeout = 10000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // 继续等待
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server failed to start');
}
```

### 构建与发布

#### 1. 本地构建

```bash
# 1. 构建 Server 二进制
./scripts/build-all.sh 1.0.0

# 2. 构建 Electron App
bun run electron:build

# 输出：
# release/
# ├── MD Viewer-1.0.0-arm64.dmg
# └── MD Viewer-1.0.0-x64.dmg
```

#### 2. 自动构建（GitHub Actions）

```yaml
# .github/workflows/build-electron.yml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build Server
        run: ./scripts/build-all.sh ${{ github.ref_name }}

      - name: Build Electron App
        run: bun run electron:build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: MD Viewer
          path: release/*.dmg
```

#### 3. 代码签名（可选）

```bash
# 申请 Apple Developer 账号
# 创建 Developer ID Application 证书

# electron-builder 自动签名
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
bun run electron:build
```

#### 4. 公证（Notarization）

```json
// package.json
{
  "build": {
    "mac": {
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "entitlements.mac.plist",
      "entitlementsInherit": "entitlements.mac.plist"
    },
    "afterSign": "scripts/notarize.js"
  }
}
```

#### 5. 分发方式

**方式 1：直接下载 .dmg**
- 托管在 GitHub Releases
- 用户下载后拖拽到 Applications

**方式 2：Homebrew Cask**
```ruby
# Formula/md-viewer.rb
cask "md-viewer" do
  version "1.0.0"
  sha256 "..."

  url "https://github.com/huanghao/md-viewer/releases/download/v#{version}/MD-Viewer-#{version}-arm64.dmg"
  name "MD Viewer"
  desc "Markdown viewer with live reload"
  homepage "https://github.com/huanghao/md-viewer"

  app "MD Viewer.app"

  zap trash: [
    "~/Library/Application Support/md-viewer",
    "~/Library/Preferences/com.huanghao.md-viewer.plist"
  ]
end
```

**方式 3：App Store（需要额外工作）**
- 需要 Mac App Store 证书
- 需要沙盒化（Sandboxing）
- 需要审核

### 自动更新

```typescript
// electron/main.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: '新版本可用，是否立即下载？',
    buttons: ['下载', '稍后']
  });
});
```

### 数据迁移

**从 CLI 版本迁移到 App 版本：**
```typescript
// 检测现有配置
const cliConfigPath = '~/.config/md-viewer/config.json';
const appConfigPath = '~/Library/Application Support/md-viewer/config.json';

if (existsSync(cliConfigPath) && !existsSync(appConfigPath)) {
  // 复制配置
  copyFileSync(cliConfigPath, appConfigPath);

  // 提示用户
  dialog.showMessageBox({
    type: 'info',
    message: '已导入现有配置',
    detail: '检测到 CLI 版本的配置，已自动导入到 App 版本。'
  });
}
```

## 需要考虑的其他问题

### 1. 性能优化

- **窗口预加载**：App 启动时预创建隐藏窗口，打开文件时直接显示
- **增量更新**：使用 electron-updater 的 differential 更新
- **内存管理**：限制最近文件数量，避免内存泄漏

### 2. 安全性

- **内容安全策略（CSP）**：限制 Web UI 的脚本执行
- **上下文隔离**：启用 `contextIsolation`
- **禁用 Node 集成**：`nodeIntegration: false`
- **预加载脚本**：使用 `contextBridge` 暴露安全的 API

### 3. 用户体验

- **首次启动引导**：介绍核心功能
- **快捷键提示**：在菜单中显示快捷键
- **错误处理**：友好的错误提示（服务启动失败、端口被占用等）
- **加载状态**：显示服务启动进度

### 4. 多语言支持

- 使用 i18n 库
- 支持中文、英文
- 跟随系统语言

### 5. 与 CLI 版本共存

- App 版本和 CLI 版本共享配置和数据
- 配置文件路径统一：`~/.config/md-viewer/`
- 数据库路径统一：`~/.local/share/md-viewer/`

### 6. 测试

- **单元测试**：测试核心逻辑
- **E2E 测试**：使用 Spectron（Electron 测试框架）
- **手动测试清单**：
  - ✅ 文件打开
  - ✅ 状态栏菜单
  - ✅ 快捷键
  - ✅ 文件关联
  - ✅ 服务重启
  - ✅ 自动更新

## 实施时间表

### Phase 1: 基础功能（1-2 周）
- [ ] 搭建 Electron 项目结构
- [ ] 实现服务启动/停止管理
- [ ] 创建主窗口和状态栏
- [ ] 基础菜单和快捷键

### Phase 2: 增强功能（1 周）
- [ ] 文件关联
- [ ] 偏好设置
- [ ] 最近文件列表
- [ ] 拖拽文件支持

### Phase 3: 打包发布（1 周）
- [ ] 配置 electron-builder
- [ ] 构建 .dmg
- [ ] 代码签名和公证
- [ ] 配置自动更新

### Phase 4: 优化完善（持续）
- [ ] 性能优化
- [ ] 用户反馈收集
- [ ] Bug 修复
- [ ] 文档完善

## 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)
- [Electron Forge](https://www.electronforge.io/)

## 总结

通过 Electron 打包，可以将 MD Viewer 从 CLI 工具升级为一个功能完整的 macOS App，提供：
- ✅ 原生 macOS 体验
- ✅ 状态栏常驻
- ✅ 自动服务管理
- ✅ 文件关联
- ✅ 自动更新

同时保持：
- ✅ 现有代码复用
- ✅ CLI 版本兼容
- ✅ 数据共享

这是一个平衡开发成本和用户体验的最佳方案。
