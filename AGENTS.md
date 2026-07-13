# AGENTS.md

This file contains durable project rules for coding agents. Keep it short and current. Do not put one-off plans, historical notes, or tool playbooks here.

## Project Shape

- `src/server.ts` is only the Hono app entrypoint: config, route registration, startup.
- HTTP routes live in `src/routes/`; request handlers live in `src/handlers/`.
- Frontend code lives in `src/client/`; static HTML is `public/index.html`; built assets are `dist/client.js` and `dist/client.css`.
- Workspace indexing is handled by the Go scanner in `cmd/workspace-scanner/`. The Bun server talks to it through `MDV_WORKSPACE_DAEMON_SOCKET` when app-nanny starts both processes.
- The TypeScript workspace scanner is fallback code. Do not make it the primary long-running indexer again without an explicit design update.
- Whole-workspace chokidar watching is intentionally off by default. Opened files may be watched individually; closed/LRU-evicted files must be unwatched.
- Annotation data is server-side SQLite. `src/annotation-db.ts` owns DB setup; feature-specific storage modules should stay small and focused.

## Removed Feature Boundary

These features were intentionally removed to reduce runtime weight and maintenance cost:

- chat / AI panel
- todo panel and todo CLI
- RAG/vector search
- translation server and paragraph translation
- agent session monitor
- external sync / sync-state flows

Do not reintroduce any of them as incidental dependencies, UI leftovers, storage keys, docs, or tests. A new version requires a fresh design document and an explicit product decision.

## Development Commands

- Install deps: `bun install`
- Dev server without nanny: `just dev`
- Build all local artifacts: `bun run build`
- Unit tests: `bun test tests/unit`
- Go scanner race tests: `go test -race ./cmd/workspace-scanner`

For long-running local use, prefer app-nanny with `app-nanny.toml`. Build the scanner first if `.cache/mdv-workspace-scanner` is missing:

```bash
bun run build:scanner
```

## Change Discipline

- Prefer existing module boundaries over new abstractions.
- Keep commits focused on one goal. Do not mix unrelated cleanup with behavioral changes.
- Add or update tests for non-trivial logic, state transitions, storage behavior, watcher behavior, or daemon behavior.
- When touching scanner/indexing behavior, run both `bun test tests/unit` and `go test -race ./cmd/workspace-scanner`.
- When touching build/runtime entrypoints, run `bun run build`.

## Frontend Rules

- Do not introduce new `(window as any).xxx = fn`, `window.xxx = fn`, or inline `onclick` as inter-component communication.
- Use event delegation (`data-action` + `data-*`) for HTML templates.
- Use `CustomEvent` or explicit `initXxx(deps)` callback injection for cross-module coordination.
- Third-party library globals (`marked`, `mermaid`, `pdfjsLib`, `renderMathInElement`) are allowed only as library integration points.
- Avoid modal UI for ordinary input/editing. Prefer inline controls, sidebars, drawers, or existing panels. Confirmation UI is reserved for high-risk destructive actions.

## Import Boundaries

- `src/client/main.ts` should remain a tiny startup bridge.
- `src/client/init.ts` owns app initialization and dependency wiring.
- Avoid circular imports. If module A needs module B but B already imports A, use `initXxx(deps)` or a narrow callback registration module.
- If a frontend change compiles but crashes with `undefined` module state at runtime, check for an import cycle before adding guards.

## Count And Badge Consistency

- Annotation open-count logic must use `isOpen(status)` from `src/annotation-status.ts`.
- Do not inline equivalent status checks such as `status !== "resolved"`.
- If annotation status values change, update server aggregation, client badge updates, UI filtering, and related tests together.

## Documentation

- Documentation governance lives in `docs/文档治理规范.md`.
- `docs/` root should only contain the docs index and governance file.
- Long-term design truth lives in `docs/design/`.
- Long-term operational/topic references live in `docs/reference/`.
- Testing notes live in `docs/testing/`.
- Do not create `docs/archive/`, `docs/research/`, or prototype asset folders for historical material. Git history is the archive.
- CLI/config behavior changes must update `showHelp()` and any relevant docs.
