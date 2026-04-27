# 渐进式中英对照翻译功能设计

**日期**：2026-04-27  
**状态**：待实现

---

## 背景

md-viewer 需要对英文 Markdown 文档提供中英对照翻译，类似沉浸式翻译，但仅作用于当前阅读的 md 文档，不污染 TOC、文件列表、评论、tab 等其他 UI 区域。

---

## 架构总览

```
前端 (Vanilla TS)
  └── 工具栏翻译按钮（按文档开/关）
  └── IntersectionObserver → 段落进入视口
  └── 批量请求队列（debounce 200ms，每批 ≤10 段）
  └── fetch → http://localhost:5050/translate

翻译 server (Python FastAPI, 独立进程)
  └── POST /translate
  └── argos-translate (in-process, en→zh)
  └── SQLite cache (key=SHA256(text), 含 created_at)
```

前端直接请求翻译 server（与现有 agent server 模式相同），地址存 localStorage，无需 md-viewer Bun server 做 proxy。

---

## 翻译 Server

### 位置

独立目录 `translate-server/`，与 md-viewer 主项目并列或置于其子目录。

### 接口

```
POST /translate
Content-Type: application/json

Request:
{
  "segments": [
    {"id": "abc123def456", "text": "Hello world, this is a paragraph."},
    ...
  ]
}

Response:
{
  "results": [
    {"id": "abc123def456", "translation": "你好世界，这是一个段落。"},
    ...
  ]
}
```

- `id` 由客户端生成，server 原样返回
- 每次请求最多 10 个 segments
- server 内部对 segments 串行翻译（argos-translate 非线程安全）

### Cache

- SQLite 表结构：

```sql
CREATE TABLE cache (
  hash TEXT PRIMARY KEY,      -- SHA256(source text)
  source TEXT NOT NULL,
  translation TEXT NOT NULL,
  created_at INTEGER NOT NULL  -- unix timestamp
);
```

- cache 命中直接返回，不调 argos
- 不做 LRU，支持按时间清理：`python server.py --clear-before 30`（删除 30 天前的记录）

### 模型

- 使用 argos-translate en→zh 语言包
- 首次启动自动下载（约 100MB）
- 只支持英译中，不做语言自动检测

### 启动

```bash
cd translate-server
pip install fastapi uvicorn argos-translate
python server.py  # 默认端口 5050
```

---

## 前端改动

### 1. 段落 ID 注入

在 `renderContent()` 完成后（marked.js 渲染后）做后处理：

- 遍历 `#reader` 内的 `p`、`blockquote`、`li` 元素
- 对每个元素的 `textContent` 取前 64 字节，计算 SHA256，取前 16 位 hex 作为 `data-para-id`
- 只加属性，不改 class 或样式

```html
<!-- 注入前 -->
<p>Hello world.</p>

<!-- 注入后 -->
<p data-para-id="a1b2c3d4e5f6a1b2">Hello world.</p>
```

### 2. 翻译开关

- 工具栏加「译」图标按钮
- 状态按文档路径存 localStorage，key：`md-viewer:translate:<filePath>`
- 开启：注册 IntersectionObserver，立即翻译视口内段落
- 关闭：移除所有 `.para-translation` 元素，断开 observer

### 3. IntersectionObserver + 请求队列

```
段落进入视口
  └── 已有 data-translation-done？跳过
  └── 否则加入待翻译队列
        └── debounce 200ms
              └── 打包当前队列（≤10 段）发请求
                    └── 译文返回 → 插入 DOM，标记 data-translation-done
```

切换文档时：取消 pending 请求（AbortController），清空队列，断开 observer。

### 4. 译文 DOM 结构

```html
<p data-para-id="a1b2c3d4e5f6a1b2">原文段落...</p>
<p class="para-translation" data-for="a1b2c3d4e5f6a1b2">译文段落...</p>
```

### 5. 译文样式

```css
.para-translation {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-top: 0.2em;
  margin-bottom: var(--paragraph-margin, 1em);  /* 与正文段落保持一致 */
  font-style: italic;  /* 轻量区分，不喧宾夺主 */
}
```

跟随 theme，不硬编码颜色。

### 6. 翻译 Server 地址配置

- 存 localStorage，key：`md-viewer:translate-url`，默认 `http://localhost:5050`
- Settings 面板加一行配置输入框（与现有 agent URL 输入框样式相同）

---

## 性能预期

| 场景 | 体验 |
|---|---|
| cache 命中 | <50ms，接近无感 |
| cache 未命中，单段 | 0.5–1.5s，译文渐进出现 |
| 首屏 5 段同时翻译（无 cache） | 约 2–4s 全部出齐 |
| 再次打开同文档 | 全部 cache 命中，接近瞬开 |
| 切换文档 | 取消 pending 请求，立即响应 |

首次使用体验较慢，多次访问后体验接近瞬开。

---

## 文件变更清单

### 新增

- `translate-server/server.py` — FastAPI + argos-translate + SQLite cache
- `translate-server/requirements.txt`

### 修改

- `src/client/main.ts` — renderContent 后注入 data-para-id
- `src/client/ui/settings.ts` — 加翻译 server 地址配置
- `src/client/translation.ts`（新建）— IntersectionObserver、请求队列、DOM 插入逻辑
- `src/styles/` — para-translation 样式

---

## 不在本期范围内

- 中译英或其他语言方向
- LRU cache 淘汰
- 翻译进度指示（loading spinner per paragraph）
- PDF 文档翻译
