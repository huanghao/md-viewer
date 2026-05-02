import type { RagResult } from '../types';
import { escapeHtml } from '../utils/escape';

export interface RagPanelCallbacks {
  onOpen: (idx: number) => void;
  switchFile: (path: string) => void;
}

let ragCallbacks: RagPanelCallbacks | null = null;

export function setRagCallbacks(callbacks: RagPanelCallbacks): void {
  ragCallbacks = callbacks;
}

export function initRagPanelActions(): void {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || (sidebar as any).__ragActionsbound) return;
  (sidebar as any).__ragActionsbound = true;
  sidebar.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('[data-action="rag-open"]') as HTMLElement | null;
    if (!actionEl) return;
    const idx = parseInt(actionEl.dataset.idx ?? '', 10);
    if (!isNaN(idx)) void openResult(idx);
  });
}

export function renderRagResultsHTML(results: RagResult[], activeIdx: number): string {
  if (!results.length) return '';
  return results.map((r, i) => {
    const relPath = r.path.split('/').slice(-2).join('/');
    const heading = r.heading ? escapeHtml(r.heading.replace(/^#+\s*/, '')) : '';
    const snippet = escapeHtml(r.text.slice(0, 120));
    const scoreLabel = r.score > 0 ? `${Math.round(r.score * 100)}%` : '文件名';
    return `
      <div class="rag-item${i === activeIdx ? ' active' : ''}"
           data-idx="${i}"
           data-action="rag-open">
        <div class="rag-item-file">
          <span class="rag-item-path">${escapeHtml(relPath)}</span>
          <span class="rag-item-score">${scoreLabel}</span>
        </div>
        ${heading ? `<div class="rag-item-heading">${heading}</div>` : ''}
        <div class="rag-item-snippet">${snippet}</div>
      </div>
    `;
  }).join('');
}

let results: RagResult[] = [];
let activeIdx = 0;
let savedQuery = '';
let savedScrollTop = 0;
let pendingHighlightText: string | null = null;

/** 文件加载完成后由 main.ts onFileLoaded 调用，执行跨文件跳转后的高亮 */
export function flushPendingRagHighlight(): void {
  if (!pendingHighlightText) return;
  const text = pendingHighlightText;
  pendingHighlightText = null;
  setTimeout(() => highlightRagChunk(text), 80);
}

export function renderRagSearchPanel(container: HTMLElement): void {
  container.innerHTML = `
    <div class="rag-search-wrap">
      <div class="search-wrapper rag-search-input-wrap" id="ragSearchInputWrap">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          id="ragSearchInput"
          placeholder="搜索内容… (⌘⇧F)"
          autocomplete="off"
          spellcheck="false"
        />
        <button class="search-clear" id="ragSearchClear" style="display:none;">×</button>
      </div>
      <div class="rag-results-area" id="ragResultsArea"></div>
    </div>
  `;

  bindRagSearchEvents();
  initRagPanelActions();
  renderRagResults();

  const input = document.getElementById('ragSearchInput') as HTMLInputElement;
  if (input && savedQuery) {
    input.value = savedQuery;
    const clear = document.getElementById('ragSearchClear') as HTMLButtonElement;
    if (clear) clear.style.display = 'block';
  }

  if (savedScrollTop) {
    requestAnimationFrame(() => {
      const area = document.getElementById('ragResultsArea');
      if (area) area.scrollTop = savedScrollTop;
    });
  }

  input?.focus();
}

function bindRagSearchEvents(): void {
  const input = document.getElementById('ragSearchInput') as HTMLInputElement;
  const clear = document.getElementById('ragSearchClear') as HTMLButtonElement;
  if (!input || !clear) return;

  input.addEventListener('input', () => {
    clear.style.display = input.value ? 'block' : 'none';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      if (results.length && q === savedQuery) openActive();
      else void runSearch(q);
    }
    else if (e.key === 'Escape') { input.value = ''; clear.style.display = 'none'; clearResults(); }
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    clearResults();
    input.focus();
  });
}

async function runSearch(q: string): Promise<void> {
  if (!q.trim()) { clearResults(); return; }
  savedQuery = q;
  const area = document.getElementById('ragResultsArea');
  if (area) area.innerHTML = `<div class="rag-empty">搜索中…</div>`;
  try {
    const resp = await fetch(`/api/rag-search?q=${encodeURIComponent(q)}&limit=10`);
    const data = await resp.json() as { results: RagResult[]; error?: string };
    results = data.results ?? [];
    activeIdx = 0;
    renderRagResults();
  } catch {
    results = [];
    renderRagResults();
  }
}

function clearResults(): void {
  results = [];
  activeIdx = 0;
  savedQuery = '';
  renderRagResults();
}

function renderRagResults(): void {
  const area = document.getElementById('ragResultsArea');
  if (!area) return;

  if (!results.length) {
    savedScrollTop = 0;
    const input = (document.getElementById('ragSearchInput') as HTMLInputElement)?.value;
    area.innerHTML = input
      ? `<div class="rag-empty">无结果</div>`
      : `<div class="rag-empty">输入关键词搜索文档内容<br><small>支持语义搜索，无需精确匹配</small></div>`;
    return;
  }

  savedScrollTop = area.scrollTop;
  area.innerHTML = renderRagResultsHTML(results, activeIdx);
  area.scrollTop = savedScrollTop;
}

function moveActive(delta: number): void {
  if (!results.length) return;
  activeIdx = Math.max(0, Math.min(results.length - 1, activeIdx + delta));
  renderRagResults();
  document.querySelector(`.rag-item[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' });
}

function openActive(): void {
  if (results[activeIdx]) void openResult(activeIdx);
}

async function openResult(idx: number): Promise<void> {
  const r = results[idx];
  if (!r) return;
  activeIdx = idx;
  renderRagResults();

  // 设置 pending highlight，供 onFileLoaded 完成后执行
  pendingHighlightText = r.text;

  if (ragCallbacks) {
    ragCallbacks.switchFile(r.path);
  }

  // 当前文件已加载时，switchFile 是同步的，onFileLoaded 不会重新调用，直接 highlight
  requestAnimationFrame(() => {
    if (pendingHighlightText === r.text) {
      pendingHighlightText = null;
      setTimeout(() => highlightRagChunk(r.text), 80);
    }
  });
}

function highlightRagChunk(chunkText: string): void {
  const reader = document.getElementById('reader');
  if (!reader) return;

  // Clear previous highlight
  reader.querySelectorAll('mark.rag-highlight').forEach(el => {
    const parent = el.parentNode;
    if (parent) parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
  });

  const needle = chunkText.trim().slice(0, 60);
  if (!needle) return;

  const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const idx = (node.textContent ?? '').indexOf(needle);
    if (idx === -1) continue;

    const before = node.textContent!.slice(0, idx);
    const matched = node.textContent!.slice(idx, idx + needle.length);
    const after = node.textContent!.slice(idx + needle.length);

    const mark = document.createElement('mark');
    mark.className = 'rag-highlight';
    mark.textContent = matched;

    const parent = node.parentNode!;
    parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(mark, node);
    parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
    parent.normalize();

    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      mark.style.transition = 'background 0.5s';
      mark.style.background = 'transparent';
      setTimeout(() => {
        const p = mark.parentNode;
        if (p) p.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
      }, 500);
    }, 3000);

    break;
  }
}

