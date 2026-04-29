import { fetchTodos, apiCreateTodo, apiUpdateTodo, apiDeleteTodo, type ClientTodo } from '../api/todos';
import { relativeTime } from '../utils/relative-time';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { showToast } from './toast';

const LONG_QUOTE_THRESHOLD = 80;

let _todos: ClientTodo[] = [];
let _filter: 'open' | 'all' = 'open';
let _pendingUndo: { id: string; wasIndex: number } | null = null;
let _copyTargetId: string | null = null;

// ── Data ──────────────────────────────────────────────────────────────────

export async function loadAndRenderTodos(): Promise<void> {
  const filter = _filter === 'open' ? { done: false } : undefined;
  _todos = await fetchTodos(filter);
  renderTodoList();
  updateTodoTabCount();
}

// ── Render ────────────────────────────────────────────────────────────────

function renderTodoList(): void {
  const container = document.getElementById('todoListContainer');
  if (!container) return;

  const open = _todos.filter(t => !t.done);
  const done = _todos.filter(t => t.done);

  let html = open.length === 0
    ? '<div style="padding:20px 14px;color:#a8a29e;font-size:12.5px;text-align:center;">暂无待办 Todo</div>'
    : open.map(renderTodoItem).join('');

  if (done.length > 0) {
    html += `
      <div class="todo-done-section">
        <div class="todo-done-toggle" id="todoDoneToggle" onclick="window._todoDoneToggle()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 4l4 4-4 4"/></svg>
          已完成 · ${done.length}
        </div>
        <div class="todo-done-items" id="todoDoneItems">
          ${done.map(renderTodoItem).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderTodoItem(todo: ClientTodo): string {
  const isLong = todo.quote.length > LONG_QUOTE_THRESHOLD;
  const fileName = todo.filePath.split('/').pop() ?? todo.filePath;
  const time = relativeTime(todo.createdAt);
  const fullTime = new Date(todo.createdAt).toLocaleString();

  return `
    <div class="todo-item${todo.done ? ' done' : ''}${isLong ? ' todo-item-long' : ''}" data-todo-id="${escapeAttr(todo.id)}">
      <div class="todo-cb${todo.done ? ' checked' : ''}" onclick="window._todoCheck('${escapeAttr(todo.id)}')" title="标记完成"></div>
      <div class="todo-item-body">
        <div class="todo-item-top">
          <span class="todo-item-file" title="${escapeAttr(todo.filePath)}" onclick="window._todoJump('${escapeAttr(todo.id)}')">${escapeHtml(fileName)}</span>
          <span class="todo-item-time" title="${escapeAttr(fullTime)}">${escapeHtml(time)}</span>
        </div>
        <div class="todo-item-quote${''}" id="tq-${escapeAttr(todo.id)}">"${escapeHtml(todo.quote)}"</div>
        ${isLong ? `<button class="todo-item-expand" onclick="window._todoExpandQuote('${escapeAttr(todo.id)}')">展开 ↓</button>` : ''}
        ${todo.note ? `<div class="todo-item-note">${escapeHtml(todo.note)}</div>` : ''}
      </div>
      <div class="todo-item-actions">
        <button class="todo-item-action" onclick="window._todoCopyMenu(event,'${escapeAttr(todo.id)}')" title="复制">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="4" width="8" height="10" rx="1.5"/><path d="M3 11V3a1 1 0 011-1h7"/></svg>
        </button>
        <button class="todo-item-action del" onclick="window._todoDelete('${escapeAttr(todo.id)}')" title="删除">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4M5 5l.5 8h5l.5-8"/></svg>
        </button>
      </div>
    </div>
  `;
}

export function updateTodoTabCount(): void {
  const el = document.getElementById('todoTabCount');
  if (!el) return;
  const openCount = _todos.filter(t => !t.done).length;
  el.textContent = openCount > 0 ? ` ${openCount}` : '';
}

// ── Actions ───────────────────────────────────────────────────────────────

async function todoCheck(id: string): Promise<void> {
  const todo = _todos.find(t => t.id === id);
  if (!todo || todo.done) return;

  // Optimistic UI: animate out
  const itemEl = document.querySelector(`.todo-item[data-todo-id="${CSS.escape(id)}"]`) as HTMLElement | null;
  if (itemEl) {
    itemEl.classList.add('done');
    const cb = itemEl.querySelector('.todo-cb');
    cb?.classList.add('checked');
  }

  _pendingUndo = { id, wasIndex: _todos.findIndex(t => t.id === id) };

  showToast({
    message: '已完成',
    type: 'success',
    duration: 4500,
    action: {
      label: '撤销',
      onClick: () => undoCheck(),
    },
  });

  // After animation delay, persist and re-render
  setTimeout(async () => {
    if (!_pendingUndo || _pendingUndo.id !== id) return; // user undid
    _pendingUndo = null;
    await apiUpdateTodo(id, { done: true });
    await loadAndRenderTodos();
  }, 600);
}

async function undoCheck(): Promise<void> {
  if (!_pendingUndo) return;
  const { id } = _pendingUndo;
  _pendingUndo = null;
  // Re-render immediately (optimistic undo)
  const itemEl = document.querySelector(`.todo-item[data-todo-id="${CSS.escape(id)}"]`) as HTMLElement | null;
  if (itemEl) {
    itemEl.classList.remove('done', 'removing');
    itemEl.querySelector('.todo-cb')?.classList.remove('checked');
  }
}

async function todoDelete(id: string): Promise<void> {
  const itemEl = document.querySelector(`.todo-item[data-todo-id="${CSS.escape(id)}"]`) as HTMLElement | null;
  if (itemEl) itemEl.classList.add('removing');
  setTimeout(async () => {
    await apiDeleteTodo(id);
    _todos = _todos.filter(t => t.id !== id);
    renderTodoList();
    updateTodoTabCount();
  }, 280);
}

function todoExpandQuote(id: string): void {
  const q = document.getElementById(`tq-${id}`);
  const btn = document.querySelector(`.todo-item[data-todo-id="${CSS.escape(id)}"] .todo-item-expand`) as HTMLButtonElement | null;
  if (!q || !btn) return;
  q.classList.toggle('expanded');
  btn.textContent = q.classList.contains('expanded') ? '收起 ↑' : '展开 ↓';
}

function todoJump(id: string): void {
  const todo = _todos.find(t => t.id === id);
  if (!todo) return;
  // Try to open the file; if it exists, switch to it
  const switchFile = (window as any).switchFile as ((path: string) => void) | undefined;
  if (switchFile) switchFile(todo.filePath);
  // TODO: after file loads, attempt anchor jump using quotePrefix/quoteSuffix
}

function todoCopyMenu(e: MouseEvent, id: string): void {
  e.stopPropagation();
  _copyTargetId = id;
  const menu = document.getElementById('todoCopyMenu');
  if (!menu) return;
  menu.classList.remove('hidden');
  const x = Math.min(e.clientX - 10, window.innerWidth - 200);
  const y = Math.min(e.clientY + 4, window.innerHeight - 120);
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

function hideCopyMenu(): void {
  document.getElementById('todoCopyMenu')?.classList.add('hidden');
}

function copyTodoField(field: 'file' | 'quote' | 'both'): void {
  const todo = _todos.find(t => t.id === _copyTargetId);
  if (!todo) return;
  const fileName = todo.filePath.split('/').pop() ?? todo.filePath;
  const text = field === 'file' ? fileName
             : field === 'quote' ? todo.quote
             : `${fileName}\n${todo.quote}`;
  navigator.clipboard.writeText(text).catch(() => {});
  showToast({ message: '已复制', type: 'success', duration: 2000 });
  hideCopyMenu();
}

// ── Composer ──────────────────────────────────────────────────────────────

interface ComposerPending {
  quote: string;
  filePath: string;
  quotePrefix?: string;
  quoteSuffix?: string;
}

let _composerPending: ComposerPending | null = null;

export function showTodoComposer(data: ComposerPending & { x?: number; y?: number }): void {
  const composer = document.getElementById('todoComposer');
  const quoteEl = document.getElementById('todoComposerQuote');
  const noteEl = document.getElementById('todoComposerNote') as HTMLTextAreaElement | null;
  if (!composer || !quoteEl || !noteEl) return;

  _composerPending = { quote: data.quote, filePath: data.filePath, quotePrefix: data.quotePrefix, quoteSuffix: data.quoteSuffix };
  quoteEl.textContent = data.quote;
  noteEl.value = '';

  // Position near selection
  if (data.x !== undefined && data.y !== undefined) {
    const left = Math.min(data.x, window.innerWidth - 360);
    const top = Math.min(data.y, window.innerHeight - 260);
    composer.style.left = `${left}px`;
    composer.style.top = `${top}px`;
  } else {
    composer.style.right = '12px';
    composer.style.bottom = '80px';
    composer.style.left = '';
    composer.style.top = '';
  }

  composer.classList.remove('hidden');
  noteEl.focus();
}

function hideTodoComposer(): void {
  document.getElementById('todoComposer')?.classList.add('hidden');
  _composerPending = null;
}

async function saveTodoFromComposer(): Promise<void> {
  if (!_composerPending) return;
  const noteEl = document.getElementById('todoComposerNote') as HTMLTextAreaElement | null;
  const note = noteEl?.value.trim() ?? '';
  hideTodoComposer();
  await apiCreateTodo({ ...(_composerPending as any), note });
  await loadAndRenderTodos();
  // Switch to todo tab so user sees the new item
  const switchTab = (window as any).switchAnnotationTab as ((tab: string) => void) | undefined;
  if (switchTab) switchTab('todo');
  const openSidebar = (window as any).openAnnotationSidebar as (() => void) | undefined;
  if (openSidebar) openSidebar();
}

// ── Filter ────────────────────────────────────────────────────────────────

export function setTodoFilter(filter: 'open' | 'all'): void {
  _filter = filter;
  document.querySelectorAll('.todo-filter-pill').forEach(pill => {
    pill.classList.toggle('active', (pill as HTMLElement).dataset.filter === filter);
  });
  loadAndRenderTodos();
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initTodoPanel(): void {
  // Composer buttons
  document.getElementById('todoComposerClose')?.addEventListener('click', hideTodoComposer);
  document.getElementById('todoComposerCancel')?.addEventListener('click', hideTodoComposer);
  document.getElementById('todoComposerSave')?.addEventListener('click', saveTodoFromComposer);
  document.getElementById('todoComposerNote')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      saveTodoFromComposer();
    }
    if (ev.key === 'Escape') hideTodoComposer();
  });

  // Copy menu items
  document.getElementById('todoCopyFile')?.addEventListener('click', () => copyTodoField('file'));
  document.getElementById('todoCopyQuote')?.addEventListener('click', () => copyTodoField('quote'));
  document.getElementById('todoCopyBoth')?.addEventListener('click', () => copyTodoField('both'));

  // Hide copy menu on outside click
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('todoCopyMenu');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target as Node)) {
      hideCopyMenu();
    }
  });

  // Listen for todo:open-composer event from annotation.ts
  document.addEventListener('todo:open-composer', (e: Event) => {
    const detail = (e as CustomEvent).detail as ComposerPending & { x?: number; y?: number };
    showTodoComposer(detail);
  });

  // Expose to window for inline onclick handlers and external callers
  (window as any)._todoCheck = todoCheck;
  (window as any)._todoDelete = todoDelete;
  (window as any)._todoExpandQuote = todoExpandQuote;
  (window as any)._todoJump = todoJump;
  (window as any)._todoCopyMenu = todoCopyMenu;
  (window as any)._todoDoneToggle = () => {
    const toggle = document.getElementById('todoDoneToggle');
    const items = document.getElementById('todoDoneItems');
    toggle?.classList.toggle('open');
    items?.classList.toggle('visible');
  };
  (window as any).setTodoFilter = setTodoFilter;
  (window as any).showTodoComposer = showTodoComposer;
}
