import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-9: 同步失败态停留与表单保持（纯失败）', async ({ page, request }) => {
  await resetAppStorage(page);

  await page.route('**/api/sync/status**', async (route) => {
    await route.fulfill({ json: { synced: false } });
  });
  await page.route('**/api/sync/recent-parents**', async (route) => {
    await route.fulfill({ json: { parents: [], defaultParentId: null } });
  });
  await page.route('**/api/sync/preferences**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { openAfterSync: false } });
      return;
    }
    await route.fulfill({ status: 200, json: { success: true } });
  });
  await page.route('**/api/sync/execute', async (route) => {
    await route.fulfill({
      json: {
        success: false,
        error: 'km-cli 执行失败',
        output: 'Error: invalid parent-id\nUsage: km-cli doc create ...',
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

  const titleValue = '失败态保留测试';
  const parentValue = '2748';
  await page.locator('#syncTitle').fill(titleValue);
  await page.locator('#syncParentId').fill(parentValue);

  const syncBtn = page.locator('.sync-dialog-btn-primary', { hasText: '同步' });
  await syncBtn.click();

  await expect(page.locator('#syncStatusError')).toBeVisible();
  await expect(page.locator('#syncStatusErrorOutput')).toContainText('invalid parent-id');
  await expect(page.locator('#syncDialogOverlay')).toHaveClass(/show/);

  await expect(page.locator('#syncTitle')).toHaveValue(titleValue);
  await expect(page.locator('#syncParentId')).toHaveValue(parentValue);

  await expect(syncBtn).toBeEnabled();
  await expect(syncBtn).toHaveText('同步');
});
