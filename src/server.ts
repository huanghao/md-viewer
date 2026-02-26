#!/usr/bin/env bun
/**
 * MDV Server - Markdown Viewer Server
 * 维护文件监听列表，管理多个客户端，支持动态添加/移除监听
 */

import { Hono } from "hono";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { readFileSync, watch, existsSync, statSync, readdirSync } from "fs";
import { resolve, basename, dirname, relative } from "path";
import { serve, type ServerWebSocket } from "bun";

// ==================== 类型定义 ====================

interface Client {
  ws: ServerWebSocket<unknown>;
  watchingFiles: Set<string>; // 当前客户端正在查看的文件
}

interface WatchedFile {
  path: string;
  watchers: Set<ServerWebSocket<unknown>>; // 哪些客户端在关注此文件
  lastContent?: string;
  lastModified: number;
}

// ==================== 配置 ====================

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// ==================== 状态管理 ====================

const clients = new Map<ServerWebSocket<unknown>, Client>();
const watchList = new Map<string, WatchedFile>(); // path -> WatchedFile
const fileWatchers = new Map<string, ReturnType<typeof watch>>(); // path -> fs.watch handle

// ==================== 工具函数 ====================

function log(msg: string) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

function isMarkdown(path: string): boolean {
  return path.endsWith(".md") || path.endsWith(".markdown");
}

function readMarkdownFile(path: string): { content: string; error?: string } {
  try {
    if (!existsSync(path)) {
      return { content: "", error: `文件不存在: ${path}` };
    }
    const content = readFileSync(path, "utf-8");
    return { content };
  } catch (e) {
    return { content: "", error: `读取失败: ${e}` };
  }
}

function getLastModified(path: string): number | undefined {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return undefined;
  }
}

function getFileList(dir: string): string[] {
  try {
    const files = readdirSync(dir, { recursive: true }) as string[];
    return files
      .filter((f) => isMarkdown(f))
      .map((f) => resolve(dir, f))
      .sort();
  } catch {
    return [];
  }
}

// ==================== WebSocket 消息处理 ====================

function send(ws: ServerWebSocket<unknown>, type: string, data?: unknown) {
  try {
    ws.send(JSON.stringify({ type, data }));
  } catch {
    // 忽略已断开的连接
  }
}

function broadcast(type: string, data?: unknown, filter?: (client: Client) => boolean) {
  for (const [ws, client] of clients) {
    if (!filter || filter(client)) {
      send(ws, type, data);
    }
  }
}

// ==================== 文件监听管理 ====================

function addFileToWatchList(path: string, clientWs: ServerWebSocket<unknown>): boolean {
  const resolvedPath = resolve(path);

  if (!existsSync(resolvedPath)) {
    return false;
  }

  // 添加到全局监听列表
  if (!watchList.has(resolvedPath)) {
    const stats = statSync(resolvedPath);
    const { content } = readMarkdownFile(resolvedPath);

    watchList.set(resolvedPath, {
      path: resolvedPath,
      watchers: new Set(),
      lastContent: content,
      lastModified: stats.mtimeMs,
    });

    // 启动文件系统监听
    const watcher = watch(resolvedPath, (eventType) => {
      if (eventType === "change") {
        handleFileChange(resolvedPath);
      }
    });
    fileWatchers.set(resolvedPath, watcher);

    log(`📁 开始监听: ${basename(resolvedPath)}`);
  }

  // 关联到客户端
  const fileInfo = watchList.get(resolvedPath)!;
  fileInfo.watchers.add(clientWs);

  // 更新客户端状态
  const client = clients.get(clientWs);
  if (client) {
    client.watchingFiles.add(resolvedPath);
  }

  return true;
}

function removeFileFromWatchList(path: string, clientWs: ServerWebSocket<unknown>) {
  const resolvedPath = resolve(path);
  const fileInfo = watchList.get(resolvedPath);

  if (fileInfo) {
    fileInfo.watchers.delete(clientWs);

    // 如果没有客户端关注此文件，停止监听
    if (fileInfo.watchers.size === 0) {
      const watcher = fileWatchers.get(resolvedPath);
      if (watcher) {
        watcher.close();
        fileWatchers.delete(resolvedPath);
      }
      watchList.delete(resolvedPath);
      log(`🛑 停止监听: ${basename(resolvedPath)}`);
    }
  }

  const client = clients.get(clientWs);
  if (client) {
    client.watchingFiles.delete(resolvedPath);
  }
}

