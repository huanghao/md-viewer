# PDF Canvas 拉框选中 + 矩形高亮 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Canvas 拉框替换 PDF TextLayer DOM 文本选中，持久高亮改为矩形框，批注流程（[+] → composer → 保存 → 高亮 → 侧边栏 → popover）与 MD 保持一致节奏。

**Architecture:** `pdf-viewer.ts` 负责所有 canvas 绘制（overlay canvas 创建、拉框、临时矩形、持久矩形、点击命中检测）；`pdf-annotation.ts` 负责流程桥接（存 rectCoords、触发 drawTempRect/clearTempRect）；`annotation.ts` 和 `annotation-storage.ts` 只做最小扩展（加 rectCoords 字段）。

**Tech Stack:** TypeScript, PDF.js (pdfjs-dist@4.9.155), Bun SQLite, HTML5 Canvas API

---

## 文件改动范围

| 文件 | 类型 | 改动内容 |
|------|------|---------|
| `src/client/annotation.ts` | 修改 | `Annotation` interface 加 `rectCoords` 可选字段 |
| `src/annotation-storage.ts` | 修改 | DB schema 加 `rect_coords_json` 列；读写逻辑 |
| `src/client/pdf-viewer.ts` | 修改 | ① TextLayer pointer-events:none；② overlay canvas；③ 事件改到 overlay；④ coordPath 函数；⑤ drawTempRect/clearTempRect；⑥ renderRectHighlight；⑦ clearHighlights 清矩形；⑧ overlay click 命中检测；⑨ PdfViewerInstance 接口扩展 |
| `src/client/pdf-annotation.ts` | 修改 | ① handleTextSelected 存 rectCoords；② openComposerFromPending 调 drawTempRect yellow；③ 取消/保存时调 clearTempRect |

---

## Task 1: 扩展 Annotation 数据结构

**Files:**
- Modify: `src/client/annotation.ts:20-33`
- Modify: `src/annotation-storage.ts:14-30` (StoredAnnotation interface)
- Modify: `src/annotation-storage.ts:145-188` (DB schema + migration)
- Modify: `src/annotation-storage.ts:297-318` (upsertAnnotation INSERT)
- Modify: `src/annotation-storage.ts:104-133` (mapRowToAnnotation)

- [ ] **Step 1: 在 `Annotation` interface 加 `rectCoords` 字段**

在 `src/client/annotation.ts` 第 33 行（`thread?` 字段后）加：

```typescript
export interface Annotation {
  id: string;
  serial?: number;
  start: number;
  length: number;
  quote: string;
  note: string;
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: 'anchored' | 'unanchored' | 'resolved';
  confidence?: number;
  thread?: AnnotationThreadItem[];
  /** PDF only: bounding box in PDF coordinate system (pt, unscaled) */
  rectCoords?: { x1: number; y1: number; x2: number; y2: number };
}
```

- [ ] **Step 2: 在 `StoredAnnotation` interface 加 `rectCoords` 字段**

在 `src/annotation-storage.ts` 的 `StoredAnnotation` interface（第 14-30 行）加：

```typescript
export interface StoredAnnotation {
  id: string;
  serial?: number;
  start: number;
  length: number;
  quote: string;
  note: string;
  thread?: StoredAnnotationThreadItem[];
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: "anchored" | "unanchored" | "resolved";
  confidence?: number;
  // PDF-specific fields
  page?: number;
  fileType?: "md" | "pdf";
  rectCoords?: { x1: number; y1: number; x2: number; y2: number };
}
```

- [ ] **Step 3: DB migration — 加 `rect_coords_json` 列**

在 `src/annotation-storage.ts` 的 `getDb()` 函数里，在现有 `if (!hasFileType)` 块之后（约第 186 行）加：

```typescript
  const hasRectCoords = columns.some((col) => col.name === "rect_coords_json");
  if (!hasRectCoords) {
    db.exec(`ALTER TABLE annotations ADD COLUMN rect_coords_json TEXT`);
  }
```

- [ ] **Step 4: `mapRowToAnnotation` 读取 `rect_coords_json`**

在 `src/annotation-storage.ts` 的 `mapRowToAnnotation` 函数（约第 104-133 行），在 `return` 语句里加 `rectCoords`：

```typescript
function mapRowToAnnotation(row: any): StoredAnnotation {
  // ... existing fields ...
  let rectCoords: { x1: number; y1: number; x2: number; y2: number } | undefined;
  if (row.rect_coords_json) {
    try { rectCoords = JSON.parse(row.rect_coords_json); } catch {}
  }
  return {
    // ... existing fields ...
    rectCoords,
  };
}
```

- [ ] **Step 5: `upsertAnnotation` 写入 `rect_coords_json`**

