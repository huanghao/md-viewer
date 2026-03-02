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

    await expect(page.locator('.file-item.current', { hasText: 'e2e-flowchart-fence.md' })).toBeVisible();
    await expect(page.locator('.mermaid-block .mermaid svg')).toBeVisible();
    await expect(page.locator('.mermaid-fallback-notice')).toHaveCount(0);
  } finally {
    if (existsSync(FILE)) rmSync(FILE);
  }
});
