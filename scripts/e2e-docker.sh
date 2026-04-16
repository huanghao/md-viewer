#!/bin/bash
# E2E 测试 Docker 运行脚本

set -e

echo "🐳 构建 E2E 测试镜像..."
docker build -f Dockerfile.e2e -t mdv-e2e:latest .

echo "🚀 运行 E2E 测试..."
docker run --rm \
  --name mdv-e2e-test \
  -e CI=true \
  -v "$(pwd)/test-results:/app/test-results" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  mdv-e2e:latest \
  bun run test:e2e "$@"

echo "✅ 测试完成，报告保存在 test-results/ 和 playwright-report/"
