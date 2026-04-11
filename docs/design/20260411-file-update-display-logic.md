# 文件更新与展示版本逻辑梳理

## 核心状态字段

每个已打开的文件（`FileInfo`）有四个关键字段：

| 字段 | 含义 |
|------|------|
| `content` | 当前正文区展示的内容（内存缓存） |
| `lastModified` | 已知的磁盘最新 mtime（由 SSE 或 loadFile 更新） |
| `displayedModified` | `content` 对应的 mtime（"我展示的是哪个版本"） |
| `pendingContent` | diff 视图的磁盘最新内容（临时缓存，用完即清） |

**脏判断**：`lastModified > displayedModified` → 展示的不是最新版本 → 显示 refresh/diff 按钮。

---

## 侧边栏状态标记

| 标记 | 颜色 | 含义 | 触发条件 |
|------|------|------|---------|
| `M` | 橙色字符 | 磁盘内容比展示内容新 | `lastModified > displayedModified` |
| 蓝点 | `#007AFF` | 工作区中出现了新文件（本 session 未见过） | `hasListDiff(path)` |
| 绿点 | `#10b981` | 焦点视图中的新文件（未在 session 中打开过） | 焦点视图专用，`hasListDiff` 且文件未在 session 中 |

---

## 逻辑链路总览

### 链路 1：SSE file-changed（磁盘文件被修改）

```
磁盘变化
  → chokidar → broadcastFileChanged(path, mtime)
  → SSE event: file-changed
  → client: file.lastModified = data.lastModified   [main.ts:1310]
  → saveState()
  → renderSidebar()  → 侧边栏显示 M 标记
  → updateToolbarButtons()  → 若当前文件变脏，显示 refresh 按钮
```

**content 不变，只更新 lastModified。**
用户必须手动点 refresh 才能看到新内容。

**SSE 丢失的影响**：若 SSE 通知丢失，`M` 标记不会出现，用户不知道文件已变化。但手动点 refresh 仍然有效——refresh 走链路 2，直接读磁盘，不依赖 SSE 的 `lastModified`。所以影响仅限于"静默丢失变化提示"，不影响实际内容的可获取性。影响程度较小。

---

### 链路 2：用户点击 refresh 按钮

```
handleRefreshButtonClick()
  → syncFileFromDisk(path, { silent: false, highlight: true })
    → loadFile(path)  [HTTP GET /api/file]
    → targetFile.content = data.content            [main.ts:201]
    → targetFile.lastModified = max(current, disk)  [main.ts:205]
    → targetFile.displayedModified = data.lastModified  [main.ts:207]
    → targetFile.pendingContent = undefined
    → renderContent()  → 正文更新
    → updateToolbarButtons()  → M/refresh 消失
```

---

### 链路 3：用户点击 diff 按钮

diff 按钮显示的是当前展示内容（旧）与磁盘最新内容（新）的对比，让用户在接受前看清楚改了什么。点"接受"等同于 refresh——两者最终效果相同（content 更新、displayedModified 对齐），区别仅在于 diff 让用户先确认变更内容。

```
handleDiffButtonClick()
  → loadPendingContent(path)  → file.pendingContent = 磁盘最新内容
  → renderDiffView(file.content, pendingContent)

acceptDiffUpdate()  ← 等同于 refresh，只是内容来自已缓存的 pendingContent
  → file.content = file.pendingContent              [main.ts:1100]
  → file.pendingContent = undefined
  → file.displayedModified = file.lastModified      [main.ts:1102]
  → renderContent()  → 正文更新
  → updateToolbarButtons()  → M/refresh/diff 消失
```

---

### 链路 4：用户点击 tab 切换文件（switchFile）

```
switchFile(path)
  → switchToFile(path)  → state.currentFile = path，清蓝点，saveState
  → renderSidebar()
  → renderContent()  → 展示 file.content（内存缓存，不读磁盘）
  → syncAnnotationsForCurrentFile()
  → updateToolbarButtons()  → 若 lastModified > displayedModified，显示按钮
```

**content 不更新，只切换展示哪个文件的缓存。**
若目标文件已脏，切换后正文是旧内容 + 显示 refresh/diff 按钮。

---

### 链路 5：SSE file-opened（CLI 打开文件）

```
SSE event: file-opened
  → onFileLoaded(data, focus)
    → addOrUpdateFile(data, focus)
      → file.content = data.content                 [state.ts:195]
      → file.lastModified = max(existing, disk)      [state.ts:189]
      → file.displayedModified:
          若已脏（lastModified > displayedModified）→ 保留旧 displayedModified（保持脏）
          否则 → data.lastModified（干净）           [state.ts:182-184]
    → renderContent()  → 正文更新（用服务端返回的 content）
```

**⚠️ 问题 A**：`addOrUpdateFile` 无条件写入 `content = data.content`（最新内容），
但若文件已脏，`displayedModified` 被保留为旧值。
结果：正文已是新内容，但 refresh/diff 按钮还在 → 状态不一致。