在 `src/annotation-storage.ts` 的 `upsertAnnotation` 函数 INSERT 语句（约第 297-318 行），在列列表和值列表里加 `rect_coords_json`：

```typescript
  database.prepare(`
    INSERT OR REPLACE INTO annotations
      (id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at,
       quote_prefix, quote_suffix, status, confidence, page, file_type, rect_coords_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ann.id,
    serial,
    path,
    ann.start,
    ann.length,
    ann.quote,
    normalizedThread[0]?.note || ann.note,
    JSON.stringify(normalizedThread),
    createdAt,
    updatedAt,
    ann.quotePrefix || null,
    ann.quoteSuffix || null,
    ann.status || "anchored",
    ann.confidence ?? null,
    ann.page ?? null,
    ann.fileType ?? "md",
    ann.rectCoords ? JSON.stringify(ann.rectCoords) : null
  );
```

- [ ] **Step 6: 同样更新所有 SELECT 查询，加 `rect_coords_json` 列**

在 `src/annotation-storage.ts` 里，搜索所有 `SELECT id, serial, doc_path, start` 开头的 SQL 查询（约第 244、254、266、329、482 行），在每个查询的列列表末尾加 `, rect_coords_json`。共 5 处，逐一加上。

- [ ] **Step 7: 启动服务器验证 DB migration 不报错**

```bash
cd /Users/huanghao/workspace/md-viewer
bun run src/server.ts &
sleep 2
curl -s http://localhost:7070/api/annotations?path=/tmp/test.md | head -c 100
kill %1
```

Expected: 返回 `{"annotations":[]}` 或类似 JSON，不报 SQLite 错误。

- [ ] **Step 8: Commit**

```bash
git add src/client/annotation.ts src/annotation-storage.ts
git commit -m "feat(pdf): add rectCoords field to Annotation + DB schema migration"
```

---

## Task 2: pdf-viewer.ts — overlay canvas + coordPath

**Files:**
- Modify: `src/client/pdf-viewer.ts`

- [ ] **Step 1: 扩展 `PdfViewerInstance` 接口**

在 `src/client/pdf-viewer.ts` 的 `PdfViewerInstance` interface（第 52-71 行），加新方法和回调：

```typescript
export interface PdfViewerInstance {
  el: HTMLElement;
  destroy(): void;
  scrollToPage(pageNum: number): void;
  highlightQuote(pageNum: number, quote: string, annotationId?: string): void;
  highlightByItemRange(pageNum: number, startItemIdx: number, endItemIdx: number, annotationId?: string, preciseQuote?: string): void;
  clearHighlights(): void;
  clearSelectionMark(): void;
  getTextBlocks(pageNum: number): PdfTextBlock[];
  getRenderedCount(): number;
  getTotalPages(): number;
  /** Draw a temporary selection rect on the overlay canvas for the given page */
  drawTempRect(pageNum: number, x1: number, y1: number, x2: number, y2: number, style: 'blue' | 'yellow'): void;
  /** Clear the temporary selection rect (all pages if pageNum omitted) */
  clearTempRect(pageNum?: number): void;
  /** Called when user clicks a persistent annotation rect */
  onAnnotationClick?: (annotationId: string, clientX: number, clientY: number) => void;
}
```

- [ ] **Step 2: 在 `createPdfViewer` 内部加 overlay canvas 数据结构**

在 `src/client/pdf-viewer.ts` 的 `createPdfViewer` 函数开头（约第 187 行，`const pageWrappers` 之后），加：

```typescript
  // overlay canvas per page: for selection rect drawing and persistent rect highlights
  const overlayCanvases: Map<number, HTMLCanvasElement> = new Map();
  // persistent rect annotations: { annotationId, x1, y1, x2, y2 } per page
  const persistentRects: Map<number, Array<{ annotationId: string; x1: number; y1: number; x2: number; y2: number }>> = new Map();
  // temp rect per page: null = none
  const tempRects: Map<number, { x1: number; y1: number; x2: number; y2: number; style: 'blue' | 'yellow' } | null> = new Map();
```

- [ ] **Step 3: 提取 `coordPath` 函数（移植自测试工具）**

在 `src/client/pdf-viewer.ts` 文件末尾（`findBlockAtY` 之后）加：

```typescript
interface CoordHitDetail {
  idx: number;
  str: string;
  startChar: number;
  endChar: number;
  slice: string;
  itemX: string;
  itemWidth: string;
}

interface CoordPathResult {
  text: string | null;
  hits: number[];
  detail: CoordHitDetail[];
}

