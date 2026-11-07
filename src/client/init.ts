// App initialization — runs the IIFE startup sequence
import { state, restoreState, saveState, markFileMissing, markWorkspaceFailed, moveTabOrder } from './state';
import { setAnnotationSummaries } from './state';
import { pruneDeadFeatureStorageKeys, pruneStalePerFileStorage } from './utils/storage';
import { hydrateExpandedWorkspaces } from './workspace';
import { loadFile } from './api/files';
import { renderSidebar, renderTabs, renderFiles, initFileListActions, initWorkspaceActions, initSearchBoxCallbacks, applyTabBatchAction, setSidebarSearchQuery, setSidebarTab, scrollCurrentFileIntoView } from './ui/sidebar';
import { mountTabStrip } from './tabs';
import { mountSidebarHeader } from './sidebar-header';
import { mountFileList } from './file-list';
import { mountContentShell } from './content-shell';
import { mountPdfPageIndicatorShell } from './pdf-page-indicator';
import { mountWorkspaceTree } from './workspace-tree';
import { mountFocusView } from './focus-view';
import { mountAddConfirmBar } from './add-confirm';
import { looksLikePathInput } from './utils/path-input';
import type { TabBatchAction } from './utils/tab-batch';
import { initToolbarActions } from './main-actions';
import { mountToolbar } from './toolbar';
import { showError } from './ui/toast';
import { showPreferences, closePreferences, isPreferencesOpen } from './ui/preferences';
import { hideShortcutsHelp, isShortcutsHelpVisible } from './ui/shortcuts-help';
import { registerAction, initDispatcher } from './keybindings';
import { initQuickOpen, showQuickOpen, hideQuickOpen } from './ui/quick-open';
import { fetchAnnotationSummaries } from './api/annotations';
import {
  initAnnotationElements,
  syncAnnotationSidebarLayout,
  dismissAnnotationPopupByEscape,
  setPendingAnnotation,
  getAnnotations,
  switchAnnotationTab,
  openComposerFromPending,
  handleSelectionForAnnotation,
} from './annotation';
import { currentPdfViewer, setPdfDefaultScale } from './pdf-state';
import {
  initTocManager,
  updateToc,
  setupTocOpenBtn,
  initTocPaneHeight,
  setupTocResize,
} from './toc-manager';
import { flushAll as flushUndoQueue } from './utils/undo-queue';
import { setupFindBar } from './find-bar';
import { mountStatusbar } from './statusbar';
import { initInputKeys } from './utils/input-keys';
import { initZoom, zoomIn, zoomOut, setZoomFromInput, updateZoomDisplay } from './zoom-controller';
import {
  initDiffView,
  handleDiffButtonClick,
} from './diff-view';
import {
  initFileSwitcher,
  switchFile,
  removeFileHandler,
  navigateFileInView,
  searchFilesHandler,
  setupDragAndDrop,
  handleURLParams,
  clearAddConfirm,
  isAddConfirmVisible,
  addFileByPath,
  handleSmartAddInput,
} from './file-switcher';
import {
  initContentRenderer,
  renderContent,
  flashContentUpdated,
  renderMath,
} from './content-renderer';
import { resolveMarkdownLinkPath } from './utils/md-link';
import { initSSEConnection, connectSSE } from './sse-connection';
import {
  pdfViewerRegistry,
  currentPdfBridgeRef,
  evictPdfViewer,
  scheduleEviction,
  cancelEviction,
  setPdfMode,
} from './pdf-registry';
import {
  applyTheme,
  renderAll,
  onFileLoaded,
  syncAnnotationsForCurrentFile,
  updateToolbarButtons,
  startWorkspacePolling,
  handleRefreshButtonClick,
  refreshFile,
  refreshCurrentFile,
  _setPendingAnnotation,
  set_setPendingAnnotation,
} from './app-actions';
import {
  initSidebarWidth,
  initSidebarCollapsed,
  setupSidebarCollapse,
  setupSidebarResize,
} from './ui/sidebar-layout';

