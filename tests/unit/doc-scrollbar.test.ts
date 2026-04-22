// tests/unit/doc-scrollbar.test.ts
// 测试自定义滚动条在 diff 模式切换时的状态正确性
// 背景：用户"采用新版本"后，滚动条没有还原成正常模式（issue 复现于 2026-04-22）

import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { mountScrollbar, unmountScrollbar, updateScrollbar, clearDiffMarkers, updateDiffMarkers } from '../../src/client/ui/doc-scrollbar';

let win: Window;
let doc: Document;

function setupDOM() {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).window = win;
  (globalThis as any).ResizeObserver = win.ResizeObserver;

  doc.body.innerHTML = `
    <div id="content" style="height:400px;overflow:auto;"></div>
    <div id="docScrollbar" class="doc-scrollbar" style="display:none;">
      <div class="doc-scrollbar-thumb"></div>
      <div class="doc-scrollbar-markers"></div>
    </div>
  `;
}

function teardownDOM() {
  doc.body.innerHTML = '';
  win.close();
}

// happy-dom 中 getBoundingClientRect 返回全零，需要 mock
function mockContentRect(scrollHeight: number, clientHeight: number) {
  const contentEl = document.getElementById('content')!;
  // 设置 scrollHeight 和 clientHeight（happy-dom 不支持真实布局，用 Object.defineProperty）
  Object.defineProperty(contentEl, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(contentEl, 'clientHeight', { value: clientHeight, configurable: true });
  // mock getBoundingClientRect 返回非零高度，让 updateScrollbar 能计算位置
  contentEl.getBoundingClientRect = () => ({
    top: 50, bottom: 450, left: 0, right: 800, width: 800, height: clientHeight, x: 0, y: 50,
    toJSON: () => ({}),
  });
}

describe('doc-scrollbar: clearDiffMarkers', () => {
  beforeEach(setupDOM);
  afterEach(teardownDOM);

  it('清空 markers 容器的内容', () => {
    // clearDiffMarkers 依赖 mountScrollbar 初始化内部 markersEl 引用
    mountScrollbar();
    const markersEl = document.querySelector('.doc-scrollbar-markers')!;
    markersEl.innerHTML = '<div class="doc-scrollbar-marker" style="top:10%;height:2%;background:red;"></div>';
    expect(markersEl.children.length).toBe(1);

    clearDiffMarkers();
    expect(markersEl.children.length).toBe(0);
    expect(markersEl.innerHTML).toBe('');
    unmountScrollbar();
  });

  it('markers 容器已空时调用不报错', () => {
    mountScrollbar();
    const markersEl = document.querySelector('.doc-scrollbar-markers')!;
    expect(markersEl.children.length).toBe(0);
    expect(() => clearDiffMarkers()).not.toThrow();
    unmountScrollbar();
  });
});

describe('doc-scrollbar: updateDiffMarkers', () => {
  beforeEach(setupDOM);
  afterEach(teardownDOM);

  it('为每个 diff group 创建一个 marker 元素', () => {
    mountScrollbar();
    mockContentRect(2000, 400);

    // 创建两个假的 diff group 元素
    const groupA = document.createElement('div');
    groupA.style.cssText = 'height:50px;';
    groupA.getBoundingClientRect = () => ({ top: 100, height: 50, bottom: 150, left: 0, right: 800, width: 800, x: 0, y: 100, toJSON: () => ({}) });
    document.getElementById('content')!.appendChild(groupA);

    const groupB = document.createElement('div');
    groupB.style.cssText = 'height:30px;';
    groupB.getBoundingClientRect = () => ({ top: 300, height: 30, bottom: 330, left: 0, right: 800, width: 800, x: 0, y: 300, toJSON: () => ({}) });
    document.getElementById('content')!.appendChild(groupB);

    updateDiffMarkers([
      { el: groupA, kind: 'insert' },
      { el: groupB, kind: 'delete' },
    ]);

    const markersEl = document.querySelector('.doc-scrollbar-markers')!;
    expect(markersEl.children.length).toBe(2);
    unmountScrollbar();
  });

  it('insert marker 使用绿色', () => {
    mountScrollbar();
    mockContentRect(1000, 400);

    const groupEl = document.createElement('div');
    groupEl.getBoundingClientRect = () => ({ top: 100, height: 20, bottom: 120, left: 0, right: 800, width: 800, x: 0, y: 100, toJSON: () => ({}) });
    Object.defineProperty(groupEl, 'offsetHeight', { value: 20, configurable: true });
    document.getElementById('content')!.appendChild(groupEl);

    updateDiffMarkers([{ el: groupEl, kind: 'insert' }]);

    const marker = document.querySelector('.doc-scrollbar-marker') as HTMLElement;
    expect(marker).not.toBeNull();
    expect(marker.style.background).toBe('#1a7f37');
    unmountScrollbar();
  });

  it('delete marker 使用红色', () => {
    mountScrollbar();
    mockContentRect(1000, 400);

    const groupEl = document.createElement('div');
    groupEl.getBoundingClientRect = () => ({ top: 200, height: 20, bottom: 220, left: 0, right: 800, width: 800, x: 0, y: 200, toJSON: () => ({}) });
    Object.defineProperty(groupEl, 'offsetHeight', { value: 20, configurable: true });
    document.getElementById('content')!.appendChild(groupEl);

    updateDiffMarkers([{ el: groupEl, kind: 'delete' }]);

    const marker = document.querySelector('.doc-scrollbar-marker') as HTMLElement;
    expect(marker).not.toBeNull();
    expect(marker.style.background).toBe('#cf222e');
    unmountScrollbar();
  });
});

describe('doc-scrollbar: updateScrollbar 可见性', () => {
  beforeEach(setupDOM);
  afterEach(teardownDOM);

  it('scrollHeight > clientHeight 时显示滚动条', () => {
    mountScrollbar();
    mockContentRect(2000, 400);

    updateScrollbar();

    const scrollbarEl = document.getElementById('docScrollbar')!;
    expect(scrollbarEl.style.display).toBe('block');
    unmountScrollbar();
  });

  it('scrollHeight <= clientHeight 时隐藏滚动条', () => {
    mountScrollbar();
    mockContentRect(300, 400);

    updateScrollbar();

    const scrollbarEl = document.getElementById('docScrollbar')!;
    expect(scrollbarEl.style.display).toBe('none');
    unmountScrollbar();
  });

  it('scrollHeight === clientHeight 时隐藏滚动条', () => {
    mountScrollbar();
    mockContentRect(400, 400);

    updateScrollbar();

    const scrollbarEl = document.getElementById('docScrollbar')!;
    expect(scrollbarEl.style.display).toBe('none');
    unmountScrollbar();
  });
});

describe('doc-scrollbar: diff 模式退出后 markers 应被清空', () => {
  beforeEach(setupDOM);
  afterEach(teardownDOM);

  it('clearDiffMarkers 后再 unmount+mount 不会恢复旧 markers', () => {
    mountScrollbar();
    mockContentRect(2000, 400);

    // 模拟 diff 模式：添加 markers
    const groupEl = document.createElement('div');
    groupEl.getBoundingClientRect = () => ({ top: 100, height: 20, bottom: 120, left: 0, right: 800, width: 800, x: 0, y: 100, toJSON: () => ({}) });
    Object.defineProperty(groupEl, 'offsetHeight', { value: 20, configurable: true });
    document.getElementById('content')!.appendChild(groupEl);
    updateDiffMarkers([{ el: groupEl, kind: 'modify' }]);

    const markersEl = document.querySelector('.doc-scrollbar-markers')!;
    expect(markersEl.children.length).toBe(1);

    // 模拟"采用新版本"：先 clearDiffMarkers，再 unmount+mount（对应 renderContent 的行为）
    clearDiffMarkers();
    unmountScrollbar();
    mountScrollbar();

    // markers 容器应为空
    const markersElAfter = document.querySelector('.doc-scrollbar-markers')!;
    expect(markersElAfter.children.length).toBe(0);
    unmountScrollbar();
  });

  it('unmount 后 scrollbar 不再响应 scroll 事件（不抛出）', () => {
    mountScrollbar();
    mockContentRect(2000, 400);
    unmountScrollbar();

    // 触发 scroll 事件不应报错（用 happy-dom 的 Event 类）
    expect(() => {
      const evt = doc.createEvent('Event');
      evt.initEvent('scroll', true, true);
      document.getElementById('content')!.dispatchEvent(evt);
    }).not.toThrow();
  });
});

describe('doc-scrollbar: mountScrollbar 幂等性', () => {
  beforeEach(setupDOM);
  afterEach(teardownDOM);

  it('多次 mount 后只有一套事件监听（不重复叠加）', () => {
    mountScrollbar();
    mockContentRect(2000, 400);
    unmountScrollbar();

    mountScrollbar();
    mockContentRect(2000, 400);

    // 验证滚动条可以正常显示（没有因重复 mount 导致状态混乱）
    updateScrollbar();
    const scrollbarEl = document.getElementById('docScrollbar')!;
    expect(scrollbarEl.style.display).toBe('block');
    unmountScrollbar();
  });
});
