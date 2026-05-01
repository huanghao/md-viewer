# RAG 搜索设计文档

> 状态：MVP 设计已确认  
> 背景：md-viewer 当前搜索仅支持文件名匹配，无法做内容语义检索

---

## 1. 模型选型

### 候选模型对比

| 模型 | 尺寸 | 向量维度 | MTEB avg | 速度（CPU，encode 1句） | 备注 |
|------|------|----------|----------|------------------------|------|
| `all-MiniLM-L6-v2` | 22 MB | 384 | 56.3 | ~8 ms | 最轻量，速度最快 |
| `all-MiniLM-L12-v2` | 33 MB | 384 | 58.5 | ~15 ms | L6 升级版 |
| `all-mpnet-base-v2` | 420 MB | 768 | 63.3 | ~50 ms | 效果好，体积大 |
| `bge-small-en-v1.5` | 24 MB | 384 | 62.0 | ~10 ms | 中文支持差 |
| `bge-m3` | 570 MB | 1024 | 65.0 | ~90 ms | 多语言最优 |
| `paraphrase-multilingual-MiniLM-L12-v2` | 118 MB | 384 | 57.1 | ~18 ms | 多语言，含中文 |

> MTEB = Massive Text Embedding Benchmark，信息检索子任务分数（越高越好）

### 确定：`paraphrase-multilingual-MiniLM-L12-v2`（含中文，MVP 选型）

**理由：**

1. **中文支持**：工作区有大量中文内容，`all-MiniLM-L6-v2` 对中文效果差，multilingual 版 MTEB 中文子任务高 ~8 点。
2. **体积可接受**：118 MB，encode 一句约 18ms，5000 chunks 全量索引约 90 秒，首次启动后台运行，不阻塞使用。
3. **项目已有依赖**：`@huggingface/transformers` + `onnxruntime-node` 已在 `package.json`，无需新增依赖。
4. **首次启动自动下载**：模型文件自动下载到 `~/.cache/huggingface/`，之后完全离线。下载约 118 MB，首次需要网络，有进度日志提示用户。

### 换模型要做什么

模型是唯一影响「向量维度」的变量。换模型时需要：

1. 更改 `RAG_MODEL_NAME` 配置常量
2. **清空 `rag_vectors` 和 `rag_chunks` 表**（旧向量与新模型不兼容）
3. 在 SQLite 元数据表记录当前模型名，服务启动时检测模型变更自动触发全量重索引
4. 如果新模型维度不同（如从 384 改 768），`rag_vectors.vector` 列存 BLOB，无需改表结构

---

## 2. 存储选型：为什么是 SQLite

### 候选方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **SQLite + BLOB** | 零依赖，已有 db，事务一致性，跨平台 | 全表扫描，>10万 chunks 慢 | 个人工具，<5万 chunks |
| **sqlite-vec 扩展** | SQLite 原生向量索引，HNSW，极快 | 需要额外编译/安装 native 扩展 | 中等规模 |
| **FAISS** | 业界标准，极快，支持 GPU | C++ native，Bun 集成麻烦，无持久化 | 大规模，服务端 |
| **Chroma / Qdrant** | 功能完整的向量 DB | 独立进程，运维负担，过度设计 | 团队级产品 |
| **LanceDB** | Node.js 友好，有持久化 | 额外依赖，生态还不成熟 | 可选升级路径 |

### 选 SQLite + BLOB 的核心理由

**规模估算**：  
个人工作区通常 200–1000 个 md 文件，每文件平均 8 个 chunk，上限约 **8000 chunks**。  
384 维向量，cosine similarity JS 全量扫描 8000 条约 **3–5ms**（M1 Mac 实测 float32 dot product），完全可接受。

**工程一致性**：  
项目已有 `annotations.db`（`bun:sqlite`），RAG 直接加到同一文件，共享连接池、事务、备份逻辑，不引入新的运维单元。

**升级路径清晰**：  
如果未来文件数超过 5万 chunks（即 ~6000 个 md 文件），可以无缝迁移到 `sqlite-vec`，API 不变，只是查询语句从 JS cosine scan 改为 `vec_search()`。

---

## 3. 索引服务设计

### 3.0 部署模式

**RAG server 是一个独立的 Bun 进程**，与主 md-viewer server 分离：

```
[主 server] port 3000    ←→   [RAG server] port 3001
  md 渲染、文件API              embedding、向量搜索
  annotations DB               rag DB (同一 SQLite 文件)

手动启动方式（开发阶段）：
  bun run src/rag-server.ts
  
主 server 调用 RAG：
  GET http://localhost:3001/search?q=xxx
  RAG server 挂了 → 主 server 降级返回空结果，不报错
```

