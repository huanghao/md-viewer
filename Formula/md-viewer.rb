class MdViewer < Formula
  desc "Markdown viewer with live reload and annotation support"
  homepage "https://github.com/huanghao/md-viewer"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-darwin-arm64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_ARM64"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-darwin-x64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_X64"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-linux-arm64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_ARM64"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-linux-x64.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_X64"
    end
  end

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
