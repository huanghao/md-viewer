# Diff 导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 diff 页面 header 下方增加导航条，支持按 block 跳转差异、显示当前位置（N/total）、键盘快捷键 `n`/`p`，并移除「接受更新」按钮。

**Architecture:** 在 `renderDiffView` 中计算 diff blocks（连续非 equal 行），渲染时为每个 block 首行加 `data-block-index` 属性和隐藏的位置标签。导航函数 `navigateDiffBlock` 操作 DOM 实现滚动和状态更新。键盘快捷键挂在已有的 `setupKeyboardShortcuts` 中。

**Tech Stack:** TypeScript，纯 DOM 操作，无额外依赖。

---

### Task 1: 移除「接受更新」按钮

**Files:**
- Modify: `src/client/main.ts:1100-1126`（`renderDiffView` 的 HTML 模板）
- Modify: `src/client/css.ts:1262-1275`（`.diff-accept-btn` 样式）

- [ ] **Step 1: 从 `renderDiffView` 的 HTML 模板中删除接受更新按钮**

在 `src/client/main.ts` 找到 `renderDiffView` 函数中的 `container.innerHTML = \`...\`` 模板字符串，将：

```html
        <div class="diff-actions">
          <button class="diff-accept-btn" onclick="window.acceptDiffUpdate()">接受更新</button>
          <button class="diff-close-btn" onclick="window.closeDiffView()">关闭</button>
        </div>
```

改为：

```html
        <div class="diff-actions">
          <button class="diff-close-btn" onclick="window.closeDiffView()">关闭</button>
        </div>
```

- [ ] **Step 2: 删除 `css.ts` 中 `.diff-accept-btn` 相关样式**

在 `src/client/css.ts` 找到并删除以下两段（共 16 行）：

```css
    .diff-accept-btn {
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #2da44e;
      background: #2da44e;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .diff-accept-btn:hover {
      background: #218a3e;
      border-color: #218a3e;
    }
```

- [ ] **Step 3: 构建并手动验证**

```bash
npm run build
```

打开应用，触发 diff 视图（修改一个文件后点击工具栏 `[± Diff]` 按钮），确认：
- header 中只剩「关闭」按钮，「接受更新」已消失
- 关闭按钮正常工作

- [ ] **Step 4: Commit**

```bash
git add src/client/main.ts src/client/css.ts
git commit -m "feat: remove accept-update button from diff view"
```

---

### Task 2: 添加导航条 CSS 样式

**Files:**
- Modify: `src/client/css.ts:1367-1370`（在 `#diffButton.active` 之前插入新样式）

- [ ] **Step 1: 在 `css.ts` 的 diff 样式区末尾（`#diffButton.active` 规则之前）插入导航条样式**

找到 `src/client/css.ts` 中：

```css
    #diffButton.active {
      color: #0969da;
      background: rgba(9, 105, 218, 0.08);
    }
```

在它**之前**插入：

```css
    .diff-nav-bar {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      background: #fff;
      border-bottom: 1px solid #d0d7de;
      font-size: 12px;
      color: #57606a;
      gap: 8px;
      flex-shrink: 0;
    }
    .diff-nav-count { flex: 1; }
    .diff-nav-btn {
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid #d0d7de;
      background: #fff;
      cursor: pointer;
      font-size: 11px;
      color: #24292f;
    }
    .diff-nav-btn:hover { background: #f6f8fa; }
    .diff-nav-btn:disabled { opacity: 0.4; cursor: default; }
    .diff-nav-btn.primary {
      background: #0969da;
      color: #fff;
      border-color: #0969da;
    }
    .diff-nav-btn.primary:hover { background: #0860ca; }
    .diff-block-index {
      display: none;
      font-size: 10px;
      color: #0969da;
      font-weight: 600;
      margin-left: 2px;
      vertical-align: middle;
    }
```

- [ ] **Step 2: 构建验证无编译错误**

```bash
npm run build
```

Expected: 构建成功，无报错。

- [ ] **Step 3: Commit**

```bash
git add src/client/css.ts
git commit -m "feat: add diff navigation bar CSS styles"
```

---

### Task 3: 计算 diff blocks 并渲染导航条 + 位置标签

**Files:**
- Modify: `src/client/main.ts:1034-1127`（`renderDiffView` 函数）

这是核心任务。改造 `renderDiffView`：
1. 在 rows 构建完成后计算 blocks
2. 为每个 block 首行的左侧行号单元格注入 `<span class="diff-block-index" data-block-span="N">N/total</span>`
3. 在 HTML 模板中加入导航条

- [ ] **Step 1: 在 `renderDiffView` 中 `rows` 数组构建完成后，紧接着计算 blocks**