**为什么分开进程**：embedding 模型加载 ~800ms，占用 ~300MB 内存，不适合在主 server 启动路径上。分开后主 server 不受影响，RAG 挂了搜索自动降级到文件名搜索。

### 3.1 架构概览

```
RAG server 启动
  │
  ├── 加载 embedding 模型（首次下载 118MB，之后从缓存读）
  ├── 初始化 SQLite 表（幂等）
  ├── 读 rag_meta 对比模型名
  │     ├── 模型变更 → 清空全部向量，触发全量重索引
  │     └── 模型一致 → 增量检查（对比 mtime）
  └── 启动 chokidar watch 所有工作区目录
  
文件系统事件（chokidar）
  ├── 文件新增/修改 → 防抖 2s 后入队
  └── 文件删除    → 立即删除对应 chunks + vectors

重索引队列（串行，单次一个文件）
  └── 读文件 → 分块 → batch encode → 事务写库
```

### 3.2 索引调度策略

| 触发时机 | 行为 | 延迟 |
|----------|------|------|
| RAG server 启动 | 增量扫描全部工作区（对比 mtime），仅处理变更文件 | 后台异步，不阻塞 HTTP 端口就绪 |
| 文件保存（chokidar事件） | 防抖 2s 后入队，防止编辑中间状态 | 2s + encode 时间 |
| 文件删除 | 立即删除，不需要 embedding | 同步，<1ms |
| 模型变更 | 重启时检测，全量重索引 | 重启后后台 |

**工作区从哪里读**：RAG server 读同一份 `~/.config/md-viewer/config.json`，主 server 写工作区路径，RAG server 直接复用，无需额外同步机制。MVP 阶段 RAG server 启动时读一次，不监听工作区变更（后续可加）。

**不设定时轮询**：chokidar 事件驱动已足够，不需要 cron。

### 3.3 SQLite 表设计

```sql
-- 元数据：记录索引状态
CREATE TABLE rag_meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
-- 初始化写入：model_name, schema_version, last_full_index_at

-- Chunks：文档分块
CREATE TABLE rag_chunks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  path        TEXT NOT NULL,          -- 绝对路径
  chunk_index INTEGER NOT NULL,       -- 该文件内的第几块（0-based）
  heading     TEXT,                   -- 所属 markdown heading，空则为文件名
  text        TEXT NOT NULL,          -- chunk 原文
  char_start  INTEGER,                -- 在原文件中的字符偏移（用于跳转）
  indexed_at  INTEGER NOT NULL,       -- epoch ms，用于增量检查
  file_mtime  INTEGER NOT NULL        -- 索引时的文件 mtime，用于判断是否过期
);
CREATE INDEX idx_rag_chunks_path ON rag_chunks(path);
CREATE UNIQUE INDEX idx_rag_chunks_path_idx ON rag_chunks(path, chunk_index);

-- 向量：与 chunks 1:1
CREATE TABLE rag_vectors (
  chunk_id  INTEGER PRIMARY KEY REFERENCES rag_chunks(id) ON DELETE CASCADE,
  vector    BLOB NOT NULL             -- float32 little-endian，384 × 4 bytes = 1536 bytes
);

-- 索引日志：用于监控和问题排查
CREATE TABLE rag_index_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  path       TEXT NOT NULL,
  event      TEXT NOT NULL,           -- 'indexed' | 'deleted' | 'error' | 'skipped'
  duration_ms INTEGER,
  error_text TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_rag_log_created ON rag_index_log(created_at);
```

### 3.4 增量更新逻辑

```
re-index(path):
  1. 读文件内容，计算 mtime
  2. 查 rag_chunks 中该 path 的最新 file_mtime
     └── 若一致 → skip（文件未变）
  3. 分块（chunking）
  4. 对所有 chunks 批量 encode（单次调用 model.encode([...texts])）
  5. BEGIN TRANSACTION
     ├── DELETE FROM rag_vectors WHERE chunk_id IN (SELECT id FROM rag_chunks WHERE path=?)
     ├── DELETE FROM rag_chunks WHERE path=?
     ├── INSERT INTO rag_chunks ...（批量）
     └── INSERT INTO rag_vectors ...（批量）
  6. COMMIT
  7. 写 rag_index_log（event='indexed', duration_ms=...）
```

用事务保证「删旧插新」的原子性，搜索请求不会看到中间状态。

### 3.5 分块策略（Chunking）

