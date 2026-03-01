#!/usr/bin/env bash
# 测试 mdv-iterm2-dispatcher 的路径处理能力

set -e

DISPATCHER="$HOME/bin/mdv-iterm2-dispatcher"
TEST_DIR="/tmp/mdv-dispatcher-test"
WORK_DIR="$TEST_DIR/work"

echo "🧪 测试 mdv-iterm2-dispatcher 路径处理"
echo ""

# 准备测试环境
rm -rf "$TEST_DIR"
mkdir -p "$WORK_DIR/docs"
echo "# Test" > "$WORK_DIR/README.md"
echo "# Docs" > "$WORK_DIR/docs/guide.md"
echo "console.log('test')" > "$WORK_DIR/test.js"

cd "$WORK_DIR"

echo "测试环境："
echo "  工作目录: $WORK_DIR"
echo "  文件结构:"
tree -L 2 "$WORK_DIR" 2>/dev/null || find "$WORK_DIR" -type f

echo ""
echo "---"
echo ""

# 测试用例
test_case() {
  local name="$1"
  local path="$2"
  local work_dir="$3"

  echo "测试: $name"
  echo "  路径: $path"
  echo "  工作目录: $work_dir"

  if "$DISPATCHER" "$path" "$work_dir" 2>&1; then
    echo "  ✅ 成功"
  else
    echo "  ❌ 失败"
  fi
  echo ""
}

# 1. 绝对路径
test_case "绝对路径" "$WORK_DIR/README.md" "$WORK_DIR"

# 2. 相对路径
test_case "相对路径 (./)" "./README.md" "$WORK_DIR"
test_case "相对路径 (docs/)" "docs/guide.md" "$WORK_DIR"

# 3. Basename
test_case "Basename" "README.md" "$WORK_DIR"

# 4. 非 .md 文件
test_case "非 .md 文件" "test.js" "$WORK_DIR"

# 5. 不存在的文件
test_case "不存在的文件" "notfound.md" "$WORK_DIR"

# 清理
cd /
rm -rf "$TEST_DIR"

echo "---"
echo "✅ 测试完成"