找到 `src/client/main.ts` 中 `renderDiffView` 函数，在 `const escH = ...` 这行**之前**插入：

```typescript
  // 计算 diff blocks：连续非 equal 行为一个 block
  const blocks: Array<{ startRowIndex: number; endRowIndex: number }> = [];
  let blockStart = -1;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const isChange = !(row.left && row.right && row.left.type === 'equal');
    if (isChange && blockStart === -1) {
      blockStart = ri;
    } else if (!isChange && blockStart !== -1) {
      blocks.push({ startRowIndex: blockStart, endRowIndex: ri - 1 });
      blockStart = -1;
    }
  }
  if (blockStart !== -1) {
    blocks.push({ startRowIndex: blockStart, endRowIndex: rows.length - 1 });
  }
  const totalBlocks = blocks.length;
  // blockStartRows: Set，记录每个 block 首行的 rowIndex，供渲染时注入标签
  const blockFirstRows = new Map<number, number>(); // rowIndex -> blockIndex (0-based)
  blocks.forEach((b, i) => blockFirstRows.set(b.startRowIndex, i));
```

- [ ] **Step 2: 改造 `tableRows` 的 map，为 block 首行注入位置标签**

找到现有的 `tableRows` 的 map 逻辑：

```typescript
  const tableRows = rows.map(({ left, right }) => {
    if (left && right && left.type === 'equal') {
      return `<tr class="diff-row-equal">
        <td class="diff-line-no">${left.oldLineNo}</td>
        <td>${escH(left.content)}</td>
        <td class="diff-line-no">${right.newLineNo}</td>
        <td>${escH(right.content)}</td>
      </tr>`;
    }
    const leftNo = left ? `<td class="diff-line-no">${left.oldLineNo ?? ''}</td>` : `<td class="diff-line-no diff-cell-empty"></td>`;
    const leftCell = left ? `<td class="diff-row-delete-cell">${escH(left.content)}</td>` : `<td class="diff-cell-empty"></td>`;
    const rightNo = right ? `<td class="diff-line-no">${right.newLineNo ?? ''}</td>` : `<td class="diff-line-no diff-cell-empty"></td>`;
    const rightCell = right ? `<td class="diff-row-insert-cell">${escH(right.content)}</td>` : `<td class="diff-cell-empty"></td>`;
    const rowClass = left && right ? 'diff-row-mixed' : left ? 'diff-row-delete' : 'diff-row-insert';
    return `<tr class="${rowClass}">${leftNo}${leftCell}${rightNo}${rightCell}</tr>`;
  }).join('');
```

替换为：

```typescript
  const tableRows = rows.map(({ left, right }, rowIndex) => {
    if (left && right && left.type === 'equal') {
      return `<tr class="diff-row-equal">
        <td class="diff-line-no">${left.oldLineNo}</td>
        <td>${escH(left.content)}</td>
        <td class="diff-line-no">${right.newLineNo}</td>
        <td>${escH(right.content)}</td>
      </tr>`;
    }
    const blockIdx = blockFirstRows.get(rowIndex);
    const blockAttr = blockIdx !== undefined ? ` data-block-index="${blockIdx}"` : '';
    const blockSpan = blockIdx !== undefined
      ? `<span class="diff-block-index" data-block-span="${blockIdx}">${blockIdx + 1}/${totalBlocks}</span>`
      : '';
    const leftNo = left
      ? `<td class="diff-line-no">${left.oldLineNo ?? ''}${blockSpan}</td>`
      : `<td class="diff-line-no diff-cell-empty"></td>`;
    const leftCell = left ? `<td class="diff-row-delete-cell">${escH(left.content)}</td>` : `<td class="diff-cell-empty"></td>`;
    const rightNo = right ? `<td class="diff-line-no">${right.newLineNo ?? ''}</td>` : `<td class="diff-line-no diff-cell-empty"></td>`;
    const rightCell = right ? `<td class="diff-row-insert-cell">${escH(right.content)}</td>` : `<td class="diff-cell-empty"></td>`;
    const rowClass = left && right ? 'diff-row-mixed' : left ? 'diff-row-delete' : 'diff-row-insert';
    return `<tr class="${rowClass}"${blockAttr}>${leftNo}${leftCell}${rightNo}${rightCell}</tr>`;
  }).join('');
```

- [ ] **Step 3: 在 HTML 模板中加入导航条**

找到 `container.innerHTML = \`...\`` 中的：

```html
      <div class="diff-header">
        <div class="diff-header-titles">
          <div class="diff-header-old">← 当前版本</div>
          <div class="diff-header-new">磁盘最新版本 →</div>
        </div>
        <div class="diff-actions">
          <button class="diff-close-btn" onclick="window.closeDiffView()">关闭</button>
        </div>
      </div>
      <div class="diff-view-scroll">
```

