# md-viewer justfile
# 日常开发只需要: just dev / just install

# 开发模式：同时启动前端 watch + 后端 watch，Ctrl+C 一起退出
dev:
    #!/usr/bin/env bash
    trap 'kill 0' INT TERM
    bun run build.ts --watch &
    bun --watch run src/server.ts &
    wait

# 构建并安装 Mac App 到 /Applications
install:
    bash scripts/build-and-install.sh

# ── 测试 ──────────────────────────────────────────────
test:
    bun test tests/unit/

e2e:
    bun run test:e2e

# ── 构建 ──────────────────────────────────────────────
# 构建前端资源（一次性，不 watch）
build-client:
    bun run build.ts && bun run scripts/embed-client.ts

# 构建本地 CLI 二进制（当前平台）
build-mdv:
    bash scripts/build-all.sh

# 构建 mdv-server universal binary（Mac App 依赖）
build-server:
    bash scripts/build-server-for-xcode.sh

# 构建 Mac App（生成 dist/MD Viewer.app + DMG）
build-app: build-server
    bash scripts/build/build_app_bundle.sh --ad-hoc

# ── 发布 ──────────────────────────────────────────────
# 发布新版本（构建所有平台 + 打包）
release version:
    bash scripts/build-all.sh {{version}}
    bash scripts/package.sh {{version}}