function coordPath(
  items: PdfPageTextItem[],
  pageH: number,
  downX: number,
  downY: number,
  upX: number,
  upY: number
): CoordPathResult {
  const deltaY = Math.abs(downY - upY);
  const isMultiLine = deltaY > 5;

  let startX: number, startY: number, endX: number, endY: number;
  if (isMultiLine) {
    const reversed = downY > upY;
    startX = reversed ? upX : downX; startY = reversed ? upY : downY;
    endX = reversed ? downX : upX;   endY = reversed ? downY : upY;
  } else {
    const reversed = downX > upX;
    startX = reversed ? upX : downX; startY = reversed ? upY : downY;
    endX = reversed ? downX : upX;   endY = reversed ? downY : upY;
  }

  const selLeft = Math.min(startX, endX);
  const selRight = Math.max(startX, endX);
  const selTop = Math.min(startY, endY);
  const selBottom = Math.max(startY, endY);
  const normDownX = startX;
  const normUpX = endX;

  const hits: Array<{ idx: number; it: PdfPageTextItem; ix: number; iy: number; ix2: number; iy2: number; fontH: number }> = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.str.trim()) continue;
    const fontH = it.height || Math.abs(it.transform[3]) || 12;
    const baselineY = pageH - it.transform[5];
    const ix = it.transform[4];
    const iy = baselineY - fontH;
    const ix2 = ix + Math.abs(it.width);
    const iy2 = baselineY + fontH * 0.3;
    if (ix < selRight && ix2 > selLeft && iy < selBottom && iy2 > selTop) {
      hits.push({ idx: i, it, ix, iy, ix2, iy2, fontH });
    }
  }

  if (hits.length === 0) return { text: null, hits: [], detail: [] };

  hits.sort((a, b) => (a.iy - b.iy) || (a.ix - b.ix));

  const parts: string[] = [];
  const detail: CoordHitDetail[] = [];

  for (let i = 0; i < hits.length; i++) {
    const { it, ix, ix2 } = hits[i];
    const str = it.str;
    const strLen = str.length;
    let startChar = 0;
    let endChar = strLen;
    if (i === 0) {
      const xInItem = Math.max(0, Math.min(normDownX - ix, ix2 - ix));
      startChar = Math.round((xInItem / (ix2 - ix)) * strLen);
    }
    if (i === hits.length - 1) {
      const xInItem = Math.max(0, Math.min(normUpX - ix, ix2 - ix));
      endChar = Math.round((xInItem / (ix2 - ix)) * strLen);
    }
    const slice = str.slice(startChar, endChar).trim();
    if (slice) parts.push(slice);
    detail.push({ idx: hits[i].idx, str: str.slice(0, 40), startChar, endChar, slice, itemX: ix.toFixed(1), itemWidth: (ix2 - ix).toFixed(1) });
  }

  return { text: parts.join(' ').trim() || null, hits: hits.map(h => h.idx), detail };
}
```

- [ ] **Step 4: 在 `renderPage` 里创建 overlay canvas**

在 `renderPage` 函数里，`wrapper.appendChild(textLayerDiv)` 之后（约第 250 行），加：

```typescript
    // Select overlay canvas — sits on top of everything, captures mouse events
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.className = 'pdf-select-overlay';
    overlayCanvas.width = Math.floor(viewport.width * dpr);
    overlayCanvas.height = Math.floor(viewport.height * dpr);
    overlayCanvas.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: ${viewport.width}px; height: ${viewport.height}px;
      pointer-events: auto; cursor: crosshair;
    `;
    const overlayCtx = overlayCanvas.getContext('2d')!;
    overlayCtx.scale(dpr, dpr);
    wrapper.appendChild(overlayCanvas);
    overlayCanvases.set(pageNum, overlayCanvas);
    persistentRects.set(pageNum, []);
    tempRects.set(pageNum, null);
```

- [ ] **Step 5: TextLayer 改为 pointer-events:none**

在 `renderPage` 里，`textLayerDiv.style.cssText` 赋值处（约第 246-249 行），改为：

```typescript
    textLayerDiv.style.cssText = `
      width: ${viewport.width}px; height: ${viewport.height}px;
      pointer-events: none; user-select: none;
    `;
```

- [ ] **Step 6: 提取 overlay 绘制辅助函数**

在 `createPdfViewer` 内部（`renderPage` 之前），加：

