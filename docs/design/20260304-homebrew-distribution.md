# Homebrew 分发方案设计

**日期**: 2026-03-04
**目标**: 通过 Homebrew 分发 md-viewer，提供跨平台二进制安装

---

## 目标

1. **简化安装**：用户通过 `brew install md-viewer` 一键安装
2. **跨平台支持**：支持 macOS (Intel/ARM) 和 Linux
3. **自包含二进制**：不依赖 bun 运行时
4. **自动更新**：通过 Homebrew 管理版本更新

---

## 技术方案

### 1. Bun 编译能力

Bun 支持将 TypeScript/JavaScript 编译为独立的二进制文件：

```bash
bun build --compile --target=<target> --outfile=<output> <entry>
```

**支持的目标平台**：
- `bun-darwin-arm64` - macOS Apple Silicon
- `bun-darwin-x64` - macOS Intel
- `bun-linux-x64` - Linux x64
- `bun-linux-arm64` - Linux ARM64

**特性**：
- ✅ 包含 Bun 运行时
- ✅ 包含所有依赖
- ✅ 单个可执行文件
- ✅ 不需要 node_modules

### 2. 架构设计

```
md-viewer/
├── bin/
│   ├── mdv                      # 主 CLI（编译后的二进制）
│   ├── mdv-admin               # 管理 CLI（编译后的二进制）
│   └── mdv-iterm2-dispatcher   # Shell 脚本
├── share/
│   └── md-viewer/
│       └── client/             # 静态资源（HTML/CSS/JS）
└── etc/
    └── md-viewer/
        └── config.json         # 默认配置
```

---

## 实施步骤

### Phase 1: 构建系统改进

#### 1.1 多平台编译脚本

创建 `scripts/build-all.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}
DIST_DIR="dist"

echo "Building md-viewer v$VERSION for all platforms..."

# 清理
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# 构建客户端资源
bun run build:client

# 定义平台
PLATFORMS=(
  "darwin-arm64"
  "darwin-x64"
  "linux-x64"
  "linux-arm64"
)

# 为每个平台编译
for platform in "${PLATFORMS[@]}"; do
  echo "Building for $platform..."

  # 编译 server (mdv-server)
  bun build --compile \
    --target="bun-$platform" \
    --outfile="$DIST_DIR/mdv-server-$platform" \
    src/server.ts

  # 编译 CLI (mdv)
  bun build --compile \
    --target="bun-$platform" \
    --outfile="$DIST_DIR/mdv-$platform" \
    src/cli.ts

  # 编译 admin CLI (mdv-admin)
  bun build --compile \
    --target="bun-$platform" \
    --outfile="$DIST_DIR/mdv-admin-$platform" \
    src/cli-admin.ts
done

# 复制静态资源
mkdir -p "$DIST_DIR/client"
cp -r dist-client/* "$DIST_DIR/client/"

# 复制 dispatcher 脚本
cp scripts/mdv-iterm2-dispatcher.sh "$DIST_DIR/"

echo "Build complete! Artifacts in $DIST_DIR/"
```

#### 1.2 创建分发包

