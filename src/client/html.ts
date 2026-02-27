import { styles } from "./css.ts";
import { readFileSync } from "fs";
import { join } from "path";

// 读取打包后的客户端脚本
let clientScript: string;
try {
  clientScript = readFileSync(join(process.cwd(), "dist/client.js"), "utf-8");
} catch (e) {
  console.error("❌ 无法读取客户端脚本，请先运行: bun run build:client");
  process.exit(1);
}

export function generateClientHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Viewer - Markdown Viewer</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
          <svg class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          MD Viewer
        </h1>
        <!-- 搜索框 -->
        <div id="searchBox"></div>
        <!-- 当前文件路径 -->
        <div id="currentPath"></div>
        <div class="add-file">
          <input type="text" id="fileInput" placeholder="输入文件路径..."
                 onkeypress="if(event.key==='Enter')addFile()">
          <button onclick="addFile()">添加</button>
        </div>
      </div>
      <div class="file-list" id="fileList">
        <div class="empty-tip">点击上方添加 Markdown 文件<br>或拖拽文件到窗口</div>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="main">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="breadcrumb" id="breadcrumb"></div>
        <div class="spacer"></div>
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
