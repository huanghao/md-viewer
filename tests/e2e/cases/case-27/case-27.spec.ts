import { expect, test } from '@playwright/test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { resetAppStorage } from '../../helpers';

const ROOT = process.cwd();
const CASE_DIR = resolve(ROOT, 'tests/e2e/runtime/case-27');
const WORKSPACE_DIR = resolve(CASE_DIR, 'ws-known-search');
const TARGET_FILE = resolve(WORKSPACE_DIR, 'docs/deep/known-search-target-file.md');

function overwrite(path: string, content: string): void {
  const dir = resolve(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content, 'utf-8');
}

test('case-27: 搜索可命中未展开目录中的已知文件', async ({ page }) => {
  if (existsSync(CASE_DIR)) rmSync(CASE_DIR, { recursive: true, force: true });
  mkdirSync(CASE_DIR, { recursive: true });

  try {
    overwrite(TARGET_FILE, '# Known\n\nfrom known list\n');

    await resetAppStorage(page);

    const workspaceId = 'ws-case-27';
    await page.evaluate(({ workspaceId, workspacePath, targetFile }) => {
      localStorage.setItem('md-viewer:config', JSON.stringify({
        sidebarTab: 'full',
        workspaces: [{
          id: workspaceId,
          name: 'ws-known-search',
          path: workspacePath,
          isExpanded: false,
        }],
      }));
      localStorage.setItem('md-viewer:workspaceKnownFiles', JSON.stringify([
        [workspaceId, [targetFile]],
      ]));
    }, {
      workspaceId,
      workspacePath: WORKSPACE_DIR,
      targetFile: TARGET_FILE,
    });

    await page.reload();

    await page.fill('#searchInput', 'known-search-target-file');

    const hit = page.locator('.tree-item.file-node', { hasText: 'known-search-target-file' });
    await expect(hit).toHaveCount(1);

    await hit.click();
    await expect(page.locator('.tree-item.current .tree-name')).toContainText('known-search-target-file');
    await expect(page.locator('#content')).toContainText('from known list');
  } finally {
    if (existsSync(CASE_DIR)) rmSync(CASE_DIR, { recursive: true, force: true });
  }
});
