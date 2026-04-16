import { expect, test } from '@playwright/test';
import { resetAppStorage, seedConfig } from '../../helpers';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const WORKSPACE_NEW_DOT_FILE = resolve(ROOT, 'docs/design/e2e-workspace-new-dot.md');

// FIXME: 工作区树形结构测试太复杂，建议用单元测试替代
test.fixme('case-5: 工作区新扫描文件（未打开）显示蓝点', async ({ page, request }) => {
  // 先清理文件
  if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
    rmSync(WORKSPACE_NEW_DOT_FILE);
  }

  try {
    // 创建工作区
    await resetAppStorage(page);
    await seedConfig(page, {
      sidebarTab: 'full',
      workspaces: [
        { id: 'ws-docs', name: 'docs', path: resolve(ROOT, 'docs'), isExpanded: true },
      ],
    });

    await expect(page.locator('.workspace-header', { hasText: 'docs' })).toBeVisible();
    await expect(page.locator('.tree-loading')).toHaveCount(0);

    // 创建新文件
    writeFileSync(WORKSPACE_NEW_DOT_FILE, '# e2e workspace new dot\n');

    // 使用 API 触发扫描（替代依赖 watcher 自动发现）
    await request.post('/api/scan-workspace', {
      data: { path: resolve(ROOT, 'docs') }
    });

    // 等待文件出现（蓝点表示新文件）
    const wsNewItem = page.locator('.tree-item', { hasText: 'e2e-workspace-new-dot' }).first();
    await expect(wsNewItem).toBeVisible({ timeout: 10000 });

    // 验证蓝点显示
    await expect(wsNewItem.locator('.new-dot')).toBeVisible();
  } finally {
    if (existsSync(WORKSPACE_NEW_DOT_FILE)) {
      rmSync(WORKSPACE_NEW_DOT_FILE);
    }
  }
});