改为：

```html
      <div class="diff-header">
        <div class="diff-header-titles">
          <div class="diff-header-old">← 当前版本</div>
          <div class="diff-header-new">磁盘最新版本 →</div>
        </div>
        <div class="diff-actions">
          <button class="diff-close-btn" onclick="window.closeDiffView()">关闭</button>
        </div>
      </div>
      <div class="diff-nav-bar">
        <span class="diff-nav-count" id="diffNavCount">共 ${totalBlocks} 处差异</span>
        <button class="diff-nav-btn" id="diffNavPrev" onclick="window.navigateDiffBlock(-1)" disabled>↑ 上一处</button>
        <button class="diff-nav-btn primary" id="diffNavNext" onclick="window.navigateDiffBlock(1)">↓ 下一处</button>
      </div>
      <div class="diff-view-scroll">
```

- [ ] **Step 4: 构建验证**

```bash
npm run build
```

Expected: 构建成功，无报错。

- [ ] **Step 5: 手动验证导航条渲染**

打开应用，触发 diff 视图，确认：
- header 下方出现导航条，显示「共 N 处差异」
- 「↑ 上一处」按钮初始为 disabled 状态
- 每个 diff block 首行的左侧行号单元格内有隐藏的 `1/N` 标签（可通过开发者工具检查 DOM）

- [ ] **Step 6: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: compute diff blocks and render nav bar with position labels"
```

---

### Task 4: 实现 `navigateDiffBlock` 导航函数

**Files:**
- Modify: `src/client/main.ts`（在 `closeDiffView` 函数之后插入新函数）

- [ ] **Step 1: 在 `src/client/main.ts` 的 `closeDiffView` 函数之后插入 `navigateDiffBlock`**

找到：

```typescript
function closeDiffView(): void {
  diffViewActive = false;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  renderContent();
}
```

在它**之后**插入：

```typescript
let currentDiffBlockIndex = -1; // -1 表示未激活任何 block

