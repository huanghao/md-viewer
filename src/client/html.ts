import { styles } from "./css.ts";
import { clientScript } from "./app.ts";

export function generateClientHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Viewer - Markdown Viewer</title>
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
        <div class="breadcrumb" id="breadcrumb"></div>
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

  <script>${clientScript}<\/script>
</body>
</html>`;
}
