# AGENTS.md

This document contains conventions and guidelines for AI agents working on the MD Viewer project.

## Man Page Maintenance Convention

When modifying CLI parameters or configuration-related code, agents MUST update the corresponding man pages.

### CLI Parameter Changes

When adding, removing, or modifying CLI options in `src/cli.ts`:

1. Update `man/md-viewer.1`:
   - Add/remove the option in the OPTIONS section
   - Update the EXAMPLES section if needed
   - Update the SYNOPSIS if command syntax changes

2. Ensure consistency between:
   - `showHelp()` output in `src/cli.ts`
   - `man/md-viewer.1` OPTIONS section
   - This document's CLI reference

### Configuration Changes

When adding, removing, or modifying configuration options:

1. Update `man/md-viewer.config.5`:
   - Add/remove the option in the appropriate section
   - Update the EXAMPLE CONFIGURATION section
   - Document the default value and valid ranges

2. 更新 `docs/配置说明.md`

3. Update configuration loading code in the appropriate module

4. Consider backward compatibility:
   - Mark deprecated options in the man page
   - Maintain support for old option names when possible

## Current Configuration Options

See `man/md-viewer.config.5` for the authoritative reference.

Categories:
- `server.*` - Server behavior (port, host)
- `client.*` - UI behavior (theme, focus)
- `editor.*` - Display options (font size, line height)
- `files.*` - File handling (auto-refresh, remember open)

## Build System

The project uses esbuild to bundle client-side code:

- Client code is in `src/client/main.ts` (and will be split into modules)
- Build output goes to `dist/client.js`
- Server reads the bundled client code from `dist/client.js`

### Build Commands

- `bun run build:client` - Build client code once
- `bun run build:client:watch` - Watch and rebuild on changes
- `bun run build` - Full production build (client + server binary)

### Development Workflow

When modifying client-side code:

1. Run `bun run build:client:watch` in one terminal (auto-rebuilds on save)
2. Run `bun run dev` in another terminal (auto-reloads server on changes)
3. Both will watch and reload automatically
4. 默认agent **DO NOT restart the server** - 因为我在终端已经运行了 `bun run dev` handles auto-reload

When modifying server-side code:

- Just run `bun run dev` - it auto-reloads on changes
- No manual build step needed

### Important Notes

- Always build client code before starting the server in production
- The server will fail to start if `dist/client.js` doesn't exist
- Client code changes require a rebuild (use watch mode during development)

## Development Reminders

- Always run `bun tsc --noEmit` after TypeScript changes
- Test both CLI and web interface after modifications
- Update TODO.md when completing tasks
- Build client code before committing if you changed client files
