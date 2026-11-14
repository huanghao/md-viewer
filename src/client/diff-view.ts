import { state, saveState } from './state';
import { loadFile } from './api/files';
import { diffLines } from './utils/diff';
import { diffBlocks } from './utils/diff-blocks';
import { applyBlockDetail } from './utils/diff-detail';
import { mountScrollbar, unmountScrollbar, updateDiffMarkers, clearDiffMarkers } from './ui/doc-scrollbar';
import { shouldRefreshDiff } from './ui/diff-refresh';
import { diffBannerStore } from './diff-banner/store';
import { mountDiffBanner } from './diff-banner';
import { highlightCodeBlocks } from './utils/code-highlight';
import { toolbarStore } from './toolbar/store';
import { protectMath } from './utils/math-protect';
import { sanitizeHtml } from './utils/html-sanitize';

import { invalidateAnnotationElementsCache } from './annotation-layout';
import { deleteSnapshot } from './api/snapshots';

// Module-level variables
let diffViewActive = false;
let diffViewFilePath: string | null = null; // diff 是为哪个文件开启的（accept/revert 用此路径）
let currentDiffBlockIndex = -1; // -1 表示未激活任何 block
let diffMode: 'paragraph' | 'line' = 'paragraph';

// Injected callbacks from main.ts (to avoid circular imports)
let _renderContent: () => void = () => {};
let _updateToolbarButtons: () => void | Promise<void> = () => {};
let _updateToc: (filePath: string) => void | Promise<void> = () => {};
let _syncAnnotationsForCurrentFile: (force?: boolean) => void = () => {};
let _flashContentUpdated: () => void = () => {};
let _renderMath: (container: HTMLElement) => void = () => {};

export function initDiffView(deps: {
  renderContent: () => void;
  updateToolbarButtons: () => void | Promise<void>;
  updateToc: (filePath: string) => void | Promise<void>;
  syncAnnotationsForCurrentFile: (force?: boolean) => void;
  flashContentUpdated: () => void;
  renderMath: (container: HTMLElement) => void;
}): void {
  _renderContent = deps.renderContent;
  _updateToolbarButtons = deps.updateToolbarButtons;
  _updateToc = deps.updateToc;
  _syncAnnotationsForCurrentFile = deps.syncAnnotationsForCurrentFile;
  _flashContentUpdated = deps.flashContentUpdated;
  _renderMath = deps.renderMath;
  mountDiffBanner({
    onNavigate: (dir) => {
      if (diffMode === 'paragraph') navigateParagraphBlock(dir);
      else navigateDiffBlock(dir);
    },
    onAccept: () => acceptDiffUpdate(),
    onClose: () => closeDiffView(),
    onSwitchMode: () => switchDiffMode(),
  });
}

export function getDiffViewActive(): boolean {
  return diffViewActive;
}

export function setDiffViewActive(value: boolean): void {
  diffViewActive = value;
}

export function getDiffViewFilePath(): string | null {
  return diffViewFilePath;
}

export function getDiffMode(): 'paragraph' | 'line' {
  return diffMode;
}

export function setDiffMode(mode: 'paragraph' | 'line'): void {
  diffMode = mode;
}

export async function loadPendingContent(path: string): Promise<string | null> {
  const file = state.sessionFiles.get(path);
  if (!file) return null;
  if (file.pendingContent !== undefined) return file.pendingContent;
  const data = await loadFile(path, true);
  if (!data) return null;
  file.pendingContent = data.content;
  return data.content;
}

type DiffLineArr = import('./utils/diff').DiffLine[];
type Segment =
  | { kind: 'equal'; lines: DiffLineArr }
  | { kind: 'delete'; lines: DiffLineArr }
  | { kind: 'insert'; lines: DiffLineArr }
  | { kind: 'modify'; delLines: DiffLineArr; insLines: DiffLineArr };
type DiffGroup = { segments: Segment[]; hasChange: boolean };

/** 将 Segment 列表合并为 group，空行 equal 段不切断相邻变更。
 *  可单独测试，不依赖 DOM 或 marked。 */
export function buildDiffGroups(segments: Segment[]): DiffGroup[] {
  const groups: DiffGroup[] = [];
  let current: DiffGroup = { segments: [], hasChange: false };

  for (const seg of segments) {
    if (seg.kind !== 'equal') {
      current.segments.push(seg);
      current.hasChange = true;
    } else {
      const isBlankOnly = seg.lines.every(l => l.content.trim() === '');
      if (current.hasChange && isBlankOnly) {
        current.segments.push(seg);
      } else {
        if (current.hasChange) groups.push(current);
        groups.push({ segments: [seg], hasChange: false });
        current = { segments: [], hasChange: false };
      }
    }
  }
  if (current.hasChange) groups.push(current);
  return groups;
}

