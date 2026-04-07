# md-viewer justfile

# 开发模式（热重载）
dev:
    bun --watch run src/server.ts

# 构建前端资源
build-client:
    bun run build.ts && bun run scripts/embed-client.ts

# 构建本地二进制（当前平台）
build:
    bash scripts/build-all.sh

# 构建并安装到 /Applications
install:
    bash scripts/build-and-install.sh

# 打包为 tarball（用于 Homebrew 分发）
package version:
    bash scripts/package.sh {{version}}

# 发布新版本（构建所有平台 + 打包）
release version:
    bash scripts/build-all.sh {{version}}
    bash scripts/package.sh {{version}}

# 更新 Homebrew Formula 的 SHA256
update-formula version:
    bash scripts/update-formula-sha.sh {{version}}

# 同步 Formula 到 homebrew-tap 仓库
sync-tap version:
    bash scripts/sync-formula-to-tap.sh {{version}}

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
