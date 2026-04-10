import { expect, test } from '@playwright/test';
import { seedConfig } from '../../helpers';
import { existsSync, mkdirSync, rmSync, writeFileSync, utimesSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-28');
const RECENT_FILE = resolve(CASE_DIR, 'focus-recent.md');
const OLD_FILE = resolve(CASE_DIR, 'focus-old.md');

function setMtime(path: string, msAgo: number): void {
  const t = new Date(Date.now() - msAgo);
  utimesSync(path, t, t);
}

test('case-28: 焦点视图只显示时间窗口内的文件', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  [RECENT_FILE, OLD_FILE].forEach(f => { if (existsSync(f)) rmSync(f); });

  try {
    writeFileSync(RECENT_FILE, '# Recent\n');
    writeFileSync(OLD_FILE, '# Old\n');

    // Set RECENT_FILE mtime to 1 hour ago (within 8h window)
    setMtime(RECENT_FILE, 1 * 3600 * 1000);
    // Set OLD_FILE mtime to 10 hours ago (outside 8h window)
    setMtime(OLD_FILE, 10 * 3600 * 1000);

    await seedConfig(page, {
      sidebarTab: 'focus',
      focusWindowKey: '8h',
      workspaces: [
        { id: 'ws-case28', name: 'case-28', path: CASE_DIR, isExpanded: true },
      ],
    });

    // Wait for focus view to load
    const wsHeader = page.locator('.focus-ws-header', { hasText: 'case-28' });
    await expect(wsHeader).toBeVisible();

    // Recent file should be visible
    await expect(
      page.locator('.focus-file-item', { hasText: 'focus-recent' })
    ).toBeVisible();

    // Old file should NOT be visible (outside time window)
    await expect(
      page.locator('.focus-file-item', { hasText: 'focus-old' })
    ).toHaveCount(0);
  } finally {
    [RECENT_FILE, OLD_FILE].forEach(f => { if (existsSync(f)) rmSync(f); });
  }
});

test('case-28b: 切换时间窗口 pill 改变显示的文件', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  [RECENT_FILE, OLD_FILE].forEach(f => { if (existsSync(f)) rmSync(f); });

  try {
    writeFileSync(RECENT_FILE, '# Recent\n');
    writeFileSync(OLD_FILE, '# Old\n');

    // RECENT: 1h ago, OLD: 3 days ago
    setMtime(RECENT_FILE, 1 * 3600 * 1000);
    setMtime(OLD_FILE, 3 * 86400 * 1000);

    await seedConfig(page, {
      sidebarTab: 'focus',
      focusWindowKey: '8h',
      workspaces: [
        { id: 'ws-case28b', name: 'case-28', path: CASE_DIR, isExpanded: true },
      ],
    });

    const wsHeader = page.locator('.focus-ws-header', { hasText: 'case-28' });
    await expect(wsHeader).toBeVisible();

    // With 8h window: only recent visible
    await expect(page.locator('.focus-file-item', { hasText: 'focus-recent' })).toBeVisible();
    await expect(page.locator('.focus-file-item', { hasText: 'focus-old' })).toHaveCount(0);

    // Switch to 1w window
    await page.locator('.focus-time-pill', { hasText: '1w' }).click();

    // Now both files should be visible
    await expect(page.locator('.focus-file-item', { hasText: 'focus-recent' })).toBeVisible();
    await expect(page.locator('.focus-file-item', { hasText: 'focus-old' })).toBeVisible();
  } finally {
    [RECENT_FILE, OLD_FILE].forEach(f => { if (existsSync(f)) rmSync(f); });
  }
});

test('case-28c: 焦点视图点击文件可以打开', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(RECENT_FILE)) rmSync(RECENT_FILE);

  try {
    writeFileSync(RECENT_FILE, '# Focus Open Test\n\nContent here.\n');
    setMtime(RECENT_FILE, 30 * 60 * 1000); // 30 min ago

    await seedConfig(page, {
      sidebarTab: 'focus',
      focusWindowKey: '8h',
      workspaces: [
        { id: 'ws-case28c', name: 'case-28', path: CASE_DIR, isExpanded: true },
      ],
    });

    const wsHeader = page.locator('.focus-ws-header', { hasText: 'case-28' });
    await expect(wsHeader).toBeVisible();

    const fileItem = page.locator('.focus-file-item', { hasText: 'focus-recent' });
    await expect(fileItem).toBeVisible();
    await fileItem.click();

    // Content should be rendered
    await expect(page.locator('#content')).toContainText('Focus Open Test');
  } finally {
    if (existsSync(RECENT_FILE)) rmSync(RECENT_FILE);
  }
});
