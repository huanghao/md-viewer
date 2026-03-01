import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-8: 勾选立即打开时成功后关闭弹窗并触发打开', async ({ page, request }) => {
  await page.addInitScript(() => {
    (window as any).__openCalls = [];
    window.open = ((url?: string | URL | undefined, target?: string, features?: string) => {
      (window as any).__openCalls.push({ url: String(url || ''), target: target || '' });
      return null;
    }) as any;
  });

  await resetAppStorage(page);

  await page.route('**/api/sync/status**', async (route) => {
    await route.fulfill({ json: { synced: false } });
  });
  await page.route('**/api/sync/recent-parents**', async (route) => {
    await route.fulfill({ json: { parents: [], defaultParentId: null } });
  });
  await page.route('**/api/sync/preferences**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { openAfterSync: true } });
      return;
    }
    await route.fulfill({ status: 200, json: { success: true } });
  });
  await page.route('**/api/sync/execute', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        kmDocId: '99442',
        kmUrl: 'https://xuecheng.com/doc/99442',
        kmTitle: '立即打开测试',
        output: '{"id":"99442"}',
      },
    });
  });

  const resp = await request.post('/api/open-file', {
    data: { path: BLUE_DOT_FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  await page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' }).click();
  await page.click('#syncButton');

  await expect(page.locator('#syncDialogOverlay')).toHaveClass(/show/);
  await expect(page.locator('#syncOpenAfter')).toBeChecked();

  await page.locator('#syncTitle').fill('立即打开测试');
  await page.locator('#syncParentId').fill('2748');

  await page.locator('.sync-dialog-btn-primary', { hasText: '同步' }).click();

  await expect(page.locator('#syncDialogOverlay')).not.toHaveClass(/show/);

  await expect
    .poll(async () => {
      return await page.evaluate(() => (window as any).__openCalls.length);
    })
    .toBeGreaterThan(0);

  const opened = await page.evaluate(() => (window as any).__openCalls[0]);
  expect(opened.url).toContain('https://xuecheng.com/doc/99442');
});
