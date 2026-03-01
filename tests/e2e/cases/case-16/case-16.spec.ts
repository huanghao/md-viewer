import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-16');
const FILE_A = resolve(CASE_DIR, 'e2e-rapid-write-a.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

test('case-16: 当前文件连续快速修改后最终收敛', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);

  try {
    overwrite(FILE_A, '# A\n\nA v1\n');

    await resetAppStorage(page);
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE_A);

    const itemA = page.locator('.file-item.current', { hasText: 'e2e-rapid-write-a.md' });
    await expect(itemA).toBeVisible();

    // 先校验监听链路就绪（收到一次变更并进入可刷新状态）
    await page.waitForTimeout(1200);
    overwrite(FILE_A, '# A\n\nA warmup\n');
    await expect.poll(async () => {
      return await page.locator('#refreshButton').isVisible();
    }, { timeout: 10000 }).toBe(true);

    // 再短间隔连续写入多个版本，验证最终收敛
    overwrite(FILE_A, '# A\n\nA v2\n');
    await wait(80);
    overwrite(FILE_A, '# A\n\nA v3\n');
    await wait(80);
    overwrite(FILE_A, '# A\n\nA v4\n');
    await wait(80);
    overwrite(FILE_A, '# A\n\nA v5 FINAL\n');

    await expect(page.locator('#refreshButton')).toBeVisible();
    await page.locator('#refreshButton').click();

    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('A v5 FINAL');

    // 当前文件自动同步成功后不应长期残留 M
    await expect.poll(async () => {
      const badge = itemA.locator('.file-item-status .status-badge');
      return await badge.count();
    }, { timeout: 10000 }).toBe(0);
  } finally {
    if (existsSync(FILE_A)) rmSync(FILE_A);
  }
});
