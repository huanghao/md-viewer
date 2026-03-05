#!/usr/bin/env bash
# 多平台编译脚本
set -euo pipefail

VERSION="${1:-dev}"
BUILD_DIR="dist"

echo "🔨 构建 md-viewer v${VERSION}"
echo "================================"
echo ""

# 清理
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 构建前端
echo "1️⃣  构建前端资源..."
bun run build:client
echo ""

# 嵌入客户端脚本
echo "2️⃣  嵌入客户端脚本..."
bun run scripts/embed-client.ts
echo ""

# 目标平台
if [[ -n "${BUN_TARGET:-}" ]]; then
  TARGET="$BUN_TARGET"
  echo "目标平台: ${TARGET} (交叉编译)"
else
  CURRENT_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  CURRENT_ARCH=$(uname -m)

  if [[ "$CURRENT_ARCH" == "arm64" ]]; then
    CURRENT_ARCH="aarch64"
  elif [[ "$CURRENT_ARCH" == "x86_64" ]]; then
    CURRENT_ARCH="x64"
  fi

  TARGET="bun-${CURRENT_OS}-${CURRENT_ARCH}"
  echo "当前平台: ${TARGET}"
fi
echo ""

# 编译 mdv
echo "3️⃣  编译 mdv (${TARGET})..."
bun build --compile \
  --target="${TARGET}" \
  --outfile="${BUILD_DIR}/mdv" \
  src/cli.ts

echo ""

# 复制 dispatcher 脚本
echo "4️⃣  复制 mdv-iterm2-dispatcher..."
cp scripts/mdv-iterm2-dispatcher.sh "${BUILD_DIR}/mdv-iterm2-dispatcher"
chmod +x "${BUILD_DIR}/mdv-iterm2-dispatcher"

echo ""
echo "📦 构建完成！"
echo "-------------"
ls -lh "$BUILD_DIR/"
echo ""
echo "产物:"
echo "  - mdv: $(du -h ${BUILD_DIR}/mdv | cut -f1)"
echo "  - mdv-iterm2-dispatcher: $(du -h ${BUILD_DIR}/mdv-iterm2-dispatcher | cut -f1)"
