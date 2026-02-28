import { styles } from "./css.ts";
import { readFileSync } from "fs";
import { join } from "path";

// 判断是否为开发模式
const isDev = process.env.NODE_ENV !== 'production';

// 生产模式：启动时读取一次并缓存
let cachedClientScript: string | null = null;

function loadClientScript(): string {
  try {
    return readFileSync(join(process.cwd(), "dist/client.js"), "utf-8");
  } catch (e) {
    console.error("❌ 无法读取客户端脚本，请先运行: bun run build:client");
    process.exit(1);
  }
}

// 生产模式下预加载
if (!isDev) {
  cachedClientScript = loadClientScript();
}

// 获取客户端脚本
function getClientScript(): string {
  if (isDev) {
    // 开发模式：每次动态读取，支持热更新
    return loadClientScript();
  } else {
    // 生产模式：使用缓存，提升性能
    return cachedClientScript!;
  }
}

export function generateClientHTML(): string {
  const clientScript = getClientScript();
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Viewer - Markdown Viewer</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <style>${styles}</style>
</head>
<body>
  <div class="app">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>
          <svg class="logo-icon" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#3b82f6"/>
            <path d="M 9 11 L 9 21 L 11 21 L 11 14.5 L 16 19.5 L 21 14.5 L 21 21 L 23 21 L 23 11 L 16 18.5 Z" fill="white"/>
          </svg>
          MD Viewer
        </h1>
        <!-- 搜索框 -->
        <div id="searchBox"></div>
        <!-- 当前文件路径 -->
        <div id="currentPath"></div>
      </div>

      <!-- 添加文件区域 -->
      <div class="add-file-section">
        <div class="add-file-title">
          <span>➕</span>
          <span>添加文件</span>
        </div>
        <input
          type="text"
          class="add-file-input"
          id="fileInput"
          placeholder="输入文件路径并回车"
          onkeypress="if(event.key==='Enter')addFile()"
        />
        <div class="add-file-hint">或拖拽 Markdown 文件到窗口</div>
      </div>

      <div class="file-list" id="fileList">
        <div class="empty-tip">暂无文件</div>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="main">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="breadcrumb" id="breadcrumb"></div>
        <div class="spacer"></div>
        <button class="settings-button" onclick="showSettingsDialog()" title="设置">⚙️</button>
        <button class="refresh-button" id="refreshButton" onclick="handleRefreshButtonClick()" style="display: none;" title="刷新文件">
          <span>🔄 刷新</span>
        </button>
        <button class="sync-button" id="syncButton" onclick="handleSyncButtonClick()">
          <span id="syncButtonText">🔄 同步</span>
        </button>
        <span class="file-meta" id="fileMeta">最后修改: -</span>
      </div>

      <!-- 标签页 -->
      <div class="tabs" id="tabs"></div>

      <!-- 内容区 -->
      <div class="content" id="content">
        <div class="empty-state">
          <h2>欢迎使用 MD Viewer</h2>
          <p>在左侧添加 Markdown 文件开始阅读</p>
        </div>
      </div>
    </main>
  </div>

  <!-- 同步对话框 -->
  <div class="sync-dialog-overlay" id="syncDialogOverlay">
    <div class="sync-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title" id="syncDialogTitle">同步到学城</div>
        <button class="sync-dialog-close" onclick="closeSyncDialog()">×</button>
      </div>
      <div class="sync-dialog-body" id="syncDialogBody">
        <!-- 动态内容 -->
      </div>
    </div>
  </div>

  <script>${clientScript}<\/script>
</body>
</html>`;
}