```typescript
  function redrawOverlay(pageNum: number) {
    const canvas = overlayCanvases.get(pageNum);
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw persistent rects
    const perPage = persistentRects.get(pageNum) || [];
    for (const r of perPage) {
      const s = scale;
      ctx.fillStyle = 'rgba(255,200,0,0.35)';
      ctx.strokeStyle = 'rgba(255,160,0,0.85)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(r.x1 * s, r.y1 * s, (r.x2 - r.x1) * s, (r.y2 - r.y1) * s);
      ctx.strokeRect(r.x1 * s, r.y1 * s, (r.x2 - r.x1) * s, (r.y2 - r.y1) * s);
    }

    // Draw temp rect on top
    const tmp = tempRects.get(pageNum);
    if (tmp) {
      const s = scale;
      const w = (tmp.x2 - tmp.x1) * s;
      const h = (tmp.y2 - tmp.y1) * s;
      if (tmp.style === 'blue') {
        ctx.fillStyle = 'rgba(66,133,244,0.18)';
        ctx.strokeStyle = 'rgba(66,133,244,0.9)';
      } else {
        ctx.fillStyle = 'rgba(255,200,0,0.30)';
        ctx.strokeStyle = 'rgba(255,160,0,0.75)';
      }
      ctx.lineWidth = 1.5;
      ctx.fillRect(tmp.x1 * s, tmp.y1 * s, w, h);
      ctx.strokeRect(tmp.x1 * s, tmp.y1 * s, w, h);
    }
  }
```

- [ ] **Step 7: 用 overlay canvas 事件替换 textLayerDiv 的 mousedown/mousemove/mouseup**

把 `renderPage` 里 `if (opts.onTextSelected)` 块（约第 320-498 行）整体替换为：

```typescript
    if (opts.onTextSelected) {
      const pageH = viewport.height / scale;
      let dragging = false;
      let downPdfX = 0, downPdfY = 0;
      let downScreenX = 0, downScreenY = 0;

      overlayCanvas.addEventListener('mousedown', (e) => {
        // If there's a pending temp rect on this page, clear it
        if (tempRects.get(pageNum)) {
          tempRects.set(pageNum, null);
          redrawOverlay(pageNum);
        }
        dragging = true;
        const rect = wrapper.getBoundingClientRect();
        downScreenX = e.clientX;
        downScreenY = e.clientY;
        downPdfX = (e.clientX - rect.left) / scale;
        downPdfY = (e.clientY - rect.top) / scale;
        e.preventDefault();
      });

      overlayCanvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = wrapper.getBoundingClientRect();
        const curX = (e.clientX - rect.left) / scale;
        const curY = (e.clientY - rect.top) / scale;
        tempRects.set(pageNum, { x1: Math.min(downPdfX, curX), y1: Math.min(downPdfY, curY), x2: Math.max(downPdfX, curX), y2: Math.max(downPdfY, curY), style: 'blue' });
        redrawOverlay(pageNum);
      });

      overlayCanvas.addEventListener('mouseup', (e) => {
        if (!dragging) return;
        dragging = false;
        const dx = Math.abs(e.clientX - downScreenX);
        const dy = Math.abs(e.clientY - downScreenY);
        if (dx < 5 && dy < 5) {
          // Click — clear temp rect, don't trigger selection
          tempRects.set(pageNum, null);
          redrawOverlay(pageNum);
          return;
        }
        const rect = wrapper.getBoundingClientRect();
        const upPdfX = (e.clientX - rect.left) / scale;
        const upPdfY = (e.clientY - rect.top) / scale;

        // Keep blue rect visible until user clicks [+]
        tempRects.set(pageNum, { x1: Math.min(downPdfX, upPdfX), y1: Math.min(downPdfY, upPdfY), x2: Math.max(downPdfX, upPdfX), y2: Math.max(downPdfY, upPdfY), style: 'blue' });
        redrawOverlay(pageNum);

        const allItems = (textContentCache.get(pageNum)?.items || []) as PdfPageTextItem[];
        const result = coordPath(allItems, pageH, downPdfX, downPdfY, upPdfX, upPdfY);
        if (!result.text || result.hits.length === 0) return;

        const startItemIdx = result.hits[0];
        const endItemIdx = result.hits[result.hits.length - 1];
        const selectedText = result.text;

        // Store rect coords for pdf-annotation.ts to pick up
        (window as any).__pdfPendingRectCoords = {
          pageNum,
          x1: Math.min(downPdfX, upPdfX),
          y1: Math.min(downPdfY, upPdfY),
          x2: Math.max(downPdfX, upPdfX),
          y2: Math.max(downPdfY, upPdfY),
        };

        const CONTEXT_ITEMS = 10;
        const prefix = allItems.slice(Math.max(0, startItemIdx - CONTEXT_ITEMS), startItemIdx).map(it => it.str).join(' ').trim();
        const suffix = allItems.slice(endItemIdx + 1, Math.min(allItems.length, endItemIdx + 1 + CONTEXT_ITEMS)).map(it => it.str).join(' ').trim();

        opts.onTextSelected!(pageNum, selectedText, prefix, suffix, e.clientX, e.clientY, startItemIdx, endItemIdx);
      });

      // Click on overlay: check if hitting a persistent annotation rect
      overlayCanvas.addEventListener('click', (e) => {
        if (opts.onAnnotationClick) {
          const rect = wrapper.getBoundingClientRect();
          const clickX = (e.clientX - rect.left) / scale;
          const clickY = (e.clientY - rect.top) / scale;
          const perPage = persistentRects.get(pageNum) || [];
          for (const r of perPage) {
            if (clickX >= r.x1 && clickX <= r.x2 && clickY >= r.y1 && clickY <= r.y2) {
              opts.onAnnotationClick(r.annotationId, e.clientX, e.clientY);
              break;
            }
          }
        }
      });
    }
```

