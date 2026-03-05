import { styles } from "./css.ts";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { EMBEDDED_CLIENT_JS } from "./embedded-client.ts";

// 判断是否为开发模式
const isDev = process.env.NODE_ENV !== 'production';

// 版本号：用于强制刷新浏览器缓存
const VERSION = Date.now().toString();

// 客户端脚本缓存
let cachedClientScript: string | null = null;

function loadClientScript(): string {
  // 开发模式：尝试从文件系统读取
  if (isDev) {
    const clientPath = join(process.cwd(), "dist/client.js");
    if (existsSync(clientPath)) {
      return readFileSync(clientPath, "utf-8");
    }
  }

  // 生产模式或文件不存在：使用嵌入的脚本
  return EMBEDDED_CLIENT_JS;
}

// 预加载客户端脚本
cachedClientScript = loadClientScript();

// 获取客户端脚本
function getClientScript(): string {
  if (isDev) {
    // 开发模式：每次动态读取，支持热更新
    return loadClientScript();
  } else {
    // 生产模式：使用缓存
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
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>MD Viewer - Markdown Viewer</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">
  <!-- Version: ${VERSION} -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css/github-markdown-light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>
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
        <div id="modeSwitchRow"></div>
        <div class="quick-action-confirm-host">
          <div class="add-file-confirm" id="quickActionConfirm" style="display: none;">
            <div class="add-file-confirm-text" id="quickActionConfirmText"></div>
            <div class="add-file-confirm-actions" id="quickActionConfirmActions"></div>
          </div>
        </div>
        <!-- 当前文件路径 -->
        <div id="currentPath"></div>
      </div>

      <div class="file-list" id="fileList">
        <div class="empty-tip">暂无文件</div>
      </div>
    </aside>
    <div class="sidebar-resizer" id="sidebarResizer" title="拖拽调整侧边栏宽度"></div>

    <!-- 主区域 -->
    <main class="main">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="breadcrumb" id="breadcrumb"></div>
        <div class="spacer"></div>
        <button class="toolbar-text-button" onclick="showSettingsDialog()" title="设置">
          <span id="settingsButtonText">[⚙ 设置]</span>
        </button>
        <button class="toolbar-text-button" id="refreshButton" onclick="handleRefreshButtonClick()" style="display: none;" title="文件已更新，点击刷新">
          <span id="refreshButtonText">[↻ 刷新]</span>
        </button>
        <button class="toolbar-text-button" id="syncButton" onclick="handleSyncButtonClick()" title="同步到学城">
          <span id="syncButtonText">[☁↑ 同步]</span>
        </button>
        <button class="font-scale-button" id="fontScaleButton" onclick="toggleFontScaleMenu()" title="调整字体大小">
          <span id="fontScaleText">100%</span>
        </button>
        <span class="file-meta" id="fileMeta"></span>
      </div>

      <!-- 字体缩放菜单 -->
      <div class="font-scale-menu" id="fontScaleMenu" style="display: none;">
        <div class="font-scale-option" onclick="setFontScale(0.75)">75%</div>
        <div class="font-scale-option" onclick="setFontScale(1.0)">100%</div>
        <div class="font-scale-option" onclick="setFontScale(1.25)">125%</div>
        <div class="font-scale-option" onclick="setFontScale(1.5)">150%</div>
        <div class="font-scale-option" onclick="setFontScale(2.0)">200%</div>
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

    <!-- 评论侧边栏 -->
    <aside class="annotation-sidebar" id="annotationSidebar">
      <div class="annotation-sidebar-header">
        <div class="annotation-header-row">
          <h3 id="annotationTitle">评论(<span id="annotationCount">0</span>)</h3>
          <div class="annotation-header-actions">
            <button class="annotation-icon-btn" id="annotationDensityToggle" title="切换默认/极简" aria-label="切换默认/极简">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>
            </button>
            <button class="annotation-icon-btn" id="annotationFilterToggle" title="筛选" aria-label="筛选">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>
            </button>
            <button class="annotation-icon-btn" id="annotationSidebarClose" title="收起评论" aria-label="收起评论">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>
            </button>
          </div>
        </div>
        <div class="annotation-filter-menu hidden" id="annotationFilterMenu">
          <button class="annotation-filter-item is-active" data-filter="all">全部</button>
          <button class="annotation-filter-item" data-filter="open">未解决</button>
          <button class="annotation-filter-item" data-filter="resolved">已解决</button>
          <button class="annotation-filter-item" data-filter="orphan">定位失败</button>
        </div>
      </div>
      <div class="annotation-list" id="annotationList">
        <div class="annotation-empty">无评论（选中文本即可添加）</div>
      </div>
    </aside>
    <div class="annotation-sidebar-resizer" id="annotationSidebarResizer" title="拖拽调整评论栏宽度"></div>
    <button class="annotation-floating-open-btn" id="annotationFloatingOpenBtn" title="打开评论侧边栏" aria-label="打开评论侧边栏">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>
    </button>
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

  <!-- 评论创建浮窗 -->
  <div id="annotationComposer" class="annotation-composer hidden">
    <div id="annotationComposerHeader" class="annotation-composer-header">
      <div class="annotation-row-top">
        <div class="annotation-row-title">新评论</div>
        <div class="annotation-row-actions">
          <button id="composerCancelBtn" class="annotation-icon-action" title="取消" aria-label="取消">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>
          </button>
          <button id="composerSaveBtn" class="annotation-icon-action resolve" title="保存" aria-label="保存">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <textarea id="composerNote" rows="1" placeholder="输入评论内容..."></textarea>
  </div>

  <!-- 划词后快速评论入口 -->
  <button id="annotationQuickAdd" class="annotation-quick-add hidden" title="添加评论" aria-label="添加评论">
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.6" y="2.6" width="10.8" height="10.8" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 5.4v5.2M5.4 8h5.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
  </button>

  <!-- 评论查看浮窗 -->
  <div id="annotationPopover" class="annotation-popover hidden">
    <div class="annotation-popover-header">
      <div class="annotation-row-top">
        <div id="popoverTitle" class="annotation-row-title">#0</div>
        <div class="annotation-row-actions">
          <button id="popoverPrevBtn" class="annotation-icon-action" title="上一条" aria-label="上一条">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>
          </button>
          <button id="popoverNextBtn" class="annotation-icon-action" title="下一条" aria-label="下一条">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>
          </button>
          <button id="popoverResolveBtn" class="annotation-icon-action resolve" title="标记已解决" aria-label="标记已解决">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>
          </button>
          <button id="popoverDeleteBtn" class="annotation-icon-action danger" title="删除评论" aria-label="删除评论">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>
          </button>
          <button id="popoverCloseBtn" class="annotation-icon-action" title="关闭" aria-label="关闭">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div id="popoverNote" class="annotation-popover-note"></div>
  </div>

  <script>${clientScript}<\/script>
</body>
</html>`;
}
