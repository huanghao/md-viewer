import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-22: 同步弹层支持右上角与遮罩关闭', async ({ page, request }) => {
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

  const resp = await request.post('/api/open-file', {
    data: { path: FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  await page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' }).click();
  await page.click('#syncButton');

  const overlay = page.locator('#syncDialogOverlay');
  const closeButton = page.locator('#syncDialogOverlay .sync-dialog-close');
  await expect(overlay).toHaveClass(/show/);
  await expect(closeButton).toBeVisible();

  await closeButton.click();
  await expect(overlay).not.toHaveClass(/show/);

  await page.click('#syncButton');
  await expect(overlay).toHaveClass(/show/);

  await overlay.click({ position: { x: 8, y: 8 } });
  await expect(overlay).not.toHaveClass(/show/);
});
