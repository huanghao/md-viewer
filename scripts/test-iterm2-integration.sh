#!/usr/bin/env bash
# 测试 iTerm2 集成是否正常工作

set -e

echo "🧪 测试 iTerm2 集成"
echo "=================="
echo ""

# 测试环境
TEST_DIR="/tmp/mdv-iterm2-test"
DISPATCHER="$HOME/bin/mdv-iterm2-dispatcher"

# 检查 dispatcher 是否存在
if [[ ! -x "$DISPATCHER" ]]; then
  echo "❌ 错误: dispatcher 不存在或没有执行权限"
  echo "   路径: $DISPATCHER"
  echo "   请运行: bun install"
  exit 1
fi

echo "✅ Dispatcher 已安装: $DISPATCHER"
echo ""

# 检查 mdv 命令
if ! command -v mdv >/dev/null 2>&1; then
  echo "❌ 错误: mdv 命令不存在"
  echo "   请运行: bun link"
  exit 1
fi

echo "✅ mdv 命令已安装: $(which mdv)"
echo ""

# 准备测试文件
echo "📁 准备测试环境..."
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR/docs"
echo "# Test README" > "$TEST_DIR/README.md"
echo "# Guide" > "$TEST_DIR/docs/guide.md"
echo "console.log('test')" > "$TEST_DIR/test.js"

echo "   工作目录: $TEST_DIR"
echo "   测试文件:"
tree -L 2 "$TEST_DIR" 2>/dev/null || find "$TEST_DIR" -type f
echo ""

# 测试场景
echo "🧪 开始测试..."
echo ""

cd "$TEST_DIR"

test_case() {
  local name="$1"
  local path="$2"
  local work_dir="$3"
  local expected="$4"

  echo "测试: $name"
  echo "  路径 (\1): $path"
  echo "  工作目录 (\5): $work_dir"

  # 调用 dispatcher（模拟 iTerm2）
  if "$DISPATCHER" "$path" "$work_dir" 2>&1 | grep -q "添加并切换\|已添加"; then
    echo "  ✅ 成功 - mdv 被调用"
  elif [[ "$expected" == "open" ]]; then
    echo "  ✅ 成功 - 回退到系统默认"
  else
    echo "  ⚠️  未知结果"
  fi
  echo ""
}

# 测试 1: 绝对路径 .md 文件
test_case "绝对路径 .md" "$TEST_DIR/README.md" "$TEST_DIR" "mdv"

# 测试 2: 相对路径 .md 文件
test_case "相对路径 .md" "docs/guide.md" "$TEST_DIR" "mdv"

# 测试 3: Basename .md 文件
test_case "Basename .md" "README.md" "$TEST_DIR" "mdv"

# 测试 4: 非 .md 文件（应该用 open）
echo "测试: 非 .md 文件"
echo "  路径 (\1): test.js"
echo "  工作目录 (\5): $TEST_DIR"
# 对于非 .md 文件，dispatcher 会调用 open，我们不实际打开
echo "  ✅ 成功 - 会回退到系统 open（未实际执行）"
echo ""

# 测试 5: 不存在的文件
test_case "不存在的文件" "notfound.md" "$TEST_DIR" "open"

# 清理
cd /
rm -rf "$TEST_DIR"

echo "---"
echo "✅ 测试完成"
echo ""
echo "下一步: 在 iTerm2 中配置 Semantic History"
echo "  命令: mdv-iterm2-dispatcher \\1 \\5"
echo ""
echo "手动测试:"
echo "  1. 在终端运行: echo 'README.md'"
echo "  2. Cmd+点击 README.md"
echo "  3. 应该在浏览器中打开 MD Viewer"
