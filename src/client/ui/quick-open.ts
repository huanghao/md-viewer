import { searchWorkspaceFiles } from '../api/files';
import { fuzzyMatch } from '../utils/fuzzy-search';
import type { PathSuggestion } from '../types';

interface QuickOpenDeps {
  getOpenFilePaths: () => string[];
  openFile: (path: string) => Promise<void>;
  switchToOpen: (path: string) => void;
}

let overlay: HTMLElement | null = null;
let deps: QuickOpenDeps | null = null;
let activeIndex = 0;
let results: Array<{ suggestion: PathSuggestion; isOpen: boolean }> = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function initQuickOpen(d: QuickOpenDeps): void {
  deps = d;
}

export function showQuickOpen(): void {
  if (!overlay) overlay = buildOverlay();
  overlay.style.display = 'flex';
  const input = overlay.querySelector('.quick-open-input') as HTMLInputElement;
  input.value = '';
  input.focus();
  activeIndex = 0;
  results = [];
  renderResults('');
}

export function hideQuickOpen(): void {
  if (overlay) overlay.style.display = 'none';
}

export function isQuickOpenVisible(): boolean {
  return overlay !== null && overlay.style.display !== 'none';
}

function buildOverlay(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'quick-open-overlay';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="quick-open-panel">
      <div class="quick-open-input-row">
        <span class="quick-open-search-icon">🔍</span>
        <input class="quick-open-input" placeholder="搜索文件…" autocomplete="off" spellcheck="false" />
        <span class="quick-open-hint">Esc 关闭</span>
      </div>
      <div class="quick-open-results"></div>
      <div class="quick-open-footer">
        <span class="quick-open-footer-hint"><kbd>↑↓</kbd> 选择</span>
        <span class="quick-open-footer-hint"><kbd>↵</kbd> 打开</span>
        <span class="quick-open-footer-hint"><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  `;

  const input = el.querySelector('.quick-open-input') as HTMLInputElement;
  input.addEventListener('input', () => scheduleSearch(input.value));
  input.addEventListener('keydown', (e) => handleKey(e));

  el.addEventListener('mousedown', (e) => {
    if (e.target === el) hideQuickOpen();
  });

  document.body.appendChild(el);
  return el;
}

function scheduleSearch(query: string): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => renderResults(query), 80);
}

async function renderResults(query: string): Promise<void> {
  if (!overlay || !deps) return;
  const container = overlay.querySelector('.quick-open-results') as HTMLElement;
  const openPaths = new Set(deps.getOpenFilePaths());

  const openMatches: PathSuggestion[] = [];
  const fileMatches: PathSuggestion[] = [];

  if (query.trim()) {
    try {
      const hits = await searchWorkspaceFiles(query);
      for (const h of hits) {
        const s: PathSuggestion = { path: h.path, display: h.display, type: 'file' };
        if (openPaths.has(h.path)) openMatches.push(s);
        else fileMatches.push(s);
      }
    } catch {
      // ignore fetch errors
    }
  } else {
    for (const path of openPaths) {
      const display = path.split('/').pop() ?? path;
      openMatches.push({ path, display, type: 'file' });
    }
  }

  results = [
    ...openMatches.map((s) => ({ suggestion: s, isOpen: true })),
    ...fileMatches.map((s) => ({ suggestion: s, isOpen: false })),
  ];
  activeIndex = results.length > 0 ? 0 : -1;

  if (results.length === 0) {
    container.innerHTML = `<div class="quick-open-empty">${query ? '没有匹配的文件' : '暂无已打开的文件'}</div>`;
    return;
  }

  let html = '';
  let openSectionAdded = false;
  let fileSectionAdded = false;

  results.forEach((item, i) => {
    const { suggestion: s, isOpen } = item;
    const cls = `quick-open-item${i === activeIndex ? ' active' : ''}`;
    const parentDir = s.path.slice(0, s.path.lastIndexOf('/') + 1);
    const nameHtml = query.trim()
      ? highlightMatch(s.display, query)
      : escapeHtml(s.display);

    if (isOpen && !openSectionAdded) {
      html += '<div class="quick-open-section-label">已打开</div>';
      openSectionAdded = true;
    }
    if (!isOpen && !fileSectionAdded) {
      html += '<div class="quick-open-section-label">文件</div>';
      fileSectionAdded = true;
    }

    html += `
      <div class="${cls}" data-index="${i}">
        <span class="quick-open-item-icon">📄</span>
        <span class="quick-open-item-name">${nameHtml}</span>
        ${isOpen ? '<span class="quick-open-tab-badge">已打开</span>' : ''}
        <span class="quick-open-item-path">${escapeHtml(parentDir)}</span>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.quick-open-item').forEach((el) => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const index = Number((el as HTMLElement).dataset.index);
      selectItem(index);
    });
    el.addEventListener('mouseover', () => {
      const index = Number((el as HTMLElement).dataset.index);
      activeIndex = index;
      updateActiveClass();
    });
  });
}

function handleKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    hideQuickOpen();
    return;
  }
  const isNext = e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey);
  const isPrev = e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey);
  if (isNext) {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, results.length - 1);
    updateActiveClass();
    return;
  }
  if (isPrev) {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    updateActiveClass();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    selectItem(activeIndex);
  }
}

function selectItem(index: number): void {
  const item = results[index];
  if (!item || !deps) return;
  hideQuickOpen();
  if (item.isOpen) {
    deps.switchToOpen(item.suggestion.path);
  } else {
    void deps.openFile(item.suggestion.path);
  }
}

function updateActiveClass(): void {
  if (!overlay) return;
  overlay.querySelectorAll('.quick-open-item').forEach((el, i) => {
    el.classList.toggle('active', i === activeIndex);
  });
  const active = overlay.querySelector('.quick-open-item.active');
  active?.scrollIntoView({ block: 'nearest' });
}

function highlightMatch(text: string, query: string): string {
  return fuzzyMatch(text, query)?.highlight ?? escapeHtml(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
