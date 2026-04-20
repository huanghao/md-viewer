# 代码质量审计报告

> 生成日期：2026-04-20  
> 更新日期：2026-04-20（重构已完成）  
> 代码库规模：22,777 行 / 68 个 TypeScript 文件

---

## 概览

| 问题类别 | 数量 | 高优先级 |
|---------|------|---------|
| 重复代码模式 | 4 | 3 |
| 文件结构问题 | 2 | 1 |
| 性能问题 | 1 | 1 |
| CSS 结构问题 | 1 | 0 |

**估计可消除重复代码：~200 行**  
**最高价值改动：localStorage 工具化（10 分钟改动，影响 12 个文件）**

---

## Part 1 — 技术债务清单

### ~~D1. `localStorage` 读写模式散落全库~~ ✅ 已修复

**严重程度：** 中  
**影响文件：** 12 个（不含 embedded-client.ts）  
**修复：** 新建 `src/client/utils/storage.ts`，迁移了 `config.ts`、`main.ts`、`annotation.ts`、`pinned-files.ts`、`workspace-focus.ts`、`workspace-state-persistence.ts`、`workspace-tree-expansion-persistence.ts`。`state.ts`（有特殊 QuotaExceededError retry 逻辑）和 `pdf-translation.ts`（有 key 枚举/removeItem 操作）暂未迁移。

相同的 `try { JSON.parse(localStorage.getItem(KEY)) } catch { return fallback }` 模式在以下位置各自实现：

| 文件 | 行号 | 模式 |
|-----|------|------|
| `src/client/config.ts` | 17–30 | getItem + JSON.parse + fallback |
| `src/client/config.ts` | 34–39 | setItem + JSON.stringify |
| `src/client/main.ts` | 257–259 | getItem + JSON.parse + fallback |
| `src/client/main.ts` | 265 | setItem + JSON.stringify |
| `src/client/main.ts` | 301 | getItem + Number() |
| `src/client/state.ts` | 59, 79, 117, 153 | 多次 setItem/getItem |
| `src/client/annotation.ts` | 513–523 | getItem + JSON.parse + setItem |
| `src/client/annotation.ts` | 540–544 | setItem/getItem + Number() |
| `src/client/workspace-state-persistence.ts` | 5–40 | 完整的 save/restore 模式 |
| `src/client/workspace-tree-expansion-persistence.ts` | 13–22 | 同上 |
| `src/client/ui/workspace-focus.ts` | 66–73 | getItem + JSON.parse + setItem |
| `src/client/utils/pinned-files.ts` | 5–16 | getItem + JSON.parse + setItem |
| `src/client/pdf-translation.ts` | 120, 208, 218, 270 | 多次 getItem/setItem |

**问题：** 每处都单独处理 JSON 解析失败、null 值、类型转换，行为不一致。

**修复方向：** 提取 `src/client/utils/storage.ts`：
```typescript
export function storageGet<T>(key: string, fallback: T): T
export function storageSet<T>(key: string, value: T): void
export function storageGetNumber(key: string, fallback: number): number
```

---

### ~~D2. `handlers.ts` 中 annotation API 的参数提取套板重复~~ ✅ 已修复

**严重程度：** 中  
**影响文件：** `src/handlers.ts`（行 702–820）  
**修复：** 提取了 `parseAnnotationRef(body)` 函数，4 个 handler 统一使用。

4 个 annotation 处理函数（`handleUpsertAnnotation`、`handleReplyAnnotation`、`handleDeleteAnnotation`、`handleUpdateAnnotationStatus`）共享完全相同的结构：

```typescript
// 每个函数都重复这个骨架（行 702, 718, 745, 765）
try {
  const body = await c.req.json();
  const path = typeof body?.path === "string" ? body.path : "";
  const id = typeof body?.id === "string" ? body.id : undefined;
  const serial = Number(body?.serial);
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  // ...
} catch (error: any) {
  return c.json({ error: error?.message || "操作失败" }, 500);
}
```

