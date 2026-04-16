# GitHub Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 推送 `v*` 标签后自动发布 mdv CLI tarballs（4平台）+ Mac App DMG（ad-hoc 签名）到 GitHub Release，并清理 3 个废弃调试脚本。

**Architecture:** 在现有 `release.yml` 里新增 `build-app` job，在 `macos-latest` runner 上依次构建 mdv-server universal binary、Swift app bundle、DMG，然后 upload artifact；`release` job 依赖它和现有 `build` job，统一收集所有产物创建 Release。本地脚本删除 3 个一次性/调试脚本，justfile 新增 app 相关命令。

**Tech Stack:** GitHub Actions, Bun (cross-compile), Swift Package Manager, hdiutil, codesign (ad-hoc), softprops/action-gh-release

---

## File Map

| 操作 | 文件 |
|------|------|
| Modify | `.github/workflows/release.yml` |
| Delete | `scripts/create-app-icon.sh` |
| Delete | `scripts/test-signing.sh` |
| Delete | `scripts/test-compile.sh` |
| Modify | `justfile` |

---

### Task 1: 删除废弃调试脚本

**Files:**
- Delete: `scripts/create-app-icon.sh`
- Delete: `scripts/test-signing.sh`
- Delete: `scripts/test-compile.sh`

- [ ] **Step 1: 删除三个脚本**

```bash
rm scripts/create-app-icon.sh scripts/test-signing.sh scripts/test-compile.sh
```

- [ ] **Step 2: 确认删除**

```bash
ls scripts/
```

Expected output（不包含上述三个文件）:
```
build
build-all.sh
build-and-install.sh
build-server-for-xcode.sh
embed-client.ts
package.sh
sync-formula-to-tap.sh
update-formula-sha.sh
```

- [ ] **Step 3: Commit**

```bash
git add -A scripts/create-app-icon.sh scripts/test-signing.sh scripts/test-compile.sh
git commit -m "chore: remove one-off debug scripts"
```

---

### Task 2: 更新 justfile，新增 app 构建命令

**Files:**
- Modify: `justfile`

- [ ] **Step 1: 替换 justfile 内容**

将 `justfile` 改为：

```makefile
# md-viewer justfile

# ── 开发 ──────────────────────────────────────────────
# 开发模式（热重载）
dev:
    bun --watch run src/server.ts

# 构建前端资源
build-client:
    bun run build.ts && bun run scripts/embed-client.ts

# ── CLI 构建 ──────────────────────────────────────────
# 构建本地 CLI 二进制（当前平台）
build:
    bash scripts/build-all.sh

# 打包 CLI 为 tarball（用于 Homebrew 分发）
package version:
    bash scripts/package.sh {{version}}

# 发布新版本（构建所有平台 + 打包）
release version:
    bash scripts/build-all.sh {{version}}
    bash scripts/package.sh {{version}}

# ── Mac App 构建 ──────────────────────────────────────
# 构建 mdv-server universal binary（App 依赖）
build-server:
    bash scripts/build-server-for-xcode.sh

# 构建 Mac App（生成 dist/MD Viewer.app + DMG）
build-app:
    bash scripts/build-server-for-xcode.sh
    bash scripts/build/build_app_bundle.sh --ad-hoc

# 构建并安装 Mac App 到 /Applications
install:
    bash scripts/build-and-install.sh

# ── Homebrew ──────────────────────────────────────────
# 更新 Homebrew Formula 的 SHA256
update-formula version:
    bash scripts/update-formula-sha.sh {{version}}

# 同步 Formula 到 homebrew-tap 仓库
sync-tap version:
    bash scripts/sync-formula-to-tap.sh {{version}}

# ── 测试 ──────────────────────────────────────────────
# 运行单元测试
test-unit:
    bun test tests/unit/

# 运行 e2e 测试
test-e2e:
    bun run test:e2e

# 运行所有测试（单元 + e2e）
test:
    bun test tests/unit/
    bun run test:e2e

# 运行 e2e 测试（有头浏览器）
test-headed:
    bun run test:e2e:headed

# 更新测试快照
test-update:
    bun run test:e2e:update
```

- [ ] **Step 2: 验证语法**

```bash
just --list
```

Expected: 列出所有命令，无报错。

- [ ] **Step 3: Commit**

```bash
git add justfile
git commit -m "chore: add build-app and build-server commands to justfile"
```

---

### Task 3: 在 release.yml 新增 build-app job

**Files:**
- Modify: `.github/workflows/release.yml`

这是核心任务。在现有 `build` job 之后、`release` job 之前插入 `build-app` job，并更新 `release` job 的 `needs` 和收集逻辑。

