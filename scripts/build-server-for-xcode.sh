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
# onnxruntime-node 不支持交叉编译，只编译 arm64
echo "3️⃣  编译 Server (arm64)..."
bun build --compile \
  --target=bun-darwin-aarch64 \
  --outfile=mdv-server \
  src/server.ts
echo ""

# 4. Ad-hoc 签名（macOS 要求所有可执行文件必须签名，否则 Gatekeeper 会 SIGKILL）
# Bun 编译产物内嵌了占位符签名（LC_CODE_SIGNATURE），必须先用 --remove-signature
# 剥掉它，codesign 才能正常写入真实签名。
echo "4️⃣  Ad-hoc 签名..."
codesign --remove-signature mdv-server
codesign --force --sign - mdv-server
echo ""

# 5. 复制到 Xcode 项目
echo "5️⃣  复制到 Xcode 项目..."
cp mdv-server MDViewer/Resources/mdv-server
chmod +x MDViewer/Resources/mdv-server
echo ""

# 6. 复制模型到 Xcode 项目
echo "6️⃣  复制模型文件..."
MODEL_SRC="models/opus-mt-en-zh"
MODEL_DST="MDViewer/Resources/models/opus-mt-en-zh"
if [ -d "$MODEL_SRC" ]; then
    rm -rf "$MODEL_DST"
    mkdir -p "$(dirname "$MODEL_DST")"
    cp -R "$MODEL_SRC" "$MODEL_DST"
    echo "  ✓ 模型已复制到 $MODEL_DST"
else
    echo "  ❌ 模型目录不存在: $MODEL_SRC"
    echo "  请先运行: bun scripts/download-model.ts"
    exit 1
fi
echo ""

# 7. 清理临时文件
echo "7️⃣  清理临时文件..."
rm -f mdv-server
echo ""

echo "✅ Server 二进制已准备好！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh MDViewer/Resources/mdv-server
echo ""
echo "下一步: 在 Xcode 中打开 MDViewer.xcodeproj"
