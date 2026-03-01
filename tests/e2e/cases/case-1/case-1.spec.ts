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

  const item = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
  await expect(item).toBeVisible();
  await expect(item.locator('.new-dot')).toBeVisible();

  await item.click();
  await expect(item.locator('.new-dot')).toHaveCount(0);

  await page.reload();

  const reloadedItem = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
  await expect(reloadedItem).toBeVisible();
  await expect(reloadedItem.locator('.new-dot')).toHaveCount(0);

  await expect(page.locator('.sidebar')).toHaveScreenshot('case-1-blue-dot-refresh.png');
});
