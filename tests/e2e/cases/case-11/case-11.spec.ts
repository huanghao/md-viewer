import { expect, test } from '@playwright/test';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const FILE = resolve(ROOT, 'docs/design/e2e-delete-visibility-check.md');

function toHex(rgb: string | null): string | null {
  if (!rgb) return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return rgb;
  const h = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

test('case-11: 当前文件删除后显示持续提示与删除态样式', async ({ page }) => {
  if (existsSync(FILE)) rmSync(FILE);
  writeFileSync(FILE, '# 删除提示可见性测试\n\n用于验证删除态。\n', 'utf-8');

  try {
    await resetAppStorage(page);

    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE);

    const currentItem = page.locator('.file-item.current', { hasText: 'e2e-delete-visibility-check.md' });
    const currentTab = page.locator('.tab.active', { hasText: 'e2e-delete-visibility-check.md' });
    await expect(currentItem).toBeVisible();
    await expect(currentTab).toBeVisible();

    rmSync(FILE);

    await expect.poll(async () => {
      const badge = currentItem.locator('.status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    await expect(page.locator('.content-file-status.deleted')).toBeVisible();

    const sidebarStyle = await currentItem.locator('.name').evaluate((el) => {
      const css = getComputedStyle(el as HTMLElement);
      return { color: css.color, line: css.textDecorationLine };
    });
    expect(toHex(sidebarStyle.color)).toBe('#cf222e');
    expect(sidebarStyle.line).toContain('line-through');

    const tabStyle = await currentTab.locator('.tab-name').evaluate((el) => {
      const css = getComputedStyle(el as HTMLElement);
      return { color: css.color, line: css.textDecorationLine };
    });
    expect(toHex(tabStyle.color)).toBe('#ff3b30');
    expect(tabStyle.line).toContain('line-through');
  } finally {
    if (existsSync(FILE)) rmSync(FILE);
  }
});
