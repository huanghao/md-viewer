# 20260308 评论系统单一事实源设计

文档定位：设计定稿

## 已确认决策

1. 评论系统正式以服务端 SQLite 为唯一事实源，不再保留评论 localStorage 兜底。
2. 设置页保留“清空评论状态”按钮，语义定义为“服务端评论数据 + 客户端评论相关状态”一起删除。
3. 评论 API 只保留逐条增量写，不暴露整量替换 HTTP 接口。

## 背景

当前评论链路已经从“浏览器 localStorage 主存储”迁移到“本地服务端 SQLite 持久化”。

但旧实现遗留了两个问题：

1. 客户端和服务端各存一份评论，容易出现不一致。
2. 评论操作部分依赖 DOM 上的 `data-current-file`，文件切换或关闭时会出现 stale path 风险。

这个项目是单机本地服务，不需要离线浏览器缓存兜底。评论应直接进入服务端，由服务端持久化到 SQLite。

## 目标

1. 评论只有一个事实源：`~/.config/md-viewer/annotations.db`
2. 客户端只保留渲染态和瞬时交互态，不保留评论副本
3. 文件切换、关闭、HTML 跳转等场景下，评论路径绑定仍然正确
4. 提供明确的调试入口：一键清空评论状态

## 非目标

1. 多人协作
2. 离线浏览器编辑后再补同步
3. 跨设备评论同步
4. 本次不改评论数据模型与重锚算法

## 架构结论

### 1. 事实源

唯一事实源：

- 服务端 SQLite：`~/.config/md-viewer/annotations.db`

客户端只保留：

- 当前文件评论数组
- 当前激活评论 ID
- 临时选区与待提交评论
- 面板展开、密度等 UI 状态

客户端不再保留：

- `md-viewer:annotations:*`
- 评论迁移标记
- 任何评论内容缓存

### 2. 客户端职责

客户端负责：

1. 选区采集
2. 线程渲染
3. 锚点高亮
4. 调用评论 API
5. 维护当前页面的瞬时交互状态

客户端不负责：

1. 评论持久化兜底
2. 评论历史恢复
3. 数据合并

### 3. 服务端职责

服务端负责：

1. 校验 `path`
2. 读写 SQLite
3. 返回当前文档评论
4. 清空评论数据

服务端 API：

- `GET /api/annotations?path=...`
- `POST /api/annotations/item`
- `POST /api/annotations/reply`
- `POST /api/annotations/delete`
- `POST /api/annotations/status`
- `POST /api/annotations/clear`

### 4. 存储层职责

`src/annotation-storage.ts` 负责：

1. `doc_path` 规范化
2. 评论线程序列化
3. SQLite 事务写入
4. 文档评论聚合查询

当前主写模型改为“逐条增量写”：

1. 新建评论：单条 upsert
2. 回复评论：单条 reply
3. 删除评论：单条 delete
4. 解决/重开评论：单条 status update
5. 重锚引起的位置或状态变化：单条 upsert

服务端不暴露整量替换 HTTP 接口。

## 当前链路

### 读取链路

1. 切换文件
2. 客户端调用 `setAnnotations(filePath)`
3. 客户端向 `GET /api/annotations` 拉取该文件评论
4. 服务端从 SQLite 读取并返回
5. 客户端渲染评论与正文高亮

### 写入链路

1. 用户新建评论 / 回复 / 删除 / 解决
2. 客户端更新内存中的 `state.annotations`
3. 客户端调用对应的增量 API：
   - `POST /api/annotations/item`
   - `POST /api/annotations/reply`
   - `POST /api/annotations/delete`
   - `POST /api/annotations/status`
4. 服务端只更新目标评论
5. SQLite 成为唯一持久化结果

### 清理链路

设置页“清空评论状态”：

1. 调用 `POST /api/annotations/clear`
2. 服务端删除 SQLite 中全部评论
3. 客户端删除评论相关 localStorage 键
4. 页面刷新

## 关键约束

### 1. 文件路径必须双向一致

评论子系统内部必须同时满足：

1. `annotation` 状态里记录的当前文件路径正确
2. DOM 中 `data-current-file` 仅作为渲染辅助，不应成为唯一数据真相源

因此客户端新增一个“活跃评论文件路径”判断：

1. 优先使用 annotation 模块自己的 `currentFilePath`
2. 若 DOM 路径存在且与其不一致，则拒绝执行评论写操作

这样可以避免：

1. 关闭当前文件后评论状态没切走
2. HTML/空页面残留旧 `data-current-file`
3. 把 A 文件的评论写进 B 文件

### 2. 评论接口失败必须显式暴露

因为客户端不再有评论副本，接口失败时不能静默吞掉。

要求：

1. `fetchAnnotations()` 非 2xx 直接抛错
2. 增量写接口非 2xx 直接抛错
3. UI 必须提示“加载失败 / 保存失败”

### 3. 评论清理按钮语义必须明确

“清空评论状态”定义为：

1. 删除服务端 SQLite 评论数据
2. 删除客户端评论相关状态：
   - `md-viewer:annotation-panel-open-by-file`
   - `md-viewer:annotation-density`
   - `md-viewer:annotation-sidebar-width`
   - 历史遗留的 `md-viewer:annotations:*`

不包含：

1. 已打开文件列表
2. 工作区列表
3. 其他非评论设置

## 风险与后续

### 当前已解决

1. 去掉评论 localStorage 双写
2. 去掉评论一次性迁移逻辑
3. 补上评论接口错误暴露
4. 修正关闭文件和空/HTML 页面下的 stale path 风险

### 仍然存在的结构性风险

1. 若未来出现多窗口并发编辑，单条增量写虽然更稳，但仍缺少版本冲突提示
2. 评论 re-anchor 触发频繁时，会产生较多单条 upsert 请求

### 下一步建议

1. 为“关闭文件 / 快速切换文件 / HTML 页面”补前端交互测试
2. 增加一个调试命令，导出当前数据库中的评论概览
3. 评估是否要给增量 API 增加版本号或 `updated_at` 并发保护

## 当前结论

1. SQLite 单一事实源已确认。
2. 设置页“清空评论状态”入口与语义已确认。
3. 只暴露逐条增量写接口已确认。
4. 评论相关客户端状态当前只保留 UI 状态：面板展开、密度、宽度。
