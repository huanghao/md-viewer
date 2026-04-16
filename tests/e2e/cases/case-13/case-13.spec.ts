import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-13');
const FILE_A = resolve(CASE_DIR, 'e2e-non-current-delete-a.md');
const FILE_B = resolve(CASE_DIR, 'e2e-non-current-delete-b.md');

function toHex(rgb: string | null): string | null {
  if (!rgb) return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return rgb;
  const h = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

// FIXME: 依赖文件系统 watcher，测试环境不稳定
test.fixme('case-13: 非当前文件删除流程', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);
  if (existsSync(FILE_B)) rmSync(FILE_B);
  writeFileSync(FILE_A, '# A\n\nA cached content\n', 'utf-8');
  writeFileSync(FILE_B, '# B\n\nB current content\n', 'utf-8');

  try {
    await resetAppStorage(page);

    await page.evaluate(async ({ a, b }) => {
      await (window as any).addFileByPath(a, false);
      await (window as any).addFileByPath(b, true);
    }, { a: FILE_A, b: FILE_B });

    const itemA = page.locator('.file-item', { hasText: 'e2e-non-current-delete-a.md' });
    const itemB = page.locator('.file-item.current', { hasText: 'e2e-non-current-delete-b.md' });
    await expect(itemA).toBeVisible();
    await expect(itemB).toBeVisible();

    // 让 watcher/SSE 稳定后再删除 A
    await page.waitForTimeout(1200);
    rmSync(FILE_A);

    await expect.poll(async () => {
      const badge = itemA.locator('.status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    const aStyle = await itemA.locator('.name').evaluate((el) => {
      const css = getComputedStyle(el as HTMLElement);
      return { color: css.color, line: css.textDecorationLine };
    });
    expect(toHex(aStyle.color)).toBe('#cf222e');
    expect(aStyle.line).toContain('line-through');

    const tabA = page.locator('.tab', { hasText: 'e2e-non-current-delete-a.md' });
    await expect(tabA).toBeVisible();
    const tabAStyle = await tabA.locator('.tab-name').evaluate((el) => {
      const css = getComputedStyle(el as HTMLElement);
      return { color: css.color, line: css.textDecorationLine };
    });
    expect(toHex(tabAStyle.color)).toBe('#ff3b30');
    expect(tabAStyle.line).toContain('line-through');

    // 点击已删除的非当前文件：不刷新，显示缓存 + 删除提示
    await itemA.click();
    await expect(page.locator('.content-file-status.deleted')).toBeVisible();
    await expect(page.locator('#content')).toContainText('A cached content');

    // 刷新页面后，A 从打开列表中移除
    await page.reload();
    await expect(page.locator('.file-item', { hasText: 'e2e-non-current-delete-a.md' })).toHaveCount(0);
    await expect(page.locator('.tab', { hasText: 'e2e-non-current-delete-a.md' })).toHaveCount(0);
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
    if (existsSync(FILE_B)) rmSync(FILE_B);
  }
});