export function renderInlineDiffHTML(lines: import('./utils/diff').DiffLine[]): { html: string; totalBlocks: number } {

  const segments: Segment[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.type === 'equal') {
      const batch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'equal') batch.push(lines[i++]);
      segments.push({ kind: 'equal', lines: batch });
    } else if (l.type === 'delete') {
      const delBatch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'delete') delBatch.push(lines[i++]);
      if (i < lines.length && lines[i].type === 'insert') {
        const insBatch: typeof lines = [];
        while (i < lines.length && lines[i].type === 'insert') insBatch.push(lines[i++]);
        segments.push({ kind: 'modify', delLines: delBatch, insLines: insBatch });
      } else {
        segments.push({ kind: 'delete', lines: delBatch });
      }
    } else {
      const batch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'insert') batch.push(lines[i++]);
      segments.push({ kind: 'insert', lines: batch });
    }
  }

  const md = (s: string) => {
    // Prevent setext heading false-positives: a line of dashes/equals that
    // immediately follows a non-empty line gets parsed as an h2/h1 underline.
    // We insert a blank line before any such underline-only line so marked
    // treats it as a thematic break (hr) instead.
    const safe = s.replace(/^([^\n]+)\n([-=]{2,}[ \t]*)$/mg, '$1\n\n$2');
    const g = protectMath(safe);
    return g.restore(sanitizeHtml((window as any).marked.parse(g.protected)));
  };

  // 将变更段合并为 group，空行 equal 段不切断相邻变更
  const groups = buildDiffGroups(segments);

  let blockIndex = 0;
  let html = '<div class="markdown-body diff-inline-body" id="reader">';

  for (const group of groups) {
    if (!group.hasChange) {
      // 纯 equal 上下文，直接渲染
      for (const seg of group.segments) {
        if (seg.kind === 'equal') {
          html += md(seg.lines.map(l => l.content).join('\n'));
        }
      }
      continue;
    }

    // 变更 group：外层包 diff-group
    html += `<div class="diff-group" data-block-index="${blockIndex}">`;
    for (const seg of group.segments) {
      if (seg.kind === 'equal') {
        html += `<div class="diff-group-context">${md(seg.lines.map(l => l.content).join('\n'))}</div>`;
      } else if (seg.kind === 'delete') {
        const inner = md(seg.lines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-delete">${inner}</div>`;
      } else if (seg.kind === 'insert') {
        const inner = md(seg.lines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-insert">${inner}</div>`;
      } else {
        const delInner = md(seg.delLines.map(l => l.content).join('\n'));
        const insInner = md(seg.insLines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-modify-del">${delInner}</div>`;
        html += `<div class="diff-block diff-block-modify-ins">${insInner}</div>`;
      }
    }
    html += '</div>';
    blockIndex++;
  }

  html += '</div>';
  return { html, totalBlocks: blockIndex };
}

function switchDiffMode(): void {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!file || file.pendingContent === undefined) return;

  diffMode = diffMode === 'paragraph' ? 'line' : 'paragraph';

  diffBannerStore.setMode(diffMode);

  renderDiffView(file.content, file.pendingContent);
  _syncAnnotationsForCurrentFile(false);
}

export function navigateParagraphBlock(direction: 1 | -1, changedEls?: HTMLElement[]): void {
  const container = document.getElementById('content');
  if (!container) return;

  const blockEls: HTMLElement[] = changedEls ?? Array.from(
    container.querySelectorAll<HTMLElement>('[data-para-changed]')
  );
  const total = blockEls.length;
  if (total === 0) return;

  const nextIndex = currentDiffBlockIndex === -1
    ? (direction === 1 ? 0 : total - 1)
    : Math.max(0, Math.min(total - 1, currentDiffBlockIndex + direction));

  if (nextIndex === currentDiffBlockIndex && currentDiffBlockIndex !== -1) return;

  container.querySelectorAll<HTMLElement>('.diff-focused').forEach(el => {
    el.classList.remove('diff-focused');
  });

  blockEls[nextIndex]?.classList.add('diff-focused');
  blockEls[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  currentDiffBlockIndex = nextIndex;

  diffBannerStore.setNav({
    count: `${nextIndex + 1} / ${total}`,
    prevDisabled: nextIndex === 0,
    nextDisabled: nextIndex === total - 1,
  });
}

export function renderParagraphDiffView(oldContent: string, newContent: string): void {
  currentDiffBlockIndex = -1;
  const container = document.getElementById('content');
  if (!container) return;

  // Normalize setext headings before both diffing and rendering so that
  // splitBlocks() and marked() see the same number of blocks/elements.
  const safeOld = oldContent.replace(/^([^\n]+)\n([-=]{2,}[ \t]*)$/mg, '$1\n\n$2');
  const safeNew = newContent.replace(/^([^\n]+)\n([-=]{2,}[ \t]*)$/mg, '$1\n\n$2');
  const blocks = diffBlocks(safeOld, safeNew);
  const changedBlocks = blocks.filter(b => b.changed);

  if (changedBlocks.length === 0) {
    container.innerHTML = `<div class="diff-no-changes">文件内容与磁盘一致，无差异</div>`;
    return;
  }

  // Render safeNew (setext-normalized) so block count matches diffBlocks(safeOld, safeNew)
  const g = protectMath(safeNew);
  container.innerHTML = `<div class="markdown-body" id="reader">${g.restore(sanitizeHtml((window as any).marked.parse(g.protected)))}</div>`;
  invalidateAnnotationElementsCache();
  highlightCodeBlocks(container);
  _renderMath(container);

  // Map rendered top-level block elements to diffBlocks[] by index
  const sel = 'p,h1,h2,h3,h4,h5,h6,ul,ol,pre,blockquote,hr,table';
  const blockEls = Array.from(
    container.querySelectorAll<HTMLElement>(sel.split(',').map(s => `.markdown-body > ${s}`).join(','))
  );

  // 容器块（表格 / 列表 / 代码 / 引用）：标出内部具体变化的部分
  blocks.forEach((block, idx) => {
    const el = blockEls[idx];
    if (el) applyBlockDetail(el, block);
  });

  // 把连续的改动块归组，整组包在一个 wrapper div 里，作为一个导航单元
  const changedGroups: HTMLElement[][] = [];
  let run: HTMLElement[] = [];
  blocks.forEach((block, idx) => {
    const el = blockEls[idx];
    if (block.changed && el) {
      run.push(el);
    } else {
      if (run.length > 0) { changedGroups.push(run); run = []; }
    }
  });
  if (run.length > 0) changedGroups.push(run);

  const changedEls: HTMLElement[] = [];
  for (const group of changedGroups) {
    let target: HTMLElement;
    if (group.length === 1) {
      target = group[0];
    } else {
      const wrapper = document.createElement('div');
      group[0].parentElement!.insertBefore(wrapper, group[0]);
      for (const el of group) wrapper.appendChild(el);
      target = wrapper;
    }
    target.dataset.paraChanged = 'true';
    changedEls.push(target);
  }

  // Update banner count
  diffBannerStore.setNav({
    count: `1 / ${changedEls.length}`,
    prevDisabled: true,
    nextDisabled: changedEls.length <= 1,
  });

  // Update scrollbar markers
  unmountScrollbar();
  mountScrollbar();
  const markerGroups = changedEls.map(el => ({ el, kind: 'modify' as const }));
  updateDiffMarkers(markerGroups);

  // Navigate to first changed block
  navigateParagraphBlock(1, changedEls);
}

export function renderDiffView(oldContent: string, newContent: string): void {
  if (diffMode === 'paragraph') {
    renderParagraphDiffView(oldContent, newContent);
    return;
  }
  currentDiffBlockIndex = -1;
  const container = document.getElementById('content');
  if (!container) return;

  const lines = diffLines(oldContent, newContent);
  const hasChanges = lines.some(l => l.type !== 'equal');

  if (!hasChanges) {
    container.innerHTML = `
      <div class="diff-no-changes">文件内容与磁盘一致，无差异</div>
    `;
    return;
  }

  const { html: bodyHTML, totalBlocks } = renderInlineDiffHTML(lines);

  // 更新 banner（banner 元素在 #content 之外，由 handleDiffButtonClick 注入）
  diffBannerStore.setNav({
    count: `1 / ${totalBlocks}`,
    prevDisabled: true,
    nextDisabled: totalBlocks <= 1,
  });

  container.innerHTML = bodyHTML;
  invalidateAnnotationElementsCache();
  _renderMath(container);

  // 更新滚动条 diff 标记
  unmountScrollbar();
  mountScrollbar();
  const diffGroups: Array<{ el: HTMLElement; kind: 'insert' | 'delete' | 'modify' }> = [];
  container.querySelectorAll<HTMLElement>('.diff-group[data-block-index]').forEach(groupEl => {
    const hasInsert = groupEl.querySelector('.diff-block-insert, .diff-block-modify-ins');
    const hasDelete = groupEl.querySelector('.diff-block-delete, .diff-block-modify-del');
    const kind = (hasInsert && hasDelete) ? 'modify' : hasInsert ? 'insert' : 'delete';
    diffGroups.push({ el: groupEl, kind });
  });
  updateDiffMarkers(diffGroups);

  // 自动跳到第一个 block
  navigateDiffBlock(1);
}

export function refreshDiffIfActive(): void {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!shouldRefreshDiff({ diffViewActive, pendingContent: file?.pendingContent })) return;
  diffBannerStore.setLabelOverride('Diff 模式 · 文件已再次更新，已刷新至最新版本');
  renderDiffView(file!.content, file!.pendingContent!);
  _syncAnnotationsForCurrentFile(false);
}

export async function handleDiffButtonClick(): Promise<void> {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (diffViewActive) {
    closeDiffView();
    return;
  }

  const newContent = await loadPendingContent(state.currentFile);
  if (newContent === null) return;

  diffViewActive = true;
  diffViewFilePath = state.currentFile;
  toolbarStore.setDiff({ active: true });
  document.getElementById('content')?.classList.add('diff-active');

  diffBannerStore.show(diffMode);

  renderDiffView(file.content, newContent);
  _syncAnnotationsForCurrentFile(false);
}

export function closeDiffView(): void {
  diffViewActive = false;
  diffViewFilePath = null;
  currentDiffBlockIndex = -1;
  toolbarStore.setDiff({ active: false });
  document.getElementById('content')?.classList.remove('diff-active');

  // 移除 banner
  diffBannerStore.hide();

  clearDiffMarkers();
  document.querySelectorAll<HTMLElement>('[data-para-changed]').forEach(el => {
    delete el.dataset.paraChanged;
  });
  diffMode = 'paragraph';
  _renderContent();
}

export function navigateDiffBlock(direction: 1 | -1): void {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  // 找所有 diff-group 元素，按 DOM 顺序收集
  const blockEls: HTMLElement[] = [];
  contentEl.querySelectorAll<HTMLElement>('.diff-group[data-block-index]').forEach(el => {
    blockEls.push(el);
  });
  const totalBlocks = blockEls.length;
  if (totalBlocks === 0) return;

  const nextIndex = currentDiffBlockIndex === -1
    ? (direction === 1 ? 0 : totalBlocks - 1)
    : Math.max(0, Math.min(totalBlocks - 1, currentDiffBlockIndex + direction));

  if (nextIndex === currentDiffBlockIndex && currentDiffBlockIndex !== -1) return;

  // 移除旧 focus
  contentEl.querySelectorAll<HTMLElement>('.diff-focused').forEach(el => {
    el.classList.remove('diff-focused');
  });

  // 加新 focus（同一 blockIndex 的所有元素，即 modify 的 del+ins 两个都高亮）
  contentEl.querySelectorAll<HTMLElement>(`.diff-group[data-block-index="${nextIndex}"]`).forEach(el => {
    el.classList.add('diff-focused');
  });

  // 滚动到第一个匹配元素
  blockEls[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  currentDiffBlockIndex = nextIndex;

  // 更新 banner 计数和按钮状态
  diffBannerStore.setNav({
    count: `${nextIndex + 1} / ${totalBlocks}`,
    prevDisabled: nextIndex === 0,
    nextDisabled: nextIndex === totalBlocks - 1,
  });
}

export async function acceptDiffUpdate(): Promise<void> {
  // 始终操作 diff 打开时绑定的文件，而非 state.currentFile（防止切换文件后错误接受）
  const targetPath = diffViewFilePath ?? state.currentFile;
  if (!targetPath) return;
  const file = state.sessionFiles.get(targetPath);
  if (!file || file.pendingContent === undefined) return;

  file.content = file.pendingContent;
  file.pendingContent = undefined;
  file.displayedModified = file.lastModified;
  saveState();

  // 删除服务端快照
  void deleteSnapshot(targetPath);

  diffViewActive = false;
  diffViewFilePath = null;
  toolbarStore.setDiff({ active: false });
  diffBannerStore.hide();
  document.getElementById('content')?.classList.remove('diff-active');
  currentDiffBlockIndex = -1;
  clearDiffMarkers();
  _renderContent();
  if (state.currentFile) _updateToc(state.currentFile);
  _syncAnnotationsForCurrentFile(false);
  _flashContentUpdated();
  await _updateToolbarButtons();
}
