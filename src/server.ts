#!/usr/bin/env bun
/**
 * MD Viewer Server - Markdown Viewer Server
 * 简单的 HTTP 服务，提供 Markdown 文件浏览功能
 */

import { Hono } from "hono";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { resolve, basename } from "path";

// ==================== 类型定义 ====================

interface FileInfo {
  path: string;
  name: string;
  content: string;
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

// ==================== SSE 客户端管理 ====================

interface SSEClient {
  controller: ReadableStreamDefaultController<Uint8Array>;
}

const sseClients = new Set<SSEClient>();

function broadcastFileOpened(fileInfo: { path: string; filename: string; content: string; lastModified: number }) {
  const data = `data: ${JSON.stringify({ type: "file-opened", data: fileInfo })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
  for (const client of sseClients) {
    try {
      client.controller.enqueue(bytes);
    } catch {
      // 客户端已断开
      sseClients.delete(client);
    }
  }
}

// ==================== HTTP 服务 ====================

const app = new Hono();

// 前端页面
app.get("/", (c) => {
  return c.html(generateClientHTML());
});

// API: 获取文件内容
app.get("/api/file", (c) => {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  const resolvedPath = resolve(path);
  const { content, error } = readMarkdownFile(resolvedPath);
  if (error) return c.json({ error }, 404);

  return c.json({
    content,
    path: resolvedPath,
    filename: basename(resolvedPath),
    lastModified: getLastModified(resolvedPath),
  });
});

// API: 获取目录下的 Markdown 文件列表
app.get("/api/files", (c) => {
  const dir = c.req.query("dir") || ".";
  const files = getFileList(resolve(dir));
  return c.json({ files: files.map((f) => ({ path: f, name: basename(f) })) });
});

// API: CLI 调用 - 打开文件
app.post("/api/open-file", async (c) => {
  const body = await c.req.json<{ path?: string }>();
  const path = body?.path;
  
  if (!path) {
    return c.json({ error: "缺少 path 参数" }, 400);
  }

  const resolvedPath = resolve(path);
  
  if (!existsSync(resolvedPath)) {
    return c.json({ error: "文件不存在" }, 404);
  }

  const { content, error } = readMarkdownFile(resolvedPath);
  if (error) {
    return c.json({ error }, 500);
  }

  const fileInfo = {
    path: resolvedPath,
    filename: basename(resolvedPath),
    content,
    lastModified: getLastModified(resolvedPath) ?? Date.now(),
  };

  // 推送给所有连接的客户端
  broadcastFileOpened(fileInfo);
  
  log(`📄 CLI 打开文件: ${fileInfo.filename}`);
  
  return c.json({ success: true, filename: fileInfo.filename });
});

// API: SSE 事件流
app.get("/api/events", (c) => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client: SSEClient = { controller };
      sseClients.add(client);
      
      // 发送初始连接成功消息
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));
      
      // 清理断开连接的客户端
      c.req.signal.addEventListener("abort", () => {
        sseClients.delete(client);
      });
    },
    cancel(controller) {
      // 清理
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

// ==================== 前端 HTML 生成 ====================

function generateClientHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Viewer - Markdown Viewer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
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
    .refresh-btn {
      padding: 4px 10px;
      background: #f6f8fa;
      border: 1px solid #d1d5da;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .refresh-btn:hover {
      background: #f3f4f6;
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
        <h1>📚 MD Viewer</h1>
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
        <button class="refresh-btn" onclick="refreshCurrent()">🔄 刷新</button>
        <div class="spacer"></div>
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

  <script>
    // ==================== 状态管理 ====================
    const state = {
      files: new Map(), // path -> { path, name, content, active, lastModified }
      currentFile: null,
    };

    // ==================== 状态持久化 ====================
    const STORAGE_KEY = 'md-viewer:openFiles';

    function saveState() {
      const data = {
        files: Array.from(state.files.entries()).map(([path, file]) => [path, {
          path: file.path,
          name: file.name,
          active: file.active
        }]),
        currentFile: state.currentFile
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    async function restoreState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        
        const data = JSON.parse(saved);
        if (!data.files || data.files.length === 0) return;

        // 恢复文件列表（重新加载内容）
        for (const [path, fileInfo] of data.files) {
          const fileData = await loadFile(path);
          if (fileData) {
            state.files.set(path, {
              path: fileData.path,
              name: fileData.filename,
              content: fileData.content,
              active: fileInfo.active,
              lastModified: fileData.lastModified
            });
          }
        }

        // 恢复当前文件
        if (data.currentFile && state.files.has(data.currentFile)) {
          state.currentFile = data.currentFile;
        } else {
          // 如果保存的当前文件不存在了，切换到第一个活跃文件
          const activeFiles = Array.from(state.files.values()).filter(f => f.active);
          state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
        }

        renderFiles();
        renderTabs();
        renderContent();
      } catch (e) {
        console.error('恢复状态失败:', e);
      }
    }

    // ==================== API 请求 ====================
    async function loadFile(path) {
      try {
        const response = await fetch(\`/api/file?path=\${encodeURIComponent(path)}\`);
        const data = await response.json();
        if (data.error) {
          alert(data.error);
          return null;
        }
        return data;
      } catch (e) {
        alert(\`加载失败: \${e.message}\`);
        return null;
      }
    }

    async function refreshCurrent() {
      if (!state.currentFile) return;
      const data = await loadFile(state.currentFile);
      if (data) {
        const file = state.files.get(data.path);
        if (file) {
          file.content = data.content;
          file.lastModified = data.lastModified;
          renderContent();
          renderFiles();
        }
      }
    }

    // ==================== 消息处理 ====================
    async function onFileLoaded(data) {
      state.files.set(data.path, {
        path: data.path,
        name: data.filename,
        content: data.content,
        active: true,
        lastModified: data.lastModified
      });

      state.currentFile = data.path;
      saveState();
      renderFiles();
      renderTabs();
      renderContent();
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
          <div class="file-item \${file.active ? 'active' : ''}"
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
          <div class="tab \${file.path === state.currentFile ? 'active' : ''}"
               onclick="switchFile('\${escapeAttr(file.path)}')">
            <span>\${file.name}</span>
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
            <h2>欢迎使用 MD Viewer</h2>
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
    async function addFile() {
      const input = document.getElementById('fileInput');
      const path = input.value.trim();
      if (!path) return;

      input.value = '';

      // 加载文件
      const data = await loadFile(path);
      if (data) {
        onFileLoaded(data);
      }
    }

    function switchFile(path) {
      state.currentFile = path;
      const file = state.files.get(path);
      if (file) {
        file.active = true;
      }
      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    function closeFile(path) {
      const file = state.files.get(path);
      if (file) {
        file.active = false;
      }

      // 如果关闭的是当前文件，切换到其他文件
      if (state.currentFile === path) {
        const activeFiles = Array.from(state.files.values()).filter(f => f.active);
        state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
      }

      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    // ==================== 拖拽支持 ====================
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', async e => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files) {
        for (const file of files) {
          if (file.name.endsWith('.md')) {
            const data = await loadFile(file.path);
            if (data) {
              onFileLoaded(data);
            }
          }
        }
      }
    });

    // ==================== URL 参数处理 ====================
    async function handleUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const openPath = params.get('open');
      
      if (openPath) {
        // 从 URL 加载指定文件
        const data = await loadFile(openPath);
        if (data) {
          onFileLoaded(data);
        }
        // 清除 URL 参数，避免刷新时重复加载
        window.history.replaceState({}, '', '/');
      }
    }

    // ==================== SSE 连接 ====================
    function connectSSE() {
      const evtSource = new EventSource('/api/events');
      
      evtSource.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === 'file-opened') {
            onFileLoaded(data);
          }
        } catch (err) {
          console.error('SSE 消息解析错误:', err);
        }
      };
      
      evtSource.onerror = () => {
        console.log('SSE 连接断开，5秒后重连...');
        evtSource.close();
        setTimeout(connectSSE, 5000);
      };
    }

    // ==================== 初始化 ====================
    restoreState();
    handleUrlParams();
    connectSSE();
  <\/script>
</body>
</html>`;
}

// ==================== 启动服务 ====================

const PORT = parseInt(process.env.PORT || "3000");

export default {
  port: PORT,
  fetch: app.fetch,
};

log(`🚀 MD Viewer Server 启动于 http://localhost:${PORT}/`);
log(`📖 使用方法: 在浏览器中打开，然后添加 Markdown 文件路径`);
