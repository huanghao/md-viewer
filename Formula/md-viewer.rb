class MdViewer < Formula
  desc "Markdown viewer with live reload and annotation support"
  homepage "https://github.com/huanghao/md-viewer"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-darwin-arm64.tar.gz"
      sha256 "d5b0dbd9f7eafd5bf9fee67f7f0de5f422b84d694b3e1f4c77a40ffe30c59780"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-darwin-x64.tar.gz"
      sha256 "11c7f806262217782b2aea7300a99d4c48a73040f753c1e927466c883c71625d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-linux-arm64.tar.gz"
      sha256 "800aa63edaa1bbcd2e579c31ba6a9cd3496be97f8775cda48745908af81593e9"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v0.1.0/mdv-linux-x64.tar.gz"
      sha256 "453695b164a161d1c67c72417aaa70946f2867d6377391b2a879d1da0cf54dc7"
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