创建 `scripts/package.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-$(node -p "require('./package.json').version")}
PLATFORM=$2  # darwin-arm64, darwin-x64, linux-x64, linux-arm64
DIST_DIR="dist"
PKG_DIR="pkg"

echo "Packaging md-viewer v$VERSION for $PLATFORM..."

PKG_NAME="md-viewer-$VERSION-$PLATFORM"
PKG_PATH="$PKG_DIR/$PKG_NAME"

# 清理并创建目录
rm -rf "$PKG_PATH"
mkdir -p "$PKG_PATH/bin"
mkdir -p "$PKG_PATH/share/md-viewer"
mkdir -p "$PKG_PATH/etc/md-viewer"

# 复制二进制
cp "$DIST_DIR/mdv-$PLATFORM" "$PKG_PATH/bin/mdv"
cp "$DIST_DIR/mdv-admin-$PLATFORM" "$PKG_PATH/bin/mdv-admin"
cp "$DIST_DIR/mdv-iterm2-dispatcher.sh" "$PKG_PATH/bin/mdv-iterm2-dispatcher"
chmod +x "$PKG_PATH/bin/"*

# 复制静态资源
cp -r "$DIST_DIR/client" "$PKG_PATH/share/md-viewer/"

# 创建默认配置
cat > "$PKG_PATH/etc/md-viewer/config.json" <<'EOF'
{
  "server": {
    "port": 3000,
    "host": "localhost"
  }
}
EOF

# 创建 tarball
cd "$PKG_DIR"
tar czf "$PKG_NAME.tar.gz" "$PKG_NAME"
cd ..

echo "Package created: $PKG_DIR/$PKG_NAME.tar.gz"
```

#### 1.3 更新 package.json

```json
{
  "scripts": {
    "build:client": "bun run build.ts",
    "build:server": "bun build --compile src/server.ts --outfile=dist/mdv-server",
    "build:cli": "bun build --compile src/cli.ts --outfile=dist/mdv",
    "build:admin": "bun build --compile src/cli-admin.ts --outfile=dist/mdv-admin",
    "build:all": "bash scripts/build-all.sh",
    "package": "bash scripts/package.sh",
    "release": "bash scripts/release.sh"
  }
}
```

### Phase 2: 代码调整

#### 2.1 静态资源路径处理

当前代码使用相对路径加载客户端资源，需要改为：

**问题**：编译后的二进制无法使用 `import.meta.dir` 等相对路径

**解决方案**：

1. **构建时嵌入资源**（推荐）

```typescript
// src/server.ts
import clientHTML from "./client/dist/index.html" with { type: "text" };
import clientCSS from "./client/dist/styles.css" with { type: "text" };
import clientJS from "./client/dist/bundle.js" with { type: "text" };

// 或者使用 Bun.file
const clientHTML = await Bun.file("./dist-client/index.html").text();
```

2. **运行时查找资源**（更灵活）

```typescript
// src/utils/paths.ts
import { resolve, dirname } from "path";
import { existsSync } from "fs";

export function getResourceDir(): string {
  // 开发模式
  if (process.env.NODE_ENV === "development") {
    return resolve(import.meta.dir, "../dist-client");
  }

  // 编译后的二进制
  // 假设安装在 /usr/local/bin/mdv
  // 资源在 /usr/local/share/md-viewer/client
  const binDir = dirname(process.execPath);
  const candidates = [
    resolve(binDir, "../share/md-viewer/client"),  // Homebrew
    resolve(binDir, "../dist-client"),              // 本地构建
    resolve(process.cwd(), "dist-client"),          // 当前目录
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  throw new Error("Cannot find client resources");
}
```

#### 2.2 配置文件路径

```typescript
// src/config.ts
export function getConfigDir(): string {
  // 优先级：环境变量 > 用户目录 > 系统目录
  return (
    process.env.MDV_CONFIG_DIR ||
    resolve(os.homedir(), ".config/md-viewer") ||
    "/usr/local/etc/md-viewer"
  );
}
```

### Phase 3: Homebrew Formula

#### 3.1 创建 Formula

创建 `Formula/md-viewer.rb`：

```ruby
class MdViewer < Formula
  desc "Markdown viewer with live reload and browser-based UI"
  homepage "https://github.com/huanghao/md-viewer"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v1.0.0/md-viewer-1.0.0-darwin-arm64.tar.gz"
      sha256 "xxx"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v1.0.0/md-viewer-1.0.0-darwin-x64.tar.gz"
      sha256 "xxx"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/huanghao/md-viewer/releases/download/v1.0.0/md-viewer-1.0.0-linux-arm64.tar.gz"
      sha256 "xxx"
    else
      url "https://github.com/huanghao/md-viewer/releases/download/v1.0.0/md-viewer-1.0.0-linux-x64.tar.gz"
      sha256 "xxx"
    end
  end

  def install
    bin.install "bin/mdv"
    bin.install "bin/mdv-admin"
    bin.install "bin/mdv-iterm2-dispatcher"

    share.install "share/md-viewer"
    etc.install "etc/md-viewer"
  end

  def post_install
    # 创建用户配置目录
    (var/"md-viewer").mkpath
  end

  test do
    system "#{bin}/mdv", "--version"
  end
end
```