---

### 链路 6：页面刷新 / 恢复状态（restoreState）

```
restoreState(loadFile)
  → 对每个保存的文件路径：
    → loadFile(path)  [HTTP GET]
    → file.content = fileData.content               [state.ts:137]
    → file.lastModified = max(disk, saved.lastModified)  [state.ts:138]
    → file.displayedModified = saved.displayedModified ?? disk.lastModified  [state.ts:139]
```

若页面刷新前文件是脏的（SSE 更新了 lastModified 但用户未 refresh），
恢复后：`content` 是磁盘最新内容，但 `displayedModified` 是旧的保存值，`lastModified` 是新值。
结果：**正文已经是新的，但按钮仍显示脏** → 状态不一致（问题 B）。

---

### 链路 7：工作区轮询（startWorkspacePolling）

```
每 N ms（当前硬编码 1500ms，待改为配置项，建议默认 5000ms）:
  scanWorkspace(ws.id)
    → GET /api/scan-workspace
    → 更新 state.fileTree（文件树结构、新增/删除文件）
    → updateWorkspaceListDiff(workspaceId, allPaths)  → 触发蓝点/绿点
    → renderSidebar()
```

**轮询只负责文件树结构的新增/删除感知，不检测文件内容变化。**
文件内容变化的通知完全依赖 SSE（链路 1）。
若 SSE 断线，轮询不会补偿，用户将错过文件变化通知。

---

## 状态写入汇总表

| 字段 | 写入位置 | 触发时机 |
|------|---------|---------|
| `content` | `addOrUpdateFile` state.ts:195 | CLI 打开、file-opened SSE |
| `content` | `syncFileFromDisk` main.ts:201 | 用户点 refresh |
| `content` | `acceptDiffUpdate` main.ts:1100 | 用户接受 diff |
| `lastModified` | `addOrUpdateFile` state.ts:189 | CLI 打开、file-opened SSE |
| `lastModified` | `syncFileFromDisk` main.ts:205 | 用户点 refresh |
| `lastModified` | SSE handler main.ts:1310 | 磁盘文件变化 |
| `lastModified` | `restoreState` state.ts:138 | 页面刷新恢复 |
| `displayedModified` | `addOrUpdateFile` state.ts:184 | CLI 打开（文件干净时） |
| `displayedModified` | `syncFileFromDisk` main.ts:207 | 用户点 refresh |
| `displayedModified` | `acceptDiffUpdate` main.ts:1102 | 用户接受 diff |
| `displayedModified` | `restoreState` state.ts:139 | 页面刷新恢复 |

---

## 已知问题

### 问题 A：file-opened SSE 导致内容/状态不一致

**场景**：文件已打开且脏 → 用户再次用 CLI `mdv file.md` 打开同一文件

`addOrUpdateFile` 写入 `content = data.content`（最新磁盘内容），
但 `displayedModified` 保留旧值（因为检测到已脏就不更新）。
结果：正文已是新内容，但 refresh/diff 按钮还在，状态不一致。

**根因**：`displayedModified` 的保留逻辑是为了"不丢失脏标记"，
但没有考虑 `content` 同时被更新的情况。

**修复方向**：`addOrUpdateFile` 写入新 content 时，同步更新 `displayedModified = lastModified`。

---

### 问题 B：restoreState 后内容已新但按钮显示脏

**场景**：文件脏（SSE 通知后未 refresh）→ 页面刷新

`restoreState` 从磁盘读取最新 content，但 `displayedModified` 恢复为旧的保存值。
结果：正文是新内容，但 `lastModified > displayedModified` → 按钮误显示。

**修复方向**：`restoreState` 加载完 content 后，`displayedModified` 应该对齐 `fileData.lastModified`。
旧的 `savedDisplayedModified` 只在"磁盘文件未变化"时才有意义，
而此时 `fileData.lastModified == savedDisplayedModified`，结果相同，可以直接用 `fileData.lastModified`。

---

### 问题 C："左上角整体更新"能解决，但不应该是必要操作

手动触发全局 refresh 走链路 2，强制 `syncFileFromDisk` 把 content + displayedModified 都更新，
绕过了问题 A/B 的不一致状态。这条路径本身是正确的，但不应该是唯一出路。

---

## 修复结论

**不变式**：`content` 被更新时，`displayedModified` 必须同步对齐到对应的 mtime。
唯一例外是 diff 视图进行中（用户在看 diff 但还没 accept）——此时 content 未变，pendingContent 是新内容。

| 问题 | 修复位置 | 修复方式 |
|------|---------|---------|
| A | `addOrUpdateFile` (state.ts) | 写入 content 时，同步 `displayedModified = lastModified` |
| B | `restoreState` (state.ts) | 用 `fileData.lastModified` 替代 `savedDisplayedModified` |
| 轮询间隔 | `startWorkspacePolling` (main.ts) + `AppConfig` | 改为配置项，默认 5000ms |
