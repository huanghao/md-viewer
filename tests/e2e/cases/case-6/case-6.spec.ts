import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');

test('case-6: 父文档 URL 归一化与失焦元信息回填', async ({ page, request }) => {
  await resetAppStorage(page);

  await page.route('**/api/sync/status**', async (route) => {
    await route.fulfill({ json: { synced: false } });
  });
  await page.route('**/api/sync/recent-parents**', async (route) => {
    await route.fulfill({
      json: {
        parents: [
          {
            id: '2748',
            title: '同步学城 - 产品文档',
            url: 'https://xuecheng.com/doc/2748',
            lastUsed: Date.now() - 5 * 60 * 1000,
          },
        ],
        defaultParentId: '2748',
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
  await page.route('**/api/sync/parent-meta**', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        parentId: '2748',
        title: '同步学城 - 产品文档',
        url: 'https://xuecheng.com/doc/2748',
      },
    });
  });

  const resp = await request.post('/api/open-file', {
    data: { path: BLUE_DOT_FILE, focus: false },
  });
  expect(resp.ok()).toBeTruthy();

  const item = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
  await expect(item).toBeVisible();
  await item.click();

  await page.click('#syncButton');
  await expect(page.locator('#syncDialogOverlay')).toHaveClass(/show/);

  const parentInput = page.locator('#syncParentId');
  await parentInput.fill('https://xuecheng.com/doc/2748?from=e2e');
  await page.locator('#syncTitle').click();

  await expect(page.locator('#syncCommandPreview')).toContainText('--parent-id "2748"');

  const parentMeta = page.locator('#syncParentMeta .sync-dialog-parent-meta-link');
  await expect(parentMeta).toBeVisible();
  await expect(parentMeta).toHaveText('同步学城 - 产品文档');
  await expect(parentMeta).toHaveAttribute('href', 'https://xuecheng.com/doc/2748');
});
