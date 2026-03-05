class MdViewerLocal < Formula
  desc "Markdown viewer with live reload and annotation support (Local Test)"
  homepage "https://github.com/huanghao/md-viewer"
  version "0.1.0-local"

  # 使用本地文件进行测试
  url "file:///Users/huanghao/workspace/md-viewer/packages/mdv-darwin-arm64.tar.gz"
  sha256 "8066959e33d87dfd67815b012215a966f919675001be672e8e17d8bf9cd75b19"

  def install
    bin.install "mdv"
    bin.install "mdv-iterm2-dispatcher"
  end

  def caveats
    <<~EOS
      MD Viewer has been installed!

      Quick Start:
        mdv README.md              # Open a markdown file
        mdv server start           # Start server (foreground)
        mdv server start --daemon  # Start server (background)
        mdv --help                 # Show help

      Configuration:
        ~/.config/md-viewer/config.json

      iTerm2 Integration:
        Set Semantic History to:
          Run command: #{bin}/mdv-iterm2-dispatcher \\1 \\5

      Documentation:
        https://github.com/huanghao/md-viewer
    EOS
  end

  test do
    system "#{bin}/mdv", "--help"
  end
end
