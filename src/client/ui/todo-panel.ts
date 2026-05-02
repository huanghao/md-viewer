import { fetchTodos, apiCreateTodo, apiUpdateTodo, apiDeleteTodo, type ClientTodo } from '../api/todos';
import { relativeTime } from '../utils/relative-time';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { showToast } from './toast';

const LONG_QUOTE_THRESHOLD = 80;

export interface TodoExternalCallbacks {
  switchFile: (path: string) => void;
  switchAnnotationTab: (tab: string) => void;
  openAnnotationSidebar: () => void;
}

let _externalCallbacks: TodoExternalCallbacks | null = null;

export function initTodoExternalCallbacks(cbs: TodoExternalCallbacks): void {
  _externalCallbacks = cbs;
}

let _todos: ClientTodo[] = [];
let _filter: 'open' | 'all' = 'open';
const _pendingUndoTimers = new Map<string, ReturnType<typeof setTimeout>>();
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
        <div class="todo-done-toggle" id="todoDoneToggle" data-action="todo-done-toggle">
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

export function renderTodoItem(todo: ClientTodo): string {
  const isLong = todo.quote.length > LONG_QUOTE_THRESHOLD;
  const fileName = todo.filePath.split('/').pop() ?? todo.filePath;
  const time = relativeTime(todo.createdAt);
  const fullTime = new Date(todo.createdAt).toLocaleString();
  const missingClass = todo.fileMissing ? ' missing' : '';
  const fileTitle = todo.fileMissing ? `${todo.filePath}（文件已删除）` : todo.filePath;
  const jumpAttr = todo.fileMissing ? '' : `data-action="todo-jump" data-id="${escapeAttr(todo.id)}"`;

  return `
    <div class="todo-item${todo.done ? ' done' : ''}${isLong ? ' todo-item-long' : ''}" data-todo-id="${escapeAttr(todo.id)}">
      <div class="todo-cb${todo.done ? ' checked' : ''}" data-action="todo-check" data-id="${escapeAttr(todo.id)}" title="标记完成"></div>
      <div class="todo-item-body">
        <div class="todo-item-top">
          <span class="todo-item-file${missingClass}" title="${escapeAttr(fileTitle)}" ${jumpAttr}>${escapeHtml(fileName)}</span>
          ${todo.fileMissing ? '<span class="todo-item-missing-badge">已删除</span>' : ''}
          <span class="todo-item-time" title="${escapeAttr(fullTime)}">${escapeHtml(time)}</span>
        </div>
        <div class="todo-item-quote" id="tq-${escapeAttr(todo.id)}">"${escapeHtml(todo.quote)}"</div>
        ${isLong ? `<button class="todo-item-expand" data-action="todo-expand-quote" data-id="${escapeAttr(todo.id)}">展开 ↓</button>` : ''}
        ${todo.note ? `<div class="todo-item-note">${escapeHtml(todo.note)}</div>` : ''}
      </div>
      <div class="todo-item-actions">
        <button class="todo-item-action" data-action="todo-copy-menu" data-id="${escapeAttr(todo.id)}" title="复制">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="4" width="8" height="10" rx="1.5"/><path d="M3 11V3a1 1 0 011-1h7"/></svg>
        </button>
        <button class="todo-item-action del" data-action="todo-delete" data-id="${escapeAttr(todo.id)}" title="删除">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4M5 5l.5 8h5l.5-8"/></svg>
        </button>
      </div>
    </div>
  `;
}

export function updateTodoTabCount(): void {
  const openCount = _todos.filter(t => !t.done).length;
  const tabCount = document.getElementById('todoTabCount');
  if (tabCount) tabCount.textContent = openCount > 0 ? ` ${openCount}` : '';
  const badge = document.getElementById('todoFloatingBadge');
  if (badge) {
    badge.textContent = String(openCount);
    badge.classList.toggle('hidden', openCount === 0);
  }
}

// ── Actions ───────────────────────────────────────────────────────────────

async function todoCheck(id: string): Promise<void> {
  const todo = _todos.find(t => t.id === id);
  if (!todo || todo.done) return;

  // Immediately mark done in memory so re-clicks are ignored
  todo.done = true;

  // Persist and re-render immediately — no delay needed, item moves to done section below
  await apiUpdateTodo(id, { done: true });
  renderTodoList();
  updateTodoTabCount();
}