function navigateDiffBlock(direction: 1 | -1): void {
  const scrollEl = document.querySelector('.diff-view-scroll');
  if (!scrollEl) return;

  // 计算总 block 数（通过 DOM 中的 data-block-index 属性）
  const allBlockRows = scrollEl.querySelectorAll<HTMLElement>('[data-block-index]');
  const totalBlocks = allBlockRows.length;
  if (totalBlocks === 0) return;

  const nextIndex = currentDiffBlockIndex === -1
    ? (direction === 1 ? 0 : totalBlocks - 1)
    : Math.max(0, Math.min(totalBlocks - 1, currentDiffBlockIndex + direction));

  if (nextIndex === currentDiffBlockIndex) return;

  // 隐藏旧标签
  if (currentDiffBlockIndex >= 0) {
    const oldSpan = scrollEl.querySelector<HTMLElement>(`[data-block-span="${currentDiffBlockIndex}"]`);
    if (oldSpan) oldSpan.style.display = 'none';
  }

  // 显示新标签
  const newSpan = scrollEl.querySelector<HTMLElement>(`[data-block-span="${nextIndex}"]`);
  if (newSpan) newSpan.style.display = 'inline';

  // 滚动到目标 block 首行
  const targetRow = scrollEl.querySelector<HTMLElement>(`[data-block-index="${nextIndex}"]`);
  if (targetRow) {
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  currentDiffBlockIndex = nextIndex;

  // 更新导航条文字和按钮状态
  const countEl = document.getElementById('diffNavCount');
  if (countEl) countEl.textContent = `${nextIndex + 1} / ${totalBlocks} 处差异`;

  const prevBtn = document.getElementById('diffNavPrev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('diffNavNext') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = nextIndex === 0;
  if (nextBtn) nextBtn.disabled = nextIndex === totalBlocks - 1;
}
```

- [ ] **Step 2: 在 `closeDiffView` 中重置 `currentDiffBlockIndex`**

找到：

```typescript
function closeDiffView(): void {
  diffViewActive = false;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  renderContent();
}
```

改为：

```typescript
function closeDiffView(): void {
  diffViewActive = false;
  currentDiffBlockIndex = -1;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  renderContent();
}
```

- [ ] **Step 3: 将 `navigateDiffBlock` 暴露到 `window`**

在 `main.ts` 中找到 `window.closeDiffView` 的暴露位置（搜索 `window.closeDiffView`），在其附近加上：

```typescript
(window as any).navigateDiffBlock = navigateDiffBlock;
```

- [ ] **Step 4: 构建验证**

```bash
npm run build
```

Expected: 构建成功，无报错。

- [ ] **Step 5: 手动验证导航功能**

打开应用，触发 diff 视图，确认：
- 点击「↓ 下一处」：滚动到第一个 block，行号旁出现 `1/N` 蓝色标签，导航条变为「1 / N 处差异」，「↑ 上一处」变为可点击
- 继续点击「↓ 下一处」：逐个跳转，标签跟随更新
- 到达最后一个 block 时「↓ 下一处」变为 disabled
- 点击「↑ 上一处」：向前跳转
- 关闭 diff 后重新打开：导航状态重置，从初始状态开始

- [ ] **Step 6: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: implement navigateDiffBlock with scroll and position indicator"
```

---

### Task 5: 添加键盘快捷键 `n` / `p`

**Files:**
- Modify: `src/client/main.ts:995-1025`（`setupKeyboardShortcuts` 函数）

- [ ] **Step 1: 在 `setupKeyboardShortcuts` 的 keydown handler 中添加 `n`/`p` 处理**

找到 `setupKeyboardShortcuts` 函数中 `document.addEventListener('keydown', (e) => {` 的末尾（在最后一个 `if` 块之后，`});` 之前），插入：

```typescript
    // n / p：diff 视图中跳转差异块
    if (diffViewActive && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        if (e.key === 'n') {
          e.preventDefault();
          navigateDiffBlock(1);
          return;
        }
        if (e.key === 'p') {
          e.preventDefault();
          navigateDiffBlock(-1);
          return;
        }
      }
    }
```

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

Expected: 构建成功，无报错。

- [ ] **Step 3: 手动验证键盘快捷键**

打开应用，触发 diff 视图，确认：
- 按 `n`：跳到下一处差异，效果与点击「↓ 下一处」相同
- 按 `p`：跳到上一处差异，效果与点击「↑ 上一处」相同
- 在输入框（如搜索框）中按 `n`/`p`：不触发导航
- 关闭 diff 视图后按 `n`/`p`：无效果

- [ ] **Step 4: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: add n/p keyboard shortcuts for diff block navigation"
```

---

### Task 6: 处理 `renderDiffView` 重新渲染时重置导航状态

**Files:**
- Modify: `src/client/main.ts`（`renderDiffView` 函数开头）

当 diff 视图重新渲染（如切换文件再回来），`currentDiffBlockIndex` 需要重置，否则导航状态会错乱。

- [ ] **Step 1: 在 `renderDiffView` 函数开头重置导航状态**

找到 `renderDiffView` 函数：

```typescript
function renderDiffView(oldContent: string, newContent: string): void {
  const container = document.getElementById('content');
  if (!container) return;
```

改为：

```typescript
function renderDiffView(oldContent: string, newContent: string): void {
  currentDiffBlockIndex = -1;
  const container = document.getElementById('content');
  if (!container) return;
```

- [ ] **Step 2: 构建验证**

```bash
npm run build
```

Expected: 构建成功，无报错。

- [ ] **Step 3: 手动验证重置行为**

打开应用，触发 diff 视图，导航到第 3 处差异。关闭 diff，再重新打开 diff，确认：
- 导航条重置为「共 N 处差异」初始状态
- 「↑ 上一处」为 disabled
- 无残留的蓝色位置标签

- [ ] **Step 4: Commit**

```bash
git add src/client/main.ts
git commit -m "fix: reset diff navigation state on re-render"
```

---

## Self-Review

**Spec coverage:**
- ✅ 移除「接受更新」按钮 → Task 1
- ✅ 导航条（header 下方，共 N 处差异 + 上一处/下一处）→ Task 3
- ✅ Block 定义（连续非 equal 行）→ Task 3 Step 1
- ✅ 位置指示（行号旁 N/total 标签）→ Task 3 Step 2
- ✅ 滚动到 block 首行（smooth, center）→ Task 4 Step 1
- ✅ 按钮 disabled 状态（首/尾）→ Task 4 Step 1
- ✅ 键盘 `n`/`p`，输入框内不拦截 → Task 5
- ✅ 关闭/重新打开时重置状态 → Task 4 Step 2 + Task 6

**Type consistency:**
- `navigateDiffBlock(direction: 1 | -1)` 在 Task 4 定义，Task 5 调用，签名一致 ✓
- `currentDiffBlockIndex` 在 Task 4 定义，Task 4/6 重置，Task 4/5 读写，一致 ✓
- `data-block-index` 属性在 Task 3 渲染，Task 4 查询，一致 ✓
- `data-block-span` 属性在 Task 3 渲染，Task 4 查询，一致 ✓
- `diffNavCount` / `diffNavPrev` / `diffNavNext` element id 在 Task 3 渲染，Task 4 操作，一致 ✓

**Placeholder scan:** 无 TBD/TODO，所有步骤均含完整代码。
