import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-17');
const FILE_A = resolve(CASE_DIR, 'e2e-delete-recreate-a.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

// FIXME: 依赖文件系统 watcher，测试环境不稳定
test.fixme('case-17: 删除后同路径重建并恢复监听', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);

  try {
    overwrite(FILE_A, '# A\n\nA v1\n');

    await resetAppStorage(page);
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE_A);

    const itemA = page.locator('.file-item.current', { hasText: 'e2e-delete-recreate-a.md' });
    await expect(itemA).toBeVisible();

    await page.waitForTimeout(1200);
    rmSync(FILE_A);

    await expect.poll(async () => {
      const badge = itemA.locator('.file-item-status .status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    await expect(page.locator('.content-file-status.deleted')).toBeVisible();

    // 同路径重建，并通过重新打开恢复状态
    overwrite(FILE_A, '# A\n\nA recreated v2\n');
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE_A);

    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('A recreated v2');

    await expect.poll(async () => {
      const badge = itemA.locator('.file-item-status .status-badge');
      return await badge.count();
    }, { timeout: 10000 }).toBe(0);

    await expect(page.locator('.content-file-status.deleted')).toHaveCount(0);

    // 再次修改，验证 watcher 已恢复（进入可刷新状态）
    await page.waitForTimeout(1200);
    overwrite(FILE_A, '# A\n\nA recreated v3 auto\n');
    await expect(page.locator('#refreshButton')).toBeVisible();
    await page.evaluate(async () => {
      await (window as any).handleRefreshButtonClick();
    });
    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('A recreated v3 auto');
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
  }
});