- [ ] **Step 1: 替换 `.github/workflows/release.yml` 为完整新内容**

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
      fail-fast: false
      matrix:
        include:
          - os: macos-latest
            platform: darwin-arm64
            target: bun-darwin-aarch64
          - os: macos-latest
            platform: darwin-x64
            target: bun-darwin-x64-baseline
          - os: ubuntu-latest
            platform: linux-x64
            target: bun-linux-x64
          - os: ubuntu-latest
            platform: linux-arm64
            target: bun-linux-aarch64

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: npm install --registry=https://registry.npmjs.org/

      - name: Build
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          ./scripts/build-all.sh $VERSION
        env:
          BUN_TARGET: ${{ matrix.target }}

      - name: Package
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          ./scripts/package.sh $VERSION ${{ matrix.platform }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: mdv-${{ matrix.platform }}
          path: packages/*.tar.gz

  build-app:
    name: Build Mac App
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: npm install --registry=https://registry.npmjs.org/

      - name: Build mdv-server universal binary
        run: ./scripts/build-server-for-xcode.sh

      - name: Build Mac App (ad-hoc signed)
        run: ./scripts/build/build_app_bundle.sh --ad-hoc --skip-dmg

      - name: Create DMG
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          APP_PATH="dist/MD Viewer.app"
          DMG_NAME="MD-Viewer-${VERSION}.dmg"
          DMG_TEMP="dist/dmg_temp"

          mkdir -p "$DMG_TEMP"
          cp -R "$APP_PATH" "$DMG_TEMP/"
          ln -s /Applications "$DMG_TEMP/Applications"

          hdiutil create \
            -volname "MD Viewer" \
            -srcfolder "$DMG_TEMP" \
            -ov \
            -format UDZO \
            "dist/${DMG_NAME}"

          rm -rf "$DMG_TEMP"
          echo "DMG_NAME=${DMG_NAME}" >> $GITHUB_ENV
          ls -lh "dist/${DMG_NAME}"

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: mdv-mac-app
          path: dist/MD-Viewer-*.dmg

  release:
    name: Create Release
    needs: [build, build-app]
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: packages

      - name: Calculate SHA256
        id: sha256
        run: |
          cd packages
          for dir in mdv-*; do
            if [ -d "$dir" ]; then
              cd "$dir"
              for file in *.tar.gz *.dmg; do
                if [ -f "$file" ]; then
                  sha256sum "$file" | tee -a ../SHA256SUMS.txt
                fi
              done
              cd ..
            fi
          done
          cat SHA256SUMS.txt

      - name: Collect release files
        run: |
          mkdir -p release-files

          # CLI tarballs
          for platform in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
            tarball=$(find packages -name "mdv-${platform}.tar.gz" -type f | head -1)
            if [ -f "$tarball" ]; then
              cp "$tarball" "release-files/mdv-${platform}.tar.gz"
              echo "✓ Found: mdv-${platform}.tar.gz"
            else
              echo "✗ Missing: mdv-${platform}.tar.gz"
            fi
          done

          # Mac App DMG
          dmg=$(find packages -name "MD-Viewer-*.dmg" -type f | head -1)
          if [ -f "$dmg" ]; then
            cp "$dmg" "release-files/$(basename $dmg)"
            echo "✓ Found: $(basename $dmg)"
          else
            echo "✗ Missing: Mac App DMG"
          fi

          cp packages/SHA256SUMS.txt release-files/
          echo ""
          echo "Release files:"
          ls -lh release-files/

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: release-files/*
          draft: false
          prerelease: false
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: 验证 YAML 语法**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))" && echo "YAML OK"
```

Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: add Mac App DMG to GitHub Release workflow"
```

---

### Task 4: 验证并推送

- [ ] **Step 1: 确认所有改动**

```bash
git log --oneline -5
```

Expected: 看到 3 个新 commit（chore: remove scripts, chore: justfile, feat: workflow）

- [ ] **Step 2: 检查 release.yml 的 needs 字段正确**

```bash
grep -A2 "needs:" .github/workflows/release.yml
```

Expected:
```
    needs: [build, build-app]
```

- [ ] **Step 3: 推送到 main**

```bash
git push origin main
```

- [ ] **Step 4: 打一个测试 tag 触发 workflow（可选，确认 CI 通过）**

```bash
# 仅在准备好发版时执行
# git tag v0.x.x && git push origin v0.x.x
```

---

## 注意事项

- `build-app` job 里 DMG 创建步骤独立于 `build_app_bundle.sh`（后者的 DMG 逻辑用了 `$VERSION` 变量但脚本读的是 `config.sh` 里的硬编码版本），所以 CI 里单独用 `hdiutil` 创建，文件名包含正确的 tag 版本号。
- `build_app_bundle.sh` 传 `--skip-dmg` 是为了避免重复创建，DMG 由后续步骤统一生成。
- `SHA256SUMS.txt` 的收集逻辑扩展了 `.dmg` 文件的匹配，兼容原有 `.tar.gz`。
- ad-hoc 签名的 DMG 分发给他人时，接收方需要右键 Open 绕过 Gatekeeper。
