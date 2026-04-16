import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-26');
const FILE_A = resolve(CASE_DIR, 'tab-order-a.md');
const FILE_B = resolve(CASE_DIR, 'tab-order-b.md');
const FILE_C = resolve(CASE_DIR, 'tab-order-c.md');
const FILE_D = resolve(CASE_DIR, 'tab-order-d.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

test('case-26: 关闭右侧与关闭全部行为正确', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  [FILE_A, FILE_B, FILE_C, FILE_D].forEach((f) => { if (existsSync(f)) rmSync(f); });

  try {
    overwrite(FILE_A, '# A\n\nA\n');
    overwrite(FILE_B, '# B\n\nB\n');
    overwrite(FILE_C, '# C\n\nC\n');
    overwrite(FILE_D, '# D\n\nD\n');

    await resetAppStorage(page);
    await page.evaluate(async ({ a, b, c, d }) => {
      await (window as any).addFileByPath(a, false);
      await (window as any).addFileByPath(b, false);
      await (window as any).addFileByPath(c, false);
      await (window as any).addFileByPath(d, true);
    }, { a: FILE_A, b: FILE_B, c: FILE_C, d: FILE_D });

    // 等待文件列表渲染（扩展名被剥离）
    await page.waitForSelector('.file-item', { timeout: 10000 });

    // 切到 B，使其右侧有 C/D
    await page.locator('.file-item', { hasText: 'tab-order-b' }).click();
    await page.waitForSelector('.file-item.current', { timeout: 10000 });
    await expect(page.locator('.file-item.current')).toContainText('tab-order-b');

    await page.locator('.tab-manager-toggle').click();
    await page.locator('.tab-manager-action[data-action="close-right"]').click();

    // 验证 C 和 D 被关闭，A 和 B 保留
    await expect(page.locator('.file-item', { hasText: 'tab-order-c' })).toHaveCount(0);
    await expect(page.locator('.file-item', { hasText: 'tab-order-d' })).toHaveCount(0);
    await expect(page.locator('.file-item', { hasText: 'tab-order-a' })).toHaveCount(1);
    await expect(page.locator('.file-item.current', { hasText: 'tab-order-b' })).toHaveCount(1);

    // 关闭全部：关掉所有文件（包括当前），列表变空
    await page.locator('.tab-manager-action[data-action="close-all"]').click();
    await expect(page.locator('.file-item')).toHaveCount(0);
  } finally {
    [FILE_A, FILE_B, FILE_C, FILE_D].forEach((f) => { if (existsSync(f)) rmSync(f); });
  }
});
