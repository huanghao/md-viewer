# 自动化测试策略

## 测试金字塔

```
       /\
      /  \  E2E Tests (少量，关键流程)
     /────\
    /      \  Integration Tests (中等，功能测试)
   /────────\
  /          \  Unit Tests (大量，单元测试)
 /────────────\
```

## 1. 单元测试（Unit Tests）

**工具：Bun Test**

```typescript
// tests/unit/utils.test.ts
import { test, expect } from 'bun:test';
import { formatRelativeTime } from '@/client/utils/format';

test('formatRelativeTime - 刚刚', () => {
  const now = Date.now();
  expect(formatRelativeTime(now)).toBe('刚刚');
});

test('formatRelativeTime - 5分钟前', () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分钟前');
});
```

**覆盖范围：**
- 工具函数（format, escape, file-names）
- 状态管理（state.ts）
- 文件类型检测（file-type.ts）

## 2. 集成测试（Integration Tests）

**工具：Bun Test + Supertest**

```typescript
// tests/integration/api.test.ts
import { test, expect } from 'bun:test';
import { app } from '@/server';

test('GET /api/file - 返回文件内容', async () => {
  const res = await app.request('/api/file?path=README.md');
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.content).toBeDefined();
});
```

**覆盖范围：**
- API 端点（/api/file, /api/files, /api/nearby）
- SSE 连接
- 文件监听

## 3. E2E 测试（End-to-End Tests）

**工具：Playwright**

```typescript
// tests/e2e/basic-flow.spec.ts
import { test, expect } from '@playwright/test';

test('完整工作流', async ({ page }) => {
  // 1. 打开应用
  await page.goto('/');
  
  // 2. 添加文件
  await page.fill('#fileInput', 'README.md');
  await page.click('button:has-text("添加文件")');
  
  // 3. 验证文件列表
  await expect(page.locator('.file-item')).toContainText('README.md');
  
  // 4. 验证内容渲染
  await expect(page.locator('.markdown-body h1')).toBeVisible();
  
  // 5. 切换文件
  await page.fill('#fileInput', 'TODO.md');
  await page.click('button:has-text("添加文件")');
  await page.click('.file-item:has-text("TODO.md")');
  
  // 6. 验证切换成功
  await expect(page.locator('.file-item.current')).toContainText('TODO.md');
});
```

**覆盖范围：**
- 文件添加、切换、删除
- 搜索功能
- 同步功能
- 设置面板

## 测试配置

```typescript
// package.json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit",
    "test:integration": "bun test tests/integration",
    "test:e2e": "playwright test",
    "test:all": "bun test && playwright test"
  }
}
```

## CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bunx playwright install
      - run: bunx playwright test
```

## 实施优先级

P0:
1. 单元测试：工具函数
2. E2E 测试：基础流程

P1:
1. 集成测试：API 端点
2. E2E 测试：高级功能

P2:
1. 视觉回归测试
2. 性能测试
