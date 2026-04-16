# PDF Viewer, Annotation, and Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PDF support to mdv: render PDFs via PDF.js, support `pdf://` anchor links from MD files, enable text-selection annotation reusing the existing system, and add per-paragraph translation via a pluggable provider.

**Architecture:** PDF files are treated as a new file type alongside `.md`, `.html`, `.json`. A new `PdfViewer` component handles rendering (PDF.js library mode via CDN), annotation (extending existing SQLite schema), and translation (pluggable `TranslationProvider`). The existing annotation sidebar, composer, and thread UI are reused unchanged.

**Tech Stack:** PDF.js 4.x (CDN, library mode), existing Hono/Bun server, existing SQLite annotation storage, MyMemory free translation API.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils.ts` | Modify | Add `isPdf()` helper |
| `src/annotation-storage.ts` | Modify | DB migration for PDF anchor columns |
| `src/handlers.ts` | Modify | Serve PDF binary via `/api/file` |
| `src/server.ts` | No change | Routes already handle `/api/file` |
| `src/client/html.ts` | Modify | Add PDF.js CDN script tags |
| `src/client/main.ts` | Modify | Route `.pdf` files to PdfViewer, intercept `pdf://` clicks |
| `src/client/pdf-viewer.ts` | Create | PDF.js rendering, page nav, text layer |
| `src/client/pdf-annotation.ts` | Create | Selection → annotation bridge for PDF |
| `src/client/pdf-translation.ts` | Create | Paragraph detection, TranslationProvider, MyMemory impl |

---

## Task 1: Extend types and utils for PDF

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils.ts`

- [ ] **Step 1: No changes needed to `src/types.ts`**

PDF anchor fields (`page`, `fileType`) go directly on `StoredAnnotation` in `src/annotation-storage.ts` (done in Task 2). `src/types.ts` only holds `FileInfo` and `FileData` — no PDF-specific types needed there.

- [ ] **Step 2: Add `isPdf` helper to `src/utils.ts`**

Open `src/utils.ts`. After the `isJson` function, add:

```typescript
export function isPdf(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}
```

Also add `isPdf` to the `isSupportedTextFile` function — actually PDF is binary, NOT text. Do NOT add it to `isSupportedTextFile`. It needs its own check in the client.

- [ ] **Step 3: Commit**

```bash
cd /Users/huanghao/workspace/md-viewer
git add src/types.ts src/utils.ts
git commit -m "feat: add PdfAnchor type and isPdf util"
```

---

## Task 2: Extend annotation storage schema for PDF anchors

**Files:**
- Modify: `src/annotation-storage.ts`

The existing `annotations` table has `start INTEGER NOT NULL` and `length INTEGER NOT NULL`. For PDF annotations, `start` and `length` are meaningless — we use `page` and the existing `quote`/`quote_prefix`/`quote_suffix` columns. We add a `page` column and a `file_type` column via migration, making `start` and `length` nullable for PDF rows.

- [ ] **Step 1: Add `page` and `file_type` columns to the migration block**

Open `src/annotation-storage.ts`. Find the migration block (around lines 163-171) that looks like:

```typescript
// Run migrations
const cols = db.query(`PRAGMA table_info(annotations)`).all() as any[];
const colNames = cols.map((c: any) => c.name);
if (!colNames.includes("serial")) {
  db.run(`ALTER TABLE annotations ADD COLUMN serial INTEGER`);
}
if (!colNames.includes("thread_json")) {
  db.run(`ALTER TABLE annotations ADD COLUMN thread_json TEXT`);
}
```

Add after the existing migration checks:

```typescript
if (!colNames.includes("page")) {
  db.run(`ALTER TABLE annotations ADD COLUMN page INTEGER`);
}
if (!colNames.includes("file_type")) {
  db.run(`ALTER TABLE annotations ADD COLUMN file_type TEXT NOT NULL DEFAULT 'md'`);
}
```

- [ ] **Step 2: Extend `StoredAnnotation` interface**

Find the `StoredAnnotation` interface in `src/annotation-storage.ts`. Add two optional fields:

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
}
```

- [ ] **Step 3: Update `upsertAnnotation` to persist PDF fields**

Find the `upsertAnnotation` function. It has an INSERT/UPDATE SQL statement. Add `page` and `file_type` to the INSERT and UPDATE:

