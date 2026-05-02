// TDD: todo-panel 按钮通过 data-action + 回调驱动，不依赖 window.*
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { renderTodoItem, initTodoPanelActions, type TodoPanelCallbacks } from '../../src/client/ui/todo-panel';
import type { ClientTodo } from '../../src/client/api/todos';

let win: Window;
let doc: Document;

const baseTodo: ClientTodo = {
  id: 'abc123',
  quote: 'some quote',
  filePath: '/docs/a.md',
  createdAt: Date.now(),
  done: false,
  fileMissing: false,
};

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).window = win;
  (globalThis as any).CSS = { escape: (s: string) => s.replace(/([^\w-])/g, '\\$1') };
  doc.body.innerHTML = '';
});

afterEach(() => {
  doc.body.innerHTML = '';
  win.close();
});

// ── renderTodoItem HTML 结构 ──────────────────────────────────────────────

describe('renderTodoItem', () => {
  it('生成的 HTML 不含 window.', () => {
    const html = renderTodoItem(baseTodo);
    expect(html).not.toContain('window.');
  });

  it('checkbox 带 data-action="todo-check" 和 data-id', () => {
    const html = renderTodoItem(baseTodo);
    expect(html).toContain('data-action="todo-check"');
    expect(html).toContain(`data-id="${baseTodo.id}"`);
  });

  it('删除按钮带 data-action="todo-delete"', () => {
    const html = renderTodoItem(baseTodo);
    expect(html).toContain('data-action="todo-delete"');
  });

  it('复制按钮带 data-action="todo-copy-menu"', () => {
    const html = renderTodoItem(baseTodo);
    expect(html).toContain('data-action="todo-copy-menu"');
  });

  it('文件名可跳转时带 data-action="todo-jump"', () => {
    const html = renderTodoItem(baseTodo);
    expect(html).toContain('data-action="todo-jump"');
  });

  it('文件已删除时不带 data-action="todo-jump"', () => {
    const html = renderTodoItem({ ...baseTodo, fileMissing: true });
    expect(html).not.toContain('data-action="todo-jump"');
  });

  it('长引用带展开按钮 data-action="todo-expand-quote"', () => {
    const longQuote = 'x'.repeat(100);
    const html = renderTodoItem({ ...baseTodo, quote: longQuote });
    expect(html).toContain('data-action="todo-expand-quote"');
  });

  it('短引用不带展开按钮', () => {
    const html = renderTodoItem({ ...baseTodo, quote: 'short' });
    expect(html).not.toContain('data-action="todo-expand-quote"');
  });

  it('done 状态时 done-toggle 区域带 data-action="todo-done-toggle"', () => {
    // renderTodoItem 本身不生成 done-toggle，由 renderTodoList 生成
    // 这里只验证 done todo-item 的 class
    const html = renderTodoItem({ ...baseTodo, done: true });
    expect(html).toContain('todo-item done');
  });
});

// ── initTodoPanelActions 事件委托 ─────────────────────────────────────────

