# MD Viewer - Markdown Viewer

一个简单的 Markdown 阅读工具，通过 HTTP 接口提供文件浏览功能。

## 快速开始

### 开发模式

```bash
# 启动服务器
bun run dev

# 启动客户端构建监听
bun run build:client:watch

# 在另一个终端打开文件
bun run src/cli.ts README.md
```

### 编译

```bash
bun run build:client
bun build src/server.ts --compile --outfile=md-viewer
bun build src/cli.ts --compile --outfile=mdv
```

## iTerm2 集成

在 iTerm2 中点击文件路径直接在 MD Viewer 中打开。

### 配置步骤

1. **确保 mdv 命令可用**

   方式 A：全局安装（推荐）
   ```bash
   # 在项目目录运行
   bun link

   # 现在可以在任何地方使用 mdv 命令
   mdv /path/to/file.md
   ```

   方式 B：添加别名
   ```bash
   # 添加到 ~/.zshrc 或 ~/.bashrc
   alias mdv='bun run /Users/huanghao/workspace/md-viewer/src/cli.ts'
   ```

2. **配置 iTerm2 Semantic History**

   - 打开 iTerm2 → Preferences (⌘,)
   - 选择 Profiles → 你的 Profile → Advanced
   - 找到 "Semantic History" 部分
   - 选择 "Run command"
   - 输入：`mdv "\1"`
   - 点击 "OK"

3. **测试**

   ```bash
   # 在终端中运行
   ls *.md

   # ⌘ + 点击任意 .md 文件名，应该会在 MD Viewer 中打开
   ```

### 使用场景

- **Git 输出**: `git status` 后点击修改的 .md 文件
- **ls 输出**: `ls *.md` 后点击文件名
- **grep 输出**: `grep -r "TODO" *.md` 后点击文件路径
- **任何包含文件路径的输出**

### 高级配置

如果你想只对 .md 文件生效，可以使用脚本：

```bash
# 创建 ~/.local/bin/mdv-smart
#!/bin/bash
if [[ "$1" =~ \.md$ ]]; then
  mdv "$1"
else
  open "$1"
fi

# 赋予执行权限
chmod +x ~/.local/bin/mdv-smart

# iTerm2 中配置为：mdv-smart "\1"
```

详细设计文档：[docs/design/iterm2-integration.md](docs/design/iterm2-integration.md)