#### 3.2 发布到 Homebrew Tap

创建自己的 Tap：

```bash
# 1. 创建 Tap 仓库
gh repo create homebrew-md-viewer --public

# 2. 克隆并添加 Formula
git clone git@github.com:huanghao/homebrew-md-viewer.git
cd homebrew-md-viewer
mkdir -p Formula
cp ../md-viewer/Formula/md-viewer.rb Formula/
git add .
git commit -m "Add md-viewer formula"
git push

# 3. 用户安装
brew tap huanghao/md-viewer
brew install md-viewer
```

### Phase 4: CI/CD 自动化

#### 4.1 GitHub Actions

创建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    name: Build ${{ matrix.platform }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: macos-latest
            platform: darwin-arm64
          - os: macos-13  # Intel
            platform: darwin-x64
          - os: ubuntu-latest
            platform: linux-x64
          # - os: ubuntu-latest  # ARM 需要特殊设置
          #   platform: linux-arm64

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build client
        run: bun run build:client

      - name: Build binaries
        run: |
          bun build --compile --target=bun-${{ matrix.platform }} \
            --outfile=dist/mdv src/cli.ts
          bun build --compile --target=bun-${{ matrix.platform }} \
            --outfile=dist/mdv-admin src/cli-admin.ts

      - name: Package
        run: bash scripts/package.sh ${{ github.ref_name }} ${{ matrix.platform }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: md-viewer-${{ matrix.platform }}
          path: pkg/*.tar.gz

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            md-viewer-*/*.tar.gz
          draft: false
          prerelease: false
```

#### 4.2 自动更新 Homebrew Formula

创建 `.github/workflows/update-formula.yml`：

```yaml
name: Update Homebrew Formula

on:
  release:
    types: [published]

jobs:
  update-formula:
    runs-on: ubuntu-latest
    steps:
      - name: Update Homebrew formula
        uses: dawidd6/action-homebrew-bump-formula@v3
        with:
          token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
          formula: md-viewer
          tap: huanghao/homebrew-md-viewer
```

---

## 优势分析

### ✅ 用户体验

1. **简单安装**
```bash
brew tap huanghao/md-viewer
brew install md-viewer
```

2. **自动更新**
```bash
brew upgrade md-viewer
```

3. **无需 Bun 运行时**
   - 用户不需要安装 bun
   - 单个二进制文件，开箱即用

### ✅ 维护成本

1. **自动化发布**
   - GitHub Actions 自动构建
   - 自动创建 Release
   - 自动更新 Formula

2. **版本管理**
   - Git tag 触发发布
   - Semantic versioning
   - 完整的 changelog

### ✅ 分发效率

1. **多平台支持**
   - macOS (Intel/ARM)
   - Linux (x64/ARM64)
   - 一次构建，多平台分发

2. **CDN 加速**
   - GitHub Releases 自带 CDN
   - 全球加速下载

---

## 挑战与解决方案

### 挑战 1: 静态资源打包

**问题**: 客户端资源（HTML/CSS/JS）如何随二进制分发？

**解决方案**:
- **方案 A**: 嵌入到二进制（推荐小文件）
- **方案 B**: 安装到 `share/md-viewer/`（推荐大文件）
- **当前推荐**: 方案 B，更灵活，易于调试

### 挑战 2: 配置文件管理

**问题**: 用户配置、缓存、数据库存放位置？

**解决方案**:
```
~/.config/md-viewer/config.json  # 用户配置
~/.local/share/md-viewer/        # 数据库、缓存
/usr/local/etc/md-viewer/        # 系统默认配置
```

### 挑战 3: iTerm2 Dispatcher

**问题**: Shell 脚本如何随二进制分发？

**解决方案**:
- 安装到 `bin/mdv-iterm2-dispatcher`
- Homebrew 自动添加到 PATH
- 脚本中硬编码查找 `mdv` 的路径

### 挑战 4: 跨平台测试

**问题**: 如何测试所有平台的二进制？

**解决方案**:
- CI/CD 在各平台构建和测试
- 使用 Docker 模拟 Linux 环境
- 社区反馈机制

---

## 实施计划

### Week 1: 基础架构

- [ ] 调整静态资源加载逻辑
- [ ] 实现跨平台路径查找
- [ ] 创建构建脚本
- [ ] 测试编译后的二进制

### Week 2: 打包与分发

- [ ] 创建打包脚本
- [ ] 编写 Homebrew Formula
- [ ] 创建 Homebrew Tap
- [ ] 手动测试安装流程

### Week 3: 自动化

- [ ] 配置 GitHub Actions
- [ ] 测试自动发布流程
- [ ] 自动更新 Formula
- [ ] 文档更新

### Week 4: 测试与发布

- [ ] 多平台测试
- [ ] 用户验收测试
- [ ] 发布 v1.0.0
- [ ] 宣传推广

---

## 成本估算

### 开发成本

- 代码调整：1-2 天
- 构建系统：1-2 天
- CI/CD 配置：1 天
- 测试：2-3 天
- **总计**: 1-2 周

### 维护成本

- 每次发布：自动化（0 成本）
- Bug 修复：正常开发流程
- 文档更新：随版本更新

### 基础设施成本

- GitHub Actions: 免费（公开仓库）
- GitHub Releases: 免费
- Homebrew Tap: 免费
- **总计**: 0 元

---

## 风险评估

### 技术风险

1. **Bun 编译稳定性**
   - 风险等级: 低
   - Bun 的 `--compile` 功能已经成熟
   - 大量项目在生产环境使用

2. **跨平台兼容性**
   - 风险等级: 中
   - 需要在各平台充分测试
   - CI/CD 可以覆盖大部分场景

3. **静态资源加载**
   - 风险等级: 低
   - 方案成熟，有多种备选方案

### 运营风险

1. **Homebrew 审核**
   - 风险等级: 低
   - 使用自己的 Tap，无需官方审核
   - 未来可以提交到官方 Homebrew

2. **用户迁移**
   - 风险等级: 低
   - 提供迁移指南
   - 保持向后兼容

---

## 替代方案

### 方案 B: npm 分发

**优势**:
- 用户可能已有 Node.js 环境
- npm 生态成熟

**劣势**:
- 需要 bun 运行时
- 安装更复杂
- 不如 Homebrew 原生

### 方案 C: Docker

**优势**:
- 环境隔离
- 跨平台一致

**劣势**:
- 启动慢
- 资源占用大
- 不适合 CLI 工具

### 方案 D: 手动下载

**优势**:
- 最简单的分发方式

**劣势**:
- 无自动更新
- 用户体验差
- 难以管理版本

---

## 结论

**推荐方案**: Homebrew + Bun 编译

**理由**:
1. ✅ 用户体验最佳（一键安装、自动更新）
2. ✅ 维护成本低（自动化 CI/CD）
3. ✅ 无需运行时依赖
4. ✅ 跨平台支持
5. ✅ 符合 macOS/Linux 生态习惯

**下一步**:
1. 创建 POC（概念验证）
2. 测试编译后的二进制
3. 验证静态资源加载
4. 编写构建脚本

---

**设计人员**: Claude Sonnet 4.6
**设计日期**: 2026-03-04