async function undoCheck(id: string): Promise<void> {
  const timer = _pendingUndoTimers.get(id);
  if (timer === undefined) return;
  clearTimeout(timer);
  _pendingUndoTimers.delete(id);
  // Revert in-memory state
  const todo = _todos.find(t => t.id === id);
  if (todo) todo.done = false;
  // Revert UI
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

export function expandQuoteToggle(id: string): void {
  const q = document.getElementById(`tq-${id}`);
  const btn = document.querySelector(`.todo-item[data-todo-id="${CSS.escape(id)}"] .todo-item-expand`) as HTMLButtonElement | null;
  if (!q || !btn) return;
  q.classList.toggle('expanded');
  btn.textContent = q.classList.contains('expanded') ? '收起 ↑' : '展开 ↓';
}

function todoJump(id: string): void {
  const todo = _todos.find(t => t.id === id);
  if (!todo || todo.fileMissing) return;
  // Use open-file API so the file is added to session even if not already open
  fetch('/api/open-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: todo.filePath }),
  }).catch(() => {
    _externalCallbacks?.switchFile(todo.filePath);
  });
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
    const left = Math.max(8, Math.min(data.x, window.innerWidth - 360));
    const top = Math.max(8, Math.min(data.y, window.innerHeight - 260));
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
  // Snapshot before hideTodoComposer clears _composerPending
  const pending = { ..._composerPending };
  hideTodoComposer();
  await apiCreateTodo({ ...pending, note });
  await loadAndRenderTodos();
  _externalCallbacks?.switchAnnotationTab('todo');
  _externalCallbacks?.openAnnotationSidebar();
}

// ── Filter ────────────────────────────────────────────────────────────────

export function setTodoFilter(filter: 'open' | 'all'): void {
  _filter = filter;
  loadAndRenderTodos();
}

// ── Exported pure actions ─────────────────────────────────────────────────

export function doneToggle(): void {
  const toggle = document.getElementById('todoDoneToggle');
  const items = document.getElementById('todoDoneItems');
  toggle?.classList.toggle('open');
  items?.classList.toggle('visible');
}

export interface TodoPanelCallbacks {
  onCheck: (id: string) => void;
  onDelete: (id: string) => void;
  onExpandQuote: (id: string) => void;
  onJump: (id: string) => void;
  onCopyMenu: (id: string, e: MouseEvent) => void;
  onDoneToggle: () => void;
}

export function initTodoPanelActions(container: HTMLElement, callbacks: TodoPanelCallbacks): void {
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id ?? '';
    if (action === 'todo-check') {
      callbacks.onCheck(id);
    } else if (action === 'todo-delete') {
      callbacks.onDelete(id);
    } else if (action === 'todo-expand-quote') {
      callbacks.onExpandQuote(id);
    } else if (action === 'todo-jump') {
      callbacks.onJump(id);
    } else if (action === 'todo-copy-menu') {
      callbacks.onCopyMenu(id, e as MouseEvent);
    } else if (action === 'todo-done-toggle') {
      callbacks.onDoneToggle();
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initTodoPanel(): void {
  // Composer buttons
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

  // 事件委托：todo 列表容器上统一处理所有 data-action 按钮
  const listContainer = document.getElementById('todoListContainer');
  if (listContainer) {
    initTodoPanelActions(listContainer, {
      onCheck: (id) => void todoCheck(id),
      onDelete: (id) => void todoDelete(id),
      onExpandQuote: expandQuoteToggle,
      onJump: todoJump,
      onCopyMenu: (id, e) => todoCopyMenu(e, id),
      onDoneToggle: doneToggle,
    });
  }
  (window as any).setTodoFilter = setTodoFilter;
  (window as any).showTodoComposer = showTodoComposer;

  // Fetch open count on init so tab badge and floating button badge are correct
  // without requiring the user to open the Todo tab first.
  fetchTodos({ done: false }).then(todos => {
    _todos = todos;
    updateTodoTabCount();
  }).catch(() => {});
}
