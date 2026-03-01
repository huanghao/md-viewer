import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage, seedConfig } from '../../helpers';

const ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(ROOT, 'tests/e2e/runtime/case-15');
const FILE_A = resolve(WORKSPACE_ROOT, 'e2e-ws-delete-without-open-a.md');
const FILE_B = resolve(WORKSPACE_ROOT, 'e2e-ws-delete-without-open-b.md');

test('case-15: 工作区中未打开文件删除后立即显示删除态', async ({ page }) => {
  if (!existsSync(WORKSPACE_ROOT)) mkdirSync(WORKSPACE_ROOT, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);
  if (existsSync(FILE_B)) rmSync(FILE_B);
  writeFileSync(FILE_A, '# A\n\nA content\n', 'utf-8');
  writeFileSync(FILE_B, '# B\n\nB content\n', 'utf-8');

  try {
    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [{ id: 'ws-runtime', name: 'case-15', path: WORKSPACE_ROOT, isExpanded: true }],
    });

    const rowAInTree = page.locator('.tree-item.file-node', { hasText: 'e2e-ws-delete-without-open-a.md' }).first();
    const rowBInTree = page.locator('.tree-item.file-node', { hasText: 'e2e-ws-delete-without-open-b.md' }).first();
    await expect(rowAInTree).toBeVisible();
    await expect(rowBInTree).toBeVisible();

    // 只打开 B，A 保持未打开状态
    await rowBInTree.click();
    await expect(page.locator('#content')).toContainText('B content');

    // 删除未打开文件 A：应立即出现删除态（D + 红色划线）
    rmSync(FILE_A);

    const rowADeleted = page.locator('.tree-item.missing', { hasText: 'e2e-ws-delete-without-open-a.md' }).first();
    await expect.poll(async () => {
      const badge = rowADeleted.locator('.status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    await expect(rowADeleted).toBeVisible();

    // 点击删除项：显示删除提示（无缓存）
    await rowADeleted.click();
    await expect(page.locator('.content-file-status.deleted')).toBeVisible();
    await expect(page.locator('#content')).toContainText('无本地缓存内容');
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
    if (existsSync(FILE_B)) rmSync(FILE_B);
  }
});
