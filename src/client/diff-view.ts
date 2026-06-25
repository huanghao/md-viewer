import { state, saveState } from './state';
import { loadFile } from './api/files';
import { diffLines } from './utils/diff';
import { diffBlocks } from './utils/diff-blocks';
import { mountScrollbar, unmountScrollbar, updateDiffMarkers, clearDiffMarkers } from './ui/doc-scrollbar';
import { shouldRefreshDiff, refreshDiffBannerLabel } from './ui/diff-refresh';
import { buildDiffBannerHTML, initDiffBannerActions, updateBannerForMode } from './ui/diff-banner';
import { renderSidebar } from './ui/sidebar';
import { protectMath } from './utils/math-protect';

// Module-level variables
let diffViewActive = false;
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
}

export function getDiffViewActive(): boolean {
  return diffViewActive;
}

export function setDiffViewActive(value: boolean): void {
  diffViewActive = value;
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

export function renderInlineDiffHTML(lines: import('./utils/diff').DiffLine[]): { html: string; totalBlocks: number } {
  type Segment =
    | { kind: 'equal'; lines: typeof lines }
    | { kind: 'delete'; lines: typeof lines }
    | { kind: 'insert'; lines: typeof lines }
    | { kind: 'modify'; delLines: typeof lines; insLines: typeof lines };

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
    return g.restore((window as any).marked.parse(g.protected));
  };

  // 将严格相邻（无 equal 间隔）的变更段合并为 group
  type Group = { segments: Segment[]; hasChange: boolean };
  const groups: Group[] = [];
  let currentGroup: Group = { segments: [], hasChange: false };

  for (const seg of segments) {
    if (seg.kind !== 'equal') {
      currentGroup.segments.push(seg);
      currentGroup.hasChange = true;
    } else {
      if (currentGroup.hasChange) groups.push(currentGroup);
      groups.push({ segments: [seg], hasChange: false });
      currentGroup = { segments: [], hasChange: false };
    }
  }
  if (currentGroup.hasChange) groups.push(currentGroup);

  let blockIndex = 0;
  let html = '<div class="markdown-body diff-inline-body">';

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

  const banner = document.getElementById('diffBanner');
  if (banner) updateBannerForMode(banner, diffMode);

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

  const countEl = document.getElementById('diffNavCount');
  if (countEl) countEl.textContent = `${nextIndex + 1} / ${total}`;
  const prevBtn = document.getElementById('diffNavPrev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('diffNavNext') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = nextIndex === 0;
  if (nextBtn) nextBtn.disabled = nextIndex === total - 1;
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
  container.innerHTML = `<div class="markdown-body">${g.restore((window as any).marked.parse(g.protected))}</div>`;
  _renderMath(container);

  // Map rendered top-level block elements to diffBlocks[] by index
  const sel = 'p,h1,h2,h3,h4,h5,h6,ul,ol,pre,blockquote,hr,table';
  const blockEls = Array.from(
    container.querySelectorAll<HTMLElement>(sel.split(',').map(s => `.markdown-body > ${s}`).join(','))
  );

  // Mark changed block elements
  const changedEls: HTMLElement[] = [];
  blocks.forEach((block, idx) => {
    if (!block.changed) return;
    const el = blockEls[idx];
    if (!el) return;
    el.dataset.paraChanged = 'true';
    changedEls.push(el);
  });

  // Update banner count
  const banner = document.getElementById('diffBanner');
  if (banner) {
    const countEl = banner.querySelector<HTMLElement>('#diffNavCount');
    if (countEl) countEl.textContent = `1 / ${changedEls.length}`;
    const prevBtn = banner.querySelector<HTMLButtonElement>('#diffNavPrev');
    const nextBtn = banner.querySelector<HTMLButtonElement>('#diffNavNext');
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = changedEls.length <= 1;
  }

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
  const banner = document.getElementById('diffBanner');
  if (banner) {
    const countEl = banner.querySelector<HTMLElement>('#diffNavCount');
    if (countEl) countEl.textContent = `1 / ${totalBlocks}`;
    const prevBtn = banner.querySelector<HTMLButtonElement>('#diffNavPrev');
    const nextBtn = banner.querySelector<HTMLButtonElement>('#diffNavNext');
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = totalBlocks <= 1;
  }

  container.innerHTML = bodyHTML;
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
  refreshDiffBannerLabel(document);
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
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.add('active');
  document.getElementById('content')?.classList.add('diff-active');

  // 插入 banner 到 #content 父元素
  const contentEl = document.getElementById('content');
  const parent = contentEl?.parentElement;
  if (parent && !document.getElementById('diffBanner')) {
    const banner = document.createElement('div');
    banner.id = 'diffBanner';
    banner.className = 'diff-banner';
    banner.innerHTML = buildDiffBannerHTML();
    initDiffBannerActions(banner, {
      onNavigate: (dir) => {
        if (diffMode === 'paragraph') {
          navigateParagraphBlock(dir);
        } else {
          navigateDiffBlock(dir);
        }
      },
      onAccept: () => acceptDiffUpdate(),
      onClose: () => closeDiffView(),
      onSwitchMode: () => switchDiffMode(),
    });
    const prevBtn = banner.querySelector<HTMLButtonElement>('#diffNavPrev');
    if (prevBtn) prevBtn.disabled = true;
    parent.insertBefore(banner, contentEl);
  }

  renderDiffView(file.content, newContent);
  _syncAnnotationsForCurrentFile(false);
}

export function closeDiffView(): void {
  diffViewActive = false;
  currentDiffBlockIndex = -1;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  document.getElementById('content')?.classList.remove('diff-active');

  // 移除 banner
  const banner = document.getElementById('diffBanner');
  if (banner) banner.remove();

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
  const countEl = document.getElementById('diffNavCount');
  if (countEl) countEl.textContent = `${nextIndex + 1} / ${totalBlocks}`;
  const prevBtn = document.getElementById('diffNavPrev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('diffNavNext') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = nextIndex === 0;
  if (nextBtn) nextBtn.disabled = nextIndex === totalBlocks - 1;
}

export async function acceptDiffUpdate(): Promise<void> {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!file || file.pendingContent === undefined) return;

  file.content = file.pendingContent;
  file.pendingContent = undefined;
  file.displayedModified = file.lastModified;
  saveState();

  diffViewActive = false;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  const banner = document.getElementById('diffBanner');
  if (banner) banner.remove();
  document.getElementById('content')?.classList.remove('diff-active');
  currentDiffBlockIndex = -1;
  clearDiffMarkers();
  _renderContent();
  _updateToc(state.currentFile);
  _syncAnnotationsForCurrentFile(false);
  _flashContentUpdated();
  renderSidebar();
  await _updateToolbarButtons();
}
