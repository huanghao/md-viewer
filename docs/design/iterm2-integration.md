# iTerm2 集成设计

## 需求
在 iTerm2 终端输出中的 Markdown 文件名，能够直接点击在 MD Viewer 中打开。

## 推荐方案：Semantic History + mdv-open 脚本

### 实施步骤

**1. 创建 mdv-open 辅助脚本**
```bash
#!/bin/bash
# 文件：/usr/local/bin/mdv-open
FILE="$1"
[[ "$FILE" == file://* ]] && FILE="${FILE#file://}"
[[ ! "$FILE" =~ ^/ ]] && FILE="$(pwd)/$FILE"
mdv "$FILE" &
```

**2. 配置 iTerm2**
- iTerm2 → Preferences → Profiles → Advanced
- Semantic History → Run command
- Command: `mdv-open "\1"`

**3. 使用**
- 在终端输出中 Cmd + 点击 .md 文件路径
- 自动在 MD Viewer 中打开

### 可选：Shell 辅助函数

```bash
# 添加到 ~/.zshrc
mdlink() {
  local file="$1"
  local abs_path="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
  echo -e "\e]8;;file://${abs_path}\e\\\e[34;4m${file}\e[0m\e]8;;\e\\"
}

lsmd() {
  for file in *.md; do
    [[ -f "$file" ]] && mdlink "$file"
  done
}
```

## 技术方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| Semantic History | 原生支持，配置简单 | 仅 iTerm2 |
| OSC 8 超链接 | 标准协议，多终端支持 | 需要修改输出 |
| Smart Selection | 右键菜单直观 | 需要右键，不够快捷 |

**推荐使用 Semantic History，因为配置最简单，使用最方便。**
