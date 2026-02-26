#!/bin/bash
# MD Viewer CLI 安装脚本
# 安装到 /usr/local/bin 或 ~/.local/bin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLI_SOURCE="$PROJECT_ROOT/bin/md-viewer-cli"

echo "📦 MD Viewer CLI 安装程序"
echo "=========================="

# 检查源文件
if [ ! -f "$CLI_SOURCE" ]; then
    echo "❌ 错误: 找不到 CLI 源文件: $CLI_SOURCE"
    exit 1
fi

# 选择安装目录
if [ -w "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
else
    INSTALL_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
fi

echo "📂 安装目录: $INSTALL_DIR"

# 创建包装脚本
# 注意：使用 PROJECT_ROOT 的绝对路径，这样即使软链接也能正确找到代码
ABSOLUTE_PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"

cat > "$INSTALL_DIR/md-viewer-cli" << INSTALLER_EOF
#!/bin/bash
# MD Viewer CLI - 全局安装版本
# 代码位置: $ABSOLUTE_PROJECT_ROOT

CLI_SCRIPT="$ABSOLUTE_PROJECT_ROOT/src/cli.ts"

# 检查 bun
if ! command -v bun &> /dev/null; then
    echo "❌ 错误: 未找到 bun，请先安装: https://bun.sh"
    exit 1
fi

# 运行 CLI
exec bun run "\$CLI_SCRIPT" "\$@"
INSTALLER_EOF

chmod +x "$INSTALL_DIR/md-viewer-cli"

# 验证安装
if command -v md-viewer-cli &> /dev/null; then
    echo "✅ 安装成功!"
    echo ""
    echo "使用方法:"
    echo "  md-viewer-cli --help"
    echo "  md-viewer-cli README.md"
    echo ""
    echo "卸载方法:"
    echo "  rm $INSTALL_DIR/md-viewer-cli"
else
    echo "⚠️  安装完成，但命令不在 PATH 中"
    echo "请添加以下行到你的 ~/.bashrc 或 ~/.zshrc:"
    echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
fi
