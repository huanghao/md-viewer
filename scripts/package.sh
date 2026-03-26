#!/usr/bin/env bash
# 打包脚本 - 为 Homebrew 分发创建 tarball
set -euo pipefail

VERSION="${1:-dev}"
PLATFORM="${2:-}"
BUILD_DIR="dist"
PACKAGE_DIR="packages"

echo "📦 打包 md-viewer v${VERSION}"
echo "============================="
echo ""

# 检查构建产物
if [[ ! -f "${BUILD_DIR}/mdv" ]]; then
  echo "❌ 构建产物不存在: ${BUILD_DIR}/mdv"
  echo "   请先运行: ./scripts/build-all.sh ${VERSION}"
  exit 1
fi

# 清理并创建打包目录
mkdir -p "$PACKAGE_DIR"

# 检测或使用指定的平台
if [[ -z "$PLATFORM" ]]; then
  CURRENT_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  CURRENT_ARCH=$(uname -m)

  if [[ "$CURRENT_ARCH" == "arm64" ]]; then
    CURRENT_ARCH="arm64"
  elif [[ "$CURRENT_ARCH" == "x86_64" ]]; then
    CURRENT_ARCH="x64"
  fi

  PLATFORM="${CURRENT_OS}-${CURRENT_ARCH}"
fi
TARBALL="mdv-${PLATFORM}.tar.gz"

echo "当前平台: ${PLATFORM}"
echo ""

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# 复制文件到临时目录
echo "1️⃣  复制文件..."
cp "${BUILD_DIR}/mdv" "${TEMP_DIR}/"

# 创建 tarball
echo "2️⃣  创建 tarball..."
cd "${TEMP_DIR}"
tar -czf "${TARBALL}" mdv
cd - > /dev/null

# 移动到 packages 目录
mv "${TEMP_DIR}/${TARBALL}" "${PACKAGE_DIR}/"

# 计算 SHA256
echo "3️⃣  计算 SHA256..."
if command -v shasum &> /dev/null; then
  SHA256=$(shasum -a 256 "${PACKAGE_DIR}/${TARBALL}" | cut -d' ' -f1)
elif command -v sha256sum &> /dev/null; then
  SHA256=$(sha256sum "${PACKAGE_DIR}/${TARBALL}" | cut -d' ' -f1)
else
  echo "⚠️  无法计算 SHA256（shasum/sha256sum 不可用）"
  SHA256="UNKNOWN"
fi

echo ""
echo "✅ 打包完成！"
echo "============="
echo ""
echo "文件: ${PACKAGE_DIR}/${TARBALL}"
echo "大小: $(du -h ${PACKAGE_DIR}/${TARBALL} | cut -f1)"
echo "SHA256: ${SHA256}"
echo ""
echo "提示: 将 SHA256 更新到 Formula/md-viewer.rb 中"
