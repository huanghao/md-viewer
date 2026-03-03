import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-25');
const FILE_A = resolve(CASE_DIR, 'tab-batch-a.md');
const FILE_B = resolve(CASE_DIR, 'tab-batch-b.md');
const FILE_C = resolve(CASE_DIR, 'tab-batch-c.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

test('case-25: 批量关闭遵循 M 文件保护规则', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  [FILE_A, FILE_B, FILE_C].forEach((f) => { if (existsSync(f)) rmSync(f); });

  try {
    overwrite(FILE_A, '# A\n\nA v1\n');
    overwrite(FILE_B, '# B\n\nB v1\n');
    overwrite(FILE_C, '# C\n\nC v1\n');

    await resetAppStorage(page);
    await page.evaluate(async ({ a, b, c }) => {
      await (window as any).addFileByPath(a, false);
      await (window as any).addFileByPath(b, false);
      await (window as any).addFileByPath(c, true);
    }, { a: FILE_A, b: FILE_B, c: FILE_C });

    await page.waitForTimeout(1200);
    overwrite(FILE_B, '# B\n\nB v2 dirty\n');

    const itemB = page.locator('.file-item', { hasText: 'tab-batch-b.md' });
    await expect.poll(async () => {
      const badge = itemB.locator('.file-item-status .status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('M');

    await page.locator('.tab-manager-toggle').click();
    await page.locator('.tab-manager-action[data-action="close-unmodified"]').click();

    await expect(page.locator('.file-item', { hasText: 'tab-batch-a.md' })).toHaveCount(0);
    await expect(page.locator('.file-item', { hasText: 'tab-batch-b.md' })).toHaveCount(1);
    await expect(page.locator('.file-item.current', { hasText: 'tab-batch-c.md' })).toHaveCount(1);

    await page.locator('.tab-manager-action[data-action="close-others"]').click();

    await expect(page.locator('.file-item')).toHaveCount(1);
    await expect(page.locator('.file-item.current', { hasText: 'tab-batch-c.md' })).toHaveCount(1);
  } finally {
    [FILE_A, FILE_B, FILE_C].forEach((f) => { if (existsSync(f)) rmSync(f); });
  }
});