- [ ] **Step 8: 实现 `renderRectHighlight` 函数**

在 `createPdfViewer` 内部（`clearHighlights` 之前），加：

```typescript
  function renderRectHighlight(pageNum: number, x1: number, y1: number, x2: number, y2: number, annotationId: string) {
    if (!rendered.has(pageNum)) return;
    const wrapper = pageWrappers[pageNum - 1];
    if (!wrapper) return;

    // Add to persistent rects list
    const perPage = persistentRects.get(pageNum) || [];
    perPage.push({ annotationId, x1, y1, x2, y2 });
    persistentRects.set(pageNum, perPage);
    redrawOverlay(pageNum);

    // Insert zero-size anchor div for jumpToAnnotation
    const anchor = document.createElement('div');
    anchor.className = 'pdf-rect-anchor';
    anchor.dataset.annotationId = annotationId;
    anchor.style.cssText = `position:absolute;top:${y1 * scale}px;left:${x1 * scale}px;width:0;height:0;pointer-events:none;`;
    wrapper.appendChild(anchor);
  }
```

- [ ] **Step 9: 更新 `clearHighlights` 清除矩形**

把现有 `clearHighlights` 函数（约第 669-683 行）改为：

```typescript
  function clearHighlights() {
    // Clear persistent rect overlays
    for (const [pageNum] of persistentRects) {
      persistentRects.set(pageNum, []);
      redrawOverlay(pageNum);
    }
    // Remove anchor divs
    el.querySelectorAll('.pdf-rect-anchor').forEach(el => el.remove());

    // Unwrap <mark> elements inserted by sub-word highlighting
    el.querySelectorAll('mark.pdf-highlight').forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    // Remove classes from span-level highlights
    el.querySelectorAll('.pdf-highlight, .annotation-mark').forEach((node) => {
      node.classList.remove('pdf-highlight');
      node.classList.remove('annotation-mark');
      delete (node as HTMLElement).dataset.annotationId;
    });
  }
```

- [ ] **Step 10: 实现 `drawTempRect` 和 `clearTempRect`**

在 `createPdfViewer` 内部（`renderRectHighlight` 之后），加：

```typescript
  function drawTempRect(pageNum: number, x1: number, y1: number, x2: number, y2: number, style: 'blue' | 'yellow') {
    tempRects.set(pageNum, { x1, y1, x2, y2, style });
    redrawOverlay(pageNum);
  }

  function clearTempRect(pageNum?: number) {
    if (pageNum !== undefined) {
      tempRects.set(pageNum, null);
      redrawOverlay(pageNum);
    } else {
      for (const [pn] of tempRects) {
        tempRects.set(pn, null);
        redrawOverlay(pn);
      }
    }
  }
```

- [ ] **Step 11: 在 `return` 语句里暴露新方法**

把 `src/client/pdf-viewer.ts` 末尾的 `return` 语句（约第 710 行）改为：

```typescript
  return {
    el, destroy, scrollToPage,
    highlightQuote, highlightByItemRange, clearHighlights, clearSelectionMark,
    getTextBlocks, getRenderedCount, getTotalPages,
    drawTempRect, clearTempRect,
    get onAnnotationClick() { return opts.onAnnotationClick; },
    set onAnnotationClick(fn) { opts.onAnnotationClick = fn; },
  };
```

注意：`opts` 需要包含 `onAnnotationClick`，在 `PdfViewerOptions` interface（约第 29-50 行）加：

```typescript
export interface PdfViewerOptions {
  container: HTMLElement;
  filePath: string;
  scale?: number;
  onTextSelected?: (...) => void;
  onParagraphClick?: (block: PdfTextBlock) => void;
  onPageRendered?: (pageNum: number) => void;
  /** Called when user clicks a persistent annotation rect on the overlay canvas */
  onAnnotationClick?: (annotationId: string, clientX: number, clientY: number) => void;
}
```

- [ ] **Step 12: Commit**

