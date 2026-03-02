# 文件更新与删除状态机（v2 对齐实现）

日期：2026-03-02

关联代码：
- `src/client/state.ts`（sessionFiles）
- `src/client/workspace-state-*.ts`（diff/missing/persistence）
- `src/client/main.ts`（SSE 事件处理）
- `src/client/ui/sidebar-workspace.ts`（工作区投影）

## 1) State Table

| StateId | 语义 | 入口条件 | 退出条件 | 不变量 |
|---|---|---|---|---|
| `S.CLEAN` | 会话文件与展示一致 | `isMissing=false` 且 `lastModified <= displayedModified` | `file-changed` / `file-deleted` | tab 正常 |
| `S.DIRTY_BG` | 会话文件后台变更 | `isMissing=false` 且 `lastModified > displayedModified` | 自动拉新成功/手动刷新 | 列表显示 `M` |
| `S.MISSING` | 会话文件已删除 | `sessionFiles[path].isMissing=true` | 关闭文件/文件恢复 | tab 与内容区删除态 |
| `W.NORMAL` | 工作区路径正常 | path 在扫描结果中，且不在 missing 集合 | 扫描消失/删除事件 | 树中正常行 |
| `W.MISSING` | 工作区路径删除态 | path 在 `workspaceMissingPaths` | 扫描重现/加载成功恢复 | 显示 `D + 红色划线` |

说明：
- `S.*`（会话态）与 `W.*`（工作区态）正交，不互相覆盖。

## 2) Transition Table

| From | Event | Guard | Side Effects | To |
|---|---|---|---|---|
| `S.CLEAN` | `file-changed` | 当前文件 | 自动同步正文 | `S.CLEAN` |
| `S.CLEAN` | `file-changed` | 非当前文件 | 更新 `lastModified` | `S.DIRTY_BG` |
| `S.DIRTY_BG` | `switch-file` | 切到该文件且拉新成功 | 同步 `displayedModified` | `S.CLEAN` |
| `S.*` | `file-deleted` | path 在 `sessionFiles` | `isMissing=true` | `S.MISSING` |
| `W.NORMAL` | `scan diff: missing` | path 从扫描集消失 | `markWorkspacePathMissing` | `W.MISSING` |
| `W.MISSING` | `scan diff: reappeared` | path 重新扫描到 | `clearWorkspacePathMissing` | `W.NORMAL` |
| `W.MISSING` | `click + load fail` | 文件不存在 | `markFileMissing(path)` | `W.MISSING + S.MISSING` |
| `W.MISSING` | `click + load success` | 文件恢复 | `addOrUpdateFile + clearMissing` | `W.NORMAL + S.CLEAN` |

## 3) View Mapping

| 状态 | Sidebar | Tabs | Content | Toolbar |
|---|---|---|---|---|
| `S.CLEAN` | 正常 | 正常 | 正常正文 | 刷新隐藏 |
| `S.DIRTY_BG` | `M` | 正常 | 非当前保持旧内容 | 切换后自动同步 |
| `S.MISSING` | `D + 划线` | 红色划线 tab | 删除提示 + 缓存/占位 | 禁止自动刷新替换 |
| `W.MISSING` | 工作区“已删除”分组 `D + 划线` | 不强制出现 | 点击后进入删除提示 | - |

## 4) 不变量

1. 未打开文件删除后也必须可见删除态（`W.MISSING`）。
2. `D` 优先级高于 `M` 与蓝点。
3. `S.MISSING` 下禁止自动替换正文。
4. `sessionFiles` 不得被当作工作区全量文件清单。

## 5) 测试映射

- `case-11`：当前文件删除态（`S.MISSING`）
- `case-12`：工作区删除样式
- `case-13`：非当前已打开文件删除流程
- `case-14`：工作区非当前已打开文件删除流程
- `case-15`：工作区未打开文件删除后立即删除态（`W.MISSING`）

## 6) 评分（v2）

- `ICS` 估算：`~19.8`（见 `20260301-state-machine-framework.md`）
- `CS` 估算：`~95.5`

结论：
- v2 状态边界清晰，关键删除链路覆盖完整，可作为当前基线。