(async () => {
  console.time('[init] total');

  // 清理已下线功能遗留的 localStorage key（todo/chat/rag/translate/monitor）
  pruneDeadFeatureStorageKeys();

  // 初始化文件切换模块
  initFileSwitcher({
    onFileLoaded,
    syncAnnotationsForCurrentFile,
    updateToolbarButtons,
    evictPdfViewer,
  });

  // 文档内容区外壳（React 持有节点，内部保持命令式）
  mountContentShell();
  mountPdfPageIndicatorShell();

  // 初始化内容渲染模块
  initContentRenderer({
    pdfViewerRegistry,
    currentPdfBridgeRef,
    evictPdfViewer,
    scheduleEviction,
    cancelEviction,
    updateToolbarButtons,
    syncAnnotationsForCurrentFile,
    addFileByPath,
  });

  // 拉取服务端客户端配置
  try {
    console.time('[init] /api/config');
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      if (cfg?.pdf?.defaultScale) {
        setPdfDefaultScale(cfg.pdf.defaultScale);
      }
    }
  } catch {}
  console.timeEnd('[init] /api/config');

  initSidebarWidth();
  initSidebarCollapsed();
  setupSidebarCollapse();
  // 初始化字体缩放
  initZoom({
    getCurrentFile: () => state.currentFile ?? undefined,
    getPdfViewer: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
  });

  // 工具栏（面包屑、缩放、Diff/刷新、PDF 模式、设置）：React 渲染，这里注入动作
  mountToolbar({
    onDiff: () => void handleDiffButtonClick(),
    onRefresh: handleRefreshButtonClick,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onZoomCommit: (raw) => {
      setZoomFromInput(raw);
      updateZoomDisplay();
    },
    onPdfMode: (mode) => setPdfMode(mode),
    onSettings: showPreferences,
  });

  // 初始化批注功能
  initAnnotationElements();
  set_setPendingAnnotation(setPendingAnnotation);
  syncAnnotationSidebarLayout();
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
  });

  window.addEventListener('beforeunload', () => {
    flushUndoQueue();
  });

  console.time('[init] restoreState');
  await restoreState(loadFile);
  console.timeEnd('[init] restoreState');

  // 回收不属于当前会话任何文件的 pdf-zoom/pdf-scroll 历史遗留 key
  pruneStalePerFileStorage(state.sessionFiles.keys());

  // 补全缺失的 createdAt / gitCreatedAt
  const missingTimes = Array.from(state.sessionFiles.values())
    .filter(f => !f.isRemote && (f.createdAt == null || f.gitCreatedAt == null))
    .map(f => f.path);
  if (missingTimes.length > 0) {
    fetch('/api/file-created-at', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: missingTimes }),
    }).then(r => r.json()).then((result: Record<string, { createdAt?: number; gitCreatedAt?: number }>) => {
      let changed = false;
      for (const [path, info] of Object.entries(result)) {
        const file = state.sessionFiles.get(path);
        if (!file) continue;
        if (info.createdAt != null && file.createdAt == null) { file.createdAt = info.createdAt; changed = true; }
        if (info.gitCreatedAt != null && file.gitCreatedAt == null) { file.gitCreatedAt = info.gitCreatedAt; changed = true; }
      }
      if (changed) saveState();
    }).catch(() => {});
  }

  applyTheme();

  console.time('[init] hydrateExpandedWorkspaces');
  const failedWorkspaceIds = await hydrateExpandedWorkspaces();
  console.timeEnd('[init] hydrateExpandedWorkspaces');

  if (failedWorkspaceIds.length > 0) {
    failedWorkspaceIds.forEach(markWorkspaceFailed);
  }
  startWorkspacePolling();

  initTocManager({
    getPdfViewerForFile: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
  });

  initDiffView({
    renderContent,
    updateToolbarButtons,
    updateToc,
    syncAnnotationsForCurrentFile,
    flashContentUpdated,
    renderMath,
  });

  // annotation tabs 等仍用 document 级事件委托，一次性注册
  // 统一输入提交：像路径则添加文件，否则全文搜索（工具栏与侧边栏搜索框共用）
  const submitUnifiedInput = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (!looksLikePathInput(value)) {
      searchFilesHandler(value).catch((err: any) => showError(`搜索失败: ${err?.message || '未知错误'}`));
      return;
    }
    handleSmartAddInput(value).catch((err: any) => showError(`添加失败: ${err?.message || '未知错误'}`));
  };

  initToolbarActions(document, {
    switchAnnotationTab: (tab) => switchAnnotationTab(tab as 'comments'),
    addFile: () => {
      const input = document.getElementById('searchInput') as HTMLInputElement;
      if (input) handleSmartAddInput(input.value).catch((err: any) => showError(`添加失败: ${err?.message || '未知错误'}`));
    },
    handleUnifiedInputSubmit: (value?: string) => {
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      submitUnifiedInput(typeof value === 'string' ? value : input?.value || '');
    },
    dismissQuickActionConfirm: () => { if (isAddConfirmVisible()) clearAddConfirm(); },
    refreshFile,
  });

  // 添加确认条：React 渲染，file-switcher 通过 store 显示
  mountAddConfirmBar();

  // 侧边栏头部：搜索框与视图切换由 React 渲染，这里注入动作
  initSearchBoxCallbacks({ renderContent });
  mountSidebarHeader({
    onQueryChange: setSidebarSearchQuery,
    onSubmit: submitUnifiedInput,
    dismissQuickActionConfirm: () => { if (isAddConfirmVisible()) clearAddConfirm(); },
    setSidebarTab,
  });

  // 注册 fileList 回调（委托到 .sidebar，一次性注册，永久有效）
  initFileListActions({
    switchFile: (path) => void switchFile(path),
    removeFile: removeFileHandler,
  });

  // 注册 workspace 回调（focus/full tab 文件点击）
  initWorkspaceActions({
    switchFile: (path) => void switchFile(path),
    loadAndSwitchFile: async (path) => {
      const data = await loadFile(path);
      if (data) await onFileLoaded(data, true);
      else {
        markFileMissing(path, true);
        renderAll();
        showError('文件已删除，已标记为 D（无本地缓存）');
      }
    },
  });

  // 文档标签栏：React 渲染，这里注入动作
  // 标签栏与文件列表共用同一份排序状态
  const reorderOpenFiles = (fromIdx: number, insertIdx: number) => {
    if (fromIdx !== insertIdx) moveTabOrder(fromIdx, insertIdx);
    renderTabs();
    renderFiles();
  };
  mountTabStrip({
    switchFile: (path) => void switchFile(path),
    removeFile: removeFileHandler,
    batch: (action: TabBatchAction) => applyTabBatchAction(action, removeFileHandler),
    reorder: reorderOpenFiles,
    onLayout: syncAnnotationSidebarLayout,
  });

  // 文件列表（“打开”视图）：React 渲染，拖拽排序复用 reorderOpenFiles
  mountFileList({
    reorder: reorderOpenFiles,
    onRendered: scrollCurrentFileIntoView,
  });

  // 工作区视图：React 渲染树，数据由 renderSidebar 触发重绘
  mountWorkspaceTree({ onRendered: scrollCurrentFileIntoView });
  mountFocusView({ onRendered: scrollCurrentFileIntoView });

  // 根据配置渲染侧边栏
  renderSidebar();

  // 拉取批注摘要（失败静默忽略，不阻塞主流程）
  fetchAnnotationSummaries().then((summaries) => {
    setAnnotationSummaries(summaries);
    renderSidebar();
  }).catch(() => {/* 静默忽略 */});

  renderContent();
  console.timeEnd('[init] total');
  syncAnnotationsForCurrentFile(true);
  if (state.currentFile) updateToc(state.currentFile);

  setupDragAndDrop();
  setupSidebarResize();
  initTocPaneHeight();
  setupTocResize();
  setupTocOpenBtn();
  document.addEventListener('click', (e) => {
    if (!isAddConfirmVisible()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.sidebar-header')) return;
    if (target.closest('#quickActionConfirm')) return;
    clearAddConfirm();
  });
  handleURLParams();
  const isInputFocused = () => {
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea';
  };

  registerAction({
    id: 'escape',
    label: 'Escape',
    category: 'view',
    defaultKey: 'Escape',
    handler: () => {
      if (dismissAnnotationPopupByEscape()) return;
      const qoOverlay = document.querySelector('.quick-open-overlay') as HTMLElement | null;
      if (qoOverlay && qoOverlay.style.display !== 'none') { hideQuickOpen(); return; }
      if (isShortcutsHelpVisible()) { hideShortcutsHelp(); return; }
      if (isPreferencesOpen()) { closePreferences(); return; }
    },
  });

  registerAction({
    id: 'close-file',
    label: '关闭当前文件',
    category: 'file',
    defaultKey: 'Ctrl+w',
    handler: () => {
      const current = state.currentFile;
      if (current) removeFileHandler(current);
    },
    shouldActivate: () => !isInputFocused(),
  });

  // j/k: 在当前侧边栏视角里上下移动文件（非输入框）
  registerAction({
    id: 'nav-file-down',
    label: '移到下一个文件',
    category: 'navigation',
    defaultKey: 'j',
    handler: () => navigateFileInView(1),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'nav-file-up',
    label: '移到上一个文件',
    category: 'navigation',
    defaultKey: 'k',
    handler: () => navigateFileInView(-1),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'quick-open',
    label: '快速打开文件',
    category: 'navigation',
    defaultKey: 'Ctrl+f',
    handler: () => showQuickOpen(),
    shouldActivate: () => !isInputFocused(),
  });

  initQuickOpen({
    getOpenFilePaths: () => Array.from(state.sessionFiles.keys()),
    openFile: (path) => addFileByPath(path, true),
    switchToOpen: (path) => void switchFile(path),
  });

  initDispatcher();
  initInputKeys();

  // 添加批注文本选中监听
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const filePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
      handleSelectionForAnnotation(filePath);
    }, 0);
  });

  // 拦截 pdf:// 协议链接点击
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute("href") || "";
    if (!href.startsWith("pdf://")) return;
    e.preventDefault();

    // Parse pdf://path/to/file.pdf#page=3&quote=some+text
    const withoutProto = href.slice("pdf://".length);
    const hashIdx = withoutProto.indexOf("#");
    const filePart = hashIdx >= 0 ? withoutProto.slice(0, hashIdx) : withoutProto;
    const paramStr = hashIdx >= 0 ? withoutProto.slice(hashIdx + 1) : "";
    const params = new URLSearchParams(paramStr);
    const pageNum = parseInt(params.get("page") || "1", 10);
    const quote = params.get("quote") || "";

    addFileByPath(filePart).then(() => {
      setTimeout(() => {
        if (currentPdfViewer) {
          currentPdfViewer.scrollToPage(pageNum);
          if (quote) currentPdfViewer.highlightQuote(pageNum, decodeURIComponent(quote));
        }
      }, 500);
    });
  });

  // 拦截 markdown 内部 .md 链接点击，在 mdv 内打开
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href') || '';
    const currentFile = state.currentFile;
    const absPath = resolveMarkdownLinkPath(href, currentFile);
    if (!absPath) return;
    e.preventDefault();
    addFileByPath(absPath, true);
  });

  // App-level PDF annotation event listeners (registered once, delegate to current bridge)
  document.addEventListener("annotations:loaded", () => {
    currentPdfBridgeRef.value?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:created", () => {
    currentPdfBridgeRef.value?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:deleted", () => {
    currentPdfBridgeRef.value?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:highlights-changed", () => {
    currentPdfBridgeRef.value?.renderHighlights(getAnnotations());
  });

  // 监听 pdf:show-composer 事件
  document.addEventListener("pdf:show-composer", (e: Event) => {
    const { annotation, filePath, clientX, clientY } = (e as CustomEvent).detail;
    if (_setPendingAnnotation) {
      _setPendingAnnotation(annotation, filePath, clientX, clientY);
    }
  });

  // 页面刷新时，自动刷新当前正在展示的文件

  // PDF temp selection mark 点击处理：失焦后重新点击黄色下划线恢复 composer
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tempMark = target.closest('mark.pdf-selection-mark-temp');
    if (!tempMark) return;
    if (!tempMark.closest('.pdf-viewer-container')) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = (tempMark as HTMLElement).getBoundingClientRect();
    openComposerFromPending(rect.right + 6, rect.top - 8);
  });

  // PDF annotation mark 点击处理
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('.annotation-mark');
    if (!mark) return;
    if (!mark.closest('.pdf-viewer-container')) return;

    const annotationId = mark.getAttribute('data-annotation-id');
    if (!annotationId) return;

    e.stopPropagation();
    e.preventDefault();

    const annotations = getAnnotations();
    const ann = annotations.find((a: any) => a.id === annotationId);
    if (!ann) return;

    const rect = (mark as HTMLElement).getBoundingClientRect();
    document.dispatchEvent(new CustomEvent('pdf:show-popover', {
      detail: { annotation: ann, x: rect.right + 8, y: rect.top }
    }));
  });
  initSSEConnection({ onFileLoaded, updateToolbarButtons });
  await refreshCurrentFile();
  connectSSE();
  mountStatusbar();
  setupFindBar();

})();
