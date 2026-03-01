# 测试规范

日期：2026-03-01

本文档定义本项目 E2E/视觉回归测试的统一流程：怎么设计 case、怎么运行、怎么判定通过。

## 1. 如何生成测试 Case

每个 Case 必须包含以下 5 个元素：
1. 目标：要防止的回归是什么。
2. 前置条件：模式、配置、数据状态。
3. 操作步骤：稳定、可重复、最小步骤。
4. 预期结果：可验证、可断言（行为或视觉）。
5. 失败信号：出现什么现象算失败。

建议原则：
- 一个 Case 只覆盖一个核心风险点。
- 优先覆盖“用户感知强”的行为（状态标记、刷新恢复、排序持久化）。
- 视觉断言只用于真正需要像素级稳定的区域，避免过度依赖截图。

## 2. 用例文档与代码映射

- 场景说明目录：`tests/e2e/cases/`
- 约定：每个 case 使用独立目录并自包含说明文件
  - `tests/e2e/cases/case-1/README.md`
  - `tests/e2e/cases/case-2/README.md`
  - ...
- E2E 代码：`tests/e2e/cases/case-*/case-*.spec.ts`
- 快照基线：按 case 就近存放（示例：`tests/e2e/cases/case-1/case-1.spec.ts-snapshots/`）

当前约束（重要）：
- 每个 `case-*` 目录包含本 case 的 `README + spec + (可选)snapshots`。
- 不再使用聚合 spec 文件承载多个 case。

目录结构（当前）：

```text
tests/e2e/
  helpers.ts
  cases/
    case-1/
      README.md
      case-1.spec.ts
      case-1.spec.ts-snapshots/
    case-2/
      README.md
      case-2.spec.ts
```

要求：
- 新增/修改 Case 时，先更新对应 `tests/e2e/cases/case-*/README.md`，再改测试代码。
- 测试代码里的 case 名称应与文档标题保持一致。

## 3. 如何运行测试

常用命令：

```bash
# 运行全部 E2E
bun run test:e2e

# 只跑核心回归文件
bun run test:e2e -- tests/e2e/cases

# 按 case 名过滤
bun run test:e2e -- tests/e2e/cases/case-1/case-1.spec.ts

# 更新视觉快照（基线）
bunx playwright test tests/e2e/cases/case-1/case-1.spec.ts --update-snapshots
```

## 4. 如何判定测试通过

通过标准：
1. 命令退出码为 0。
2. 所有断言通过（无 failed case）。
3. 视觉用例无 diff（或已明确执行快照更新并完成 review）。

失败处理：
1. 先判定是“行为回归”还是“快照漂移”。
2. 若是行为回归：修复代码后重跑。
3. 若是预期视觉变更：更新快照并在提交说明中写明原因。

## 5. 提交前最小检查

```bash
git status --short
git diff --name-only
bun run test:e2e -- tests/e2e/core-ui-regression.spec.ts
bun run test:e2e -- tests/e2e/cases
```

如果 TypeScript 本身存在已知历史错误（非本次引入），需要在提交说明里单独标注“旧错误未新增”。
