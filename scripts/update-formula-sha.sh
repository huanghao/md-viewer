#!/usr/bin/env bash
# 更新 Formula 中的 SHA256
set -euo pipefail

VERSION="${1:-}"
FORMULA="Formula/md-viewer.rb"

if [[ -z "$VERSION" ]]; then
  echo "用法: $0 <version>"
  echo "示例: $0 1.0.0"
  exit 1
fi

if [[ ! -f "$FORMULA" ]]; then
  echo "❌ Formula 文件不存在: $FORMULA"
  exit 1
fi

echo "🔄 更新 Formula SHA256"
echo "===================="
echo ""

# 从 GitHub Release 下载 SHA256SUMS.txt
SUMS_URL="https://github.com/huanghao/md-viewer/releases/download/v${VERSION}/SHA256SUMS.txt"
echo "1️⃣  下载 SHA256SUMS.txt..."
echo "   URL: $SUMS_URL"

if ! curl -fsSL "$SUMS_URL" -o /tmp/SHA256SUMS.txt; then
  echo "❌ 下载失败"
  exit 1
fi

echo ""
echo "2️⃣  解析 SHA256..."

# 读取各平台的 SHA256
SHA_DARWIN_ARM64=$(grep "mdv-darwin-arm64.tar.gz" /tmp/SHA256SUMS.txt | cut -d' ' -f1)
SHA_DARWIN_X64=$(grep "mdv-darwin-x64.tar.gz" /tmp/SHA256SUMS.txt | cut -d' ' -f1)
SHA_LINUX_ARM64=$(grep "mdv-linux-arm64.tar.gz" /tmp/SHA256SUMS.txt | cut -d' ' -f1)
SHA_LINUX_X64=$(grep "mdv-linux-x64.tar.gz" /tmp/SHA256SUMS.txt | cut -d' ' -f1)

echo "   darwin-arm64: $SHA_DARWIN_ARM64"
echo "   darwin-x64:   $SHA_DARWIN_X64"
echo "   linux-arm64:  $SHA_LINUX_ARM64"
echo "   linux-x64:    $SHA_LINUX_X64"

echo ""
echo "3️⃣  更新 Formula..."

# 使用 sed 更新 SHA256（macOS 兼容）
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/version \".*\"/version \"${VERSION}\"/" "$FORMULA"
  sed -i '' "s|download/v[0-9.]*|download/v${VERSION}|g" "$FORMULA"
  sed -i '' "s/sha256 \"PLACEHOLDER_SHA256_ARM64\"/sha256 \"${SHA_DARWIN_ARM64}\"/" "$FORMULA"
  sed -i '' "s/sha256 \"PLACEHOLDER_SHA256_X64\"/sha256 \"${SHA_DARWIN_X64}\"/" "$FORMULA"
  sed -i '' "s/sha256 \"PLACEHOLDER_SHA256_LINUX_ARM64\"/sha256 \"${SHA_LINUX_ARM64}\"/" "$FORMULA"
  sed -i '' "s/sha256 \"PLACEHOLDER_SHA256_LINUX_X64\"/sha256 \"${SHA_LINUX_X64}\"/" "$FORMULA"
else
  sed -i "s/version \".*\"/version \"${VERSION}\"/" "$FORMULA"
  sed -i "s|download/v[0-9.]*|download/v${VERSION}|g" "$FORMULA"
  sed -i "s/sha256 \"PLACEHOLDER_SHA256_ARM64\"/sha256 \"${SHA_DARWIN_ARM64}\"/" "$FORMULA"
  sed -i "s/sha256 \"PLACEHOLDER_SHA256_X64\"/sha256 \"${SHA_DARWIN_X64}\"/" "$FORMULA"
  sed -i "s/sha256 \"PLACEHOLDER_SHA256_LINUX_ARM64\"/sha256 \"${SHA_LINUX_ARM64}\"/" "$FORMULA"
  sed -i "s/sha256 \"PLACEHOLDER_SHA256_LINUX_X64\"/sha256 \"${SHA_LINUX_X64}\"/" "$FORMULA"
fi

echo ""
echo "✅ Formula 已更新！"
echo ""
echo "下一步:"
echo "  git add $FORMULA"
echo "  git commit -m 'chore: update formula for v${VERSION}'"
echo "  git push"
