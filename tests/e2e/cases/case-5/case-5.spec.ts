import { expect, test } from '@playwright/test';
import { resetAppStorage, seedConfig } from '../../helpers';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const WORKSPACE_NEW_DOT_FILE = resolve(ROOT, 'docs/design/e2e-workspace-new-dot.md');

test('case-5: 工作区新扫描文件（未打开）显示蓝点', async ({ page }) => {
  if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
    rmSync(WORKSPACE_NEW_DOT_FILE);
  }

  try {
    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-docs', name: 'docs', path: resolve(ROOT, 'docs'), isExpanded: true },
      ],
    });

    await expect(page.locator('.workspace-header', { hasText: 'docs' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    writeFileSync(WORKSPACE_NEW_DOT_FILE, '# e2e workspace new dot\n');
    await page.reload();

    const wsNewItem = page.locator('.tree-item', { hasText: 'e2e-workspace-new-dot.md' }).first();
    await expect(wsNewItem).toBeVisible();
    await expect(wsNewItem.locator('.new-dot')).toBeVisible();
  } finally {
    if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
      rmSync(WORKSPACE_NEW_DOT_FILE);
    }
  }
});
