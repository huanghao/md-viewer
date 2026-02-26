# MD Viewer 发布指南

## Bun 跨平台编译

Bun 支持编译为以下目标平台的单文件可执行文件：

| 平台 | 架构 | 编译命令 |
|------|------|---------|
| macOS | x64 | `--target=bun-darwin-x64` |
| macOS | arm64 | `--target=bun-darwin-arm64` |
| Linux | x64 | `--target=bun-linux-x64` |
| Linux | arm64 | `--target=bun-linux-arm64` |
| Windows | x64 | `--target=bun-windows-x64` |

### 编译命令

```bash
# 当前平台
bun build src/server.ts --compile --outfile=dist/md-viewer-server
bun build src/cli.ts --compile --outfile=dist/md-viewer-cli

# 指定目标平台（交叉编译）
bun build src/server.ts --compile --target=bun-darwin-arm64 --outfile=dist/md-viewer-server-darwin-arm64
bun build src/cli.ts --compile --target=bun-linux-x64 --outfile=dist/md-viewer-cli-linux-x64
```

---

## GitHub Release 发布流程

```bash
# 1. 编译所有平台
mkdir -p dist
bun build src/server.ts --compile --target=bun-darwin-arm64 --outfile=dist/md-viewer-server-darwin-arm64
bun build src/server.ts --compile --target=bun-darwin-x64 --outfile=dist/md-viewer-server-darwin-x64
bun build src/server.ts --compile --target=bun-linux-x64 --outfile=dist/md-viewer-server-linux-x64
bun build src/cli.ts --compile --target=bun-darwin-arm64 --outfile=dist/md-viewer-cli-darwin-arm64
bun build src/cli.ts --compile --target=bun-linux-x64 --outfile=dist/md-viewer-cli-linux-x64

# 2. 打标签
git tag v1.0.0
git push origin v1.0.0

# 3. 在 GitHub 创建 Release，上传 dist/ 下的二进制文件
```

---

## Homebrew 分发

创建 `Formula/md-viewer.rb`：

```ruby
class MdViewer < Formula
  desc "Markdown viewer with live reload"
  homepage "https://github.com/yourusername/md-viewer"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yourusername/md-viewer/releases/download/v1.0.0/md-viewer-cli-darwin-arm64"
      sha256 "..."
    else
      url "https://github.com/yourusername/md-viewer/releases/download/v1.0.0/md-viewer-cli-darwin-x64"
      sha256 "..."
    end
  end

  on_linux do
    url "https://github.com/yourusername/md-viewer/releases/download/v1.0.0/md-viewer-cli-linux-x64"
    sha256 "..."
  end

  def install
    bin.install "md-viewer-cli-darwin-arm64" => "md-viewer-cli" if Hardware::CPU.arm?
    bin.install "md-viewer-cli-darwin-x64" => "md-viewer-cli" if Hardware::CPU.intel?
    bin.install "md-viewer-cli-linux-x64" => "md-viewer-cli" if OS.linux?
  end
end
```

用户安装：
```bash
brew tap yourusername/md-viewer
brew install md-viewer
```
