import { expect, test } from '@playwright/test';
import { resetAppStorage, seedConfig } from './helpers';
import { resolve } from 'path';
import { existsSync, rmSync, writeFileSync } from 'fs';

const ROOT = process.cwd();
const BLUE_DOT_FILE = resolve(ROOT, 'docs/design/blue-dot-refresh-test.md');
const WORKSPACE_NEW_DOT_FILE = resolve(ROOT, 'docs/design/e2e-workspace-new-dot.md');

test.describe('MD Viewer 核心 UI 回归', () => {
  test('case-1: 列表差异蓝点刷新后保持（行为+视觉）', async ({ page, request }) => {
    await resetAppStorage(page);

    const resp = await request.post('/api/open-file', {
      data: { path: BLUE_DOT_FILE, focus: false },
    });
    expect(resp.ok()).toBeTruthy();

    const item = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
    await expect(item).toBeVisible();
    await expect(item.locator('.new-dot')).toBeVisible();

    await page.reload();

    const reloadedItem = page.locator('.file-item', { hasText: 'blue-dot-refresh-test.md' });
    await expect(reloadedItem).toBeVisible();
    await expect(reloadedItem.locator('.new-dot')).toBeVisible();

    await expect(page.locator('.sidebar')).toHaveScreenshot('case-1-blue-dot-refresh.png');
  });

  test('case-2: 工作区展开状态刷新后保持，并加载目录树', async ({ page }) => {
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-mdv', name: 'md-viewer', path: ROOT, isExpanded: true },
      ],
    });

    const wsHeader = page.locator('.workspace-header', { hasText: 'md-viewer' });
    await expect(wsHeader).toBeVisible();
    await expect(wsHeader.locator('.workspace-toggle')).toHaveText('▼');
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    const docsNode = page.locator('.tree-item .tree-name', { hasText: 'docs' }).first();
    await expect(docsNode).toBeVisible();

    await page.reload();

    await expect(page.locator('.workspace-header', { hasText: 'md-viewer' })).toBeVisible();
    await expect(page.locator('.workspace-header .workspace-toggle').first()).toHaveText('▼');
    await expect(page.locator('.tree-loading')).toHaveCount(0);
    await expect(page.locator('.tree-item .tree-name', { hasText: 'docs' }).first()).toBeVisible();
  });

  test('case-3: 状态标记在右侧（简单模式 + 工作区模式）', async ({ page, request }) => {
    await resetAppStorage(page);

    // simple mode
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

    // switch to workspace mode
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-mdv', name: 'md-viewer', path: ROOT, isExpanded: true },
      ],
    });
    await page.reload();

    const wsItem = page.locator('.tree-item', { hasText: 'blue-dot-refresh-test.md' }).first();
    await expect(wsItem).toBeVisible();
    await expect(wsItem.locator('.new-dot')).toBeVisible();

    const wsName = wsItem.locator('.tree-name');
    const wsStatus = wsItem.locator('.file-item-status');
    const wsNameBox = await wsName.boundingBox();
    const wsStatusBox = await wsStatus.boundingBox();
    expect(wsNameBox).not.toBeNull();
    expect(wsStatusBox).not.toBeNull();
    expect((wsStatusBox as any).x).toBeGreaterThan((wsNameBox as any).x);
  });

  test('case-4: 工作区排序使用↑/↓，并持久化', async ({ page }) => {
    await seedConfig(page, {
      sidebarMode: 'workspace',
      workspaces: [
        { id: 'ws-a', name: 'alpha', path: ROOT, isExpanded: false },
        { id: 'ws-b', name: 'beta', path: resolve(ROOT, 'docs'), isExpanded: false },
        { id: 'ws-c', name: 'gamma', path: resolve(ROOT, 'src'), isExpanded: false },
      ],
    });

    const items = page.locator('.workspace-item');
    await expect(items).toHaveCount(3);

    // 首项只有下移，不显示上移
    await items.nth(0).locator('.workspace-header').hover();
    await expect(items.nth(0).locator('button[title="上移"]')).toHaveCount(0);
    await expect(items.nth(0).locator('button[title="下移"]')).toHaveCount(1);

    // 末项只有上移，不显示下移
    await items.nth(2).locator('.workspace-header').hover();
    await expect(items.nth(2).locator('button[title="上移"]')).toHaveCount(1);
    await expect(items.nth(2).locator('button[title="下移"]')).toHaveCount(0);

    // 点击首项“下移”后，alpha 应变成第二项
    await items.nth(0).locator('.workspace-header').hover();
    await items.nth(0).locator('button[title="下移"]').click();

    const namesAfter = await page.locator('.workspace-name').allTextContents();
    expect(namesAfter.map((s) => s.trim())).toEqual(['beta', 'alpha', 'gamma']);

    await page.reload();

    const namesReloaded = await page.locator('.workspace-name').allTextContents();
    expect(namesReloaded.map((s) => s.trim())).toEqual(['beta', 'alpha', 'gamma']);
  });

  test('case-5: 工作区新扫描文件（未打开）显示蓝点', async ({ page }) => {
    if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
      rmSync(WORKSPACE_NEW_DOT_FILE);
    }

    try {
      await resetAppStorage(page);
      await seedConfig(page, {
        sidebarMode: 'workspace',
        workspaces: [
          { id: 'ws-docs', name: 'docs', path: resolve(ROOT, 'docs'), isExpanded: true },
        ],
      });

      await expect(page.locator('.workspace-header', { hasText: 'docs' })).toBeVisible();
      await expect(page.locator('.tree-loading')).toHaveCount(0);

      writeFileSync(WORKSPACE_NEW_DOT_FILE, '# e2e workspace new dot\n');
      await page.reload();

      const wsNewItem = page.locator('.tree-item', { hasText: 'e2e-workspace-new-dot.md' }).first();
      await expect(wsNewItem).toBeVisible();
      await expect(wsNewItem.locator('.new-dot')).toBeVisible();
    } finally {
      if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
        rmSync(WORKSPACE_NEW_DOT_FILE);
      }
    }
  });
});
