import { expect, test } from '@playwright/test';
import { resetAppStorage } from '../../helpers';

test('case-30: 设置面板打开并显示主题选项', async ({ page }) => {
  await resetAppStorage(page);

  // Open settings dialog
  await page.locator('button[onclick="showSettingsDialog()"]').click();

  const dialog = page.locator('#settingsDialogOverlay');
  await expect(dialog).toBeVisible();

  // Appearance section should be present
  await expect(dialog.locator('.settings-group-title', { hasText: '外观' })).toBeVisible();

  // Both dropdowns should exist
  await expect(dialog.locator('#markdownThemeSelect')).toBeVisible();
  await expect(dialog.locator('#codeThemeSelect')).toBeVisible();

  // Markdown theme options
  const mdSelect = dialog.locator('#markdownThemeSelect');
  await expect(mdSelect.locator('option[value="github"]')).toHaveCount(1);
  await expect(mdSelect.locator('option[value="notion"]')).toHaveCount(1);
  await expect(mdSelect.locator('option[value="bear"]')).toHaveCount(1);

  // Code theme options
  const hlSelect = dialog.locator('#codeThemeSelect');
  await expect(hlSelect.locator('option[value="github"]')).toHaveCount(1);
  await expect(hlSelect.locator('option[value="github-dark"]')).toHaveCount(1);
  await expect(hlSelect.locator('option[value="atom-one-dark"]')).toHaveCount(1);
});

test('case-30b: 切换主题立即生效（live preview）', async ({ page }) => {
  await resetAppStorage(page);

  // Open a file first so we have content to check
  await page.evaluate(async () => {
    await (window as any).addFileByPath(
      '/Users/huanghao/workspace/md-viewer/README.md', true
    );
  });
  await expect(page.locator('#content')).toBeVisible();

  // Open settings
  await page.locator('button[onclick="showSettingsDialog()"]').click();
  const dialog = page.locator('#settingsDialogOverlay');
  await expect(dialog).toBeVisible();

  // Switch to Bear theme
  await dialog.locator('#markdownThemeSelect').selectOption('bear');

  // The theme style tag should now contain Georgia (Bear uses serif)
  const themeStyleContent = await page.evaluate(() => {
    const el = document.getElementById('theme-md-css');
    return el?.textContent || '';
  });
  expect(themeStyleContent).toContain('Georgia');

  // Cancel — should restore original theme
  await dialog.locator('button', { hasText: '取消' }).click();
  await expect(dialog).not.toBeVisible();

  // After cancel, theme should be back to default (github — no Georgia)
  const restoredStyle = await page.evaluate(() => {
    const el = document.getElementById('theme-md-css');
    return el?.textContent || '';
  });
  expect(restoredStyle).not.toContain('Georgia');
});

test('case-30c: 保存主题后跨 reload 持久化', async ({ page }) => {
  await resetAppStorage(page);

  // Open settings and switch to Notion theme
  await page.locator('button[onclick="showSettingsDialog()"]').click();
  const dialog = page.locator('#settingsDialogOverlay');
  await expect(dialog).toBeVisible();

  await dialog.locator('#markdownThemeSelect').selectOption('notion');
  await dialog.locator('#codeThemeSelect').selectOption('github-dark');

  // Save
  await dialog.locator('button', { hasText: '保存' }).click();
  await expect(dialog).not.toBeVisible();

  // Reload page
  await page.reload();

  // Theme should still be Notion (ui-sans-serif override)
  const themeStyle = await page.evaluate(() => {
    const el = document.getElementById('theme-md-css');
    return el?.textContent || '';
  });
  expect(themeStyle).toContain('ui-sans-serif');

  // Code theme should be github-dark
  const hlStyle = await page.evaluate(() => {
    const el = document.getElementById('theme-hl-css');
    return el?.textContent || '';
  });
  expect(hlStyle).toContain('#0d1117'); // github-dark background

  // Config in localStorage should reflect saved choices
  const config = await page.evaluate(() => {
    const raw = localStorage.getItem('md-viewer:config');
    return raw ? JSON.parse(raw) : {};
  });
  expect(config.markdownTheme).toBe('notion');
  expect(config.codeTheme).toBe('github-dark');
});
