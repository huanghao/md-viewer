import { expect, test } from '@playwright/test';
import { seedConfig } from '../../helpers';

const ROOT = process.cwd();

test('case-2: 工作区展开状态刷新后保持，并加载目录树', async ({ page }) => {
  await seedConfig(page, {
    sidebarMode: 'workspace',
    workspaces: [
      { id: 'ws-mdv', name: 'md-viewer', path: ROOT, isExpanded: true },
    ],
  });

  const wsHeader = page.locator('.workspace-header', { hasText: 'md-viewer' });
  await expect(wsHeader).toBeVisible();
  await expect(wsHeader.locator('.workspace-toggle')).toHaveText('▼');
  await expect(page.locator('.tree-loading')).toHaveCount(0);

  const docsNode = page.locator('.tree-item .tree-name', { hasText: 'docs' }).first();
  await expect(docsNode).toBeVisible();

  await page.reload();

  await expect(page.locator('.workspace-header', { hasText: 'md-viewer' })).toBeVisible();
  await expect(page.locator('.workspace-header .workspace-toggle').first()).toHaveText('▼');
  await expect(page.locator('.tree-loading')).toHaveCount(0);
  await expect(page.locator('.tree-item .tree-name', { hasText: 'docs' }).first()).toBeVisible();
});
