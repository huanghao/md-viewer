import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage, seedConfig } from '../../helpers';

const ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(ROOT, 'tests/e2e/runtime/case-14');
const FILE_A = resolve(WORKSPACE_ROOT, 'e2e-ws-noncurrent-a.md');
const FILE_B = resolve(WORKSPACE_ROOT, 'e2e-ws-noncurrent-b.md');

test('case-14: 工作区模式删除非当前文件', async ({ page }) => {
  if (!existsSync(WORKSPACE_ROOT)) mkdirSync(WORKSPACE_ROOT, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);
  if (existsSync(FILE_B)) rmSync(FILE_B);
  writeFileSync(FILE_A, '# A\n\nA cached content\n', 'utf-8');
  writeFileSync(FILE_B, '# B\n\nB current content\n', 'utf-8');

  try {
    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [{ id: 'ws-runtime', name: 'case-14', path: WORKSPACE_ROOT, isExpanded: true }],
    });

    await expect(page.locator('.workspace-header', { hasText: 'case-14' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    const itemA = page.locator('.tree-item.file-node', { hasText: 'e2e-ws-noncurrent-a.md' }).first();
    const itemB = page.locator('.tree-item.file-node', { hasText: 'e2e-ws-noncurrent-b.md' }).first();
    await expect(itemA).toBeVisible();
    await expect(itemB).toBeVisible();

    // 先打开 A（缓存内容），再打开 B 让 A 变成非当前
    await itemA.click();
    await expect(page.locator('#content')).toContainText('A cached content');
    await itemB.click();
    await page.waitForTimeout(1200);

    rmSync(FILE_A);

    await expect.poll(async () => {
      const badge = itemA.locator('.status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    // 点击已删除的非当前文件：展示删除提示 + 保留缓存内容
    await itemA.click();
    await expect(page.locator('.content-file-status.deleted')).toBeVisible();
    await expect(page.locator('#content')).toContainText('A cached content');

    // 刷新后 A 被清理
    await page.reload();
    await expect(page.locator('.tree-item.file-node:not(.missing)', { hasText: 'e2e-ws-noncurrent-a.md' })).toHaveCount(0);
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
    if (existsSync(FILE_B)) rmSync(FILE_B);
  }
});
