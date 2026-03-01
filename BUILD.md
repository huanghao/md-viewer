# Build Guide

## Installation

### Install CLI Commands Globally

```bash
# Step 1: Register the package
bun link

# Step 2: Install dependencies and run postinstall hook
bun install
```

This installs:
- `mdv` - CLI client to add files to MD Viewer (via bun link)
- `mdv-admin` - Admin CLI for managing sync records (via bun link)
- `mdv-iterm2-dispatcher` - iTerm2 Semantic History dispatcher (via postinstall to ~/bin/)

Verify installation:
```bash
which mdv                      # Should show: ~/.bun/bin/mdv
which mdv-admin                # Should show: ~/.bun/bin/mdv-admin
which mdv-iterm2-dispatcher    # Should show: ~/bin/mdv-iterm2-dispatcher
mdv --help                     # Show client CLI usage
mdv-admin --help               # Show admin CLI usage
```

**Important Notes**:
- `bun link` registers the package and creates `mdv` and `mdv-admin` commands
- `bun install` triggers the postinstall hook which installs `mdv-iterm2-dispatcher`
- The dispatcher script is only needed if you want to use iTerm2 Semantic History (Cmd+click)
- See `docs/design/iterm2-integration.md` for iTerm2 configuration

### CLI Usage

**mdv (Client)**
```bash
mdv README.md                    # Add file and switch to it
mdv --no-focus notes.md          # Add file without switching
mdv -p 3001 doc.md               # Use custom server port
mdv https://example.com/doc.md   # Add remote file
```

**mdv-admin (Administration)**
```bash
mdv-admin stats                  # View sync statistics
mdv-admin cleanup                # Clean up expired records (>6 months)
mdv-admin stats -p 3001          # Use custom server port
```

Note: `mdv-admin` works with or without the server running. When the server is not running, it operates directly on local data files.

### Uninstall

```bash
bun unlink
```

Or manually remove the symlinks:
```bash
rm ~/.bun/bin/mdv
rm ~/.bun/bin/mdv-admin
```

## Development

Use two terminals:

```bash
# terminal 1: server with auto-reload
bun run dev

# terminal 2: client bundle with watch mode
bun run build:client:watch
```

Notes:
- Do not manually restart server during normal development; `bun run dev` auto-reloads.
- Client changes require rebuild (`build:client:watch` handles this).
- CLI commands are linked, so code changes take effect immediately (no reinstall needed).

## Production Build

```bash
bun run build:client
bun run build
```

Artifacts:
- `dist/client.js` - Client bundle
- `md-viewer` - Standalone server binary

## Troubleshooting

### Server fails with missing client bundle

```bash
bun run build:client
```

### CLI command not found after installation

```bash
# Check if ~/.bun/bin is in PATH
echo $PATH | grep -q ".bun/bin" && echo "✅ In PATH" || echo "❌ Not in PATH"

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$HOME/.bun/bin:$PATH"
```

### CLI points to old version

```bash
# Re-link
bun unlink
bun link
```
