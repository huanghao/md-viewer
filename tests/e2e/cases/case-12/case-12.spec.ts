import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage, seedConfig } from '../../helpers';

const ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(ROOT, 'tests/e2e/runtime/case-12');
const FILE = resolve(WORKSPACE_ROOT, 'e2e-workspace-delete-style.md');

function toHex(rgb: string | null): string | null {
  if (!rgb) return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return rgb;
  const h = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

test('case-12: 工作区模式删除态样式', async ({ page }) => {
  if (!existsSync(WORKSPACE_ROOT)) mkdirSync(WORKSPACE_ROOT, { recursive: true });
  if (existsSync(FILE)) rmSync(FILE);
  writeFileSync(FILE, '# workspace delete style\n\nhello\n', 'utf-8');

  try {
    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-runtime', name: 'case-12', path: WORKSPACE_ROOT, isExpanded: true },
      ],
    });

    await expect(page.locator('.workspace-header', { hasText: 'case-12' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    const targetItem = page.locator('.tree-item.file-node', { hasText: 'e2e-workspace-delete-style.md' }).first();
    await expect(targetItem).toBeVisible();
    await targetItem.click();
    await page.waitForTimeout(1200); // 等待 watchFile + SSE 订阅稳定

    rmSync(FILE);

    const deletedItem = page.locator('.tree-item.file-node', { hasText: 'e2e-workspace-delete-style.md' }).first();

    await expect.poll(async () => {
      const badge = deletedItem.locator('.status-badge');
      return (await badge.count()) > 0 ? (await badge.first().innerText()).trim() : '';
    }, { timeout: 10000 }).toBe('D');

    const style = await deletedItem.locator('.tree-name').evaluate((el) => {
      const css = getComputedStyle(el as HTMLElement);
      return {
        color: css.color,
        line: css.textDecorationLine,
      };
    });

    expect(toHex(style.color)).toBe('#cf222e');
    expect(style.line).toContain('line-through');
  } finally {
    if (existsSync(FILE)) rmSync(FILE);
  }
});