```bash
git add src/client/pdf-viewer.ts
git commit -m "feat(pdf): add overlay canvas, coordPath, rect highlight, drawTempRect/clearTempRect"
```

---

## Task 3: pdf-annotation.ts — 桥接 rectCoords 和临时矩形

**Files:**
- Modify: `src/client/pdf-annotation.ts`
- Modify: `src/client/annotation.ts` (openComposerFromPending)

- [ ] **Step 1: `handleTextSelected` 读取 `__pdfPendingRectCoords` 并存入 pending**

在 `src/client/pdf-annotation.ts` 的 `handleTextSelected` 函数（第 27-59 行），在 `showQuickAdd` 调用之前，读取并清除 `__pdfPendingRectCoords`，存入 pending annotation：

```typescript
  function handleTextSelected(
    pageNum: number,
    selectedText: string,
    prefix: string,
    suffix: string,
    clientX: number,
    clientY: number,
    startItemIdx: number,
    endItemIdx: number
  ) {
    const annotations = opts.getAnnotations();
    const serial = nextAnnotationSerial(annotations);

    // Pick up rect coords stored by pdf-viewer.ts
    const pendingRect = (window as any).__pdfPendingRectCoords as { pageNum: number; x1: number; y1: number; x2: number; y2: number } | undefined;
    (window as any).__pdfPendingRectCoords = null;
    const rectCoords = pendingRect && pendingRect.pageNum === pageNum
      ? { x1: pendingRect.x1, y1: pendingRect.y1, x2: pendingRect.x2, y2: pendingRect.y2 }
      : undefined;

    const pending: Annotation = {
      id: crypto.randomUUID(),
      serial,
      start: startItemIdx,
      length: endItemIdx - startItemIdx + 1,
      quote: selectedText,
      quotePrefix: prefix,
      quoteSuffix: suffix,
      note: "",
      createdAt: Date.now(),
      status: "anchored",
      page: pageNum,
      fileType: "pdf",
      pdfItemStart: startItemIdx,
      pdfItemEnd: endItemIdx,
      rectCoords,
    } as Annotation & { page: number; fileType: "pdf"; pdfItemStart: number; pdfItemEnd: number };

    showQuickAdd(clientX + 6, clientY - 8, pending);
  }
```

- [ ] **Step 2: `openComposerFromPending` 里，PDF 批注改为调 `drawTempRect yellow`**

在 `src/client/annotation.ts` 的 `openComposerFromPending` 函数（约第 754-799 行），把现有 `__pdfPendingSelectionRange` 处理块替换为 `drawTempRect` 调用：

找到这段代码：
```typescript
  // PDF side: insert yellow underline using the stored Range from mouseup
  const pdfPending = (window as any).__pdfPendingSelectionRange;
  if (pdfPending) {
    // ... 整段 wrapNode 逻辑 ...
  }
```

替换为：
```typescript
  // PDF side: switch temp rect from blue to yellow
  const pdfViewer = (window as any).__currentPdfViewer as import('./pdf-viewer.js').PdfViewerInstance | undefined;
  const ann = state.pendingAnnotation as Annotation & { page?: number; rectCoords?: { x1: number; y1: number; x2: number; y2: number } };
  if (pdfViewer && ann?.page !== undefined && ann?.rectCoords) {
    const { x1, y1, x2, y2 } = ann.rectCoords;
    pdfViewer.drawTempRect(ann.page, x1, y1, x2, y2, 'yellow');
  }
```

- [ ] **Step 3: 在 `main.ts` 里把 viewer 实例挂到 `window.__currentPdfViewer`**

在 `src/client/main.ts` 里，找到 `createPdfViewer(...)` 调用处，在创建后加：

```typescript
  (window as any).__currentPdfViewer = pdfViewerInstance;
```

在 `destroy()` 或 PDF 卸载时清除：
```typescript
  (window as any).__currentPdfViewer = null;
```

- [ ] **Step 4: `hideQuickAdd` 取消时 clearTempRect**

在 `src/client/annotation.ts` 的 `hideQuickAdd` 函数（约第 740-752 行），加 PDF clearTempRect 调用：

```typescript
export function hideQuickAdd(clearPending = true): void {
  const el = getElements();
  if (el.quickAdd) el.quickAdd.classList.add('hidden');
  if (clearPending) {
    state.pendingAnnotation = null;
    state.pendingAnnotationFilePath = null;
    // PDF: clear temp rect
    const pdfViewer = (window as any).__currentPdfViewer as import('./pdf-viewer.js').PdfViewerInstance | undefined;
    pdfViewer?.clearTempRect();
  }
}
```

- [ ] **Step 5: `savePendingAnnotation` 之后 clearTempRect（已由 renderHighlights 接管，但保险起见）**

