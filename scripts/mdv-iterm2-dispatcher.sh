#!/usr/bin/env bash
# iTerm2 Semantic History Dispatcher for MD Viewer
# 只处理 .md/.markdown 文件，其他文件回退到系统默认行为
#
# 用法: mdv-iterm2-dispatcher \1 \5
#   \1 - 匹配到的路径（可能是相对路径、basename 或绝对路径）
#   \5 - 当前工作目录（iTerm2 提供）

set -euo pipefail

input="${1:-}"
working_dir="${2:-}"

# 空输入，直接退出
if [[ -z "$input" ]]; then
  exit 0
fi

# 处理 file:// URI
if [[ "$input" == file://* ]]; then
  input="${input#file://}"
fi

# 转换为绝对路径
if [[ "$input" != /* ]]; then
  # 相对路径或 basename，需要结合工作目录
  if [[ -n "$working_dir" ]]; then
    # 使用 iTerm2 提供的工作目录
    input="$working_dir/$input"
  elif [[ -n "${PWD:-}" ]]; then
    # 回退到 PWD
    input="$PWD/$input"
  else
    # 最后回退
    input="$(pwd)/$input"
  fi
fi

# 规范化路径（去除 ./ ../ 等）
if [[ -e "$input" ]]; then
  input="$(cd "$(dirname "$input")" 2>/dev/null && pwd)/$(basename "$input")"
fi

# 检查文件是否存在
if [[ ! -e "$input" ]]; then
  # 文件不存在，尝试系统默认行为（可能是 URL 或其他）
  open "$input" 2>/dev/null || true
  exit 0
fi

# 检查文件扩展名
if [[ "$input" =~ \.(md|markdown)$ ]]; then
  # Markdown 文件，尝试用 mdv 打开
  if command -v mdv >/dev/null 2>&1; then
    # mdv 会自己处理错误，失败时回退到 open
    mdv "$input" 2>/dev/null || open "$input"
  else
    # mdv 不可用，回退到系统默认
    open "$input"
  fi
else
  # 非 Markdown 文件，使用系统默认
  open "$input"
fi
