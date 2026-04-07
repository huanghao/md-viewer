import { expect, test } from '@playwright/test';
import { seedConfig } from '../../helpers';
import { resolve } from 'path';

const ROOT = process.cwd();

test('case-4: 工作区排序使用↑/↓，并持久化', async ({ page }) => {
  await seedConfig(page, {
    sidebarTab: 'full',
    workspaces: [
      { id: 'ws-a', name: 'alpha', path: ROOT, isExpanded: false },
      { id: 'ws-b', name: 'beta', path: resolve(ROOT, 'docs'), isExpanded: false },
      { id: 'ws-c', name: 'gamma', path: resolve(ROOT, 'src'), isExpanded: false },
    ],
  });

  const items = page.locator('.workspace-item');
  await expect(items).toHaveCount(3);

  await items.nth(0).locator('.workspace-header').hover();
  await expect(items.nth(0).locator('button[title="上移"]')).toHaveCount(0);
  await expect(items.nth(0).locator('button[title="下移"]')).toHaveCount(1);

  await items.nth(2).locator('.workspace-header').hover();
  await expect(items.nth(2).locator('button[title="上移"]')).toHaveCount(1);
  await expect(items.nth(2).locator('button[title="下移"]')).toHaveCount(0);

  await items.nth(0).locator('.workspace-header').hover();
  await items.nth(0).locator('button[title="下移"]').click();

  const namesAfter = await page.locator('.workspace-name').allTextContents();
  expect(namesAfter.map((s) => s.trim())).toEqual(['beta', 'alpha', 'gamma']);

  await page.reload();

  const namesReloaded = await page.locator('.workspace-name').allTextContents();
  expect(namesReloaded.map((s) => s.trim())).toEqual(['beta', 'alpha', 'gamma']);
});
