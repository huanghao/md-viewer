# MD Viewer

Local Markdown/PDF/HTML reading tool with file watching, workspace navigation, tabs, and SQLite-backed annotations.

## Current Features

- Open local Markdown, HTML, text-like files, and PDF files through `mdv <FILE>` or the browser UI.
- Maintain opened tabs and session state in the browser.
- Detect external file changes and show refresh/diff state for opened files.
- Browse configured workspaces with tree view, path autocomplete, quick open, and workspace file search.
- Use a lightweight Go workspace scanner daemon for long-running indexing when started by app-nanny.
- Add text annotations, replies, status changes, quick comments, and PDF annotations backed by local SQLite.
- Render Markdown with TOC, search, diff, zoom, code highlighting, KaTeX, Mermaid, and PDF.js support.

Removed features are not part of the current product: chat, todo, RAG/vector search, translation, agent monitor, and external sync flows.

## Development

Install dependencies:

```bash
bun install
```

Run the development server without nanny:

```bash
just dev
```

Build local artifacts:

```bash
bun run build
```

Run tests:

```bash
bun test tests/unit
go test -race ./cmd/workspace-scanner
```

## Long-Running Local Service

For daily local use, run the service through app-nanny using `app-nanny.toml`. It starts:

- Bun server on port `3000`
- frontend build watcher
- Go workspace scanner daemon over `.cache/mdv-workspace-index.sock`

Build the scanner once if needed:

```bash
bun run build:scanner
```

`mdv <FILE>` expects the local server to already be running.

## Project Layout

- `src/server.ts` — Hono server entrypoint
- `src/routes/` — HTTP route registration
- `src/handlers/` — request handlers
- `src/client/` — browser app
- `cmd/workspace-scanner/` — Go workspace scanner daemon
- `docs/design/` — long-term design truth
- `docs/reference/` — long-term operational/topic references
- `docs/testing/` — testing notes

See [docs/README.md](docs/README.md) and [AGENTS.md](AGENTS.md) for maintenance rules.
