#!/usr/bin/env bash
# 安装 iTerm2 Semantic History Dispatcher
set -euo pipefail

TARGET_DIR="$HOME/bin"
TARGET_FILE="$TARGET_DIR/mdv-iterm2-dispatcher"
SOURCE_FILE="$(dirname "$0")/../scripts/mdv-iterm2-dispatcher.sh"

# 创建 ~/bin 目录（如果不存在）
if [[ ! -d "$TARGET_DIR" ]]; then
  echo "📁 创建目录: $TARGET_DIR"
  mkdir -p "$TARGET_DIR"
fi

# 检查文件是否已存在
if [[ -f "$TARGET_FILE" ]]; then
  echo "⚠️  文件已存在: $TARGET_FILE"
  echo "   如需重新安装，请先删除该文件"
  exit 0
fi

# 复制脚本
echo "📋 安装 iTerm2 dispatcher: $TARGET_FILE"
cp "$SOURCE_FILE" "$TARGET_FILE"
chmod +x "$TARGET_FILE"

# 检查 ~/bin 是否在 PATH 中
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
  echo ""
  echo "⚠️  警告: ~/bin 不在 PATH 中"
  echo ""
  echo "请添加以下内容到 ~/.zshrc 或 ~/.bashrc:"
  echo ""
  echo "    export PATH=\"\$HOME/bin:\$PATH\""
  echo ""
fi

echo "✅ 安装完成!"
echo ""
echo "下一步: 配置 iTerm2 Semantic History"
echo "  1. iTerm2 → Preferences → Profiles → Advanced"
echo "  2. Semantic History → Run command"
echo "  3. 命令: mdv-iterm2-dispatcher \\1 \\5"
echo ""
echo "说明:"
echo "  \\1 - 匹配到的路径（可能是相对路径或 basename）"
echo "  \\5 - 当前工作目录（用于解析相对路径）"
echo ""
echo "详细说明: docs/design/iterm2-integration.md"
