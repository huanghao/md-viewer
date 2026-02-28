# iTerm2 集成设计

## 需求

在 iTerm2 中看到 Markdown 文件路径时（例如 `git status`、`ls` 输出等），可以直接点击打开到 MD Viewer 中。

## 技术方案

### 方案 A：iTerm2 Semantic History + 自定义 URL Scheme ⭐ 推荐

**原理：**
1. 注册自定义 URL scheme：`mdv://`
2. 配置 iTerm2 的 Semantic History 功能
3. 点击文件路径时，iTerm2 调用 `mdv://` 协议
4. macOS 打开注册的应用处理该 URL

**实现步骤：**

#### 1. 注册 URL Scheme

创建 `mdv-handler` 可执行文件：
```bash
#!/usr/bin/env bun
# 处理 mdv:// 协议
# 例如：mdv:///path/to/file.md
```

或者使用 macOS 的 URL Handler：
```xml
<!-- Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>MD Viewer</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>mdv</string>
    </array>
  </dict>
</array>
```

#### 2. 配置 iTerm2 Semantic History

iTerm2 → Preferences → Profiles → Advanced → Semantic History

选择 "Run command" 并输入：
```bash
/usr/local/bin/mdv "\1"
```

或使用 URL scheme：
```bash
open "mdv://\1"
```

#### 3. 创建 mdv 命令包装器

```bash
#!/bin/bash
# /usr/local/bin/mdv
# 包装器：处理文件路径并调用 CLI

if [[ "$1" =~ ^mdv:// ]]; then
  # 从 URL 中提取路径
  path="${1#mdv://}"
else
  path="$1"
fi

# 调用现有的 CLI
bun run /path/to/md-viewer/src/cli.ts "$path"
```

**优点：**
- 系统级集成，任何支持 URL scheme 的应用都能用
- iTerm2 原生支持
- 用户体验好

**缺点：**
- 需要安装配置
- 仅限 macOS

---

### 方案 B：iTerm2 Semantic History + 直接调用 CLI

**原理：**
直接配置 iTerm2 调用 mdv CLI

**实现步骤：**

1. 确保 `mdv` 命令在 PATH 中
2. 配置 iTerm2 Semantic History：
   ```bash
   mdv "\1"
   ```

**优点：**
- 简单直接
- 不需要注册 URL scheme

**缺点：**
- 仅限 iTerm2
- 需要手动配置

---

### 方案 C：Shell 别名 + 自动检测

**原理：**
在 shell 配置中添加别名，自动识别 .md 文件并用 mdv 打开

```bash
# ~/.zshrc 或 ~/.bashrc
alias cat='function _cat() {
  if [[ "$1" =~ \.md$ ]]; then
    mdv "$1"
  else
    command cat "$@"
  fi
}; _cat'
```

**优点：**
- 自动化
- 不需要点击

**缺点：**
- 改变了 cat 命令的行为
- 可能有副作用

---

## 推荐实现

**阶段 1：简单方案（立即可用）**

1. 确保 `mdv` 命令全局可用：
   ```bash
   # 添加到 ~/.zshrc
   alias mdv='bun run /path/to/md-viewer/src/cli.ts'
   ```

2. 用户手动配置 iTerm2：
   - Preferences → Profiles → Advanced → Semantic History
   - 选择 "Run command"
   - 输入：`mdv "\1"`

**阶段 2：完整方案（更好的用户体验）**

1. 创建 `mdv-handler` 可执行文件处理 URL scheme
2. 提供安装脚本自动配置
3. 支持 `mdv://` 协议

---

## 使用场景

### 1. Git 输出
```bash
$ git status
modified:   README.md
modified:   docs/guide.md
```
点击文件名 → 在 MD Viewer 中打开

### 2. ls 输出
```bash
$ ls *.md
README.md  TODO.md  docs/api.md
```
点击任意文件名 → 在 MD Viewer 中打开

### 3. grep 输出
```bash
$ grep -r "TODO" *.md
README.md:## TODO
docs/guide.md:# TODO List
```
点击文件名 → 在 MD Viewer 中打开

---

## 实现优先级

1. ✅ **P0**: 确保 CLI 命令工作正常（已完成）
2. 🔲 **P1**: 提供 iTerm2 配置文档
3. 🔲 **P2**: 创建安装脚本
4. 🔲 **P3**: 注册 URL scheme（macOS）
5. 🔲 **P4**: 支持其他终端（Alacritty, Kitty 等）

---

## 下一步

**立即可做：**
1. 在 README 中添加 iTerm2 配置说明
2. 测试 Semantic History 功能

**后续优化：**
1. 创建安装脚本
2. 注册 URL scheme
3. 支持更多终端