```
输入：markdown 文本

1. 按 heading 分割（## / ###）
   每块 = heading 文本 + heading 下的内容
   最大 800 字符（约 150-200 词），超出则滑窗分割
   
2. 无 heading 的文件（纯正文）：
   按段落边界（空行）分割
   合并小段直到 ≥ 200 字符，或单段 > 800 字符时强制切

3. 每块附加上下文前缀（不参与存储，只用于 encode）：
   "文件名 > heading > " + chunk_text
   提升检索相关性

4. 过滤：跳过纯代码块（```...```），纯图片行，纯分隔线
```

### 3.6 监控与健康检查（MVP 范围外，后续加）

MVP 阶段不做 CLI 和 status API，RAG server 启动日志直接打印到 terminal，够用。

后续可加：`mdv rag status` / `mdv rag reindex` / `mdv rag purge`。

### 3.7 治理规则

| 场景 | 处理方式 |
|------|---------|
| 文件删除 | 立即同步删除 chunks + vectors（CASCADE） |
| 工作区移除 | 删除该 workspace 下所有 path 的 chunks + vectors |
| 文件 > 1MB | 跳过，写 log（event='skipped', error='too large'） |
| 二进制/非文本 md | 检测 UTF-8 编码失败时跳过 |
| 索引日志保留 | 保留最近 7 天，`rag_index_log` 定期 DELETE WHERE created_at < now-7d |
| 模型升级 | 启动时检测模型名变更 → 自动清空 + 全量重索引 |
| 孤儿向量 | `rag_vectors` 有 `ON DELETE CASCADE`，chunks 删除时自动清理 |
| DB 膨胀 | 定期 `PRAGMA wal_checkpoint; VACUUM;`（在全量重索引后执行） |

---

## 4. 搜索 API 设计

RAG server 暴露 HTTP API，主 server 代理转发给前端：

```
RAG server:  GET http://localhost:3001/search?q=<query>&limit=10
主 server:   GET /api/rag-search?q=<query>&limit=10  （代理到 RAG server）

Response:
{
  "results": [
    {
      "path": "/abs/path/to/file.md",
      "heading": "## 部署流程",
      "text": "...匹配的段落内容...",
      "score": 0.87,          // cosine similarity [0,1]
      "charStart": 1240       // 文件中字符偏移，用于跳转定位
    }
  ],
  "queryTime": 12             // ms
}
```

**点击行为**：点击搜索结果 → 打开文件并滚动到 `charStart` 对应段落位置（与现有 annotation 锚点机制复用）。

**降级**：RAG server 不可用时，`/api/rag-search` 返回 `{ results: [], error: "rag_unavailable" }`，前端提示"内容搜索暂不可用"。

**前端集成**：搜索框增加 `[文件名] / [内容]` 切换 tab，内容搜索结果卡片展示：文件名 + heading + chunk 预览（120 字符）+ 相似度分。

---

## 5. 决策记录

| 问题 | 决策 | 理由 |
|------|------|------|
| 模型 | `paraphrase-multilingual-MiniLM-L12-v2` | 工作区有大量中文，multilingual 版效果更好 |
| 模型下载 | 首次启动自动下载（118MB） | 开发阶段可接受，有日志提示进度 |
| 点击行为 | 打开文件并跳转到 `charStart` 位置 | charStart 已存，跳转无额外成本，体验更好 |
| 混合搜索 | MVP 不做，只做向量搜索 | 先验证向量搜索效果，不够再加 BM25 |
| 部署方式 | 独立进程，手动启动 | 与 agent server / translate server 一致，开发阶段 |
| 定时触发 | 不需要外部 cron，chokidar 事件驱动 | RAG server 内部自驱 |

---

## 6. MVP 实现范围

| 模块 | 内容 | 估时 |
|------|------|------|
| `src/rag-server.ts` | HTTP server，`/search` 端点，启动/关闭逻辑 | 1h |
| `src/rag-storage.ts` | SQLite 建表，chunk CRUD，vector CRUD | 1h |
| `src/rag-chunker.ts` | md 分块逻辑（heading 分割 + 滑窗） | 1h |
| `src/rag-indexer.ts` | embedding 模型封装，indexFile，启动增量扫描，chokidar 监听 | 2h |
| `src/handlers.ts` | 新增 `/api/rag-search` 代理端点（降级处理） | 0.5h |
| `src/client/ui/sidebar.ts` | 搜索 tab 切换 + RAG 结果卡片渲染 | 2h |

**不在 MVP 内**：CLI 命令、status API、混合搜索、工作区动态感知（重启生效）。
