#!/usr/bin/env bash
# 打包 Server 源码到 MDViewer/Resources/server/
# 运行时由 app 通过系统 bun 启动 src/server.ts
set -euo pipefail

echo "🔨 打包 Server 源码..."
echo ""

# 1. 构建前端
echo "1️⃣  构建前端资源..."
bun run build:client
echo ""

# 2. 嵌入客户端脚本
echo "2️⃣  嵌入客户端脚本..."
bun run scripts/embed-client.ts
echo ""

# 3. 打包 server 源码 + node_modules 到 Resources/server/
echo "3️⃣  打包 Server 源码..."
SERVER_DST="MDViewer/Resources/server"
rm -rf "$SERVER_DST"
mkdir -p "$SERVER_DST"

# 复制源码和依赖
cp -R src "$SERVER_DST/"
cp -R node_modules "$SERVER_DST/"
cp package.json "$SERVER_DST/"
cp tsconfig.json "$SERVER_DST/"
echo "  ✓ 源码已复制到 $SERVER_DST"
echo ""

# 4. 复制模型文件
echo "4️⃣  复制模型文件..."
MODEL_SRC="models/opus-mt-en-zh"
MODEL_DST="MDViewer/Resources/models/opus-mt-en-zh"
if [ -d "$MODEL_SRC" ]; then
    rm -rf "$MODEL_DST"
    mkdir -p "$(dirname "$MODEL_DST")"
    cp -R "$MODEL_SRC" "$MODEL_DST"
    echo "  ✓ 模型已复制到 $MODEL_DST"
else
    echo "  ⚠️  模型目录不存在: $MODEL_SRC（翻译功能不可用）"
    echo "  如需翻译，请先运行: bun scripts/download-model.ts"
fi
echo ""

echo "✅ Server 源码已准备好！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
du -sh "$SERVER_DST"
echo ""
echo "下一步: 运行 ./scripts/build/build_app_bundle.sh --install --skip-dmg"
