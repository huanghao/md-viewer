import { expect, test } from '@playwright/test';
import { resetAppStorage, seedConfig } from '../../helpers';
import { resolve } from 'path';
import { existsSync, rmSync, writeFileSync } from 'fs';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');
const WORKSPACE_DOT_FILE = resolve(ROOT, 'docs/design/e2e-workspace-dot-case-3.md');

test('case-3: 状态标记在右侧（简单模式 + 工作区模式）', async ({ page, request }) => {
  await resetAppStorage(page);

  await request.post('/api/open-file', { data: { path: BLUE_DOT_FILE, focus: false } });
  const simpleItem = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
  await expect(simpleItem).toBeVisible();
  await expect(simpleItem.locator('.new-dot')).toBeVisible();

  const simpleName = simpleItem.locator('.name');
  const simpleStatus = simpleItem.locator('.file-item-status');
  const simpleNameBox = await simpleName.boundingBox();
  const simpleStatusBox = await simpleStatus.boundingBox();
  expect(simpleNameBox).not.toBeNull();
  expect(simpleStatusBox).not.toBeNull();
  expect((simpleStatusBox as any).x).toBeGreaterThan((simpleNameBox as any).x);

  if (existsSync(WORKSPACE_DOT_FILE)) rmSync(WORKSPACE_DOT_FILE);
  try {
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-docs-case-3', name: 'docs', path: resolve(ROOT, 'docs'), isExpanded: true },
      ],
    });

    await expect(page.locator('.workspace-header', { hasText: 'docs' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    writeFileSync(WORKSPACE_DOT_FILE, '# case-3 workspace dot\\n');
    await page.reload();

    const wsItem = page.locator('.tree-item', { hasText: 'e2e-workspace-dot-case-3.md' }).first();
    await expect(wsItem).toBeVisible();
    await expect(wsItem.locator('.new-dot')).toBeVisible();

    const wsName = wsItem.locator('.tree-name');
    const wsStatus = wsItem.locator('.file-item-status');
    const wsNameBox = await wsName.boundingBox();
    const wsStatusBox = await wsStatus.boundingBox();
    expect(wsNameBox).not.toBeNull();
    expect(wsStatusBox).not.toBeNull();
    expect((wsStatusBox as any).x).toBeGreaterThan((wsNameBox as any).x);
  } finally {
    if (existsSync(WORKSPACE_DOT_FILE)) rmSync(WORKSPACE_DOT_FILE);
  }
});
