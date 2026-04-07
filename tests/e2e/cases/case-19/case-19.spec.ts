import { expect, test } from '@playwright/test';
import { seedConfig } from '../../helpers';

const ROOT = process.cwd();

test('case-19: 轮询重扫后仍保持目录折叠状态', async ({ page }) => {
  await seedConfig(page, {
    sidebarTab: 'full',
    workspaces: [
      { id: 'ws-mdv-poll', name: 'md-viewer', path: ROOT, isExpanded: true },
    ],
  });

  const workspaceHeader = page.locator('.workspace-header', { hasText: 'md-viewer' });
  await expect(workspaceHeader).toBeVisible();
  await expect(page.locator('.tree-loading')).toHaveCount(0);

  const docsName = page
    .locator('.tree-item.directory-node .tree-name')
    .filter({ hasText: /^docs$/ })
    .first();
  await expect(docsName).toBeVisible();

  const docsDirectory = docsName.locator('xpath=ancestor::div[contains(@class,"tree-item") and contains(@class,"directory-node")][1]');
  const docsNode = docsDirectory.locator('xpath=ancestor::div[contains(@class,"tree-node")][1]');
  const docsToggle = docsDirectory.locator('.tree-toggle').first();

  await expect(docsToggle).toHaveText('▼');
  await expect(docsNode.locator(':scope > .file-tree')).toHaveCount(1);

  await docsToggle.click();

  await expect(docsToggle).toHaveText('▶');
  await expect(docsNode.locator(':scope > .file-tree')).toHaveCount(0);

  // workspace polling interval is 1500ms; wait across at least one cycle.
  await page.waitForTimeout(2200);

  await expect(docsToggle).toHaveText('▶');
  await expect(docsNode.locator(':scope > .file-tree')).toHaveCount(0);
});
