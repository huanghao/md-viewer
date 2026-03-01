# Build Guide

## Development

Use two terminals:

```bash
# terminal 1
bun run dev

# terminal 2
bun run build:client:watch
```

Notes:
- Do not manually restart server during normal development; `bun run dev` auto-reloads.
- Client changes require rebuild (`build:client:watch` handles this).

## Production Build

```bash
bun run build:client
bun run build
```

Artifacts:
- `dist/client.js`
- `md-viewer` (server binary)

## Troubleshooting

- If server fails with missing client bundle, run:

```bash
bun run build:client
```
