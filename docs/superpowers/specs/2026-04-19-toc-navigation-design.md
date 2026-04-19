# TOC 导航目录功能设计

**日期：** 2026-04-19  
**状态：** 待实现

---

## 需求概述

为 MD 和 PDF 文件提供导航目录（TOC），显示在左侧边栏下半部分，支持点击跳转。

---

## 功能范围

- MD 文件：解析 `#` 标题，同步生成 TOC
- PDF 文件：优先读取内嵌 outline；无 outline 则懒加载扫描标题，扫描完成后写 sidecar 缓存文件（`foo.pdf.toc.json`）；下次打开直接读 sidecar
- TOC 面板与文件列表上下分栏，中间可拖动 resizer 调整高度比例
- 默认布局：文件列表在上，TOC 在下
- 分栏高度比例持久化到 localStorage

---

## 数据结构

```typescript
interface TocItem {
  title: string;
  level: number;       // 1=h1, 2=h2, 3=h3
  pageNum?: number;    // PDF：页码
  anchor?: string;     // MD：heading id（如 #introduction）
  children: TocItem[];
}
```

---

## 组件划分

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/client/toc-extractor.ts` | 新建 | TOC 提取逻辑：MD 解析、PDF outline 读取、PDF 懒加载扫描 |
| `src/client/ui/toc-panel.ts` | 新建 | TOC 面板渲染、高亮当前位置、点击跳转 |
| `src/client/ui/sidebar.ts` | 修改 | 增加上下分栏结构和 toc-resizer 拖拽逻辑 |
| `src/client/main.ts` | 修改 | 文件切换时触发 TOC 更新 |

---

## 数据流

**MD：** 打开文件 → `extractMdToc(content)` 同步解析 → 立即渲染

**PDF（有 outline）：** 打开 → `pdfDoc.getOutline()` → 立即渲染

**PDF（无 outline，无 sidecar）：** 打开 → 显示"扫描中…" → 后台逐页 `classifyPageItems()` → 增量更新 TOC → 扫描完写 `foo.pdf.toc.json`

**PDF（有 sidecar）：** 打开 → 读 sidecar → 立即渲染，跳过扫描

---

## 侧边栏布局

```
┌─────────────────┐
│  搜索框 / 视图切换  │
├─────────────────┤
│                 │
│   文件列表        │  ← 上半部分（默认较大）
│                 │
├──── resizer ────┤  ← 可拖动，调整上下高度比
│                 │
│   TOC 面板       │  ← 下半部分
│   1. Intro      │
│   2. Arch       │
│                 │
└─────────────────┘
```

- TOC 面板无内容时（非 MD/PDF，或 PDF 无标题）自动折叠隐藏 resizer
- 分栏高度比例存 `localStorage` key：`md-viewer:toc-pane-height`
- 默认 TOC 高度：`240px`

---

## 命名约定（新增到 naming-dict）

| 中文名 | 代号 | HTML class | 说明 |
|--------|------|-----------|------|
| TOC 面板 | toc panel | `.toc-panel` | 侧边栏下半部分的目录树 |
| TOC 分隔条 | toc resizer | `.toc-resizer` | 上下分栏的可拖动分隔线 |
| TOC 条目 | toc item | `.toc-item` | 单条目录项 |
| 当前 TOC 项 | toc item active | `.toc-item.active` | 当前阅读位置对应的目录项 |
| Sidecar 文件 | sidecar file | — | 与主文件同名、不同扩展名的伴生文件，如 `foo.pdf.toc.json` |

---

## 不在范围内

- TOC 面板位置上下互换的 UI 配置入口（预留 localStorage key，暂不做设置界面）
- PDF 扫描进度百分比显示
- TOC 搜索/过滤
