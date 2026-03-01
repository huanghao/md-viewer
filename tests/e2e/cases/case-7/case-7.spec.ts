import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-7: 同步失败后留在同页并支持重试', async ({ page, request }) => {
  await resetAppStorage(page);

  await page.route('**/api/sync/status**', async (route) => {
    await route.fulfill({ json: { synced: false } });
  });
  await page.route('**/api/sync/recent-parents**', async (route) => {
    await route.fulfill({
      json: {
        parents: [],
        defaultParentId: null,
      },
    });
  });
  await page.route('**/api/sync/preferences**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { openAfterSync: false } });
      return;
    }
    await route.fulfill({ status: 200, json: { success: true } });
  });

  let executeCount = 0;
  await page.route('**/api/sync/execute', async (route) => {
    executeCount += 1;
    if (executeCount === 1) {
      await route.fulfill({
        json: {
          success: false,
          error: 'km-cli 执行失败',
          output: 'Error: invalid parent-id',
        },
      });
      return;
    }
    await route.fulfill({
      json: {
        success: true,
        kmDocId: '98321',
        kmUrl: 'https://xuecheng.com/doc/98321',
        kmTitle: '周报：同步交互重构',
        output: '{"id":"98321","title":"周报：同步交互重构"}',
      },
    });
  });

  const resp = await request.post('/api/open-file', {
    data: { path: BLUE_DOT_FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  const item = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
  await item.click();

  await page.click('#syncButton');
  await expect(page.locator('#syncDialogOverlay')).toHaveClass(/show/);

  await page.locator('#syncTitle').fill('周报：同步交互重构');
  await page.locator('#syncParentId').fill('2748');

  await page.locator('.sync-dialog-btn-primary', { hasText: '同步' }).click();

  await expect(page.locator('#syncStatusError')).toBeVisible();
  await expect(page.locator('#syncStatusErrorOutput')).toContainText('invalid parent-id');

  await expect(page.locator('#syncDialogOverlay')).toHaveClass(/show/);
  await expect(page.locator('#syncTitle')).toHaveValue('周报：同步交互重构');
  await expect(page.locator('#syncParentId')).toHaveValue('2748');

  await page.locator('.sync-dialog-btn-primary', { hasText: '同步' }).click();

  await expect(page.locator('#syncStatusSuccess')).toBeVisible();
  await expect(page.locator('#syncStatusDocTitle')).toHaveText('周报：同步交互重构');
  await expect(page.locator('#syncStatusDocTitle')).toHaveAttribute('href', 'https://xuecheng.com/doc/98321');
  await expect(page.locator('#syncStatusTime')).toContainText('同步时间：');
});
