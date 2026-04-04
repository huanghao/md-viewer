# JSON / JSONL Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collapsible tree-view rendering for `.json` and `.jsonl` files, with search/highlight, integrated into the existing md-viewer workspace sidebar.

**Architecture:** Hand-written pure-TS JSON tree renderer (`json-viewer.ts`) following the same pattern as `renderContent()` in `main.ts`. File-type detection and workspace scanning extended by adding `.json`/`.jsonl` to `isSupportedTextFile()`. Styles appended to `css.ts`.

**Tech Stack:** TypeScript, Bun, esbuild (existing build chain) — zero new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils.ts` | Modify | Add `.json`/`.jsonl` to `isSupportedTextFile()` |
| `src/client/utils/file-type.ts` | Modify | Add `isJsonFile()`, `isJsonlFile()`, update `getFileTypeIcon()` |
| `src/client/ui/json-viewer.ts` | Create | JSON tree renderer: parse, render DOM, toggle expand/collapse, search |
| `src/client/main.ts` | Modify | `renderContent()` JSON branch; `isJsonPath()` helper |
| `src/client/css.ts` | Modify | Append JSON viewer styles |

---

### Task 1: Extend file-type detection

**Files:**
- Modify: `src/utils.ts:21-24`
- Modify: `src/client/utils/file-type.ts`

- [ ] **Step 1: Add `isJson` helpers to `src/utils.ts`**

In `src/utils.ts`, after the `isHtml` function (line 17), add:

```ts
export function isJson(path: string): boolean {
  return path.endsWith(".json") || path.endsWith(".jsonl");
}
```

Then update `isSupportedTextFile` (line 21):

```ts
export function isSupportedTextFile(path: string): boolean {
  const lower = path.toLowerCase();
  return isMarkdown(lower) || isHtml(lower) || isJson(lower);
}
```

- [ ] **Step 2: Add helpers to `src/client/utils/file-type.ts`**

Replace the entire file content:

```ts
// 文件类型检测工具

export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

export function isMarkdownFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'md' || ext === 'markdown';
}

export function isHtmlFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'html' || ext === 'htm';
}

export function isJsonFile(path: string): boolean {
  return getFileExtension(path) === 'json';
}

export function isJsonlFile(path: string): boolean {
  return getFileExtension(path) === 'jsonl';
}

export function getFileTypeIcon(path: string): { cls: 'md' | 'html' | 'json'; label: string } {
  if (isHtmlFile(path)) {
    return { cls: 'html', label: '<>' };
  }
  if (isJsonFile(path) || isJsonlFile(path)) {
    return { cls: 'json', label: '{}' };
  }
  return { cls: 'md', label: 'M' };
}