在 `src/client/annotation.ts` 的 `savePendingAnnotation` 函数（约第 1105 行），在 `persistAnnotation` 调用之后加：

```typescript
    // PDF: clear temp rect (renderHighlights will redraw persistent rect)
    const pdfViewer = (window as any).__currentPdfViewer as import('./pdf-viewer.js').PdfViewerInstance | undefined;
    pdfViewer?.clearTempRect();
```

- [ ] **Step 6: `renderHighlights` 调用 `renderRectHighlight`**

在 `src/client/pdf-annotation.ts` 的 `renderHighlights` 函数（第 61-79 行），在 `highlightByItemRange` 调用之后加矩形高亮：

```typescript
  function renderHighlights(annotations: Annotation[]) {
    opts.viewer.clearSelectionMark();
    opts.viewer.clearHighlights();
    const pdfAnns = annotations.filter(a => {
      const pa = a as Annotation & { page?: number; fileType?: string };
      return pa.fileType === "pdf" && typeof pa.page === "number" && a.status !== 'resolved';
    }) as (Annotation & { page: number; fileType: string })[];

    for (const a of pdfAnns) {
      const pa = a as Annotation & { page: number; start?: number; length?: number; rectCoords?: { x1: number; y1: number; x2: number; y2: number } };

      // Span highlight (text regions)
      if (typeof pa.start === "number" && typeof pa.length === "number") {
        const endIdx = pa.start + pa.length - 1;
        opts.viewer.highlightByItemRange(pa.page, pa.start, endIdx, a.id, a.quote);
      } else {
        opts.viewer.highlightQuote(a.page, a.quote, a.id);
      }

      // Rect highlight (visual overlay + anchor div)
      if (pa.rectCoords) {
        const { x1, y1, x2, y2 } = pa.rectCoords;
        opts.viewer.renderRectHighlight(pa.page, x1, y1, x2, y2, a.id);
      }
    }
  }
```

注意：`renderRectHighlight` 也需要加到 `PdfViewerInstance` 接口里（在 Task 2 Step 1 已加）。

- [ ] **Step 7: 设置 `onAnnotationClick` 回调**

在 `src/client/main.ts` 里，找到 `createPdfViewer(...)` 调用处，在创建后设置：

```typescript
  pdfViewerInstance.onAnnotationClick = (annotationId, clientX, clientY) => {
    pdfBridge?.handleAnnotationClick(annotationId, clientX, clientY);
  };
```

在 `src/client/pdf-annotation.ts` 的 `PdfAnnotationBridge` interface 加：

```typescript
export interface PdfAnnotationBridge {
  handleTextSelected(...): void;
  renderHighlights(annotations: Annotation[]): void;
  handleAnnotationClick(annotationId: string, clientX: number, clientY: number): void;
}
```

在 `createPdfAnnotationBridge` 里实现：

```typescript
  function handleAnnotationClick(annotationId: string, clientX: number, clientY: number) {
    const ann = opts.getAnnotations().find(a => a.id === annotationId);
    if (!ann) return;
    // Re-use the existing showPopover from annotation.ts
    import('./annotation.js').then(({ showPopover }) => {
      showPopover(ann, clientX + 8, clientY - 8);
    });
  }
```

注意：`showPopover` 需要从 `annotation.ts` export（检查是否已 export，如未 export 则加上）。

- [ ] **Step 8: Commit**

```bash
git add src/client/pdf-annotation.ts src/client/annotation.ts src/client/main.ts
git commit -m "feat(pdf): wire rectCoords through annotation bridge, drawTempRect on [+] click, popover on rect click"
```

---

## Task 4: 补全 PdfViewerInstance 接口 + `renderRectHighlight` 暴露

**Files:**
- Modify: `src/client/pdf-viewer.ts`

- [ ] **Step 1: 在 `PdfViewerInstance` 加 `renderRectHighlight`**

在 Task 2 Step 1 的接口里补上：

```typescript
  /** Draw a persistent annotation rect on the overlay canvas */
  renderRectHighlight(pageNum: number, x1: number, y1: number, x2: number, y2: number, annotationId: string): void;
```

- [ ] **Step 2: 在 `return` 语句里暴露 `renderRectHighlight`**

在 Task 2 Step 11 的 `return` 语句里加：

```typescript
  return {
    el, destroy, scrollToPage,
    highlightQuote, highlightByItemRange, clearHighlights, clearSelectionMark,
    renderRectHighlight,
    getTextBlocks, getRenderedCount, getTotalPages,
    drawTempRect, clearTempRect,
    get onAnnotationClick() { return opts.onAnnotationClick; },
    set onAnnotationClick(fn) { opts.onAnnotationClick = fn; },
  };
```