function handleFileChange(path: string) {
  const fileInfo = watchList.get(path);
  if (!fileInfo) return;

  const { content, error } = readMarkdownFile(path);
  if (error) return;
  const lastModified = getLastModified(path) ?? Date.now();

  // 检查内容是否真的变化了（避免触发器导致的假更新）
  if (content === fileInfo.lastContent) return;

  fileInfo.lastContent = content;
  fileInfo.lastModified = lastModified;

  log(`🔄 文件变化: ${basename(path)} (${fileInfo.watchers.size} 个客户端)`);

  // 通知所有关注此文件的客户端
  for (const ws of fileInfo.watchers) {
    send(ws, "file-updated", {
      path,
      filename: basename(path),
      content,
      lastModified,
    });
  }
}

// ==================== WebSocket 处理器 ====================

function handleMessage(ws: ServerWebSocket<unknown>, rawMessage: string) {
  let msg: { type: string; data?: unknown };
  try {
    msg = JSON.parse(rawMessage);
  } catch {
    return;
  }

  const client = clients.get(ws);
  if (!client) return;

  switch (msg.type) {
    case "watch": {
      const path = msg.data as string;
      if (addFileToWatchList(path, ws)) {
        const resolvedPath = resolve(path);
        const { content, error } = readMarkdownFile(resolvedPath);
        send(ws, "file-loaded", {
          path: resolvedPath,
          filename: basename(path),
          content: error ? undefined : content,
          lastModified: getLastModified(resolvedPath),
          error,
        });
      } else {
        send(ws, "error", { message: `无法监听文件: ${path}` });
      }
      break;
    }

    case "unwatch": {
      const path = msg.data as string;
      removeFileFromWatchList(path, ws);
      break;
    }

    case "get-file-list": {
      const dir = msg.data as string;
      const files = getFileList(resolve(dir));
      send(ws, "file-list", { files: files.map((f) => ({ path: f, name: basename(f) })) });
      break;
    }

    case "close-tab": {
      const path = msg.data as string;
      removeFileFromWatchList(path, ws);
      break;
    }
  }
}

// ==================== HTTP 服务 ====================

const app = new Hono();

// 前端页面
app.get("/", (c) => {
  return c.html(generateClientHTML());
});

// API: 获取文件内容（HTTP 备用方式）
app.get("/api/file", (c) => {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  const { content, error } = readMarkdownFile(resolve(path));
  if (error) return c.json({ error }, 404);

  return c.json({ content, path: resolve(path), filename: basename(path) });
});

// API: 获取目录下的 Markdown 文件列表
app.get("/api/files", (c) => {
  const dir = c.req.query("dir") || ".";
  const files = getFileList(resolve(dir));
  return c.json({ files: files.map((f) => ({ path: f, name: basename(f) })) });
});

// ==================== 前端 HTML 生成 ====================

function generateClientHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MDV - Markdown Viewer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      height: 100vh;
      overflow: hidden;
    }
    .app {
      display: flex;
      height: 100vh;
    }

    /* 左侧边栏 */
    .sidebar {
      width: 260px;
      background: #fff;
      border-right: 1px solid #e1e4e8;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e1e4e8;
    }
    .sidebar-header h1 {
      font-size: 16px;
      color: #24292e;
      margin-bottom: 12px;
    }
    .add-file {
      display: flex;
      gap: 8px;
    }
    .add-file input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 12px;
    }
    .add-file button {
      padding: 6px 12px;
      background: #2ea44f;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .add-file button:hover {
      background: #2c974b;
    }
    .file-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 4px;
      font-size: 13px;
      color: #24292e;
    }
    .file-item:hover {
      background: #f6f8fa;
    }
    .file-item.active {
      background: #ddf4ff;
      color: #0969da;
    }
    .file-item .icon {
      margin-right: 8px;
    }
    .file-item .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-item .close {
      opacity: 0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .file-item:hover .close {
      opacity: 1;
    }
    .file-item .close:hover {
      background: #ff4444;
      color: white;
    }
    .file-item.changed::after {
      content: "●";
      color: #ff6b6b;
      margin-left: 6px;
      font-size: 10px;
    }
    .empty-tip {
      padding: 20px;
      text-align: center;
      color: #6a737d;
      font-size: 13px;
    }

    /* 主内容区 */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* 工具栏 */
    .toolbar {
      height: 48px;
      background: #fff;
      border-bottom: 1px solid #e1e4e8;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .toolbar .spacer {
      flex: 1;
    }
    .file-meta {
      font-size: 12px;
      color: #586069;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #586069;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #28a745;
    }
    .status-dot.disconnected {
      background: #d73a49;
    }

    /* 标签页 */
    .tabs {
      display: flex;
      background: #f6f8fa;
      border-bottom: 1px solid #e1e4e8;
      overflow-x: auto;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f6f8fa;
      border-right: 1px solid #e1e4e8;
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
    }
    .tab:hover {
      background: #fff;
    }
    .tab.active {
      background: #fff;
      border-bottom: 2px solid #0969da;
      margin-bottom: -1px;
    }
    .tab.changed {
      font-style: italic;
    }
    .tab .close {
      opacity: 0.5;
      padding: 0 4px;
    }
    .tab .close:hover {
      opacity: 1;
      background: #ff4444;
      color: white;
      border-radius: 4px;
    }

    /* 内容区 */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .markdown-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .markdown-body {
      background: transparent !important;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6a737d;
    }
    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 12px;
      color: #24292e;
    }

    /* 加载遮罩 */
    .loading {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e1e4e8;
      border-top-color: #0969da;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>📚 MDV Viewer</h1>
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
        <div class="status">
          <span class="status-dot" id="statusDot"></span>
          <span id="statusText">连接中...</span>
        </div>
        <div class="spacer"></div>
        <span class="file-meta" id="fileMeta">最后修改: -</span>
      </div>

      <!-- 标签页 -->
      <div class="tabs" id="tabs"></div>

      <!-- 内容区 -->
      <div class="content" id="content">
        <div class="empty-state">
          <h2>欢迎使用 MDV</h2>
          <p>在左侧添加 Markdown 文件开始阅读</p>
        </div>
      </div>
    </main>
  </div>

  <script>
    // ==================== 状态管理 ====================
    const state = {
      ws: null,
      files: new Map(), // path -> { path, name, content, changed, active, lastModified }
      currentFile: null,
      reconnectTimer: null
    };

    // ==================== WebSocket ====================
    function connect() {
      const ws = new WebSocket(\`ws://\${location.host}/ws\`);

      ws.onopen = () => {
        console.log('WebSocket 已连接');
        updateStatus(true);
        // 重新订阅已打开的文件
        for (const [path, file] of state.files) {
          if (file.active) {
            send('watch', path);
          }
        }
      };

      ws.onclose = () => {
        console.log('WebSocket 已断开');
        updateStatus(false);
        // 5秒后重连
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onmessage = (e) => {
        const { type, data } = JSON.parse(e.data);
        handleMessage(type, data);
      };

      state.ws = ws;
    }

    function send(type, data) {
      if (state.ws?.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({ type, data }));
      }
    }

    function updateStatus(connected) {
      const dot = document.getElementById('statusDot');
      const text = document.getElementById('statusText');
      dot.classList.toggle('disconnected', !connected);
      text.textContent = connected ? '已连接' : '连接中...';
    }

    // ==================== 消息处理 ====================
    function handleMessage(type, data) {
      switch (type) {
        case 'file-loaded':
          onFileLoaded(data);
          break;
        case 'file-updated':
          onFileUpdated(data);
          break;
        case 'error':
          alert(data.message);
          break;
      }
    }

    function onFileLoaded(data) {
      console.log('onFileLoaded:', data);
      if (data.error) {
        alert(data.error);
        return;
      }

      state.files.set(data.path, {
        path: data.path,
        name: data.filename,
        content: data.content,
        changed: false,
        active: true,
        lastModified: data.lastModified
      });

      state.currentFile = data.path;
      console.log('Rendering files, tabs, content...');
      renderFiles();
      renderTabs();
      renderContent();
      console.log('Render complete');
    }

    function onFileUpdated(data) {
      const file = state.files.get(data.path);
      if (file) {
        file.content = data.content;
        file.lastModified = data.lastModified;
        if (file.active) {
          file.changed = false;
          renderContent();
        } else {
          file.changed = true;
          renderFiles();
          renderTabs();
        }
      } else {
        markChanged(data.path);
      }
    }

    function markChanged(path) {
      const file = state.files.get(path);
      if (file) {
        file.changed = true;
        renderFiles();
        renderTabs();
      }
    }

    // ==================== UI 渲染 ====================
    function escapeAttr(str) {
      return str ? str.replace(/'/g, "\\'") : '';
    }

    function renderFiles() {
      const container = document.getElementById('fileList');
      if (state.files.size === 0) {
        container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown 文件</div>';
        return;
      }

      container.innerHTML = Array.from(state.files.values())
        .map(file => \`
          <div class="file-item \${file.active ? 'active' : ''} \${file.changed ? 'changed' : ''}"
               onclick="switchFile('\${escapeAttr(file.path)}')">
            <span class="icon">📄</span>
            <span class="name">\${file.name}</span>
            <span class="close" onclick="event.stopPropagation();closeFile('\${escapeAttr(file.path)}')">×</span>
          </div>
        \`).join('');
    }

    function renderTabs() {
      const activeFiles = Array.from(state.files.values()).filter(f => f.active);
      const container = document.getElementById('tabs');

      if (activeFiles.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = activeFiles
        .map(file => \`
          <div class="tab \${file.path === state.currentFile ? 'active' : ''} \${file.changed ? 'changed' : ''}"
               onclick="switchFile('\${escapeAttr(file.path)}')">
            <span>\${file.name}\${file.changed ? ' *' : ''}</span>
            <span class="close" onclick="event.stopPropagation();closeFile('\${escapeAttr(file.path)}')">×</span>
          </div>
        \`).join('');
    }

    function renderContent() {
      const container = document.getElementById('content');
      const file = state.currentFile ? state.files.get(state.currentFile) : null;

      if (!file) {
        updateFileMeta(null);
        container.innerHTML = \`
          <div class="empty-state">
            <h2>欢迎使用 MDV</h2>
            <p>在左侧添加 Markdown 文件开始阅读</p>
          </div>
        \`;
        return;
      }

      try {
        const html = marked.parse(file.content || '');
        container.innerHTML = \`
          <div class="markdown-wrapper">
            <div class="markdown-body">\${html}</div>
          </div>
        \`;
      } catch (e) {
        container.innerHTML = \`
          <div class="empty-state">
            <h2>渲染错误</h2>
            <p>\${e.message}</p>
          </div>
        \`;
      }

      updateFileMeta(file.lastModified);
    }

    function updateFileMeta(lastModified) {
      const el = document.getElementById('fileMeta');
      if (!el) return;
      if (!lastModified) {
        el.textContent = '最后修改: -';
        return;
      }
      el.textContent = '最后修改: ' + new Date(lastModified).toLocaleString('zh-CN');
    }

    // ==================== 用户操作 ====================
    function addFile() {
      const input = document.getElementById('fileInput');
      const path = input.value.trim();
      if (!path) return;

      input.value = '';

      // 发送 watch 请求
      send('watch', path);
    }

    function switchFile(path) {
      state.currentFile = path;
      const file = state.files.get(path);
      if (file) {
        file.active = true;
      }
      renderFiles();
      renderTabs();
      renderContent();
    }

    function closeFile(path) {
      const file = state.files.get(path);
      if (file) {
        file.active = false;
        send('close-tab', path);
      }

      // 如果关闭的是当前文件，切换到其他文件
      if (state.currentFile === path) {
        const activeFiles = Array.from(state.files.values()).filter(f => f.active);
        state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
      }

      renderFiles();
      renderTabs();
      renderContent();
    }

    // ==================== 拖拽支持 ====================
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files) {
        for (const file of files) {
          if (file.name.endsWith('.md')) {
            send('watch', file.path);
          }
        }
      }
    });

    // ==================== 初始化 ====================
    connect();

    // 定期心跳保活
    setInterval(() => {
      if (state.ws?.readyState === WebSocket.OPEN) {
        send('ping');
      }
    }, 30000);
  </script>
</body>
</html>`;
}

// ==================== 启动服务 ====================

const PORT = parseInt(process.env.PORT || "3000");

serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket 升级
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
    }

    // HTTP 路由
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      clients.set(ws, {
        ws,
        watchingFiles: new Set(),
      });
      log(`👤 客户端已连接 (${clients.size} 个)`);
      send(ws, "connected", { message: "已连接到 MDV Server" });
    },
    close(ws) {
      const client = clients.get(ws);
      if (client) {
        // 清理该客户端的所有监听
        for (const path of client.watchingFiles) {
          removeFileFromWatchList(path, ws);
        }
        clients.delete(ws);
      }
      log(`👋 客户端已断开 (${clients.size} 个)`);
    },
    message(ws, message) {
      handleMessage(ws, message.toString());
    },
  },
});

log(`🚀 MDV Server 启动于 http://localhost:${PORT}/`);
log(`📖 使用方式: 在浏览器中打开，然后添加 Markdown 文件路径`);
