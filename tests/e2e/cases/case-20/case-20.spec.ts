import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-20');
const FILE = resolve(CASE_DIR, 'e2e-flowchart-fence.md');

test('case-20: flowchart fenced code block 渲染为 Mermaid 图', async ({ page }) => {
  if (!existsSync(CASE_DIR)) mkdirSync(CASE_DIR, { recursive: true });
  if (existsSync(FILE)) rmSync(FILE);

  try {
    writeFileSync(
      FILE,
      [
        '# flowchart fence test',
        '',
        '```flowchart',
        'A[Start] --> B{Ready?}',
        'B -->|Yes| C[Done]',
        'B -->|No| D[Retry]',
        '```',
        '',
      ].join('\n'),
      'utf-8'
    );

    await resetAppStorage(page);
    await page.evaluate(async (path) => {
      await (window as any).addFileByPath(path, true);
    }, FILE);

    // 等待文件项渲染（扩展名被剥离）
    await page.waitForSelector('.file-item', { timeout: 10000 });
    await expect(page.locator('.file-item.current', { hasText: 'e2e-flowchart-fence' })).toBeVisible();

    // 等待 Mermaid 渲染（CDN 加载需要时间）
    await page.waitForSelector('.mermaid-block .mermaid svg', { timeout: 15000 });
    await expect(page.locator('.mermaid-block .mermaid svg')).toBeVisible();

    // 确保没有降级通知
    await expect(page.locator('.mermaid-fallback-notice')).toHaveCount(0);
  } finally {
    if (existsSync(FILE)) rmSync(FILE);
  }
});
