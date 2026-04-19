#!/bin/bash
# 在 A/B 两个版本之间切换 test-diff.md，用于测试 diff 视图
# 用法：bash scripts/toggle-test-diff.sh

DIR="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$DIR/docs/test-diff.md"
VERSION_A="$DIR/docs/test-diff-a.md"
VERSION_B="$DIR/docs/test-diff-b.md"

if [ ! -f "$FILE" ] || diff -q "$FILE" "$VERSION_A" > /dev/null 2>&1; then
  python3 -c "open('$FILE','w').write(open('$VERSION_B').read())"
  echo "→ 已切换到版本 B"
else
  python3 -c "open('$FILE','w').write(open('$VERSION_A').read())"
  echo "→ 已切换到版本 A"
fi
