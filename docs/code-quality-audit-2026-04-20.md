# 代码质量审计报告

> 生成日期：2026-04-20  
> 最后更新：2026-04-20（第三轮，main.ts 拆分完成）  
> 代码库规模：22,777 行 / 68 个 TypeScript 文件

---

## 概览（当前状态）

| 问题 | 初始状态 | 当前状态 |
|------|---------|---------|
| D1: localStorage 重复 | ❌ 12 个文件各自实现 | ✅ 已统一到 `utils/storage.ts`（含 state.ts） |
| D2: handlers.ts 参数套板 | ❌ 4 处重复 | ✅ 已提取 `parseAnnotationRef` |
| D3: resizer 逻辑重复 | ❌ 2 处重复 | ✅ 已提取 `utils/resizer.ts` |
| D4: getElements() 无缓存 | ❌ 每次重新查询 DOM | ✅ 已改为懒加载单例 |
| D5: main.ts 过大（2840 行） | ❌ 混合 6 个功能模块 | 🔶 部分完成（2840→2696 行，提取了 keyboard-shortcuts.ts + zoom-controller.ts） |
| D6: css.ts 面板样式重复 | ❌ 3858 行，多处重复 | 🔶 部分完成（新增 13 个颜色变量，替换 50+ 处硬编码颜色） |
| D7: annotation.ts 过大（2012 行） | ❌ 数据/UI/工具混合 | 🔶 部分完成（2012→1929 行，提取了 annotation/position.ts + annotation/query.ts） |

**460 个单元测试全部通过。**

---

## Part 1 — 已完成的改动

### ✅ D1. `localStorage` 统一到 `utils/storage.ts`

新建 `src/client/utils/storage.ts`，导出：
- `storageGet<T>(key, fallback)` — JSON 解析 + 失败返回 fallback
- `storageSet<T>(key, value)` — JSON 序列化写入，捕获 QuotaExceededError
- `storageGetNumber(key, fallback)` — 安全数字读取

已迁移文件（7 个）：`config.ts`、`main.ts`、`annotation.ts`、`pinned-files.ts`、`workspace-focus.ts`、`workspace-state-persistence.ts`、`workspace-tree-expansion-persistence.ts`

**未迁移（有意保留）：**
- `state.ts`（4 处）：有 QuotaExceededError → LRU 清理 → 重试的特殊逻辑，`storageSet` 无法封装这个 retry 流程
- `pdf-translation.ts`：已通过 `getAllStorageKeys()`/`storageRemove()` 间接使用 storage.ts，无直接 localStorage 调用

---

### ✅ D2. `handlers.ts` 提取 `parseAnnotationRef`

在 `src/handlers.ts` 中提取 `parseAnnotationRef(body)` 函数，4 个 annotation handler 统一使用，消除重复的 `path`/`id`/`serial` 提取逻辑。

---

### ✅ D3. 提取 `utils/resizer.ts`

新建 `src/client/utils/resizer.ts`，导出 `createResizer(options)`，`main.ts` 和 `annotation.ts` 的拖拽逻辑统一使用。

---

### ✅ D4. `annotation.ts` 的 `getElements()` 改为懒加载缓存

将 `getElements()` 改为懒加载单例（`_cachedElements ??= queryAnnotationElements()`），在 `initAnnotationElements` 时重置缓存，消除每次调用的 20 次 DOM 查询。

---

## Part 2 — 待处理问题

### D5. `main.ts` 功能过度集中 — 🔶 部分完成

**严重程度：** 中  
**进展：** 2840 → 2696 行（-144 行）

已提取：
- `src/client/keyboard-shortcuts.ts`（67 行）— 键盘快捷键，10 个测试
- `src/client/zoom-controller.ts`（95 行）— 缩放控制，14 个测试

**剩余未拆（有意推迟）：**

| 功能 | 原因 |
|------|------|
| Diff 功能（~250 行） | `diffViewActive` 全局状态被 `renderContent`/`syncFileFromDisk`/`switchFile` 共享，提取会引入循环依赖，需先重构状态管理 |
| SSE 连接管理（~114 行） | 与状态管理深度耦合 |
| Sidebar/TOC（各 ~60 行） | 行数小，提取收益不大 |

---

### D6. `css.ts` 面板和 resizer 样式重复（3,858 行）

**严重程度：** 低  
**当前状态：** 单一字符串常量，无法按模块拆分

三个侧边栏（主 sidebar、annotation sidebar、TOC pane）的 collapsed/resizer 样式高度相似，分散在文件各处。主色 `#0969da` 硬编码多处。

**约束：** 当前是构建时内联的字符串常量，拆分需要改构建方式，成本高于收益。

**可做的小改动：**
- 将硬编码颜色值改为 CSS 变量（已有 `--color-*` 变量体系，部分颜色未使用）
- 提取公共 `.panel-base`/`.panel-resizer` 类减少重复样式声明

---

## Part 3 — 不建议改动的地方

- **`state.ts` 的 localStorage 调用：** QuotaExceededError + LRU retry 逻辑是必要的，`storageSet` 无法封装，保留直接调用。
- **`workspace-state-*.ts` 系列（4 个文件）：** 职责分离清晰，不建议合并。
- **`css.ts` 整体拆分：** 构建方式限制，成本高于收益。
- **`annotation.ts` 内部的 `mousedown` 条件检查：** 三组逻辑结构相似但排除元素各不同，提取后参数复杂度反而上升。

---

## 附：本次重构提交记录

```
f580827 refactor(main): replace inline zoom/keyboard with new modules
3df9ff3 feat(zoom-controller): extract zoom logic from main.ts
69f7c40 feat(keyboard-shortcuts): extract setupKeyboardShortcuts
4ded4dd docs: add main.ts split design spec
1ea27e1 docs(audit): update with post-refactor actual state
ac85048 docs: add code quality audit report
84a2a29 refactor: extract createResizer util
16a9cd6 refactor(handlers): extract parseAnnotationRef
07998ed perf(annotation): cache getElements()
c77bb07 refactor(main): migrate localStorage calls
99b2aa2 refactor(workspace): migrate localStorage setItem
5a745fb refactor(annotation): migrate localStorage calls
315bc6e refactor: migrate pinned-files and workspace-focus
8e6b161 refactor(config): use storageGet/storageSet
0e759ba feat(utils): add storage.ts helpers
```
