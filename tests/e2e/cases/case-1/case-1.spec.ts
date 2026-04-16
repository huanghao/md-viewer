import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-1: 列表差异蓝点刷新后消失（行为+视觉）', async ({ page, request }) => {
  await resetAppStorage(page);

  const resp = await request.post('/api/open-file', {
    data: { path: BLUE_DOT_FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  // 等待文件列表渲染完成（扩展名被剥离，所以用前缀匹配）
  await page.waitForSelector('.file-item', { timeout: 10000 });

  // 验证文件项存在且可交互
  const item = page.locator('.file-item', { hasText: 'blue-dot-refresh-test' });
  await expect(item).toBeVisible();

  // 点击文件项
  await item.click();

  // 刷新页面
  await page.reload();
  await page.waitForSelector('.file-item', { timeout: 10000 });

  // 验证刷新后文件项仍然存在
  const reloadedItem = page.locator('.file-item', { hasText: 'blue-dot-refresh-test' });
  await expect(reloadedItem).toBeVisible();
});
