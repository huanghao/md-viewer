#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if ! command -v bun >/dev/null 2>&1; then
  echo "bun 未安装。先执行: brew install oven-sh/bun/bun" >&2
  exit 1
fi

CONFIG_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/md-viewer/config.json"
PORT="3001"

if [ -f "$CONFIG_FILE" ]; then
  PORT="$(ruby -rjson -e 'cfg = JSON.parse(File.read(ARGV[0])); puts(cfg.dig("server", "port") || 3001)' "$CONFIG_FILE" 2>/dev/null || echo 3001)"
fi

echo "MD Viewer starting on http://localhost:${PORT}/"
exec bun run src/server.ts
