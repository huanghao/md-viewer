import { expect, test } from '@playwright/test';
import { seedConfig } from '../../helpers';
import { existsSync, mkdirSync, rmSync, writeFileSync, utimesSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-29');
const FILE_A = resolve(CASE_DIR, 'pin-target.md');
const FILE_B = resolve(CASE_DIR, 'normal-file.md');

function setMtime(path: string, msAgo: number): void {
  const t = new Date(Date.now() - msAgo);
  utimesSync(path, t, t);
}

test('case-29: 全量视图 pin 文件后在焦点视图常驻（即使超出时间窗口）', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  [FILE_A, FILE_B].forEach(f => { if (existsSync(f)) rmSync(f); });

  try {
    writeFileSync(FILE_A, '# Pin Target\n');
    writeFileSync(FILE_B, '# Normal File\n');

    // Both files are old (outside 8h window)
    setMtime(FILE_A, 24 * 3600 * 1000);
    setMtime(FILE_B, 24 * 3600 * 1000);

    // Start in full view
    await seedConfig(page, {
      sidebarTab: 'full',
      focusWindowKey: '8h',
      workspaces: [
        { id: 'ws-case29', name: 'case-29', path: CASE_DIR, isExpanded: true },
      ],
    });

    // Wait for tree to load
    await expect(page.locator('.workspace-header', { hasText: 'case-29' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    // Pin FILE_A via the pin button in full view
    const fileAItem = page.locator('.tree-item.file-node', { hasText: 'pin-target' }).first();
    await expect(fileAItem).toBeVisible();
    await fileAItem.hover();
    const pinBtn = fileAItem.locator('.tree-pin-btn');
    await expect(pinBtn).toBeVisible();
    await pinBtn.click();

    // Switch to focus view
    await page.locator('.view-tab', { hasText: '焦点' }).click();

    const wsHeader = page.locator('.focus-ws-header', { hasText: 'case-29' });
    await expect(wsHeader).toBeVisible();

    // pin-target should appear in focus view (pinned, despite old mtime)
    await expect(
      page.locator('.focus-file-item', { hasText: 'pin-target' })
    ).toBeVisible();

    // normal-file should NOT appear (old and not pinned)
    await expect(
      page.locator('.focus-file-item', { hasText: 'normal-file' })
    ).toHaveCount(0);
  } finally {
    [FILE_A, FILE_B].forEach(f => { if (existsSync(f)) rmSync(f); });
  }
});

test('case-29b: 焦点视图 unpin 后文件消失（如果超出时间窗口）', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);

  try {
    writeFileSync(FILE_A, '# Pin Target\n');
    setMtime(FILE_A, 24 * 3600 * 1000); // old file

    // Pre-seed pinned state
    await page.goto('/');
    await page.evaluate(({ configKey, pinnedKey, wsId, wsPath, fileA }) => {
      localStorage.setItem(pinnedKey, JSON.stringify([fileA]));
      localStorage.setItem(configKey, JSON.stringify({
        sidebarTab: 'focus',
        focusWindowKey: '8h',
        workspaces: [{ id: wsId, name: 'case-29', path: wsPath, isExpanded: true }],
      }));
    }, {
      configKey: 'md-viewer:config',
      pinnedKey: 'md-viewer:pinned-files',
      wsId: 'ws-case29b',
      wsPath: CASE_DIR,
      fileA: FILE_A,
    });
    await page.reload();

    // File should be visible (pinned)
    const wsHeader = page.locator('.focus-ws-header', { hasText: 'case-29' });
    await expect(wsHeader).toBeVisible();
    const fileItem = page.locator('.focus-file-item', { hasText: 'pin-target' });
    await expect(fileItem).toBeVisible();

    // Unpin via the 📌 button
    const pinBtn = fileItem.locator('.tree-pin-btn.active');
    await expect(pinBtn).toBeVisible();
    await pinBtn.click();

    // File should disappear (old mtime, no longer pinned)
    await expect(
      page.locator('.focus-file-item', { hasText: 'pin-target' })
    ).toHaveCount(0);
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
  }
});
