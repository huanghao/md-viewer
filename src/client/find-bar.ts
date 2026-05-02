// ==================== 页面内查找 ====================
export function setupFindBar() {
  // 创建 find bar DOM
  const bar = document.createElement('div');
  bar.id = 'findBar';
  bar.innerHTML = `
    <input id="findBarInput" type="text" placeholder="查找..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="上一个 (⇧⌘G)">&#8593;</button>
    <button id="findBarNext" title="下一个 (⌘G)">&#8595;</button>
    <button id="findBarClose" title="关闭 (Esc)">&#10005;</button>
  `;
  document.body.appendChild(bar);

  const input = document.getElementById('findBarInput') as HTMLInputElement;
  const countEl = document.getElementById('findBarCount') as HTMLElement;
  const prevBtn = document.getElementById('findBarPrev') as HTMLButtonElement;
  const nextBtn = document.getElementById('findBarNext') as HTMLButtonElement;
  const closeBtn = document.getElementById('findBarClose') as HTMLButtonElement;

  let matches: Range[] = [];
  let currentIndex = -1;
  let highlightContainer: HTMLElement | null = null;

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
    countEl.textContent = '';
  }

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatches(query: string) {
    clearHighlights();
    if (!query) return;

    const content = document.getElementById('content');
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
    updateCount();
  }

  function scrollToMatch(index: number) {
    const content = document.getElementById('content');
    if (!content) return;
    const marks = content.querySelectorAll('mark.find-highlight');
    marks.forEach((m, i) => {
      m.classList.toggle('find-highlight-current', i === index);
    });
    const current = marks[index] as HTMLElement | undefined;
    if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function updateCount() {
    if (matches.length === 0) {
      countEl.textContent = input.value ? '无结果' : '';
      countEl.className = input.value ? 'no-result' : '';
    } else {
      countEl.textContent = `${currentIndex + 1} / ${matches.length}`;
      countEl.className = '';
    }
  }

  function next() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex + 1) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function prev() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function show() {
    bar.classList.add('visible');
    input.focus();
    input.select();
    if (input.value) highlightMatches(input.value);
  }

  function hide() {
    bar.classList.remove('visible');
    clearHighlights();
  }

  // 暴露给 Swift 调用（Swift 通过 evaluateJavaScript("window.__showFindBar(true/false)") 调用）
  (window as any).__showFindBar = show;

  input.addEventListener('input', () => highlightMatches(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.shiftKey ? prev() : next();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      hide();
      e.preventDefault();
    }
  });
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  closeBtn.addEventListener('click', hide);
}
