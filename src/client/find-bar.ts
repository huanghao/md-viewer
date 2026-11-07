import { resolveReaderElement } from './annotation-layout';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FindBar } from './find-bar/FindBar';
import { findBarStore } from './find-bar/store';

// ==================== 页内查找 ====================
// 查找栏界面由 React（find-bar/FindBar.tsx）渲染，状态在 find-bar/store.ts；
// 这里保留命令式的高亮与滚动逻辑，它们直接修改正文 DOM。
export function setupFindBar() {
  const host = document.createElement('div');
  host.id = 'findBarHost';
  document.body.appendChild(host);

  let matches: Range[] = [];
  let currentIndex = -1;
  let highlightContainer: HTMLElement | null = null;

  function publish() {
    findBarStore.setMatches(matches.length, currentIndex);
  }

  function clearHighlights() {
    if (highlightContainer) {
      // unwrap all highlight spans
      highlightContainer.querySelectorAll('mark.find-highlight').forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
          parent.normalize();
        }
      });
    }
    matches = [];
    currentIndex = -1;
    publish();
  }

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatches(query: string) {
    clearHighlights();
    if (!query) return;

    // HTML 文件的内容在 shadow root 里；#content 本身是 shadow host 的外层容器，
    // TreeWalker 从 #content 出发天然穿不进 shadow 边界，必须直接把 root 定位到
    // 已解析出的 reader 元素（md 文件走这条路也完全兼容，行为不变）。
    const content = resolveReaderElement() ?? document.getElementById('content');
    if (!content) return;
    highlightContainer = content;

    const regex = new RegExp(escapeRegex(query), 'gi');
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'mark') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      let match: RegExpExecArray | null;
      const parts: (string | HTMLElement)[] = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const mark = document.createElement('mark');
        mark.className = 'find-highlight';
        mark.textContent = match[0];
        parts.push(mark);
        matches.push(document.createRange()); // placeholder
        lastIndex = match.index + match[0].length;
      }
      if (parts.length === 0) continue;
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));

      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (typeof p === 'string') frag.appendChild(document.createTextNode(p));
        else frag.appendChild(p);
      });
      textNode.parentNode!.replaceChild(frag, textNode);
    }

    // re-collect actual mark elements
    matches = [];
    content.querySelectorAll('mark.find-highlight').forEach((m) => {
      const r = document.createRange();
      r.selectNode(m);
      matches.push(r);
    });

    if (matches.length > 0) {
      currentIndex = 0;
      scrollToMatch(0);
    }
    publish();
  }

  function scrollToMatch(index: number) {
    if (!highlightContainer) return;
    const marks = highlightContainer.querySelectorAll('mark.find-highlight');
    marks.forEach((m, i) => {
      m.classList.toggle('find-highlight-current', i === index);
    });
    const current = marks[index] as HTMLElement | undefined;
    if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function next() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex + 1) % matches.length;
    scrollToMatch(currentIndex);
    publish();
  }

  function prev() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    scrollToMatch(currentIndex);
    publish();
  }

  function show() {
    findBarStore.show();
    const query = findBarStore.getState().query;
    if (query) highlightMatches(query);
  }

  function hide() {
    findBarStore.hide();
    clearHighlights();
  }

  createRoot(host).render(
    createElement(FindBar, {
      callbacks: {
        onQuery: (query: string) => {
          findBarStore.setQuery(query);
          highlightMatches(query);
        },
        onNext: next,
        onPrev: prev,
        onClose: hide,
      },
    }),
  );

  // 原生壳通过 evaluateJavaScript("window.__showFindBar(true/false)") 调用；保留为原生集成点。
  (window as any).__showFindBar = (visible: boolean) => (visible ? show() : hide());
}