Find the INSERT statement (it will look like):
```sql
INSERT INTO annotations (id, serial, doc_path, start, length, quote, note, ...)
VALUES (?, ?, ?, ?, ?, ?, ?, ...)
```

Replace with (preserve all existing columns, just add the two new ones):
```sql
INSERT INTO annotations (id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence, page, file_type)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  note = excluded.note,
  thread_json = excluded.thread_json,
  updated_at = excluded.updated_at,
  quote_prefix = excluded.quote_prefix,
  quote_suffix = excluded.quote_suffix,
  status = excluded.status,
  confidence = excluded.confidence,
  page = excluded.page,
  file_type = excluded.file_type
```

And pass `annotation.page ?? null` and `annotation.fileType ?? "md"` as the last two bind parameters.

- [ ] **Step 4: Update `rowToAnnotation` to read PDF fields**

Find the function that maps a DB row to `StoredAnnotation` (it reads `row.start`, `row.length`, etc.). Add:

```typescript
page: row.page ?? undefined,
fileType: (row.file_type as "md" | "pdf") ?? "md",
```

- [ ] **Step 5: Commit**

```bash
git add src/annotation-storage.ts
git commit -m "feat: extend annotation schema with page and file_type for PDF"
```

---

## Task 3: Serve PDF binary from server

**Files:**
- Modify: `src/handlers.ts`

Currently `handleGetFile` reads text content. PDF must be served as binary. We add a separate route `/api/pdf-asset` that streams the raw file bytes — same pattern as the existing `/api/file-asset`.

- [ ] **Step 1: Add `handleGetPdfAsset` handler to `src/handlers.ts`**

Open `src/handlers.ts`. Find `handleGetFileAsset` (around line 115). Add a new handler right after it:

```typescript
export async function handleGetPdfAsset(c: Context): Promise<Response> {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "path required" }, 400);
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return c.json({ error: "remote PDFs not supported" }, 400);
  }
  const resolvedPath = resolve(path);
  try {
    const file = Bun.file(resolvedPath);
    const exists = await file.exists();
    if (!exists) return c.json({ error: "file not found" }, 404);
    const buffer = await file.arrayBuffer();
    return new Response(buffer, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}
```

- [ ] **Step 2: Register the route in `src/server.ts`**

Open `src/server.ts`. Find the GET routes block. Add:

```typescript
app.get("/api/pdf-asset", handleGetPdfAsset);
```

Also add the import at the top of `server.ts` where other handlers are imported:

```typescript
import { ..., handleGetPdfAsset } from "./handlers.js";
```

- [ ] **Step 3: Commit**

```bash
git add src/handlers.ts src/server.ts
git commit -m "feat: add /api/pdf-asset endpoint to serve PDF binary"
```

---

## Task 4: Add PDF.js CDN scripts to HTML template

**Files:**
- Modify: `src/client/html.ts`

- [ ] **Step 1: Add PDF.js script tags**

Open `src/client/html.ts`. Find the CDN script block (around lines 56-60) that loads marked, mermaid, katex. Add PDF.js after them:

```html
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs" type="module" id="pdfjs-script"></script>
```

Wait — PDF.js 4.x uses ES modules. The worker must be configured. Instead, use the legacy UMD build which is simpler to integrate:

```html
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/legacy/build/pdf.js"></script>
```

Add this line in `generateClientHTML()` inside the `<head>` section, after the existing CDN scripts.

- [ ] **Step 2: Configure PDF.js worker URL**

The worker must be set before using PDF.js. In `src/client/html.ts`, add an inline script after the PDF.js script tag:

```html
<script>
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/legacy/build/pdf.worker.js';
  }
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/client/html.ts
git commit -m "feat: add PDF.js CDN scripts to HTML template"
```

---

## Task 5: Create PdfViewer component

**Files:**
- Create: `src/client/pdf-viewer.ts`

This is the core rendering component. It renders all pages of a PDF as canvas+text-layer pairs, supports scrolling, and exposes hooks for annotation and translation.

- [ ] **Step 1: Create `src/client/pdf-viewer.ts`**

