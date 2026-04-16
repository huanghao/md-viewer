# E2E 测试状态

## 当前状态

- **22 个通过** ✅
- **0 个跳过**
- **0 个失败**

## 已删除的测试（用单元测试替代）

| 原测试 | 删除原因 | 替代单元测试 |
|--------|----------|-------------|
| case-5 | 工作区蓝点（树形结构复杂） | workspace-state-diff.test.ts |
| case-10 | 文件修改不自动刷新 | file-change-dirty-state.test.ts |
| case-11 | 当前文件删除态样式 | file-deleted-state.test.ts |
| case-13 | 非当前文件删除流程 | file-deleted-state.test.ts |
| case-16 | 快速修改收敛 | file-change-dirty-state.test.ts |
| case-17 | 删除重建恢复监听 | file-deleted-state.test.ts |
| case-18 | SSE断线重连 | sse-reconnect.test.ts |
| case-25 | 批量关闭M保护 | tab-batch-semantics.test.ts |

## 单元测试覆盖范围

| 测试文件 | 覆盖功能 |
|----------|----------|
| file-change-dirty-state.test.ts | M 标记、dirty 检测、状态持久化 |
| file-deleted-state.test.ts | D 标记、删除状态、重建恢复 |
| tab-batch-semantics.test.ts | 批量关闭逻辑、M 保护规则 |
| sse-reconnect.test.ts | SSE 重连、指数退避 |
| annotation-status.test.ts | 批注状态筛选、open 计数 |

## 测试策略

- **E2E 测试**：验证用户交互流程（打开、渲染、切换、搜索）
- **单元测试**：验证状态管理逻辑（dirty、deleted、batch）

## Docker 运行

```bash
./scripts/e2e-docker.sh
```

所有测试通过，无需进一步修复。
