# 状态同步风险分析（客户端/服务端）

日期：2026-03-02

## 1. 当前结论（更新）

现状：
- 工作区目录树由“扫描 + 轮询 + watcher/SSE”共同驱动。
- 展开态工作区会周期扫描；文件变更通过 SSE 推送。
- 未打开文件删除也能进入工作区删除态（`workspaceMissingPaths`）。

结论：
- 工作区一致性风险已从“高”降为“中低”，但仍存在短时间窗口（轮询间隔内）。

---

## 2. 状态清单

### 客户端状态

1. 会话文件状态（内存 + localStorage）
- `state.sessionFiles`、`state.currentFile`
- 持久化键：`md-viewer:openFiles`

2. UI 配置（localStorage）
- `state.config.sidebarMode`、`state.config.workspaces`
- 持久化键：`md-viewer:config`

3. 工作区运行时缓存（仅内存）
- `state.currentWorkspace`、`state.fileTree`

4. 临时交互状态（仅内存）
- 搜索关键词、确认条状态、工作区加载失败/加载中标记等

5. 其他本地偏好（localStorage）
- 侧栏宽度、字体缩放

### 服务端状态

1. SSE 客户端集合（内存）
- 当前连接会话集合

2. 文件监听状态（内存）
- watcher + watchedPaths + watchedWorkspaceRoots（包含工作区目录监听）

3. 同步记录（磁盘）
- `~/.config/md-viewer/sync-records.json`

4. 服务配置（磁盘）
- `~/.config/md-viewer/config.json`

---

## 3. 不同步风险与建议

### A. 工作区树 vs 真实文件系统（中风险）

风险：
- 目录变化与 UI 投影存在短暂延迟（轮询窗口内）。

建议：
- 保持当前“目录 watcher + 轮询扫描”双保险。
- 若后续性能压力上升，可将轮询改为事件驱动优先、轮询兜底。

### B. watchedPaths 膨胀（中风险）

风险：
- 关闭文件后未取消监听，监听集合长期增长。

建议：
- 关闭文件时通知服务端执行 unwatch。
- 或增加 watcher 级 TTL/LRU 回收。

### C. 已保存工作区路径失效（中风险）

风险：
- 路径被移动/删除后仍显示为可用工作区。

建议：
- 启动时做工作区健康检查，失效项标记并提供清理入口。

### D. 未加载工作区搜索盲区（中风险）

风险：
- 未展开工作区没有树数据，跨工作区搜索会漏结果。

建议：
- 显示“未索引”提示，或做后台懒索引。

---

## 4. 推荐后续顺序（更新）

1. 为工作区 watcher 增加健康指标与日志采样（定位偶发漏事件）
2. 关闭文件时取消不必要的文件级监听（控制资源增长）
3. 启动健康检查 + 未索引提示（提升可解释性）

---

## 5. 新文件提示规则（补充）

需求补充：
- 工作区目录在刷新后出现新增文件时，应在工作区树中用小蓝点提示（未读/新出现状态）。

建议的状态定义：
- `workspaceKnownFiles[workspaceId]`：记录上次扫描已知文件路径集合
- 本次扫描结果与上次集合做差，新增路径进入 `listDiffPaths`
- 在树渲染时：若节点路径命中 `listDiffPaths`，显示蓝点
- 当用户点击打开该文件后，移除该文件蓝点状态

触发时机：
1. 首次扫描：仅建立基线，不打蓝点（避免首次加载全部高亮）
2. 后续扫描：只对“新增差异”打蓝点
3. 文件被删除：从 `workspaceKnownFiles` 与 `listDiffPaths` 清理，并进入 `workspaceMissingPaths`