`path`/`id`/`serial` 的提取逻辑在 4 处完全相同（行 705–706, 721–723, 748–750, 768–770）。

**修复方向：** 提取 `parseAnnotationBody(body)` 工具函数，或用一个通用的 `withAnnotationBody(handler)` 包装器。

---

### ~~D3. 拖拽 resizer 逻辑完全重复~~ ✅ 已修复

**严重程度：** 低  
**影响文件：** `src/client/main.ts`（行 232–239）、`src/client/annotation.ts`（行 1903–1922）  
**修复：** 新建 `src/client/utils/resizer.ts`，导出 `createResizer(options)`，两处均已迁移。

两处实现了几乎相同的 mousedown → mousemove → mouseup 拖拽逻辑，仅 CSS 类名和宽度变量不同：

```typescript
// main.ts:232 — sidebar resizer
resizer.addEventListener('mousedown', (event) => {
  document.body.classList.add('sidebar-resizing');
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// annotation.ts:1903 — annotation sidebar resizer（结构完全相同）
getElements().sidebarResizer?.addEventListener('mousedown', (event) => {
  document.body.classList.add('annotation-sidebar-resizing');
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});
```

**修复方向：** 提取 `src/client/utils/resizer.ts` 的 `createResizer(options)` 工具函数。

---

### ~~D4. `annotation.ts` 的 `getElements()` 每次调用重新查询 DOM~~ ✅ 已修复

**严重程度：** 高（性能问题）  
**影响文件：** `src/client/annotation.ts`（行 243–266，调用点 25+ 处）  
**修复：** 改为懒加载单例（`queryAnnotationElements` + `_cachedElements ??=`），`initAnnotationElements` 时重置缓存。

`getElements()` 函数（行 243）每次调用都重新执行 17 次 `document.getElementById()`，没有任何缓存：

```typescript
// annotation.ts:243 — 每次调用都重新查询
function getElements() {
  return {
    sidebar: document.getElementById('annotationSidebar'),
    sidebarResizer: document.getElementById('annotationSidebarResizer'),
    // ... 共 17 个 getElementById
  };
}
```

调用点分布在 `initAnnotationElements`、事件处理、渲染函数等 25+ 处，其中部分在高频事件（scroll、mousemove）的回调中被间接触发。

**修复方向：** 将 `getElements()` 改为懒加载单例，或在 `initAnnotationElements` 时缓存一次，之后直接引用缓存对象。

---

### D5. `main.ts` 功能过度集中（2,840 行）

**严重程度：** 中  
**影响文件：** `src/client/main.ts`

文件混合了至少 6 个功能模块，边界不清晰：

| 行范围 | 功能 | 理想归属 |
|--------|------|---------|
| 600–1200 | PDF viewer 集成 | `pdf-manager.ts` |
| 1200–1600 | 文件 diff 处理 | `diff-manager.ts` 或 `main.ts` |
| 1600–2000 | 批注/标签处理 | `annotation.ts` 已有模块 |
| 2000–2300 | 全局快捷键 | `keyboard.ts` |
| 1961–1970 | fontScale 状态 | `state.ts` 或 `config.ts` |

特别是 PDF 相关的 localStorage 操作（行 912, 1067, 2010, 2020）分散在文件各处，与 `pdf-viewer.ts` 的职责重叠。

---

### D6. `css.ts` 面板和 resizer 样式重复（3,858 行）

**严重程度：** 低  
**影响文件：** `src/client/css.ts`

三个侧边栏（主 sidebar、annotation sidebar、TOC pane）的 collapsed 状态处理、resizer 样式高度相似，分散在文件各处：

- 主 sidebar collapsed 逻辑（约行 63–68）
- annotation sidebar collapsed 逻辑（约行 2537–2542）  
- resizer hover 样式在两处各自定义（约行 131–150 vs 2542–2580）

另外，`#0969da`（主色）在 CSS 中硬编码多次，未统一用 CSS 变量。

---