export function getFileTypeLabel(path: string): string | null {
  if (isMarkdownFile(path)) {
    return null;
  }
  const ext = getFileExtension(path);
  return ext ? `.${ext}` : null;
}
```

- [ ] **Step 3: Build and verify no type errors**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Expected: build succeeds (exit 0). If there are type errors about `cls: 'json'` in sidebar code, check `src/client/ui/sidebar.ts` for any type assertion on `getFileTypeIcon` return and update accordingly.

- [ ] **Step 4: Commit**

```bash
git add src/utils.ts src/client/utils/file-type.ts
git commit -m "feat: add .json/.jsonl to supported file types"
```

---

### Task 2: JSON viewer styles

**Files:**
- Modify: `src/client/css.ts` (append before closing backtick)

- [ ] **Step 1: Append JSON viewer CSS to `src/client/css.ts`**

Find the last line of `src/client/css.ts` which is the closing backtick of the template literal (line 2687). Insert the following block before that closing backtick:

```css
    /* ==================== JSON Viewer ==================== */
    .json-viewer {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: calc(13px * var(--font-scale));
      line-height: 1.6;
      padding: 16px 20px;
      color: #24292e;
      user-select: text;
    }
    .json-viewer ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .json-viewer li {
      padding: 0;
    }
    .json-node {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 1px 0;
      cursor: default;
    }
    .json-node-expandable {
      cursor: pointer;
    }
    .json-node-expandable:hover {
      background: rgba(0,0,0,0.04);
      border-radius: 3px;
    }
    .json-toggle {
      display: inline-block;
      width: 14px;
      font-size: 10px;
      color: #6a737d;
      flex-shrink: 0;
      user-select: none;
    }
    .json-key {
      color: #005cc5;
      white-space: nowrap;
    }
    .json-colon {
      color: #24292e;
      margin-right: 4px;
    }
    .json-string { color: #22863a; }
    .json-number { color: #005cc5; }
    .json-boolean { color: #e36209; }
    .json-null { color: #6a737d; }
    .json-bracket {
      color: #6a737d;
      font-weight: 500;
    }
    .json-count {
      color: #6a737d;
      font-size: 11px;
      margin-left: 4px;
    }
    .json-preview {
      color: #6a737d;
      font-size: 12px;
      margin-left: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
    .json-children {
      padding-left: 20px;
    }
    .json-children.collapsed {
      display: none;
    }
    .json-error {
      background: #ffeef0;
      border: 1px solid #fdb8c0;
      border-radius: 4px;
      padding: 12px 16px;
      color: #b31d28;
      margin-bottom: 12px;
    }
    .json-error pre {
      margin-top: 8px;
      font-size: 12px;
      color: #586069;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .json-line-header {
      font-size: 11px;
      color: #6a737d;
      padding: 4px 0 2px;
      border-top: 1px solid #eaecef;
      margin-top: 8px;
      user-select: none;
    }
    .json-line-header:first-child {
      border-top: none;
      margin-top: 0;
    }
    mark.json-match {
      background: #fff3b0;
      color: inherit;
      border-radius: 2px;
      padding: 0 1px;
    }
    .json-no-results {
      color: #6a737d;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
```

- [ ] **Step 2: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/client/css.ts
git commit -m "feat: add JSON viewer styles"
```

---

### Task 3: JSON tree renderer

**Files:**
- Create: `src/client/ui/json-viewer.ts`

- [ ] **Step 1: Create `src/client/ui/json-viewer.ts`**

```ts
import { escapeHtml } from '../utils/escape';
import { isJsonlFile } from '../utils/file-type';

// ==================== Types ====================

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

// ==================== Inline preview ====================

function inlinePreview(value: JsonValue, maxLen = 60): string {
  const raw = JSON.stringify(value);
  if (raw.length <= maxLen) return escapeHtml(raw);
  return escapeHtml(raw.slice(0, maxLen)) + '…';
}

// ==================== Build node HTML ====================

function buildNode(
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
      ? `<span class="json-key">${highlight(JSON.stringify(key), query)}</span><span class="json-colon">:</span>`
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
  const typeLabel = isArray ? '[]' : '{}';
  const collapsed = !defaultExpanded;
  const arrow = collapsed ? '▶' : '▼';
  const childrenClass = collapsed ? 'json-children collapsed' : 'json-children';

  const keyHtml = key !== null
    ? `<span class="json-key">${highlight(JSON.stringify(key), query)}</span><span class="json-colon">:</span>`
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

function renderLeaf(value: JsonValue, query: string): string {
  if (value === null) return `<span class="json-null">${highlight('null', query)}</span>`;
  if (typeof value === 'boolean') return `<span class="json-boolean">${highlight(String(value), query)}</span>`;
  if (typeof value === 'number') return `<span class="json-number">${highlight(String(value), query)}</span>`;
  // string
  return `<span class="json-string">${highlight(escapeHtml(JSON.stringify(value)), query)}</span>`;
}

function highlight(text: string, query: string): string {
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

  // Walk all leaf nodes and expandable nodes, mark matches bottom-up
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
      // Expand this node
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
      // Collapse
      nodeDiv.setAttribute('data-expanded', 'false');
      if (toggle) toggle.textContent = '▶';
      childrenUl.classList.add('collapsed');
      if (closeBracket) closeBracket.style.display = 'none';
      if (preview) {
        preview.style.display = '';
      } else {
        // Build preview lazily if missing
        const li2 = nodeDiv.parentElement as HTMLElement;
        const previewSpan = document.createElement('span');
        previewSpan.className = 'json-preview';
        // We can't easily re-derive value here, so just show ellipsis
        previewSpan.textContent = '…';
        nodeDiv.appendChild(previewSpan);
      }
    } else {
      // Expand
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
```

- [ ] **Step 2: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/json-viewer.ts
git commit -m "feat: add JSON tree renderer"
```

---

### Task 4: Wire JSON rendering into main.ts

**Files:**
- Modify: `src/client/main.ts`

- [ ] **Step 1: Add import for `renderJsonContent` and `isJsonFile`/`isJsonlFile`**

At the top of `src/client/main.ts`, find the existing import from `'./utils/file-type'`:

```ts
import { getFileTypeIcon, getFileTypeLabel } from './utils/file-type';
```

Replace with:

```ts
import { getFileTypeIcon, getFileTypeLabel, isJsonFile, isJsonlFile } from './utils/file-type';
```

Then add the json-viewer import after the existing UI imports block:

```ts
import { renderJsonContent } from './ui/json-viewer';
```

- [ ] **Step 2: Add `isJsonPath` helper**

After the existing `isHtmlPath` function (around line 587):

```ts
function isJsonPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.jsonl');
}
```

- [ ] **Step 3: Add JSON branch to `renderContent()`**

In `renderContent()`, after the `isHtmlPath` branch (after line 450, before the `// 使用 marked 渲染 Markdown` comment), add:

```ts
  if (isJsonPath(file.path)) {
    container.setAttribute('data-current-file', file.path);
    container.innerHTML = '';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const query = searchInput?.value?.trim() ?? '';
    renderJsonContent(container, file.content, file.path, query);
    const meta = document.getElementById('fileMeta');
    if (meta) meta.textContent = formatRelativeTime(file.lastModified);
    renderBreadcrumb();
    updateToolbarButtons();
    return;
  }
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: wire JSON renderer into renderContent"
```

---

### Task 5: Connect search input to JSON viewer

**Files:**
- Modify: `src/client/main.ts`

The search input (`#searchInput`) currently drives MD file search. For JSON files, typing in the search box should re-render the JSON tree with highlights.

- [ ] **Step 1: Find the search input event handler**

Search for where `searchInput` change/input events are handled:

```bash
grep -n "searchInput\|setSearchQuery\|onSearch" /Users/huanghao/workspace/md-viewer/src/client/main.ts | head -20
```

- [ ] **Step 2: Add JSON re-render on search input**

Find the event listener that handles the search input (look for `addEventListener('input'` near `searchInput`). Inside that handler, after any existing logic, add a check:

```ts
// If current file is JSON, re-render with new query
if (state.currentFile && isJsonPath(state.currentFile)) {
  renderContent();
}
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 4: Manual smoke test**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run dev
```

1. Open a `.json` file — verify tree renders with `▶/▼` toggles
2. Click a collapsed node — verify it expands
3. Click again — verify it collapses
4. Type a search term — verify matching keys/values are highlighted and ancestor nodes auto-expand
5. Clear search — verify tree resets to default state (depth-1 expanded)
6. Open a `.jsonl` file — verify each line renders as a separate labeled tree
7. Open a `.json` file with syntax error — verify error box with message and raw text preview

- [ ] **Step 5: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: connect search input to JSON viewer re-render"
```

---

### Task 6: Rebuild embedded client

**Files:**
- Run build pipeline

- [ ] **Step 1: Full build**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

Expected: succeeds, `dist/` updated, embedded client rebuilt.

- [ ] **Step 2: Commit**

```bash
git add dist/ src/client/embedded-client.ts
git commit -m "build: rebuild embedded client with JSON viewer"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `.json`/`.jsonl` in `isSupportedTextFile` | Task 1 |
| `getFileTypeIcon` returns `{}` for JSON | Task 1 |
| Collapsible tree, default depth-1 expanded | Task 3 (`buildNode` depth check) |
| Click to toggle expand/collapse | Task 3 (`attachToggleHandlers`) |
| Collapsed inline preview | Task 3 (`inlinePreview`) |
| Search highlights key+value, expands ancestors | Task 3 (`highlight`, `expandMatchingAncestors`) |
| "无匹配结果" when no matches | Task 3 |
| JSON parse error display | Task 3 (`renderJson`) |
| JSONL per-line parse with error isolation | Task 3 (`renderJsonl`) |
| `renderContent()` JSON branch | Task 4 |
| Search input wired to JSON re-render | Task 5 |
| `user-select: text` preserved | Task 2 (CSS has `user-select: text` on `.json-viewer`) |
| `syncAnnotationsForCurrentFile` not excluding JSON | Not needed — current code only excludes `isHtmlPath`, JSON was never excluded |

**Placeholder scan:** None found.

**Type consistency:** `isJsonFile`/`isJsonlFile` defined in Task 1, imported in Task 3 and Task 4. `renderJsonContent` defined in Task 3, imported in Task 4. `JsonValue`/`JsonObject`/`JsonArray` defined and used only within `json-viewer.ts`.
