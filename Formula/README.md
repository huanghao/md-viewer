# Homebrew Tap for MD Viewer

This directory contains the Homebrew Formula for MD Viewer.

## Installation

```bash
# Add tap
brew tap huanghao/tap

# Install
brew install md-viewer
```

Or install directly:

```bash
brew install huanghao/tap/md-viewer
```

## Note

The Formula has been moved to the dedicated tap repository:
https://github.com/huanghao/homebrew-tap

This directory is kept for reference and local testing only.

## Usage

```bash
# Start server (foreground)
mdv server start

# Start server (background)
mdv server start --daemon

# Open a markdown file
mdv README.md

# Show help
mdv --help
```

## Configuration

Configuration file: `~/.config/md-viewer/config.json`

## iTerm2 Integration

Set Semantic History in iTerm2 Preferences:

```
Run command: /opt/homebrew/bin/mdv-iterm2-dispatcher \1 \5
```

## Development

### Update Formula

After releasing a new version:

```bash
./scripts/update-formula-sha.sh <version>
git add Formula/md-viewer.rb
git commit -m 'chore: update formula for v<version>'
git push
```

### Local Testing

```bash
# Build
./scripts/build-all.sh 1.0.0

# Package
./scripts/package.sh 1.0.0

# Test locally
brew install --build-from-source Formula/md-viewer-local.rb
```

## Links

- [Main Repository](https://github.com/huanghao/md-viewer)
- [Releases](https://github.com/huanghao/md-viewer/releases)
