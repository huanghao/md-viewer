# 文件更新与删除状态机（v1 基线）

日期：2026-03-01

关联代码：
- `src/client/main.ts`（SSE 事件处理）
- `src/client/state.ts`（file state）
- `src/client/utils/file-status.ts`（M/D 计算）
- `src/client/ui/sidebar.ts` + `src/client/css.ts`（展示映射）

## 1) State Table

| StateId | 语义 | 入口条件 | 退出条件 | 不变量 |
|---|---|---|---|---|
| `CLEAN` | 文件展示与磁盘一致 | `lastModified <= displayedModified` 且 `isMissing=false` | `file-changed` / `file-deleted` | 不显示 `M/D` |
| `DIRTY_BG` | 非当前文件有更新 | `lastModified > displayedModified` 且 `isMissing=false` | 用户切换并自动拉新，或手动刷新 | 列表显示 `M` |
| `MISSING` | 文件已删除（列表仍保留） | `isMissing=true` | 用户关闭该文件；或重试成功恢复 | 显示 `D`，名称删除线 |
| `ACTIVE_VIEW` | 当前正在阅读 | `state.currentFile === file.path` | 用户切换文件 | 内容区展示 `file.content` |

说明：`ACTIVE_VIEW` 与其余状态为正交维度（可组合）。

## 2) Transition Table

| From | Event | Guard | Side Effects | To |
|---|---|---|---|---|
| `CLEAN` | `file-changed` | 当前文件 | 自动读取最新内容并替换正文，触发轻量高亮 | `CLEAN + ACTIVE_VIEW` |
| `CLEAN` | `file-changed` | 非当前文件 | 更新 `lastModified`，列表渲染 | `DIRTY_BG` |
| `DIRTY_BG` | `switch-file` | 点击该文件 | 切换后自动拉新，成功则清除 `M` | `CLEAN + ACTIVE_VIEW` |
| `DIRTY_BG` | `manual-refresh` | 文件存在 | `content/lastModified/displayedModified` 同步 | `CLEAN` |
| `*` | `file-deleted` | 命中已打开文件 | `isMissing=true`，保留当前正文，不刷新替换 | `MISSING` |
| `MISSING` | `remove-file` | 用户关闭 | 从状态中删除文件 | 终态 |

## 3) View Mapping

| 状态 | Sidebar | Tabs | Content | Toolbar |
|---|---|---|---|---|
| `CLEAN` | 正常 | 正常 | 正常 | 刷新按钮隐藏 |
| `DIRTY_BG` | `M` 橙色 | 正常 | 非当前文件保持旧内容 | 刷新按钮可作为兜底 |
| `MISSING` | 红字 + 删除线 + `D` | 红字 + 删除线 | 保留旧内容 | 刷新/同步建议禁用（待完善） |

## 4) 不变量

1. `isMissing=true` 时，禁止自动替换正文（避免用户阅读上下文丢失）。
2. `isMissing=true` 时，列表必须可见 `D` 且文件名删除线。
3. `lastModified > displayedModified` 必须映射为 `M`（仅非当前文件可见），除非 `isMissing=true`（`D` 优先）。

## 5) 评分（v1 基线）

### ICS
- `S=4`（含一个正交状态）
- `T=6`
- `G=6`（增加“当前/非当前”与“自动拉新成功/失败兜底”分支）
- `A=4`（SSE、loadFile、render 批更新、并发序号保护）
- `V=4`（sidebar/tabs/content/toolbar）

`ICS = 1.0*4 + 1.2*6 + 0.8*6 + 1.5*4 + 0.7*4 = 24.8`

### CS
- `SC=0.90`（核心状态定义完整）
- `TC=0.88`（主迁移已覆盖，删除后恢复分支待细化）
- `VC=0.91`（当前/非当前刷新策略映射更清晰）
- `EC=0.80`（新增 case-10 覆盖 file-changed 三条主链路）

`CS = 30*0.90 + 30*0.88 + 20*0.91 + 20*0.80 = 87.6`

结论：
- 当前可运行且一致性达标；建议补“删除态恢复/禁用操作”测试完善边界分支。
