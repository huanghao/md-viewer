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

2. Update configuration loading code in the appropriate module

3. Consider backward compatibility:
   - Mark deprecated options in the man page
   - Maintain support for old option names when possible

### Man Page Format Guidelines

- Use `.TP` for option definitions
- Keep option descriptions under 80 characters where possible
- Use `.BR` for bold+roman mixed text (e.g., `.BR \-p ", " \-\-port`)
- Include examples for non-obvious options
- Cross-reference related man pages with `.BR manpage (N)`

## Current CLI Reference

```
md-viewer-cli [OPTIONS] FILE

Options:
  -p, --port <PORT>     Server port (default: 3000)
  -h, --host <HOST>     Server host (default: localhost)
  --no-focus            Don't switch to the file after adding
  --help                Show help message
```

## Current Configuration Options

See `man/md-viewer.config.5` for the authoritative reference.

Categories:
- `server.*` - Server behavior (port, host)
- `client.*` - UI behavior (theme, focus)
- `editor.*` - Display options (font size, line height)
- `files.*` - File handling (auto-refresh, remember open)

## Development Reminders

- Always run `bun tsc --noEmit` after TypeScript changes
- Test both CLI and web interface after modifications
- Update TODO.md when completing tasks
