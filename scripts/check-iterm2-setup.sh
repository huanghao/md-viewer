#!/usr/bin/env bash
# 检查 iTerm2 集成配置是否正确

echo "🔍 检查 iTerm2 集成配置"
echo "======================="
echo ""

EXIT_CODE=0

# 检查 1: mdv 命令
echo "1. 检查 mdv 命令..."
if command -v mdv >/dev/null 2>&1; then
  echo "   ✅ mdv 已安装: $(which mdv)"
else
  echo "   ❌ mdv 未安装"
  echo "      请运行: bun link"
  EXIT_CODE=1
fi
echo ""

# 检查 2: mdv-admin 命令
echo "2. 检查 mdv-admin 命令..."
if command -v mdv-admin >/dev/null 2>&1; then
  echo "   ✅ mdv-admin 已安装: $(which mdv-admin)"
else
  echo "   ❌ mdv-admin 未安装"
  echo "      请运行: bun link"
  EXIT_CODE=1
fi
echo ""

# 检查 3: dispatcher 脚本
echo "3. 检查 mdv-iterm2-dispatcher 脚本..."
if [[ -x "$HOME/bin/mdv-iterm2-dispatcher" ]]; then
  echo "   ✅ dispatcher 已安装: $HOME/bin/mdv-iterm2-dispatcher"
else
  echo "   ❌ dispatcher 未安装或没有执行权限"
  echo "      请运行: bun install"
  EXIT_CODE=1
fi
echo ""

# 检查 4: ~/bin 是否在 PATH 中
echo "4. 检查 ~/bin 是否在 PATH 中..."
if [[ ":$PATH:" == *":$HOME/bin:"* ]]; then
  echo "   ✅ ~/bin 在 PATH 中"
else
  echo "   ⚠️  ~/bin 不在 PATH 中"
  echo "      dispatcher 可能无法被 iTerm2 找到"
  echo "      请添加到 ~/.zshrc 或 ~/.bashrc:"
  echo "      export PATH=\"\$HOME/bin:\$PATH\""
  EXIT_CODE=1
fi
echo ""

# 检查 5: MD Viewer 服务
echo "5. 检查 MD Viewer 服务..."
if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
  echo "   ✅ 服务正在运行 (http://localhost:3000)"
else
  echo "   ⚠️  服务未运行"
  echo "      请在项目目录运行: bun run dev"
fi
echo ""

# 检查 6: 测试 dispatcher
echo "6. 测试 dispatcher 功能..."
TEST_FILE="/tmp/test-mdv-$$.md"
echo "# Test" > "$TEST_FILE"

if "$HOME/bin/mdv-iterm2-dispatcher" "$TEST_FILE" "/tmp" 2>&1 | grep -q "已添加\|添加并切换"; then
  echo "   ✅ dispatcher 工作正常"
else
  echo "   ❌ dispatcher 测试失败"
  EXIT_CODE=1
fi

rm -f "$TEST_FILE"
echo ""

# 总结
echo "---"
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ 所有检查通过！"
  echo ""
  echo "下一步:"
  echo "  1. 配置 iTerm2 Semantic History"
  echo "     - iTerm2 → Preferences → Profiles → Advanced"
  echo "     - Semantic History → Run command"
  echo "     - 命令: mdv-iterm2-dispatcher \\1 \\5"
  echo ""
  echo "  2. 测试"
  echo "     - 在终端运行: echo 'README.md'"
  echo "     - Cmd+点击 README.md"
  echo "     - 应该在浏览器中打开 MD Viewer"
  echo ""
  echo "详细说明: docs/design/iterm2-integration.md"
else
  echo "❌ 有些检查未通过，请先解决上述问题"
fi

exit $EXIT_CODE
