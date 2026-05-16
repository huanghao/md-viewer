import {
  type Annotation,
  state,
  ensureAnnotationThreads,
  ensureAnnotationSerials,
  replaceAnnotationInState,
} from '../annotation-state';
import { upsertAnnotationRemote, fetchAnnotations } from '../api/annotations';
import { adjustAnnotationCount, state as appState } from '../state';
import { isOpen, isUnanchored } from '../../annotation-status';
import { showError } from '../ui/toast';
import {
  setSidebarCollapsed,
  loadAnnotationPanelOpen,
} from '../annotation-layout';

// ── callbacks injected by annotation.ts ──────────────────────────────────────

let _applyAnnotations: () => void = () => {};
let _renderAnnotationList: (fp: string | null) => void = () => {};
let _hideComposer: () => void = () => {};
let _hideQuickAdd: (clearPending: boolean) => void = () => {};
let _hidePopover: (force: boolean) => void = () => {};

export function registerPersistenceCallbacks(cbs: {
  applyAnnotations: () => void;
  renderAnnotationList: (fp: string | null) => void;
  hideComposer: () => void;
  hideQuickAdd: (clearPending: boolean) => void;
  hidePopover: (force: boolean) => void;
}): void {
  _applyAnnotations = cbs.applyAnnotations;
  _renderAnnotationList = cbs.renderAnnotationList;
  _hideComposer = cbs.hideComposer;
  _hideQuickAdd = cbs.hideQuickAdd;
  _hidePopover = cbs.hidePopover;
}

// ── persistence functions ─────────────────────────────────────────────────────

export function persistAnnotation(filePath: string, annotation: Annotation, errorPrefix = '评论保存失败'): void {
  void upsertAnnotationRemote(filePath, annotation)
    .then((saved) => {
      if (state.currentFilePath !== filePath) return;
      replaceAnnotationInState(saved);
      _renderAnnotationList(filePath);
    })
    .catch((error) => {
      showError(`${errorPrefix}: ${error?.message || '未知错误'}`);
      // 回滚创建时的乐观计数更新
      adjustAnnotationCount(filePath, -1);
      import('../ui/sidebar').then(({ renderSidebar }) => renderSidebar());
    });
}

export function persistAnnotations(filePath: string, annotations: Annotation[], errorPrefix = '评论保存失败'): void {
  for (const annotation of annotations) {
    persistAnnotation(filePath, annotation, errorPrefix);
  }
}

export async function hydrateAnnotationsFromRemote(filePath: string): Promise<void> {
  try {
    const remote = await fetchAnnotations(filePath);
    if (!Array.isArray(remote)) return;
    if (state.currentFilePath !== filePath) return;
    state.annotations = remote;
    const threadChanged = ensureAnnotationThreads(state.annotations);
    const serialChanged = ensureAnnotationSerials(state.annotations);
    if (threadChanged || serialChanged) {
      persistAnnotations(filePath, state.annotations);
    }
    // 根据真实数据校正 badge 计数，防止乐观更新累计漂移
    const anchoredCount = remote.filter(a => isOpen(a.status as any)).length;
    const unanchoredCount = remote.filter(a => isUnanchored(a.status as any)).length;
    const existing = appState.annotationSummaries.get(filePath);
    if (anchoredCount === 0 && unanchoredCount === 0) {
      appState.annotationSummaries.delete(filePath);
    } else {
      appState.annotationSummaries.set(filePath, {
        count: anchoredCount,
        unanchoredCount,
        updatedAt: existing?.updatedAt ?? Date.now(),
      });
    }

    _renderAnnotationList(filePath);
    _applyAnnotations();
    import('../ui/sidebar').then(({ renderSidebar }) => renderSidebar());
  } catch (error: any) {
    if (state.currentFilePath !== filePath) return;
    const msg = error?.message || '未知错误';
    console.error('[annotation] 评论加载失败:', msg, error);
    showError(`评论加载失败: ${msg}`);
  }
}

export function setAnnotations(filePath: string | null): void {
  state.currentFilePath = filePath;
  if (filePath) {
    state.annotations = [];
    void hydrateAnnotationsFromRemote(filePath);
  } else {
    state.annotations = [];
  }
  state.pinnedAnnotationId = null;
  state.activeAnnotationId = null;
  state.pendingAnnotation = null;
  state.pendingAnnotationFilePath = null;
  _hideComposer();
  _hideQuickAdd(true);
  _hidePopover(true);
  if (filePath) {
    setSidebarCollapsed(!loadAnnotationPanelOpen());
  } else {
    setSidebarCollapsed(true);
  }
}
