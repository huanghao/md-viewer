# Playwright 手工测试设计

## 需求
启动 Playwright 进行可视化手工测试，能够：
1. 看到测试过程
2. 记录测试步骤
3. 发现错误自动修复
4. 集成测试

## 方案：Playwright UI Mode + Codegen

### 1. 安装 Playwright
```bash
bun add -D @playwright/test
bunx playwright install
```

### 2. 配置 Playwright
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3456',
    headless: false,  // 显示浏览器
    screenshot: 'on',  // 截图
    video: 'on',       // 录制视频
  },
  webServer: {
    command: 'bun run dev',
    port: 3456,
    reuseExistingServer: true,
  },
});
```

### 3. 启动 UI Mode
```bash
# 启动 Playwright UI Mode（可视化测试界面）
bunx playwright test --ui

# 或者启动 Codegen（录制测试）
bunx playwright codegen http://localhost:3456
```

### 4. 编写测试用例
```typescript
// tests/basic.spec.ts
import { test, expect } from '@playwright/test';

test('打开 Markdown 文件', async ({ page }) => {
  await page.goto('/');
  
  // 输入文件路径
  await page.fill('#fileInput', 'README.md');
  await page.click('button:has-text("添加文件")');
  
  // 验证文件已打开
  await expect(page.locator('.file-item')).toContainText('README.md');
  
  // 验证内容已渲染
  await expect(page.locator('.markdown-body')).toBeVisible();
});
```

### 5. 测试录制和回放
- UI Mode 可以录制操作
- 自动生成测试代码
- 回放测试并查看结果

## 推荐工作流

1. **开发阶段**：使用 Codegen 录制操作
2. **测试阶段**：使用 UI Mode 运行测试
3. **CI 阶段**：使用 headless 模式自动化测试

## 实施步骤

P0:
1. 安装 Playwright
2. 创建基础测试用例
3. 配置 playwright.config.ts

P1:
1. 添加更多测试场景
2. 集成到 CI/CD
3. 错误自动截图
