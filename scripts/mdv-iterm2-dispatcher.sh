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

# 调试日志（可选，取消注释以启用）
# DEBUG_LOG="/tmp/mdv-iterm2-dispatcher.log"
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== START =====" >> "$DEBUG_LOG"
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] input='$input'" >> "$DEBUG_LOG"
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] working_dir='$working_dir'" >> "$DEBUG_LOG"

# 空输入，直接退出
if [[ -z "$input" ]]; then
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Empty input, exiting" >> "$DEBUG_LOG"
  exit 0
fi

# 处理 file:// URI
if [[ "$input" == file://* ]]; then
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Detected file:// URI" >> "$DEBUG_LOG"
  input="${input#file://}"
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] After removing file://: '$input'" >> "$DEBUG_LOG"
fi

# 转换为绝对路径
if [[ "$input" != /* ]]; then
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Relative path detected" >> "$DEBUG_LOG"
  # 相对路径或 basename，需要结合工作目录
  if [[ -n "$working_dir" ]]; then
    # 使用 iTerm2 提供的工作目录
    # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using working_dir: '$working_dir'" >> "$DEBUG_LOG"
    input="$working_dir/$input"
  elif [[ -n "${PWD:-}" ]]; then
    # 回退到 PWD
    # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using PWD: '$PWD'" >> "$DEBUG_LOG"
    input="$PWD/$input"
  else
    # 最后回退
    # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using pwd" >> "$DEBUG_LOG"
    input="$(pwd)/$input"
  fi
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] After path conversion: '$input'" >> "$DEBUG_LOG"
else
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Already absolute path" >> "$DEBUG_LOG"
  true
fi

# 规范化路径（去除 ./ ../ 等）
if [[ -e "$input" ]]; then
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] File exists, normalizing path" >> "$DEBUG_LOG"
  input="$(cd "$(dirname "$input")" 2>/dev/null && pwd)/$(basename "$input")"
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Normalized path: '$input'" >> "$DEBUG_LOG"
else
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: File does not exist yet: '$input'" >> "$DEBUG_LOG"
  true
fi

# 检查文件是否存在
if [[ ! -e "$input" ]]; then
  # 文件不存在，尝试系统默认行为（可能是 URL 或其他）
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] File not found, calling open" >> "$DEBUG_LOG"
  open "$input" 2>/dev/null || true
  exit 0
fi
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] File exists: '$input'" >> "$DEBUG_LOG"

# 检查文件扩展名
if [[ "$input" =~ \.(md|markdown)$ ]]; then
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Markdown file detected" >> "$DEBUG_LOG"
  # Markdown 文件，尝试用 mdv 打开

  # 查找 bun 和 mdv
  BUN_BIN=""
  MDV_SCRIPT=""

  # 查找 bun 可执行文件
  for bun_path in "$HOME/.bun/bin/bun" "/usr/local/bin/bun" "$(command -v bun 2>/dev/null)"; do
    if [[ -n "$bun_path" && -x "$bun_path" ]]; then
      BUN_BIN="$bun_path"
      # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Found bun at: $bun_path" >> "$DEBUG_LOG"
      break
    fi
  done

  # 查找 mdv 脚本
  for mdv_path in "$HOME/.bun/bin/mdv" "$HOME/.bun/install/global/node_modules/md-viewer/src/cli.ts"; do
    if [[ -n "$mdv_path" && -f "$mdv_path" ]]; then
      MDV_SCRIPT="$mdv_path"
      # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Found mdv script at: $mdv_path" >> "$DEBUG_LOG"
      break
    fi
  done

  if [[ -n "$BUN_BIN" && -n "$MDV_SCRIPT" ]]; then
    # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Calling: $BUN_BIN run $MDV_SCRIPT '$input'" >> "$DEBUG_LOG"
    if "$BUN_BIN" run "$MDV_SCRIPT" "$input" 2>/dev/null; then
      # echo "[$(date '+%Y-%m-%d %H:%M:%S')] mdv succeeded" >> "$DEBUG_LOG"
      true
    else
      # echo "[$(date '+%Y-%m-%d %H:%M:%S')] mdv failed with exit code $?, calling open" >> "$DEBUG_LOG"
      open "$input"
    fi
  else
    # mdv 或 bun 不可用，回退到系统默认
    # echo "[$(date '+%Y-%m-%d %H:%M:%S')] bun or mdv not found (bun=$BUN_BIN, mdv=$MDV_SCRIPT), calling open" >> "$DEBUG_LOG"
    open "$input"
  fi
else
  # 非 Markdown 文件，使用系统默认
  # echo "[$(date '+%Y-%m-%d %H:%M:%S')] Not a markdown file, calling open" >> "$DEBUG_LOG"
  open "$input"
fi

# 确保成功退出
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== END =====" >> "$DEBUG_LOG"
exit 0
