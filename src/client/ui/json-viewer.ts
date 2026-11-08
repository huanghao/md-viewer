import { isJsonlFile } from '../utils/file-type';

// JSON / JSONL 查看器：用 DOM API 构建（不经过 innerHTML），文本内容一律作为 textContent 写入。
// 搜索高亮在原始文本上切分，所以不会切断 HTML 实体。

// ==================== Types ====================

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

// ==================== Helpers ====================

/** 把 text 追加到 parent：命中 query 的部分包进 <mark class="json-match">（大小写不敏感） */
export function appendHighlighted(parent: HTMLElement, text: string, query: string): void {
  if (!query) {
    parent.appendChild(document.createTextNode(text));
    return;
  }
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lt.indexOf(lq, i);
    if (idx === -1) {
      parent.appendChild(document.createTextNode(text.slice(i)));
      break;
    }
    if (idx > i) parent.appendChild(document.createTextNode(text.slice(i, idx)));
    const mark = document.createElement('mark');
    mark.className = 'json-match';
    mark.textContent = text.slice(idx, idx + lq.length);
    parent.appendChild(mark);
    i = idx + lq.length;
  }
}

function span(className: string, text?: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function keyElements(key: string | null, query: string): HTMLElement[] {
  if (key === null) return [];
  const keyEl = span('json-key');
  appendHighlighted(keyEl, JSON.stringify(key), query);
  return [keyEl, span('json-colon', ':')];
}

// ==================== Inline preview ====================

export function inlinePreview(value: JsonValue, maxLen = 60): string {
  const raw = JSON.stringify(value);
  if (raw.length <= maxLen) return raw;
  return raw.slice(0, maxLen) + '…';
}

// ==================== Build nodes ====================

export function renderLeaf(value: JsonValue, query: string): HTMLElement {
  let cls: string;
  let text: string;
  if (value === null) {
    cls = 'json-null';
    text = 'null';
  } else if (typeof value === 'boolean') {
    cls = 'json-boolean';
    text = String(value);
  } else if (typeof value === 'number') {
    cls = 'json-number';
    text = String(value);
  } else {
    cls = 'json-string';
    text = JSON.stringify(value);
  }
  const el = span(cls);
  appendHighlighted(el, text, query);
  return el;
}

export function buildNode(value: JsonValue, key: string | null, depth: number, query: string): HTMLLIElement {
  const li = document.createElement('li');
  const isExpandable = value !== null && typeof value === 'object';

  if (!isExpandable) {
    const row = document.createElement('div');
    row.className = 'json-node';
    row.appendChild(span('json-toggle'));
    for (const el of keyElements(key, query)) row.appendChild(el);
    row.appendChild(renderLeaf(value, query));
    li.appendChild(row);
    return li;
  }

  // 对象或数组：depth 0 展开，其余折叠
  const isArray = Array.isArray(value);
  const entries: Array<[string, JsonValue]> = isArray
    ? (value as JsonArray).map((v, i) => [String(i), v])
    : Object.entries(value as JsonObject);
  const count = entries.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const collapsed = depth >= 1;

  const row = document.createElement('div');
  row.className = 'json-node json-node-expandable';
  row.setAttribute('data-expanded', String(!collapsed));
  row.appendChild(span('json-toggle', collapsed ? '▶' : '▼'));
  for (const el of keyElements(key, query)) row.appendChild(el);
  row.appendChild(span('json-bracket', openBracket));
  row.appendChild(span('json-count', `${count} ${isArray ? 'items' : 'keys'}`));
  if (collapsed) row.appendChild(span('json-preview', inlinePreview(value)));
  const close = span('json-bracket json-close-bracket', closeBracket);
  close.style.display = collapsed ? 'none' : 'inline';
  row.appendChild(close);
  li.appendChild(row);

  const children = document.createElement('ul');
  children.className = collapsed ? 'json-children collapsed' : 'json-children';
  for (const [k, v] of entries) {
    children.appendChild(buildNode(v, isArray ? null : k, depth + 1, query));
  }
  const endLi = document.createElement('li');
  const endRow = document.createElement('div');
  endRow.className = 'json-node';
  endRow.appendChild(span('json-toggle'));
  endRow.appendChild(span('json-bracket', closeBracket));
  endLi.appendChild(endRow);
  children.appendChild(endLi);
  li.appendChild(children);
  return li;
}

// ==================== Search: expand ancestors ====================

function expandMatchingAncestors(container: HTMLElement, query: string): boolean {
  if (!query) return false;
  const lq = query.toLowerCase();
  let anyMatch = false;

  function walk(el: HTMLElement): boolean {
    const nodeDiv = el.querySelector(':scope > .json-node') as HTMLElement | null;
    const childrenUl = el.querySelector(':scope > .json-children') as HTMLElement | null;

    if (!childrenUl) {
      // 叶子：检查文本
      const text = nodeDiv?.textContent?.toLowerCase() || '';
      return text.includes(lq);
    }

    // 可展开节点：递归子节点
    const childLis = Array.from(childrenUl.querySelectorAll(':scope > li')) as HTMLElement[];
    let childMatch = false;
    for (const child of childLis) {
      if (walk(child)) childMatch = true;
    }

    if (childMatch) {
      anyMatch = true;
      if (nodeDiv) {
        nodeDiv.setAttribute('data-expanded', 'true');
        const toggle = nodeDiv.querySelector('.json-toggle');
        if (toggle) toggle.textContent = '▼';
        const closeBracket = nodeDiv.querySelector('.json-close-bracket') as HTMLElement | null;
        if (closeBracket) closeBracket.style.display = 'inline';
        const preview = nodeDiv.querySelector('.json-preview') as HTMLElement | null;
        if (preview) preview.style.display = 'none';
      }
      childrenUl.classList.remove('collapsed');
    }
    return childMatch;
  }

  const rootLis = Array.from(container.querySelectorAll(':scope > ul > li')) as HTMLElement[];
  for (const li of rootLis) walk(li);
  return anyMatch;
}

// ==================== Toggle click handler ====================

function attachToggleHandlers(container: HTMLElement): void {
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const nodeDiv = target.closest('.json-node-expandable') as HTMLElement | null;
    if (!nodeDiv) return;

    const li = nodeDiv.parentElement as HTMLElement;
    const childrenUl = li.querySelector(':scope > .json-children') as HTMLElement | null;
    if (!childrenUl) return;

    const expanded = nodeDiv.getAttribute('data-expanded') === 'true';
    const toggle = nodeDiv.querySelector('.json-toggle');
    const closeBracket = nodeDiv.querySelector('.json-close-bracket') as HTMLElement | null;
    const preview = nodeDiv.querySelector('.json-preview') as HTMLElement | null;

    if (expanded) {
      nodeDiv.setAttribute('data-expanded', 'false');
      if (toggle) toggle.textContent = '▶';
      childrenUl.classList.add('collapsed');
      if (closeBracket) closeBracket.style.display = 'none';
      if (preview) {
        preview.style.display = '';
      } else {
        nodeDiv.appendChild(span('json-preview', '…'));
      }
    } else {
      nodeDiv.setAttribute('data-expanded', 'true');
      if (toggle) toggle.textContent = '▼';
      childrenUl.classList.remove('collapsed');
      if (closeBracket) closeBracket.style.display = 'inline';
      if (preview) preview.style.display = 'none';
    }
  });
}

