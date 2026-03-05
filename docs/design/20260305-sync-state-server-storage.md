# 20260305-同步状态服务端化（SQLite）

## 待决策项

1. 旧文件 `sync-records.json` 是否长期保留（当前方案：迁移后重命名为 `sync-records.migrated.json`，不再写入）。
2. 同步状态与评论是否继续共用 `annotations.db`（当前方案：共用同一 DB，不新增 DB 文件）。

## 背景

当前“文档同步状态”存在两份：

- 服务端：`sync-records.json`
- 客户端：`localStorage` 中 `md-viewer:syncState`

这会导致跨端/跨会话状态不一致，且客户端可见状态并非事实源。

## 目标

1. 同步状态事实源统一到服务端 SQLite。
2. 前端不再持久化同步状态，只通过 API 获取。
3. 保持现有 `/api/sync/*` 交互协议兼容。

## 数据库 Schema

基于 `~/.config/md-viewer/annotations.db` 新增下列表：

```sql
CREATE TABLE IF NOT EXISTS sync_recent_parents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  last_used INTEGER NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sync_files (
  file_path TEXT PRIMARY KEY,
  km_doc_id TEXT NOT NULL,
  km_url TEXT NOT NULL,
  km_title TEXT NOT NULL,
  base_title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id TEXT NOT NULL,
  last_sync_time INTEGER NOT NULL,
  command TEXT
);

CREATE TABLE IF NOT EXISTS sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  version INTEGER NOT NULL,
  km_doc_id TEXT,
  km_url TEXT,
  km_title TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'abandoned')),
  synced_at INTEGER NOT NULL,
  command TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS sync_preferences (
  pref_key TEXT PRIMARY KEY,
  pref_value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  meta_key TEXT PRIMARY KEY,
  meta_value TEXT
);
```

## 接口设计

保持现有接口不变，语义改为直接读写 SQLite：

- `GET /api/sync/status?path=...`
- `POST /api/sync/execute`
- `GET /api/sync/recent-parents`
- `GET /api/sync/parent-meta?value=...`
- `GET /api/sync/preferences`
- `POST /api/sync/preferences`
- `POST /api/sync/cleanup`
- `GET /api/sync/stats`

## 迁移策略

服务启动首次访问同步存储时：

1. 检查 `sync_meta.legacy_json_migrated` 标记。
2. 若未迁移且存在 `sync-records.json`，导入 recent/files/history/preferences/default_parent_id。
3. 设置迁移标记。
4. 将旧文件重命名为 `sync-records.migrated.json`。

## 前端改造

1. 删除 `src/client/sync-state.ts`（不再 `localStorage` 持久化同步状态）。
2. 同步按钮状态仅由 `getSyncStatus()` 驱动。
3. 删除 `SyncMeta` 类型与相关迁移逻辑（`state.ts` 中旧字段迁移）。
