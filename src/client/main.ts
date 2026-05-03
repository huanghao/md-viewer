// main.ts — entry point. All logic lives in focused modules; this file re-exports
// the public API and triggers the app init side-effect.

// CSS entry points — esbuild extracts these into dist/client.css
import './vendor-github-markdown.css';
import './vendor-highlight-github.css';
import './styles.css';

export { applyTheme, renderAll, scrollContentToTop } from './app-actions';
export { pdfViewerRegistry, currentPdfBridgeRef, PDF_IDLE_TIMEOUT_MS, PDF_MODE_KEY } from './pdf-registry';
export {
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  getMaxSidebarWidth,
  clampSidebarWidth,
  applySidebarWidth,
  initSidebarWidth,
  setSidebarCollapsed,
  initSidebarCollapsed,
  setupSidebarCollapse,
  setupSidebarResize,
} from './ui/sidebar-layout';
export {
  resolveCopyFeedbackTarget,
  applyCopyFeedback,
  copyTextWithFeedback,
  copySingleText,
  copyFilePath,
  copyRelativePath,
  copyAbsolutePath,
  copyFileName,
} from './utils/clipboard';

declare global {
  function cleanupAllExpiredRecords(): number;
}

// ==================== 初始化 ====================
import './init';