```typescript
// PDF.js types via window global (loaded from CDN)
declare const pdfjsLib: any;

export interface PdfPageTextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, x, y]
  width: number;
  height: number;
}

export interface PdfTextBlock {
  pageNum: number;
  items: PdfPageTextItem[];
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfViewerOptions {
  container: HTMLElement;
  filePath: string;
  scale?: number;
  onTextSelected?: (pageNum: number, selectedText: string, prefix: string, suffix: string) => void;
  onParagraphClick?: (block: PdfTextBlock) => void;
}

export interface PdfViewerInstance {
  destroy(): void;
  scrollToPage(pageNum: number): void;
  highlightQuote(pageNum: number, quote: string): void;
  clearHighlights(): void;
  getTextBlocks(pageNum: number): PdfTextBlock[];
}

const SCALE_DEFAULT = 1.5;
const LINE_HEIGHT_MULTIPLIER = 1.5; // paragraph grouping threshold

export async function createPdfViewer(opts: PdfViewerOptions): Promise<PdfViewerInstance> {
  const { container, filePath, scale = SCALE_DEFAULT } = opts;
  container.innerHTML = "";
  container.className = "pdf-viewer-container";

  // Load PDF bytes via our server endpoint
  const url = `/api/pdf-asset?path=${encodeURIComponent(filePath)}`;
  const pdfDoc = await pdfjsLib.getDocument(url).promise;

  const pageContainers: HTMLElement[] = [];
  const textBlocksByPage: Map<number, PdfTextBlock[]> = new Map();

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Wrapper div for this page
    const pageWrapper = document.createElement("div");
    pageWrapper.className = "pdf-page-wrapper";
    pageWrapper.dataset.page = String(pageNum);
    pageWrapper.style.position = "relative";
    pageWrapper.style.width = `${viewport.width}px`;
    pageWrapper.style.height = `${viewport.height}px`;
    pageWrapper.style.marginBottom = "16px";

    // Canvas layer
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageWrapper.appendChild(canvas);

    // Text layer
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "pdf-text-layer";
    textLayerDiv.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: ${viewport.width}px; height: ${viewport.height}px;
      overflow: hidden; opacity: 0.2; line-height: 1;
      pointer-events: auto; user-select: text;
    `;
    pageWrapper.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
    await pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
      textDivs: [],
    }).promise;

    // Build text blocks for this page
    const blocks = buildTextBlocks(pageNum, textContent.items as PdfPageTextItem[], viewport, scale);
    textBlocksByPage.set(pageNum, blocks);

    // Paragraph click handler
    if (opts.onParagraphClick) {
      textLayerDiv.addEventListener("click", (e) => {
        if (window.getSelection()?.toString()) return; // ignore if selecting
        const clickY = (e as MouseEvent).offsetY / scale;
        const block = findBlockAtY(blocks, clickY);
        if (block) opts.onParagraphClick!(block);
      });
    }

    // Text selection handler
    if (opts.onTextSelected) {
      textLayerDiv.addEventListener("mouseup", () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const selectedText = sel.toString().trim();
        if (!selectedText) return;
        const { prefix, suffix } = getSelectionContext(textContent.items as PdfPageTextItem[], selectedText);
        opts.onTextSelected!(pageNum, selectedText, prefix, suffix);
      });
    }

    container.appendChild(pageWrapper);
    pageContainers.push(pageWrapper);
  }

  function scrollToPage(pageNum: number) {
    const wrapper = pageContainers[pageNum - 1];
    if (wrapper) wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function highlightQuote(pageNum: number, quote: string) {
    clearHighlights();
    const wrapper = pageContainers[pageNum - 1];
    if (!wrapper) return;
    const textLayer = wrapper.querySelector(".pdf-text-layer") as HTMLElement;
    if (!textLayer) return;
    const spans = Array.from(textLayer.querySelectorAll("span"));
    const normalizedQuote = quote.toLowerCase().replace(/\s+/g, " ").trim();
    for (const span of spans) {
      const text = (span.textContent || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (text && normalizedQuote.includes(text)) {
        span.classList.add("pdf-highlight");
      }
    }
  }

  function clearHighlights() {
    container.querySelectorAll(".pdf-highlight").forEach((el) => {
      el.classList.remove("pdf-highlight");
    });
  }

  function getTextBlocks(pageNum: number): PdfTextBlock[] {
    return textBlocksByPage.get(pageNum) ?? [];
  }

  function destroy() {
    container.innerHTML = "";
  }

  return { destroy, scrollToPage, highlightQuote, clearHighlights, getTextBlocks };
}

function buildTextBlocks(pageNum: number, items: PdfPageTextItem[], viewport: any, scale: number): PdfTextBlock[] {
  if (!items.length) return [];
  // Sort by y descending (PDF coords are bottom-up), then x
  const sorted = [...items].filter(i => i.str.trim()).sort((a, b) => {
    const ay = viewport.height / scale - a.transform[5];
    const by = viewport.height / scale - b.transform[5];
    return ay - by || a.transform[4] - b.transform[4];
  });

  const blocks: PdfTextBlock[] = [];
  let current: PdfPageTextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevY = viewport.height / scale - prev.transform[5];
    const currY = viewport.height / scale - curr.transform[5];
    const lineHeight = (prev.height || 12);
    if (Math.abs(currY - prevY) < lineHeight * LINE_HEIGHT_MULTIPLIER) {
      current.push(curr);
    } else {
      blocks.push(itemsToBlock(pageNum, current, viewport, scale));
      current = [curr];
    }
  }
  blocks.push(itemsToBlock(pageNum, current, viewport, scale));
  return blocks;
}

