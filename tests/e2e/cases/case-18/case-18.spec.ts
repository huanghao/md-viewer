import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-18');
const FILE_A = resolve(CASE_DIR, 'e2e-sse-reconnect-a.md');

function overwrite(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8');
}

test('case-18: SSE 断线重连后继续接收变更', async ({ page, context }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE_A)) rmSync(FILE_A);

  try {
    overwrite(FILE_A, '# A\n\nA v1\n');

    await resetAppStorage(page);
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE_A);

    const itemA = page.locator('.file-item.current', { hasText: 'e2e-sse-reconnect-a.md' });
    await expect(itemA).toBeVisible();

    // 确保初始 watch + SSE 已稳定
    await page.waitForTimeout(1200);

    // 模拟 SSE 断线并等待客户端自动重连
    await context.setOffline(true);
    await page.waitForTimeout(1200);
    await context.setOffline(false);
    await page.waitForTimeout(3600);

    overwrite(FILE_A, '# A\n\nA v2 after reconnect\n');
    await expect(page.locator('#refreshButton')).toBeVisible();
    await page.locator('#refreshButton').click();

    await expect.poll(async () => {
      return await page.locator('#content').innerText();
    }, { timeout: 10000 }).toContain('A v2 after reconnect');
  } finally {
    await context.setOffline(false);
    if (existsSync(FILE_A)) rmSync(FILE_A);
  }
});
