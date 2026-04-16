#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [ $# -lt 1 ]; then
  echo "用法: ./open-doc.sh <markdown-or-html-file>" >&2
  exit 1
fi

exec bun run src/cli.ts "$1"