- [ ] **Step 3: 验证 TypeScript 编译无错误**

```bash
cd /Users/huanghao/workspace/md-viewer
bun run tsc --noEmit 2>&1 | head -40
```

Expected: 无错误输出（或只有已知的不相关警告）。

- [ ] **Step 4: Commit**

```bash
git add src/client/pdf-viewer.ts
git commit -m "fix(pdf): expose renderRectHighlight in PdfViewerInstance interface"
```

---

## Task 5: 检查 `showPopover` export + 端到端测试

**Files:**
- Modify: `src/client/annotation.ts` (确认 showPopover export)

- [ ] **Step 1: 确认 `showPopover` 已 export**

在 `src/client/annotation.ts` 里搜索 `showPopover`：

```bash
grep -n "export.*showPopover\|function showPopover" src/client/annotation.ts
```

如果是 `function showPopover`（未 export），改为 `export function showPopover`。

- [ ] **Step 2: 启动开发服务器**

```bash
bun run src/server.ts
```

打开 `http://localhost:7070`，加载一个 PDF 文件。

- [ ] **Step 3: 验证拉框选中**

- 在 PDF 页面上拖拽画框（鼠标按下拖动 > 5px）
- 预期：蓝色半透明矩形实时出现
- 松手后：蓝色矩形保留，[+] 按钮出现在鼠标附近

- [ ] **Step 4: 验证 [+] 点击变黄**

- 点击 [+] 按钮
- 预期：蓝色矩形变为黄色矩形，composer 输入框出现

- [ ] **Step 5: 验证取消清除**

- 点击 composer 外部或取消按钮
- 预期：黄色矩形消失，[+] 消失，无残留

- [ ] **Step 6: 验证保存持久高亮**

- 输入评论，Cmd+Enter 保存
- 预期：composer 消失，黄色矩形持久显示在原位置，侧边栏出现新批注条目

- [ ] **Step 7: 验证点击矩形弹 popover**

- 点击持久黄色矩形区域
- 预期：弹出 popover 显示评论内容

- [ ] **Step 8: 验证侧边栏定位**

- 点击侧边栏批注条目
- 预期：页面滚动到对应页面，popover 出现

- [ ] **Step 9: 验证单击不触发选中**

- 在 PDF 上单击（不拖拽）
- 预期：无矩形出现，无 [+] 按钮

- [ ] **Step 10: 验证刷新后高亮重放**

- 刷新页面，重新加载同一 PDF
- 预期：之前保存的批注黄色矩形重新出现

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "feat(pdf): canvas rect select + rect highlight complete

- Replace TextLayer DOM selection with overlay canvas drag
- coordPath: find TextItems within drawn rectangle
- Blue rect on mouseup, yellow on [+] click, persistent on save
- renderRectHighlight: canvas overlay + zero-size anchor div
- onAnnotationClick: hit-test persistent rects → showPopover
- rectCoords stored in annotation + DB (rect_coords_json column)"
```

---

## Self-Review

**Spec coverage check:**

| Spec 要求 | 对应 Task |
|-----------|---------|
| Canvas 拉框替换 TextLayer DOM 选中 | Task 2 Step 4-7 |
| coordPath 逻辑移植 | Task 2 Step 3 |
| 蓝色矩形保留到点 [+] | Task 2 Step 7 (mouseup 保留 blue) |
| 点 [+] 变黄色 | Task 3 Step 2 |
| 取消/点外部清除 | Task 3 Step 4 |
| 保存后持久黄色矩形 | Task 3 Step 6, Task 2 Step 8 |
| 锚点 div 供 jumpToAnnotation | Task 2 Step 8 (renderRectHighlight) |
| 点击矩形弹 popover | Task 2 Step 7 (click handler), Task 3 Step 7 |
| rectCoords 存储 | Task 1 + Task 3 Step 1 |
| DB migration | Task 1 Step 3-6 |
| TextLayer pointer-events:none | Task 2 Step 5 |

**Type consistency check:**
- `drawTempRect(pageNum, x1, y1, x2, y2, style)` — 接口、实现、调用方三处一致 ✓
- `clearTempRect(pageNum?)` — 一致 ✓
- `renderRectHighlight(pageNum, x1, y1, x2, y2, annotationId)` — 接口、实现、调用方三处一致 ✓
- `rectCoords: { x1, y1, x2, y2 }` — Annotation interface、StoredAnnotation、DB 列名 `rect_coords_json` 一致 ✓
- `coordPath` 返回 `{ text, hits, detail }` — 调用方只用 `text` 和 `hits`，一致 ✓

**Placeholder scan:** 无 TBD/TODO/类似表述。