## Part 2 — 重构优先级评估

### 优先级矩阵

| 优先级 | 问题 | 改动成本 | 收益 | 状态 |
|--------|------|---------|------|------|
| **P0** | D4: `getElements()` 无缓存 | 低 | 高 | ✅ 已完成 |
| **P0** | D1: localStorage 模式重复 | 低 | 高 | ✅ 已完成（部分：state.ts/pdf-translation.ts 未迁移） |
| **P1** | D2: handlers.ts 参数套板 | 低 | 中 | ✅ 已完成 |
| **P1** | D5: main.ts 过大 | 高 | 中 | 待处理 |
| **P2** | D3: resizer 逻辑重复 | 低 | 低 | ✅ 已完成 |
| **P2** | D6: CSS 面板样式重复 | 中 | 低 | 待处理 |

---

### ~~P0 — 立即处理~~ ✅ 全部完成（2026-04-20）

#### ~~P0-A: 修复 `getElements()` 缓存问题~~

**文件：** `src/client/annotation.ts:243`  
**改动：** 把 `getElements()` 改为模块级缓存变量，在 `initAnnotationElements` 时初始化一次。

```typescript
// 改前：每次调用重新查询
function getElements() { return { sidebar: document.getElementById('...'), ... } }

// 改后：懒加载单例
let _elements: ReturnType<typeof queryElements> | null = null;
function queryElements() { return { sidebar: document.getElementById('annotationSidebar'), ... } }
function getElements() { return _elements ??= queryElements(); }
export function clearElementsCache() { _elements = null; } // 供测试用
```

**风险：** 极低。DOM 元素在页面生命周期内不变。

---

#### ~~P0-B: 提取 `localStorage` 工具函数~~

**新文件：** `src/client/utils/storage.ts`  
**影响：** 12 个文件统一使用，消除各自的 try-catch 和 JSON 解析代码。

```typescript
export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] 保存 ${key} 失败:`, e);
  }
}

export function storageGetNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
```

**风险：** 低。需要逐文件验证替换后的行为一致（特别是 `workspace-state-persistence.ts` 中有自定义的数组格式验证逻辑，需要保留）。

---

### P1 — 计划处理

#### ~~P1-A: 提取 `handlers.ts` 参数解析~~ ✅ 已完成

**文件：** `src/handlers.ts:702–820`  
**改动：** 提取 `parseAnnotationRef(body)` 函数，返回 `{ path, id, serial }` 或抛出 400 错误。

---

#### P1-B: 拆分 `main.ts`

建议按以下顺序拆分，每步独立可测试：

1. 提取 PDF scroll/zoom 的 localStorage 操作 → 移入 `pdf-viewer.ts` 或新建 `pdf-state.ts`
2. 提取全局快捷键注册 → `src/client/keyboard.ts`
3. 提取 fontScale 状态 → `src/client/state.ts`

**风险：** 中。`main.ts` 中有大量跨功能的状态引用，拆分时需要仔细处理依赖方向，避免循环引用。建议先写好现有功能的集成测试再拆。

---

### P2 — 有空时处理

#### ~~P2-A: 提取 resizer 工具函数~~ ✅ 已完成

**文件：** `src/client/utils/resizer.ts`（已新建）

#### P2-B: 统一 CSS 面板样式

将三个侧边栏共用的 collapsed/resizer 样式提取为 `.panel-base` 和 `.panel-resizer` 公共类，减少约 60 行重复 CSS。

---

## 附录：不建议改动的地方

- **`workspace-state-*.ts` 系列（4 个文件）：** 虽然总行数只有 156 行，但职责分离清晰（diff/persistence/missing），不建议合并。
- **`annotation.ts` 内部的 `mousedown` 条件检查（行 1957–1992）：** 三组逻辑虽然结构相似，但每组的"排除元素"不同，提取后反而会增加参数复杂度。
- **`css.ts` 整体拆分：** 目前是构建时内联的字符串常量，拆分需要改构建方式，成本高于收益。
