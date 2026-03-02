# E2E + 视觉回归推广方案（团队版）

## 本次已落地能力

- 测试框架：Playwright
- 配置文件：`playwright.config.ts`
- 测试文件：`tests/e2e/core-ui-regression.spec.ts`
- 基线快照目录：`tests/e2e/core-ui-regression.spec.ts-snapshots/`

已跑通用例（4个）：
1. 未读蓝点刷新后保持（行为 + 视觉快照）
2. 工作区展开状态刷新后保持，并加载目录树
3. 状态标记在右侧（简单模式 + 工作区模式）
4. 工作区排序使用 `↑/↓` 并持久化

## 基线图策略

### 什么时候生成基线
- 新增视觉用例首次通过时，使用：

```bash
bun run test:e2e:update -- tests/e2e/core-ui-regression.spec.ts -g "case-1"
```

### 什么时候更新基线
- 只有“产品明确接受 UI 变化”时才更新。
- Bug 修复导致 UI 恢复预期时，不应更新基线，而应修代码让测试通过。

### PR 要求
- 若更新了 snapshot，PR 描述必须说明：
  - 为什么 UI 变化是预期行为
  - 影响范围（哪些页面/组件）
  - 对应设计文档链接

## 开发工作流建议

1. 本地快速回归（改完即跑）

```bash
bun run test:e2e -- tests/e2e/core-ui-regression.spec.ts
```

2. 指定 case 调试

```bash
bun run test:e2e -- tests/e2e/core-ui-regression.spec.ts -g "case-3"
```

3. 需要看浏览器过程

```bash
bun run test:e2e:headed -- tests/e2e/core-ui-regression.spec.ts -g "case-2"
```

## CI 推广建议（分阶段）

### 阶段 1（立即）
- PR 阶段运行：4 个核心 case（当前文件）
- 目标：防止近期 UI 回归（蓝点/状态位置/工作区状态/排序）

### 阶段 2（1-2 周）
- 增加关键路径：
  - 添加文件智能确认流程
  - 删除文件 D 状态与恢复
  - 侧边栏宽度拖拽持久化

### 阶段 3（稳定后）
- 引入多分辨率视觉回归（desktop + laptop）
- 引入失败自动产物归档（trace/video/screenshot）

## 风险与约束

1. 视觉快照对环境敏感：
- 需要固定 viewport、字体缩放、主题。

2. 动态内容影响截图：
- 避免把相对时间文本作为快照主断言区域。

3. 回归误报成本：
- 快照用例数量不宜一次性过多，优先“核心高风险 UI”。

## 下一步建议

1. 把本文件列为团队测试规范入口（链接到 README 或 BUILD）。
2. 在 CI 加入 `bun run test:e2e -- tests/e2e/core-ui-regression.spec.ts`。
3. 每次 UI 变更先补/改对应 case，再改实现。