function itemsToBlock(pageNum: number, items: PdfPageTextItem[], viewport: any, scale: number): PdfTextBlock {
  const x = Math.min(...items.map(i => i.transform[4]));
  const y = viewport.height / scale - Math.max(...items.map(i => i.transform[5]));
  const width = Math.max(...items.map(i => i.transform[4] + i.width)) - x;
  const height = Math.max(...items.map(i => i.height || 12));
  return { pageNum, items, text: items.map(i => i.str).join(" "), x, y, width, height };
}

function findBlockAtY(blocks: PdfTextBlock[], clickY: number): PdfTextBlock | null {
  return blocks.find(b => clickY >= b.y - 2 && clickY <= b.y + b.height + 4) ?? null;
}

function getSelectionContext(items: PdfPageTextItem[], selectedText: string): { prefix: string; suffix: string } {
  const fullText = items.map(i => i.str).join(" ");
  const idx = fullText.toLowerCase().indexOf(selectedText.toLowerCase());
  if (idx === -1) return { prefix: "", suffix: "" };
  return {
    prefix: fullText.slice(Math.max(0, idx - 50), idx).trim(),
    suffix: fullText.slice(idx + selectedText.length, idx + selectedText.length + 50).trim(),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pdf-viewer.ts
git commit -m "feat: add PdfViewer component with PDF.js rendering and text layer"
```

---

## Task 6: Create PDF annotation bridge

**Files:**
- Create: `src/client/pdf-annotation.ts`

This bridges PDF text selection to the existing annotation composer/sidebar. It reuses `showAnnotationComposer`, `saveAnnotation`, `loadAnnotations` from `annotation.ts`.

- [ ] **Step 1: Create `src/client/pdf-annotation.ts`**

```typescript
import type { PdfViewerInstance } from "./pdf-viewer.js";
import { nextAnnotationSerial } from "./annotation.js";
import type { Annotation } from "./annotation.js";

export interface PdfAnnotationBridgeOptions {
  filePath: string;
  viewer: PdfViewerInstance;
  getAnnotations: () => Annotation[];
  onAnnotationCreated: (ann: Annotation) => void;
}

export interface PdfAnnotationBridge {
  handleTextSelected(pageNum: number, selectedText: string, prefix: string, suffix: string): void;
  renderHighlights(annotations: Annotation[]): void;
}

export function createPdfAnnotationBridge(opts: PdfAnnotationBridgeOptions): PdfAnnotationBridge {
  function handleTextSelected(pageNum: number, selectedText: string, prefix: string, suffix: string) {
    // Build a pending annotation and show the composer
    const annotations = opts.getAnnotations();
    const serial = nextAnnotationSerial(annotations);
    const pending: Annotation = {
      id: crypto.randomUUID(),
      serial,
      start: 0,   // unused for PDF
      length: 0,  // unused for PDF
      quote: selectedText,
      quotePrefix: prefix,
      quoteSuffix: suffix,
      note: "",
      createdAt: Date.now(),
      status: "anchored",
      page: pageNum,
      fileType: "pdf",
    } as Annotation & { page: number; fileType: "pdf" };

    // Dispatch custom event that annotation.ts composer listens to
    document.dispatchEvent(new CustomEvent("pdf:show-composer", {
      detail: { annotation: pending, filePath: opts.filePath }
    }));
  }

  function renderHighlights(annotations: Annotation[]) {
    opts.viewer.clearHighlights();
    for (const ann of annotations) {
      const a = ann as Annotation & { page?: number; fileType?: string };
      if (a.fileType === "pdf" && typeof a.page === "number" && a.quote) {
        opts.viewer.highlightQuote(a.page, a.quote);
      }
    }
  }

  return { handleTextSelected, renderHighlights };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pdf-annotation.ts
git commit -m "feat: add PDF annotation bridge connecting text selection to composer"
```

---

## Task 7: Create translation provider and UI

**Files:**
- Create: `src/client/pdf-translation.ts`

- [ ] **Step 1: Create `src/client/pdf-translation.ts`**

```typescript
import type { PdfTextBlock } from "./pdf-viewer.js";

export interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

export class MyMemoryProvider implements TranslationProvider {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory error: ${res.status}`);
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || "Translation failed");
    return data.responseData.translatedText as string;
  }
}

// Active translation overlays keyed by a stable block key
const activeTranslations = new Map<string, HTMLElement>();

function blockKey(block: PdfTextBlock): string {
  return `${block.pageNum}:${block.y.toFixed(0)}`;
}

export function createTranslationUI(
  pageContainer: HTMLElement,
  block: PdfTextBlock,
  translatedText: string,
  scale: number
): void {
  const key = blockKey(block);
  // Remove existing translation for this block if toggling
  const existing = activeTranslations.get(key);
  if (existing) {
    existing.remove();
    activeTranslations.delete(key);
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "pdf-translation-overlay";
  overlay.style.cssText = `
    position: absolute;
    left: ${block.x * scale}px;
    top: ${(block.y + block.height) * scale + 4}px;
    width: ${Math.max(block.width * scale, 200)}px;
    background: rgba(255, 253, 230, 0.97);
    border: 1px solid #e0d080;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.5;
    color: #444;
    z-index: 100;
    pointer-events: auto;
    cursor: pointer;
  `;
  overlay.title = "Click to dismiss";
  overlay.textContent = translatedText;
  overlay.addEventListener("click", () => {
    overlay.remove();
    activeTranslations.delete(key);
  });

  pageContainer.appendChild(overlay);
  activeTranslations.set(key, overlay);
}

export async function handleParagraphTranslation(
  pageWrapper: HTMLElement,
  block: PdfTextBlock,
  provider: TranslationProvider,
  scale: number
): Promise<void> {
  const key = blockKey(block);
  // Toggle off if already shown
  const existing = activeTranslations.get(key);
  if (existing) {
    existing.remove();
    activeTranslations.delete(key);
    return;
  }

  // Show loading indicator
  const loading = document.createElement("div");
  loading.className = "pdf-translation-overlay pdf-translation-loading";
  loading.style.cssText = `
    position: absolute;
    left: ${block.x * scale}px;
    top: ${(block.y + block.height) * scale + 4}px;
    background: rgba(240,240,240,0.9);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: #888;
    z-index: 100;
  `;
  loading.textContent = "翻译中…";
  pageWrapper.appendChild(loading);

  try {
    const translated = await provider.translate(block.text, "en", "zh");
    loading.remove();
    createTranslationUI(pageWrapper, block, translated, scale);
  } catch (e) {
    loading.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "pdf-translation-overlay";
    errDiv.style.cssText = loading.style.cssText;
    errDiv.style.color = "#c00";
    errDiv.textContent = "翻译失败";
    pageWrapper.appendChild(errDiv);
    setTimeout(() => errDiv.remove(), 2000);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pdf-translation.ts
git commit -m "feat: add TranslationProvider interface and MyMemory implementation"
```

---

## Task 8: Wire everything into main.ts

**Files:**
- Modify: `src/client/main.ts`

This task integrates all new components into the existing routing and event system.

- [ ] **Step 1: Add imports at the top of `src/client/main.ts`**

Find the existing imports block. Add:

```typescript
import { createPdfViewer, type PdfViewerInstance } from "./pdf-viewer.js";
import { createPdfAnnotationBridge } from "./pdf-annotation.js";
import { MyMemoryProvider, handleParagraphTranslation } from "./pdf-translation.js";
```

- [ ] **Step 2: Add `isPdfPath` helper near the other path helpers (around line 644)**

Find `isHtmlPath`, `isJsonPath` etc. Add:

```typescript
function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}
```

- [ ] **Step 3: Add PDF viewer state variable near other state variables**

Find where state variables are declared (look for `let currentFilePath` or similar). Add:

```typescript
let currentPdfViewer: PdfViewerInstance | null = null;
const translationProvider = new MyMemoryProvider();
```

- [ ] **Step 4: Add PDF branch in `renderContent()` function**

Find the `renderContent()` function (around line 465). It has:
```typescript
if (isHtmlPath(file.path)) { ... }
if (isJsonPath(file.path)) { ... }
// default: markdown
```

Add a PDF branch BEFORE the markdown default:

```typescript
if (isPdfPath(file.path)) {
  // Destroy previous PDF viewer if any
  if (currentPdfViewer) {
    currentPdfViewer.destroy();
    currentPdfViewer = null;
  }

  const scale = 1.5;
  // bridge is set after viewer resolves; callbacks check it defensively
  let bridge: ReturnType<typeof createPdfAnnotationBridge> | null = null;

  createPdfViewer({
    container,
    filePath: file.path,
    scale,
    onTextSelected: (pageNum, selectedText, prefix, suffix) => {
      bridge?.handleTextSelected(pageNum, selectedText, prefix, suffix);
    },
    onParagraphClick: (block) => {
      const pageWrapper = container.querySelector(
        `.pdf-page-wrapper[data-page="${block.pageNum}"]`
      ) as HTMLElement;
      if (pageWrapper) {
        handleParagraphTranslation(pageWrapper, block, translationProvider, scale);
      }
    },
  }).then((viewer) => {
    currentPdfViewer = viewer;
    bridge = createPdfAnnotationBridge({
      filePath: file.path,
      viewer,
      getAnnotations: () => (window as any).__annotationState?.annotations ?? [],
      onAnnotationCreated: () => {},
    });
    // Re-render annotation highlights when annotations load
    document.addEventListener("annotations:loaded", () => {
      const anns = (window as any).__annotationState?.annotations ?? [];
      bridge?.renderHighlights(anns);
    }, { once: false });
  });
  return; // don't fall through to markdown renderer
}
```

- [ ] **Step 5: Intercept `pdf://` link clicks**

Find where click events on the content area are handled, or find where markdown links are intercepted. Add a global click interceptor. Find the `DOMContentLoaded` or initialization block and add:

```typescript
document.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
  if (!target) return;
  const href = target.getAttribute("href") || "";
  if (!href.startsWith("pdf://")) return;
  e.preventDefault();

  // Parse pdf://path/to/file.pdf#page=3&quote=some+text
  const withoutProto = href.slice("pdf://".length);
  const hashIdx = withoutProto.indexOf("#");
  const filePart = hashIdx >= 0 ? withoutProto.slice(0, hashIdx) : withoutProto;
  const paramStr = hashIdx >= 0 ? withoutProto.slice(hashIdx + 1) : "";
  const params = new URLSearchParams(paramStr);
  const pageNum = parseInt(params.get("page") || "1", 10);
  const quote = params.get("quote") || "";

  // Open the PDF file (reuse existing file-open mechanism)
  openFile(filePart).then(() => {
    // After render, scroll and highlight
    setTimeout(() => {
      if (currentPdfViewer) {
        currentPdfViewer.scrollToPage(pageNum);
        if (quote) currentPdfViewer.highlightQuote(pageNum, decodeURIComponent(quote));
      }
    }, 500);
  });
});
```

Note: `openFile` is the existing function that loads a file by path. Find its actual name in `main.ts` (search for `handleGetFile` call or the function that sets `currentFilePath`) and use the correct name.

- [ ] **Step 6: Handle `pdf:show-composer` event from annotation bridge**

In the same initialization block, add:

```typescript
document.addEventListener("pdf:show-composer", (e: Event) => {
  const { annotation, filePath } = (e as CustomEvent).detail;
  // Use existing annotation composer — dispatch to annotation system
  // Set pending annotation in annotation state
  if ((window as any).__setPendingAnnotation) {
    (window as any).__setPendingAnnotation(annotation, filePath);
  }
});
```

This requires a small export from `annotation.ts` in Task 9.

- [ ] **Step 7: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: wire PDF viewer, annotation, and translation into main.ts"
```

---

## Task 9: Export annotation composer hook from annotation.ts

**Files:**
- Modify: `src/client/annotation.ts`

The PDF annotation bridge needs to trigger the existing composer. We expose a function on `window` so the bridge can call it without circular imports.

- [ ] **Step 1: Find where `pendingAnnotation` state is set in `annotation.ts`**

Search for `pendingAnnotation` assignment in `annotation.ts`. Find the function or block that sets it and shows the composer popup (look for `composerPopup.style.display` or similar).

- [ ] **Step 2: Export a `setPendingAnnotation` function and expose on window**

In `annotation.ts`, find the `initAnnotationElements` function or the module initialization. Add at the end of the file:

```typescript
export function setPendingAnnotation(annotation: Annotation, filePath: string): void {
  // Set state directly — find the actual state mutation used in the existing code
  // and replicate it here for PDF annotations
  state.pendingAnnotation = annotation;
  state.pendingAnnotationFilePath = filePath;
  showComposerPopup(annotation);
}
```

Then in `main.ts` after `initAnnotationElements()` is called, expose it:

```typescript
import { ..., setPendingAnnotation } from "./annotation.js";
// ...
(window as any).__setPendingAnnotation = setPendingAnnotation;
```

Note: Find the exact state variable name and `showComposerPopup` function name by reading `annotation.ts` — they may differ. Use the actual names found.

- [ ] **Step 3: Commit**

```bash
git add src/client/annotation.ts src/client/main.ts
git commit -m "feat: expose setPendingAnnotation for PDF annotation bridge"
```

---

## Task 10: Add CSS for PDF viewer and translation overlays

**Files:**
- Modify: `src/client/css.ts`

- [ ] **Step 1: Add PDF viewer CSS to `src/client/css.ts`**

Open `src/client/css.ts`. Find the end of the CSS string (it's a large template literal). Add before the closing backtick:

```css
/* PDF Viewer */
.pdf-viewer-container {
  padding: 16px;
  background: #525659;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-page-wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  background: white;
}

.pdf-page-wrapper canvas {
  display: block;
}

.pdf-text-layer span {
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.pdf-highlight {
  background: rgba(255, 220, 0, 0.4) !important;
  border-radius: 2px;
}

.pdf-translation-overlay {
  word-break: break-all;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/css.ts
git commit -m "feat: add CSS for PDF viewer, text layer, highlights, and translation overlays"
```

---

## Task 11: Build and smoke test

- [ ] **Step 1: Build the client bundle**

```bash
cd /Users/huanghao/workspace/md-viewer
bun run build:client
```

Expected: no TypeScript errors, `dist/client.js` updated.

- [ ] **Step 2: Start the server and open a PDF**

```bash
bun run src/server.ts /path/to/any.pdf
```

Open browser at `http://localhost:7701`. Verify:
- PDF renders with all pages
- Text is selectable in text layer
- Clicking a paragraph shows "翻译中…" then Chinese translation below

- [ ] **Step 3: Test pdf:// link from a markdown file**

Create a test MD file:
```markdown
# Test

See [Section 3](pdf://test.pdf#page=2&quote=introduction)
```

Open it in mdv. Click the link. Verify PDF opens at page 2 with highlighted text.

- [ ] **Step 4: Test annotation on PDF**

Select text in the PDF text layer. Verify the annotation composer appears. Save the annotation. Verify it appears in the sidebar.

- [ ] **Step 5: Commit any fixes, then tag**

```bash
git add -A
git commit -m "fix: PDF viewer smoke test fixes"
```

---

## Notes and TODOs

- **TODO**: PDF.js `renderTextLayer` API changed between versions — if the CDN version differs, the text layer call may need adjustment. Check the PDF.js 4.x migration guide if text layer doesn't render.
- **TODO**: `openFile` function name in `main.ts` — Task 8 Step 5 references it but the exact name must be verified by reading `main.ts`.
- **TODO**: `showComposerPopup` and `state` object names in `annotation.ts` — Task 9 Step 2 references them but exact names must be verified.
- **TODO**: Translation target language hardcoded to `zh` — add to settings later.
- **TODO**: Add `LibreTranslateProvider` and `LocalModelProvider` implementations.
- **TODO**: PDF viewer toolbar (zoom controls, page number input).
- **TODO**: Handle multi-column PDF layouts for paragraph detection.
