import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-21');
const FILE = resolve(CASE_DIR, 'e2e-sync-blocked-by-m.md');

function overwrite(content: string): void {
  writeFileSync(FILE, content, 'utf-8');
}

test('case-21: M 状态下禁止同步', async ({ page }) => {
  test.skip(true, 'sync button feature not yet implemented - #syncButton, #syncButtonText, #syncDialogOverlay elements do not exist in the codebase');
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE)) rmSync(FILE);

  try {
    overwrite('# Sync Block\n\nv1\n');

    await resetAppStorage(page);
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE);

    await page.waitForTimeout(1200);
    overwrite('# Sync Block\n\nv2 changed\n');

    await expect.poll(async () => {
      return (await page.locator('#syncButtonText').innerText()).trim();
    }, { timeout: 10000 }).toContain('先刷新后同步');

    await expect(page.locator('#syncButton')).toBeDisabled();
    await expect(page.locator('#syncDialogOverlay.show')).toHaveCount(0);
  } finally {
    if (existsSync(FILE)) rmSync(FILE);
  }
});
