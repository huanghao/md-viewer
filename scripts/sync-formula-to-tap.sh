#!/usr/bin/env bash
# 同步 Formula 到 homebrew-tap 仓库
set -euo pipefail

VERSION="${1:-}"
TAP_REPO="${2:-../homebrew-tap}"

if [[ -z "$VERSION" ]]; then
  echo "用法: $0 <version> [tap-repo-path]"
  echo "示例: $0 0.1.0 ../homebrew-tap"
  exit 1
fi

FORMULA="Formula/md-viewer.rb"

if [[ ! -f "$FORMULA" ]]; then
  echo "❌ Formula 文件不存在: $FORMULA"
  exit 1
fi

if [[ ! -d "$TAP_REPO" ]]; then
  echo "❌ Tap 仓库不存在: $TAP_REPO"
  echo "   请先克隆: git clone https://github.com/huanghao/homebrew-tap.git"
  exit 1
fi

echo "🔄 同步 Formula 到 homebrew-tap"
echo "=============================="
echo ""
echo "版本: v${VERSION}"
echo "Tap 仓库: ${TAP_REPO}"
echo ""

# 复制 Formula
echo "1️⃣  复制 Formula..."
cp "$FORMULA" "${TAP_REPO}/Formula/"

# 切换到 tap 仓库
cd "$TAP_REPO"

# 检查是否有变更
if git diff --quiet Formula/md-viewer.rb; then
  echo "⚠️  Formula 没有变更"
  exit 0
fi

echo ""
echo "2️⃣  提交到 tap 仓库..."

git add Formula/md-viewer.rb
git commit -m "chore: update md-viewer to v${VERSION}

Release: https://github.com/huanghao/md-viewer/releases/tag/v${VERSION}"

echo ""
echo "3️⃣  推送到远程..."
git push

echo ""
echo "✅ Formula 已同步！"
echo ""
echo "测试安装:"
echo "  brew update"
echo "  brew upgrade md-viewer"
