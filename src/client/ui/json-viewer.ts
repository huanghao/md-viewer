import { escapeHtml } from '../utils/escape';
import { isJsonlFile } from '../utils/file-type';

// ==================== Types ====================

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

// ==================== Inline preview ====================

export function inlinePreview(value: JsonValue, maxLen = 60): string {
  const raw = JSON.stringify(value);
  if (raw.length <= maxLen) return escapeHtml(raw);
  return escapeHtml(raw.slice(0, maxLen)) + '…';
}

// ==================== Build node HTML ====================

export function buildNode(
  value: JsonValue,
  key: string | null,
  depth: number,
  query: string,
): string {
  const isExpandable = value !== null && typeof value === 'object';
  const defaultExpanded = depth < 1; // depth 0 children expanded, depth>=1 collapsed

  if (!isExpandable) {
    // Leaf node
    const keyHtml = key !== null
      ? `<span class="json-key">${highlight(escapeHtml(JSON.stringify(key)), query)}</span><span class="json-colon">:</span>`
      : '';
    const valHtml = renderLeaf(value, query);
    return `
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          ${keyHtml}
          ${valHtml}
        </div>
      </li>`;
  }

  // Expandable node (object or array)
  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as JsonArray).map((v, i) => ({ k: String(i), v }))
    : Object.entries(value as JsonObject).map(([k, v]) => ({ k, v }));
  const count = entries.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const collapsed = !defaultExpanded;
  const arrow = collapsed ? '▶' : '▼';
  const childrenClass = collapsed ? 'json-children collapsed' : 'json-children';

  const keyHtml = key !== null
    ? `<span class="json-key">${highlight(escapeHtml(JSON.stringify(key)), query)}</span><span class="json-colon">:</span>`
    : '';

  const previewHtml = collapsed
    ? `<span class="json-preview">${inlinePreview(value)}</span>`
    : '';

  const childrenHtml = entries
    .map(({ k, v }) => buildNode(v, isArray ? null : k, depth + 1, query))
    .join('');

  return `
    <li>
      <div class="json-node json-node-expandable" data-expanded="${!collapsed}">
        <span class="json-toggle">${arrow}</span>
        ${keyHtml}
        <span class="json-bracket">${openBracket}</span>
        <span class="json-count">${count} ${isArray ? 'items' : 'keys'}</span>
        ${previewHtml}
        <span class="json-bracket json-close-bracket" style="display:${collapsed ? 'none' : 'inline'}">${closeBracket}</span>
      </div>
      <ul class="${childrenClass}">
        ${childrenHtml}
        <li><div class="json-node"><span class="json-toggle"></span><span class="json-bracket">${closeBracket}</span></div></li>
      </ul>
    </li>`;
}

export function renderLeaf(value: JsonValue, query: string): string {
  if (value === null) return `<span class="json-null">${highlight('null', query)}</span>`;
  if (typeof value === 'boolean') return `<span class="json-boolean">${highlight(String(value), query)}</span>`;
  if (typeof value === 'number') return `<span class="json-number">${highlight(String(value), query)}</span>`;
  // string
  return `<span class="json-string">${highlight(escapeHtml(JSON.stringify(value)), query)}</span>`;
}

export function highlight(text: string, query: string): string {
  if (!query) return text;
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  let result = '';
  let i = 0;
  while (i < text.length) {
    const idx = lt.indexOf(lq, i);
    if (idx === -1) { result += text.slice(i); break; }
    result += text.slice(i, idx);
    result += `<mark class="json-match">${text.slice(idx, idx + lq.length)}</mark>`;
    i = idx + lq.length;
  }
  return result;
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
      // Leaf li — check text content
      const text = nodeDiv?.textContent?.toLowerCase() || '';
      return text.includes(lq);
    }

    // Expandable — recurse children
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
        const previewSpan = document.createElement('span');
        previewSpan.className = 'json-preview';
        previewSpan.textContent = '…';
        nodeDiv.appendChild(previewSpan);
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
  const isJsonl = isJsonlFile(filePath);

  if (isJsonl) {
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

function renderJson(container: HTMLElement, rawText: string, query: string): void {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    container.innerHTML = `
      <div class="json-viewer">
        <div class="json-error">
          JSON 解析失败：${escapeHtml(String(e))}
          <pre>${escapeHtml(rawText.slice(0, 500))}</pre>
        </div>
      </div>`;
    return;
  }

  const viewer = document.createElement('div');
  viewer.className = 'json-viewer';
  viewer.innerHTML = `<ul>${buildNode(parsed, null, 0, query)}</ul>`;
  container.appendChild(viewer);
}

function renderJsonl(container: HTMLElement, rawText: string, query: string): void {
  const lines = rawText.split('\n');
  const viewer = document.createElement('div');
  viewer.className = 'json-viewer';

  let lineNum = 0;
  for (const line of lines) {
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
      const errDiv = document.createElement('div');
      errDiv.className = 'json-error';
      errDiv.innerHTML = `解析失败：${escapeHtml(String(e))}<pre>${escapeHtml(trimmed.slice(0, 200))}</pre>`;
      viewer.appendChild(errDiv);
      continue;
    }

    const ul = document.createElement('ul');
    ul.innerHTML = buildNode(parsed, null, 0, query);
    viewer.appendChild(ul);
  }

  container.appendChild(viewer);
}
