import { expect, test } from '@playwright/test';
import { resetAppStorage, seedConfig } from '../../helpers';
import { resolve } from 'path';
import { existsSync, rmSync, writeFileSync } from 'fs';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');
const WORKSPACE_DOT_FILE = resolve(ROOT, 'docs/design/e2e-workspace-dot-case-3.md');

// 简单模式测试：状态标记位置
test('case-3a: 简单模式状态标记在名称右侧', async ({ page, request }) => {
  await resetAppStorage(page);

  await request.post('/api/open-file', { data: { path: BLUE_DOT_FILE, focus: false } });
  await page.waitForSelector('.file-item', { timeout: 10000 });

  // 注意：扩展名被剥离
  const simpleItem = page.locator('.file-item', { hasText: 'blue-dot-refresh-test' });
  await expect(simpleItem).toBeVisible();

  const simpleName = simpleItem.locator('.tree-name');
  const simpleStatus = simpleItem.locator('.tree-status-inline');
  const simpleNameBox = await simpleName.boundingBox();
  const simpleStatusBox = await simpleStatus.boundingBox();
  expect(simpleNameBox).not.toBeNull();
  expect(simpleStatusBox).not.toBeNull();
  expect((simpleStatusBox as any).x).toBeGreaterThan((simpleNameBox as any).x);
});

// 工作区模式测试：状态标记位置（使用 API 触发扫描）
test('case-3b: 工作区模式状态标记在名称左侧', async ({ page, request }) => {
  if (existsSync(WORKSPACE_DOT_FILE)) rmSync(WORKSPACE_DOT_FILE);

  try {
    // 先创建文件，再启动工作区
    writeFileSync(WORKSPACE_DOT_FILE, '# case-3 workspace dot\n');

    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarTab: 'full',
      workspaces: [
        { id: 'ws-docs-case-3', name: 'docs', path: resolve(ROOT, 'docs'), isExpanded: true },
      ],
    });

    await expect(page.locator('.workspace-header', { hasText: 'docs' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    // 触发工作区扫描（替代等待 watcher 自动发现）
    await request.post('/api/scan-workspace', {
      data: { path: resolve(ROOT, 'docs') }
    });

    // 等待文件出现
    await page.waitForTimeout(500);

    // 注意：扩展名被剥离
    const wsItem = page.locator('.tree-item', { hasText: 'e2e-workspace-dot-case-3' }).first();
    await expect(wsItem).toBeVisible();

    // 验证状态标记在名称左侧（tree-status-inline 在 tree-name 之前）
    const wsName = wsItem.locator('.tree-name');
    const wsStatus = wsItem.locator('.tree-status-inline');
    const wsNameBox = await wsName.boundingBox();
    const wsStatusBox = await wsStatus.boundingBox();
    expect(wsNameBox).not.toBeNull();
    expect(wsStatusBox).not.toBeNull();
    expect((wsStatusBox as any).x).toBeLessThan((wsNameBox as any).x);
  } finally {
    if (existsSync(WORKSPACE_DOT_FILE)) rmSync(WORKSPACE_DOT_FILE);
  }
});
