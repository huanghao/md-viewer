import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-24');
const FILE_A = resolve(CASE_DIR, 'tab-manager-a.md');
const FILE_B = resolve(CASE_DIR, 'tab-manager-b.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

test('case-24: Tabs 管理面板支持搜索与切换', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);
  if (existsSync(FILE_B)) rmSync(FILE_B);

  try {
    overwrite(FILE_A, '# A\n\nfrom a\n');
    overwrite(FILE_B, '# B\n\nfrom b\n');

    await resetAppStorage(page);

    await page.evaluate(async ({ a, b }) => {
      await (window as any).addFileByPath(a, false);
      await (window as any).addFileByPath(b, true);
    }, { a: FILE_A, b: FILE_B });

    await page.locator('.tab-manager-toggle').click();
    await expect(page.locator('.tab-manager-panel.show')).toHaveCount(1);

    await page.fill('.tab-manager-search', 'tab-manager-a');
    await expect(page.locator('.tab-manager-item')).toHaveCount(1);
    await expect(page.locator('.tab-manager-item .tab-manager-name')).toContainText('tab-manager-a.md');

    await page.locator('.tab-manager-item').first().click();
    await expect(page.locator('.file-item.current .name')).toContainText('tab-manager-a.md');
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
    if (existsSync(FILE_B)) rmSync(FILE_B);
  }
});
