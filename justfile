# md-viewer justfile
# 日常开发只需要: just dev

# 开发模式：同时启动前端 watch + 后端 watch，Ctrl+C 一起退出
# 端口: main=3000
dev:
    #!/usr/bin/env bash
    trap 'kill 0' INT TERM
    bun run build.ts --watch &
    bun --watch run src/server.ts &
    wait

# ── 测试 ──────────────────────────────────────────────
test coverage="":
    #!/usr/bin/env bash
    if [[ "{{coverage}}" == "coverage" || "{{coverage}}" == "--coverage" ]]; then
        bun test --coverage tests/unit/
    else
        bun test --only-failures tests/unit/
    fi

# ── 构建 ──────────────────────────────────────────────
# 构建前端资源（一次性，不 watch）
build-client:
    bun run build.ts

# 构建本地 CLI 二进制（当前平台）
build-mdv:
    bash scripts/build-all.sh

# ── 发布 ──────────────────────────────────────────────
# 构建所有平台二进制
release version:
    bash scripts/build-all.sh {{version}}
