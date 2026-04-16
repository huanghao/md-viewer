# PDF Viewer, Annotation, and Translation Design

Date: 2026-04-16

## Overview

Add PDF support to mdv for academic paper reading. Four subsystems built in order:

1. PDF rendering (PDF.js library mode)
2. Cross-file anchor links (`pdf://` protocol)
3. PDF text selection annotation (reuse existing system)
4. Paragraph translation (pluggable provider, default MyMemory)

## Subsystem 1: PDF Rendering

**Library**: PDF.js via CDN (same pattern as marked.js, mermaid). Library mode, not pre-built viewer.

**Rendering structure per page**:
- `<canvas>` for visual rendering
- `<div class="textLayer">` overlaid for text selection (required for annotation and translation)

**Integration points**:
- `src/utils.ts`: add `.pdf` to supported file types
- `src/handlers.ts`: serve PDF as binary (`application/pdf`) via `/api/file`
- `src/client/main.ts`: route `.pdf` files to new `PdfViewer` component
- New file: `src/client/pdf-viewer.ts`

**UI**: scrollable list of pages, page number indicator, basic zoom (TODO: toolbar with more controls).

## Subsystem 2: PDF Anchor Links

**Format**: `[Section 3.2](pdf://paper.pdf#page=3&quote=transformer%20attention)`

**Flow**:
1. MD renderer intercepts clicks on `pdf://` hrefs
2. Parse `file`, `page`, `quote` from URL
3. Switch to PDF file via existing file-open mechanism
4. After render: scroll to page, fuzzy-search quote in text layer, highlight match
5. Fallback: if quote not found, scroll to page only (no error)

**Quote matching**: case-insensitive, collapse whitespace, partial match sufficient.

**Agent authoring**: agent reads PDF text, writes links directly — no pre-indexing needed.

## Subsystem 3: PDF Annotation

Reuse existing annotation system (SQLite storage, sidebar UI, thread replies). Only the anchor schema changes.

| Field | Markdown | PDF |
|-------|----------|-----|
| `fileType` | `"md"` | `"pdf"` |
| `page` | — | page number (1-based) |
| `quote` | text content | text content |
| `quotePrefix` | context before | context before |
| `quoteSuffix` | context after | context after |
| `start`/`length` | char offset | — |

**Selection flow**: PDF.js text layer → user selects text → existing composer popup → save with PDF anchor → render highlight overlay on correct page.

**Anchor re-resolution**: on PDF open, match stored `{page, quote, quotePrefix, quoteSuffix}` against text layer — same fuzzy strategy as MD.

## Subsystem 4: Paragraph Translation

**Interaction**: click any text in PDF → "Translate" button appears → click → translated text inserted below paragraph with light background. Click again to collapse.

**Paragraph detection**: group PDF.js text items by proximity on Y-axis (threshold: ~1.5× line height). Clicking any item in a group translates the whole group.

**Provider interface**:
```typescript
interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>
}
```

**Default**: `MyMemoryProvider` — calls `https://api.mymemory.translated.net/get` (free, no key, 5000 chars/day limit).

**TODO**: `LibreTranslateProvider`, `LocalModelProvider`.

**Target language**: Chinese (zh), hardcoded for now. TODO: settings option.

## Anchor Stability

PDF files are immutable — page numbers are permanent anchors. Quote text provides secondary precision. This is sufficient for agent-generated references and user annotations alike.

## File Changes Summary

| File | Change |
|------|--------|
| `src/utils.ts` | add `.pdf` to supported types |
| `src/handlers.ts` | serve PDF binary |
| `src/client/main.ts` | route PDF files, intercept `pdf://` clicks |
| `src/client/pdf-viewer.ts` | new — PDF.js rendering, text layer, page nav |
| `src/client/pdf-annotation.ts` | new — selection handling, anchor schema for PDF |
| `src/client/pdf-translation.ts` | new — paragraph detection, TranslationProvider |
| `src/client/annotation.ts` | extend anchor type to support PDF fields |
| `src/annotation-storage.ts` | extend schema for PDF anchor fields |
| `src/types.ts` | extend `StoredAnnotation` type |
