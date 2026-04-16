#!/usr/bin/env bash
# 构建 Server 二进制用于 Xcode 项目
set -euo pipefail

echo "🔨 构建 Server 二进制用于 Xcode..."
echo ""

# 1. 构建前端
echo "1️⃣  构建前端资源..."
bun run build:client
echo ""

# 2. 嵌入客户端脚本
echo "2️⃣  嵌入客户端脚本..."
bun run scripts/embed-client.ts
echo ""

# 3. 编译 Server（Apple Silicon）
echo "3️⃣  编译 Server (arm64)..."
bun build --compile \
  --target=bun-darwin-aarch64 \
  --outfile=mdv-server-arm64 \
  src/server.ts
echo ""

# 4. 编译 Server（Intel）
echo "4️⃣  编译 Server (x64)..."
bun build --compile \
  --target=bun-darwin-x64 \
  --outfile=mdv-server-x64 \
  src/server.ts
echo ""

# 5. 创建通用二进制（Universal Binary）
echo "5️⃣  创建通用二进制..."
lipo -create \
  mdv-server-arm64 \
  mdv-server-x64 \
  -output mdv-server
echo ""

# 6. Ad-hoc 签名（macOS 要求所有可执行文件必须签名，否则 Gatekeeper 会 SIGKILL）
# Bun 编译产物内嵌了占位符签名（LC_CODE_SIGNATURE），必须先用 --remove-signature
# 剥掉它，codesign 才能正常写入真实签名。
echo "6️⃣  Ad-hoc 签名..."
codesign --remove-signature mdv-server
codesign --force --sign - mdv-server
echo ""

# 7. 复制到 Xcode 项目
echo "7️⃣  复制到 Xcode 项目..."
cp mdv-server MDViewer/Resources/mdv-server
chmod +x MDViewer/Resources/mdv-server
echo ""

# 8. 清理临时文件
echo "8️⃣  清理临时文件..."
rm -f mdv-server-arm64 mdv-server-x64 mdv-server
echo ""

echo "✅ Server 二进制已准备好！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh MDViewer/Resources/mdv-server
echo ""
echo "下一步: 在 Xcode 中打开 MDViewer.xcodeproj"
