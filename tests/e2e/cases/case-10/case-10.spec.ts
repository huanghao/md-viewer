import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const FILE_A = resolve(ROOT, 'docs/design/e2e-file-changed-a.md');
const FILE_B = resolve(ROOT, 'docs/design/e2e-file-changed-b.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

test('case-10: file-changed 交互正确（当前/非当前都不自动刷新）', async ({ page }) => {
  if (existsSync(FILE_A)) rmSync(FILE_A);
  if (existsSync(FILE_B)) rmSync(FILE_B);

  try {
    overwrite(FILE_A, '# A\n\nA v1\n');
    overwrite(FILE_B, '# B\n\nB v1\n');

    await resetAppStorage(page);

    await page.evaluate(async ({ a, b }) => {
      await (window as any).addFileByPath(a, false);
      await (window as any).addFileByPath(b, true);
    }, { a: FILE_A, b: FILE_B });

    const itemA = page.locator('.file-item', { hasText: 'e2e-file-changed-a.md' });
    const itemB = page.locator('.file-item', { hasText: 'e2e-file-changed-b.md' });
    await expect(itemA).toBeVisible();
    await expect(itemB).toBeVisible();

    // 等 watcher 与 mtime 稳定后再改写，避免同毫秒时间戳导致 dirty 不触发
    await page.waitForTimeout(1200);

    // 当前文件 B 修改后：正文不自动刷新，先保持旧内容并显示 M
    overwrite(FILE_B, '# B\n\nB v2 waiting-for-refresh\n');
    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('B v1');
    await expect.poll(async () => {
      const badge = itemB.locator('.file-item-status .status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('M');

    // 手动刷新后，当前正文更新，M 清除
    await page.evaluate(() => (window as any).handleRefreshButtonClick());
    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('B v2 waiting-for-refresh');
    await expect.poll(async () => {
      const badge = itemB.locator('.file-item-status .status-badge');
      return await badge.count();
    }, { timeout: 10000 }).toBe(0);

    await page.waitForTimeout(1200);

    // 非当前文件 A 修改后应显示 M
    overwrite(FILE_A, '# A\n\nA v2 waiting-for-open\n');
    await expect.poll(async () => {
      const badge = itemA.locator('.file-item-status .status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('M');

    // 点击带 M 的 A：自动读取新内容并清除 M
    await itemA.click();
    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('A v2 waiting-for-open');

    await expect.poll(async () => {
      const badge = itemA.locator('.file-item-status .status-badge');
      return await badge.count();
    }, { timeout: 10000 }).toBe(0);
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
    if (existsSync(FILE_B)) rmSync(FILE_B);
  }
});
