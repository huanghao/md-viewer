import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const LONG_FILE = resolve(ROOT, 'docs/design/20260301-agent-style-learning.md');
const TARGET_FILE_NAME = 'blue-dot-refresh-test.md';

test('case-23: 搜索打开新文件后正文回到顶部', async ({ page, request }) => {
  await resetAppStorage(page);

  const resp = await request.post('/api/open-file', {
    data: { path: LONG_FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  await page.locator('.file-item', { hasText: '20260301-agent-style-learning.md' }).click();

  await page.evaluate(() => {
    const content = document.getElementById('content');
    if (!content) return;
    content.scrollTop = 600;
  });

  const before = await page.evaluate(() => {
    const content = document.getElementById('content');
    return content ? content.scrollTop : -1;
  });
  expect(before).toBeGreaterThan(0);

  await page.fill('#searchInput', 'blue-dot-refresh-test');
  await page.keyboard.press('Enter');

  await expect(page.locator('.file-item.current .name')).toContainText(TARGET_FILE_NAME);

  const after = await page.evaluate(() => {
    const content = document.getElementById('content');
    return content ? content.scrollTop : -1;
  });
  expect(after).toBe(0);
});
