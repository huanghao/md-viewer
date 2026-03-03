#!/usr/bin/env bash
# 测试 Bun 编译功能
set -euo pipefail

echo "🔨 测试 Bun 编译功能"
echo "====================="
echo ""

# 清理
rm -rf test-compile
mkdir -p test-compile

# 1. 编译 CLI
echo "1️⃣  编译 mdv CLI..."
bun build --compile \
  --outfile=test-compile/mdv \
  src/cli.ts

# 2. 编译 admin
echo "2️⃣  编译 mdv-admin CLI..."
bun build --compile \
  --outfile=test-compile/mdv-admin \
  src/cli-admin.ts

# 3. 查看文件信息
echo ""
echo "📦 编译结果:"
echo "-------------"
ls -lh test-compile/
echo ""

# 4. 查看依赖
echo "🔍 依赖分析:"
echo "-------------"
if [[ "$(uname)" == "Darwin" ]]; then
  echo "mdv 依赖:"
  otool -L test-compile/mdv | grep -v "test-compile"
  echo ""
  echo "mdv-admin 依赖:"
  otool -L test-compile/mdv-admin | grep -v "test-compile"
else
  echo "mdv 依赖:"
  ldd test-compile/mdv
  echo ""
  echo "mdv-admin 依赖:"
  ldd test-compile/mdv-admin
fi
echo ""

# 5. 测试运行
echo "🧪 功能测试:"
echo "-------------"
echo "测试 mdv --help:"
./test-compile/mdv --help | head -5
echo ""
echo "测试 mdv-admin --help:"
./test-compile/mdv-admin --help | head -5
echo ""

echo "✅ 编译测试完成！"
echo ""
echo "二进制位置: test-compile/"
echo "  - mdv: $(du -h test-compile/mdv | cut -f1)"
echo "  - mdv-admin: $(du -h test-compile/mdv-admin | cut -f1)"