// ==================== Public API ====================

export function renderJsonContent(
  container: HTMLElement,
  rawText: string,
  filePath: string,
  query: string = '',
): void {
  if (isJsonlFile(filePath)) {
    renderJsonl(container, rawText, query);
  } else {
    renderJson(container, rawText, query);
  }

  attachToggleHandlers(container);

  if (query) {
    const hasMatch = expandMatchingAncestors(container, query);
    if (!hasMatch) {
      const noResults = document.createElement('div');
      noResults.className = 'json-no-results';
      noResults.textContent = '无匹配结果';
      container.appendChild(noResults);
    }
  }
}

function errorBlock(message: string, raw: string): HTMLElement {
  const err = document.createElement('div');
  err.className = 'json-error';
  err.appendChild(document.createTextNode(message));
  const pre = document.createElement('pre');
  pre.textContent = raw;
  err.appendChild(pre);
  return err;
}

function renderJson(container: HTMLElement, rawText: string, query: string): void {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    const viewer = document.createElement('div');
    viewer.className = 'json-viewer';
    viewer.appendChild(errorBlock(`JSON 解析失败：${String(e)}`, rawText.slice(0, 500)));
    container.replaceChildren(viewer);
    return;
  }

  const viewer = document.createElement('div');
  viewer.className = 'json-viewer';
  const ul = document.createElement('ul');
  ul.appendChild(buildNode(parsed, null, 0, query));
  viewer.appendChild(ul);
  container.appendChild(viewer);
}

function renderJsonl(container: HTMLElement, rawText: string, query: string): void {
  const viewer = document.createElement('div');
  viewer.className = 'json-viewer';

  let lineNum = 0;
  for (const line of rawText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    lineNum++;

    const header = document.createElement('div');
    header.className = 'json-line-header';
    header.textContent = `Line ${lineNum}`;
    viewer.appendChild(header);

    let parsed: JsonValue;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      viewer.appendChild(errorBlock(`解析失败：${String(e)}`, trimmed.slice(0, 200)));
      continue;
    }

    const ul = document.createElement('ul');
    ul.appendChild(buildNode(parsed, null, 0, query));
    viewer.appendChild(ul);
  }

  container.appendChild(viewer);
}