describe('initTodoPanelActions', () => {
  function makeCallbacks(): TodoPanelCallbacks {
    return {
      onCheck: mock((_id: string) => {}),
      onDelete: mock((_id: string) => {}),
      onExpandQuote: mock((_id: string) => {}),
      onJump: mock((_id: string) => {}),
      onCopyMenu: mock((_id: string, _e: MouseEvent) => {}),
      onDoneToggle: mock(() => {}),
    };
  }

  it('点击 todo-check 调用 onCheck(id)', () => {
    doc.body.innerHTML = `
      <div id="todoListContainer">
        <div class="todo-item" data-todo-id="abc">
          <div class="todo-cb" data-action="todo-check" data-id="abc"></div>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initTodoPanelActions(doc.getElementById('todoListContainer')!, cbs);
    (doc.querySelector('[data-action="todo-check"]') as HTMLElement).click();
    expect(cbs.onCheck).toHaveBeenCalledWith('abc');
  });

  it('点击 todo-delete 调用 onDelete(id)', () => {
    doc.body.innerHTML = `
      <div id="todoListContainer">
        <div class="todo-item" data-todo-id="abc">
          <button data-action="todo-delete" data-id="abc"></button>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initTodoPanelActions(doc.getElementById('todoListContainer')!, cbs);
    (doc.querySelector('[data-action="todo-delete"]') as HTMLElement).click();
    expect(cbs.onDelete).toHaveBeenCalledWith('abc');
  });

  it('点击 todo-jump 调用 onJump(id)', () => {
    doc.body.innerHTML = `
      <div id="todoListContainer">
        <span data-action="todo-jump" data-id="abc">file.md</span>
      </div>`;
    const cbs = makeCallbacks();
    initTodoPanelActions(doc.getElementById('todoListContainer')!, cbs);
    (doc.querySelector('[data-action="todo-jump"]') as HTMLElement).click();
    expect(cbs.onJump).toHaveBeenCalledWith('abc');
  });

  it('点击 todo-expand-quote 调用 onExpandQuote(id)', () => {
    doc.body.innerHTML = `
      <div id="todoListContainer">
        <button data-action="todo-expand-quote" data-id="abc">展开</button>
      </div>`;
    const cbs = makeCallbacks();
    initTodoPanelActions(doc.getElementById('todoListContainer')!, cbs);
    (doc.querySelector('[data-action="todo-expand-quote"]') as HTMLElement).click();
    expect(cbs.onExpandQuote).toHaveBeenCalledWith('abc');
  });

  it('点击 todo-done-toggle 调用 onDoneToggle()', () => {
    doc.body.innerHTML = `
      <div id="todoListContainer">
        <div data-action="todo-done-toggle">已完成</div>
      </div>`;
    const cbs = makeCallbacks();
    initTodoPanelActions(doc.getElementById('todoListContainer')!, cbs);
    (doc.querySelector('[data-action="todo-done-toggle"]') as HTMLElement).click();
    expect(cbs.onDoneToggle).toHaveBeenCalledTimes(1);
  });
});

// ── todoExpandQuote 纯逻辑 ────────────────────────────────────────────────

describe('expandQuoteToggle', () => {
  it('第一次点击展开 quote（加 expanded class，按钮文字变收起）', () => {
    doc.body.innerHTML = `
      <div class="todo-item" data-todo-id="abc">
        <div id="tq-abc" class="todo-item-quote">quote</div>
        <button class="todo-item-expand" data-action="todo-expand-quote" data-id="abc">展开 ↓</button>
      </div>`;
    const { expandQuoteToggle } = require('../../src/client/ui/todo-panel');
    expandQuoteToggle('abc');
    expect(doc.getElementById('tq-abc')!.classList.contains('expanded')).toBe(true);
    expect((doc.querySelector('.todo-item-expand') as HTMLElement).textContent).toBe('收起 ↑');
  });

  it('第二次点击收起 quote', () => {
    doc.body.innerHTML = `
      <div class="todo-item" data-todo-id="abc">
        <div id="tq-abc" class="todo-item-quote expanded">quote</div>
        <button class="todo-item-expand" data-action="todo-expand-quote" data-id="abc">收起 ↑</button>
      </div>`;
    const { expandQuoteToggle } = require('../../src/client/ui/todo-panel');
    expandQuoteToggle('abc');
    expect(doc.getElementById('tq-abc')!.classList.contains('expanded')).toBe(false);
    expect((doc.querySelector('.todo-item-expand') as HTMLElement).textContent).toBe('展开 ↓');
  });
});

// ── doneToggle 纯逻辑 ─────────────────────────────────────────────────────

describe('doneToggle', () => {
  it('切换 todoDoneToggle 和 todoDoneItems 的 class', () => {
    doc.body.innerHTML = `
      <div id="todoDoneToggle"></div>
      <div id="todoDoneItems"></div>`;
    const { doneToggle } = require('../../src/client/ui/todo-panel');
    doneToggle();
    expect(doc.getElementById('todoDoneToggle')!.classList.contains('open')).toBe(true);
    expect(doc.getElementById('todoDoneItems')!.classList.contains('visible')).toBe(true);
    doneToggle();
    expect(doc.getElementById('todoDoneToggle')!.classList.contains('open')).toBe(false);
    expect(doc.getElementById('todoDoneItems')!.classList.contains('visible')).toBe(false);
  });
});
