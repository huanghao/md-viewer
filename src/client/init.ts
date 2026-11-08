// App initialization — runs the IIFE startup sequence
import { state, restoreState, markFileMissing, markWorkspaceFailed, moveTabOrder } from './state';
import { setAnnotationSummaries } from './state';
import { pruneDeadFeatureStorageKeys, pruneStalePerFileStorage } from './utils/storage';
import { hydrateExpandedWorkspaces } from './workspace';
import { loadFile } from './api/files';
import { renderSidebar, renderTabs, renderFiles, initFileListActions, initWorkspaceActions, initSearchBoxCallbacks, applyTabBatchAction, setSidebarSearchQuery, setSidebarTab, scrollCurrentFileIntoView, requestSidebarRender } from './ui/sidebar';
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
import { mountToastStack, showError } from './ui/toast';
import { subscribeState } from './state';
import { showPreferences } from './ui/preferences';
import { setThemeApplier } from './preferences/controller';

import { initDispatcher } from './keybindings';
import { initQuickOpen, showQuickOpen } from './ui/quick-open';
import { fetchAnnotationSummaries } from './api/annotations';
import {
  initAnnotationElements,
  syncAnnotationSidebarLayout,
  setPendingAnnotation,
  getAnnotations,
  switchAnnotationTab,
  openComposerFromPending,
  handleSelectionForAnnotation,
} from './annotation';
import { initTocManager, updateToc, setupTocOpenBtn, initTocPaneHeight, setupTocResize, mountTocPanel } from './toc-manager';
import { installUnloadFlush } from './utils/undo-queue';
import { loadClientConfig } from './app-config';
import { backfillMissingCreatedTimes } from './file-metadata';
import { registerAppKeyboardActions } from './keyboard-actions';
import { setupFindBar } from './find-bar';
import { setupContentLinks } from './content-links';
import { setupAnnotationInteractions } from './annotation/interactions';
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
  setupAddConfirmDismiss,
  clearAddConfirm,
  isAddConfirmVisible,
  handleURLParams,
  addFileByPath,
  handleSmartAddInput,
} from './file-switcher';
import {
  initContentRenderer,
  renderContent,
  flashContentUpdated,
} from './content-renderer';
import { renderMath } from './utils/math-render';
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
    scheduleEviction,
    cancelEviction,
    updateToolbarButtons,
    addFileByPath,
  });

  // 消息提示容器：尽早挂载，之后的 showToast 才能立即显示
  mountToastStack();
  mountTocPanel();
  // 状态变化（会话文件、标签顺序、当前工作区、批注摘要、配置等）→ 合并后重绘侧栏
  subscribeState(() => requestSidebarRender());

  // 拉取服务端客户端配置（失败静默）
  await loadClientConfig();

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

  installUnloadFlush();

  console.time('[init] restoreState');
  await restoreState(loadFile);
  console.timeEnd('[init] restoreState');

  // 回收不属于当前会话任何文件的 pdf-zoom/pdf-scroll 历史遗留 key
  pruneStalePerFileStorage(state.sessionFiles.keys());

  // 补全缺失的 createdAt / gitCreatedAt（后台）
  backfillMissingCreatedTimes();

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
    renderAll,
    renderSidebar,
  });
  // 偏好面板的主题即时预览：由组合根注入，避免 preferences 导入入口模块
  setThemeApplier(applyTheme);

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
  requestSidebarRender();

  // 拉取批注摘要（失败静默忽略，不阻塞主流程）
  fetchAnnotationSummaries().then((summaries) => {
    setAnnotationSummaries(summaries);
    requestSidebarRender();
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
  setupAddConfirmDismiss();
  handleURLParams();

  registerAppKeyboardActions({ removeFileHandler, navigateFileInView, showQuickOpen });

  initQuickOpen({
    getOpenFilePaths: () => Array.from(state.sessionFiles.keys()),
    openFile: (path) => addFileByPath(path, true),
    switchToOpen: (path) => void switchFile(path),
  });

  initDispatcher();
  initInputKeys();

  // 文档内链接（pdf:// 与 Markdown 内部链接）在 mdv 内打开
  setupContentLinks({
    addFileByPath,
    getCurrentFile: () => state.currentFile ?? null,
    getPdfViewerForFile: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
  });

  // 批注交互：划词选择、PDF 批注事件同步高亮、PDF 标记点击
  setupAnnotationInteractions({
    getAnnotations,
    getBridge: () => currentPdfBridgeRef.value,
    getPendingAnnotationSetter: () => _setPendingAnnotation,
    openComposerFromPending,
    handleSelectionForAnnotation,
  });
  initSSEConnection({ onFileLoaded, updateToolbarButtons });
  await refreshCurrentFile();
  connectSSE();
  mountStatusbar();
  setupFindBar();

})();
