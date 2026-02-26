# MD Viewer 打包发布指南

## 1. 本地开发使用

### 方法 A：直接运行（无需安装）

```bash
# 克隆代码
cd ~/workspace/learning/md-viewer

# 启动服务端
bun run dev

# 使用 CLI（新终端）
bun run cli README.md
```

### 方法 B：安装到系统 PATH

```bash
# 运行安装脚本
./scripts/install.sh

# 现在可以在任何地方使用
md-viewer-cli ~/Documents/notes.md
md-viewer-cli -p 3001 ./README.md
```

**安装位置**：
- 有权限时: `/usr/local/bin/md-viewer-cli`
- 无权限时: `~/.local/bin/md-viewer-cli`

---

## 2. 打包发布

### 方式一：Bun 编译为独立可执行文件

```bash
# 编译服务端为独立可执行文件
bun build src/server.ts --compile --outfile=md-viewer-server

# 编译 CLI 为独立可执行文件
bun build src/cli.ts --compile --outfile=md-viewer-cli
```

优点：
- 单文件，无需依赖
- 用户无需安装 bun
- 可直接分发

### 方式二：NPM 发布

```bash
# 1. 登录 npm
npm login

# 2. 发布
npm publish
```

发布后用户安装：
```bash
npm install -g md-viewer
md-viewer-cli README.md
```

### 方式三：Homebrew 发布（macOS/Linux）

创建 `md-viewer.rb` formula：

```ruby
class MdViewer < Formula
  desc "Markdown viewer with live reload"
  homepage "https://github.com/yourusername/md-viewer"
  url "https://github.com/yourusername/md-viewer/archive/v1.0.0.tar.gz"
  sha256 "..."
  license "MIT"

  depends_on "bun"

  def install
    bin.install "bin/md-viewer-cli"
  end
end
```

用户安装：
```bash
brew tap yourusername/md-viewer
brew install md-viewer
```

---

## 3. 推荐发布流程

### 步骤 1：版本号管理

```bash
# 更新 package.json 版本
npm version patch  # 或 minor / major
```

### 步骤 2：创建 GitHub Release

```bash
# 打标签
git tag v1.0.0
git push origin v1.0.0

# 在 GitHub 上创建 Release，上传编译好的二进制文件
```

### 步骤 3：多种分发渠道

| 渠道 | 目标用户 | 命令 |
|------|---------|------|
| GitHub Releases | 所有用户 | 下载二进制文件 |
| NPM | Node.js 用户 | `npm install -g md-viewer` |
| Homebrew | macOS 用户 | `brew install md-viewer` |
| AUR | Arch Linux | `yay -S md-viewer` |

---

## 4. 快速测试发布包

```bash
# 1. 编译
cd ~/workspace/learning/md-viewer
bun build src/server.ts --compile --outfile=/tmp/md-viewer-server
bun build src/cli.ts --compile --outfile=/tmp/md-viewer-cli

# 2. 测试服务端
/tmp/md-viewer-server

# 3. 测试 CLI（新终端）
/tmp/md-viewer-cli ~/Documents/some-file.md
```
