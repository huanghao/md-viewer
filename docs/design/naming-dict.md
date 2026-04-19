# MDV 项目命名字典

> 开发者沟通用词汇表。更新时间：2026-04-19

---

## 一、整体布局

```
┌─────────────────────────────────────────────────────────┐
│  sidebar  │           main                │ annotation  │
│  (左侧栏) │  toolbar                      │  sidebar    │
│           │  tabs                         │  (右侧栏)   │
│           │  content                      │             │
└─────────────────────────────────────────────────────────┘
```

| 中文名 | 代号 | HTML | 说明 |
|--------|------|------|------|
| 左侧栏 | sidebar | `.sidebar` | 文件树/搜索面板 |
| 主区域 | main | `.main` | 工具栏 + 标签页 + 内容区 |
| 右侧栏 | annotation sidebar | `.annotation-sidebar` | 批注/翻译面板 |
| 左侧栏拖拽条 | sidebar resizer | `.sidebar-resizer` | 拖动调整左侧栏宽度 |
| 右侧栏拖拽条 | annotation sidebar resizer | `.annotation-sidebar-resizer` | 拖动调整右侧栏宽度 |

**CSS 变量：**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--sidebar-width` | 260px | 左侧栏宽度 |
| `--annotation-sidebar-width` | 320px | 右侧栏宽度 |
| `--font-scale` | 1 | 全局字体缩放 |

---

## 二、左侧栏（Sidebar）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 搜索框 | search box | `#searchBox` / `#searchInput` | 路径搜索 + 自动补全 |
| 收起按钮 | collapse btn | `#sidebarCollapseBtn` | 收起左侧栏 |
| 展开浮动按钮 | floating open btn | `#sidebarFloatingOpenBtn` | 左侧栏收起时显示，点击展开 |
| 视图模式切换 | view tabs | `.view-tabs` | list / focus / full 三种视图 |
| 当前路径 | current path | `#currentPath` | 显示当前打开文件的路径 |
| 文件列表 | file list | `#fileList` / `.file-list` | 文件列表容器 |
| 文件树项 | tree item | `.tree-item` | 树形视图下的目录/文件项 |
| 当前文件项 | current item | `.tree-item.current` | 当前选中的文件 |
| 快速操作确认条 | quick action confirm | `#quickActionConfirm` | 添加文件/工作区时出现的确认条 |

**侧栏状态（body class）：**

| class | 说明 |
|-------|------|
| `body.sidebar-collapsed` | 左侧栏已收起 |
| `body.sidebar-resizing` | 正在拖拽调整左侧栏宽度 |

---

## 三、工具栏（Toolbar）

| 中文名 | 代号 | HTML id | 说明 |
|--------|------|---------|------|
| 面包屑 | breadcrumb | `#breadcrumb` | 当前文件路径导航 |
| 设置按钮 | settings btn | `#settingsButtonText` | 打开设置对话框 |
| Diff 按钮 | diff btn | `#diffButton` | 打开/关闭 Diff 视图 |
| 刷新按钮 | refresh btn | `#refreshButton` | 重新加载当前文件 |
| 监控按钮 | monitor btn | `#monitorButton` | 打开系统监控浮窗 |
| 字体缩放按钮 | font scale btn | `#fontScaleButton` | 调整字体大小 |
| 连接状态 | connection status | `#connectionStatus` | SSE 连接状态指示 |
| 文件元数据 | file meta | `#fileMeta` | 显示文件大小/修改时间等 |

---

## 四、标签页（Tabs）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 标签页容器 | tabs | `#tabs` / `.tabs` | 顶部文件标签页 |
| 标签页项 | tab item | `.tab-item` | 单个标签页 |
| 当前标签页 | current tab | `.tab-item.current` | 当前激活的标签页 |
| 标签页管理器 | tab manager | `#tabManager` | 标签页管理浮窗（多标签时） |

---

## 五、内容区（Content）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 内容容器 | content | `#content` / `.content` | 文件内容主容器，也是滚动容器 |
| 阅读区 | reader | `#reader` | Markdown 渲染内容区 |
| Markdown 内容 | markdown body | `.markdown-body` | Markdown 渲染结果 |
| 欢迎页 | empty state | `.empty-state` | 无文件打开时的欢迎界面 |
| 文件状态提示 | file status | `.content-file-status` | 文件已删除等提示 |
| HTML 预览 | html preview | `.html-preview-frame` | HTML 文件的 iframe 预览 |
| PDF 查看器 | pdf viewer | `.pdf-viewer-container` | PDF 渲染容器 |

---

## 六、Diff 视图

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| Diff 导航条 | diff banner | `#diffBanner` / `.diff-banner` | Diff 模式下顶部的导航条 |
| 上一处按钮 | diff prev | `#diffNavPrev` | 跳到上一个差异块 |
| 下一处按钮 | diff next | `#diffNavNext` | 跳到下一个差异块 |
| 块计数 | diff count | `#diffNavCount` | 显示"当前块/总块数" |
| 采用新版本 | accept btn | `.diff-accept-btn` | 用磁盘最新内容替换当前内容 |
| 差异块 | diff group | `.diff-group` | 一组相邻的变更行 |
| 当前焦点块 | focused block | `.diff-group.diff-focused` | 当前导航到的差异块 |
| 删除行 | delete block | `.diff-block-delete` | 红色，被删除的内容 |
| 插入行 | insert block | `.diff-block-insert` | 绿色，新增的内容 |
| 上下文行 | context | `.diff-group-context` | 差异块周围未变化的内容 |
| Diff 激活状态 | diff active | `.content.diff-active` | Diff 视图开启时 content 的状态 |

---

## 七、页内查找（Find Bar）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 查找栏 | find bar | `#findBar` | 页内查找工具栏（Cmd+F 触发） |
| 查找输入框 | find input | `#findBarInput` | 关键词输入 |
| 匹配计数 | find count | `#findBarCount` | 显示"3/12"等 |
| 上一个 | find prev | `#findBarPrev` | 跳到上一个匹配 |
| 下一个 | find next | `#findBarNext` | 跳到下一个匹配 |
| 匹配高亮 | find highlight | `.find-highlight` | 所有匹配项的高亮 |
| 当前匹配 | current highlight | `.find-highlight-current` | 当前聚焦的匹配项 |

---

## 八、自定义滚动条（Doc Scrollbar）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 滚动条容器 | doc scrollbar | `#docScrollbar` / `.doc-scrollbar` | 覆盖在内容区右侧的自定义滚动条 |
| 滚动条滑块 | thumb | `.doc-scrollbar-thumb` | 可拖动的滑块 |
| Diff 标记 | scrollbar markers | `.doc-scrollbar-markers` | 滚动条上显示 Diff 位置的小标记 |

---

## 九、系统监控浮窗（Monitor Panel）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 监控面板 | monitor panel | `#monitorPanel` / `.monitor-panel` | 工具栏监控按钮打开的浮窗 |
| 内存标签页 | memory tab | `#monitorTabMemory` | PDF 内存占用统计 |
| 翻译标签页 | translation tab | `#monitorTabTranslation` | 翻译请求统计 |

---

## 十、右侧栏 — 批注/翻译（Annotation Sidebar）

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 批注标签页 | comments tab | `data-tab="comments"` | 显示批注列表 |
| 翻译标签页 | translation tab | `data-tab="translation"` | 显示 PDF 翻译结果 |
| 批注计数角标 | annotation count | `#annotationTabCount` | 批注标签页上的数字 |
| 翻译计数角标 | translation count | `#translationTabCount` | 翻译标签页上的数字 |
| 密度切换 | density toggle | `#annotationDensityToggle` | 切换"定位模式"和"极简列表"两种显示密度 |
| 筛选按钮 | filter toggle | `#annotationFilterToggle` | 打开筛选菜单 |
| 筛选菜单 | filter menu | `#annotationFilterMenu` | 全部 / 未解决 / 已解决 / 定位失败 |
| 批注列表 | annotation list | `#annotationList` | 批注条目列表 |
| 翻译列表 | translation list | `#translationList` | 翻译结果列表 |
| 翻译状态点 | translation status dot | `#translationStatusDot` | 翻译服务连接状态指示 |
| 浮动展开按钮 | floating open btn | `#annotationFloatingOpenBtn` | 右侧栏收起时显示 |

**右侧栏状态（body class）：**

| class | 说明 |
|-------|------|
| `body.annotation-sidebar-collapsed` | 右侧栏已收起 |
| `body.annotation-sidebar-resizing` | 正在拖拽调整右侧栏宽度 |

---

## 十一、批注 UI 组件

| 中文名 | 代号 | HTML id / class | 说明 |
|--------|------|-----------------|------|
| 快速添加按钮 | quick-add | `#annotationQuickAdd` / `.annotation-quick-add` | 选中文字/拉框后出现的 [+] 圆形按钮 |
| **composer** | composer | `#annotationComposer` / `.annotation-composer` | 点 [+] 后弹出的**写评论输入框** |
| **popover** | popover | `#annotationPopover` / `.annotation-popover` | 点击高亮/矩形后弹出的**只读评论浮窗** |
| 批注条目 | annotation item | `.annotation-item` | 列表里的单条批注 |
| 评论线程 | thread | `.annotation-thread` | 一条批注下的所有评论（含回复） |

### 高亮标记

| 中文名 | CSS class | 说明 |
|--------|-----------|------|
| MD 高亮 | `.annotation-mark` | MD 文件里的黄色背景高亮 span |
| MD 临时高亮 | `.annotation-mark-temp` | 点 [+] 后、保存前的黄色下划线 span |
| PDF 选中矩形（蓝） | `.pdf-selection-mark` | 拉框时的蓝色临时矩形 |
| PDF 临时矩形（黄） | `.pdf-selection-mark-temp` | 点 [+] 后变黄色的临时矩形 |

### 批注状态

| 状态值 | CSS class | 说明 |
|--------|-----------|------|
| `anchored` | `.status-exact`（置信度≥0.95）/ `.status-reanchored`（<0.95） | 已定位，高亮正常显示 |
| `unanchored` | `.status-orphan` | 失位，文本已改变，无法定位 |
| `resolved` | `.is-resolved` | 用户标记为已解决 |

### 交互流程

**MD 批注：**
```
选中文字 → [+] 出现（蓝色 selection）
→ 点 [+] → composer 出现（黄色下划线）
→ 保存 → applyAnnotations（持久黄色背景高亮）
→ 点高亮 / 侧边栏点条目 → popover
```

**PDF 批注：**
```
拉框 → 蓝色矩形 + [+] 出现
→ 点 [+] → 矩形变黄 + composer 出现
→ 保存 → 持久黄色矩形（canvas）+ 锚点 div
→ 点矩形 / 侧边栏点条目 → popover（矩形右下角）
```

---

## 十二、PDF 专属组件

| 中文名 | 代号 | CSS class | 说明 |
|--------|------|-----------|------|
| PDF 查看器容器 | pdf viewer | `.pdf-viewer-container` | 整个 PDF 查看器的根 div |
| 页面包装器 | page wrapper | `.pdf-page-wrapper` | 每页 PDF 的容器 |
| 文本层 | text layer | `.pdf-text-layer` | PDF.js 生成的透明 span 层（pointer-events:none） |
| 选区 overlay canvas | select overlay | `.pdf-select-overlay` | 每页顶层的透明 canvas，捕获鼠标、绘制矩形 |
| 矩形高亮 | rect highlight | — | canvas 上绘制的持久黄色矩形（保存批注后） |
| 锚点 div | rect anchor | `.pdf-rect-anchor` | 零尺寸 div，挂 `data-annotation-id`，供跳转定位用 |
| 翻译按钮 | translate btn | `.pdf-translate-btn` | 悬停段落时出现的"译"按钮 |

---

## 十三、数据结构关键字段

### Annotation（批注）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUID，批注唯一标识 |
| `serial` | number | 序号，显示为 #1、#2 |
| `start` | number | MD：全局文本 offset；PDF：TextItem 数组索引 |
| `length` | number | MD：字符数；PDF：item 数量 |
| `quote` | string | 被批注的原始文本 |
| `quotePrefix` | string | 前文上下文（用于重新定位） |
| `quoteSuffix` | string | 后文上下文（用于重新定位） |
| `status` | `'anchored'` \| `'unanchored'` \| `'resolved'` | 批注状态 |
| `confidence` | number | 定位置信度 0–1 |
| `thread` | `AnnotationThreadItem[]` | 评论线程（首条 type='comment'，后续 type='reply'） |
| `rectCoords` | `{x1,y1,x2,y2}` | PDF 专属：矩形坐标（PDF 坐标系，pt，未乘 scale） |
| `page` | number | PDF 专属：页码（从 1 开始） |
| `fileType` | `'md'` \| `'pdf'` | 文件类型 |

### FileInfo（会话文件）

| 字段 | 说明 |
|------|------|
| `path` | 文件完整路径 |
| `content` | 当前展示的文件内容 |
| `pendingContent` | 磁盘最新内容（Diff 用） |
| `lastModified` | 磁盘文件修改时间戳 |
| `savedScrollTop` | 上次阅读位置 |
| `isMissing` | 文件是否已被删除 |

### Workspace（工作区）

| 字段 | 说明 |
|------|------|
| `id` | 工作区唯一 ID |
| `name` | 工作区名称 |
| `path` | 工作区根路径 |

---

## 十四、关键函数速查

| 函数 | 文件 | 说明 |
|------|------|------|
| `showQuickAdd(x, y, pending)` | annotation.ts | 显示 [+] 按钮 |
| `hideQuickAdd(clearPending?)` | annotation.ts | 隐藏 [+] 按钮 |
| `openComposerFromPending()` | annotation.ts | 点 [+] 后打开 composer |
| `savePendingAnnotation(filePath)` | annotation.ts | 保存 composer 里的评论 |
| `showPopover(ann, x, y)` | annotation.ts | 在指定坐标显示 popover |
| `setActiveAnnotation(id, filePath)` | annotation.ts | 侧边栏点条目，跳转 + 显示 popover |
| `applyAnnotations()` | annotation.ts | 重新渲染所有高亮（MD） |
| `renderAnnotationList(filePath)` | annotation.ts | 刷新侧边栏列表 |
| `renderHighlights(annotations)` | pdf-annotation.ts | 渲染所有 PDF 矩形高亮 |
| `drawTempRect(page, x1,y1,x2,y2, style)` | pdf-viewer.ts | 绘制临时矩形（'blue' 或 'yellow'） |
| `clearTempRect(page?)` | pdf-viewer.ts | 清除临时矩形 |
| `renderRectHighlight(page, x1,y1,x2,y2, id)` | pdf-viewer.ts | 绘制持久矩形 + 插入锚点 div |

---

## 十五、状态变量（`AnnotationState`）

| 变量 | 说明 |
|------|------|
| `state.pendingAnnotation` | 当前正在编辑的批注（选中后、保存前） |
| `state.pinnedAnnotationId` | 当前 popover 显示的批注 id |
| `state.activeAnnotationId` | 侧边栏当前选中的批注 id |
| `state.annotations` | 当前文件的所有批注数组 |
| `state.filter` | 侧边栏筛选器：`'all'` / `'open'` / `'resolved'` / `'orphan'` |
| `state.density` | 列表密度：`'default'`（定位模式）/ `'simple'`（极简列表） |

---

## 十六、LocalStorage 键名

| 键名 | 说明 |
|------|------|
| `md-viewer:openFiles` | 会话文件状态（路径、滚动位置等） |
| `md-viewer:sidebar-width` | 左侧栏宽度（px） |
| `md-viewer:sidebar-collapsed` | 左侧栏是否收起（'0'/'1'） |
| `md-viewer:annotation-sidebar-width` | 右侧栏宽度（px） |
| `md-viewer:annotation-density` | 批注显示密度（'default'/'simple'） |
| `md-viewer:annotation-panel-open-by-file` | 各文件的右侧栏展开状态 |
| `fontScale` | 全局字体缩放（浮点数） |
| `md-viewer:pdf-scroll:${path}` | PDF 文件滚动位置 |
| `md-viewer:workspace-expanded:${wsId}` | 工作区文件树展开状态 |

---

## 十七、SSE 事件类型

| 事件 | 说明 |
|------|------|
| `connected` | SSE 连接建立 |
| `file-changed` | 文件内容已在磁盘更新 |
| `file-deleted` | 文件已被删除 |
| `file-opened` | CLI 触发打开文件 |
| `translate-status` | 翻译服务上线/下线 |

---

## 十八、API 路由速查

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/file` | GET | 获取文件内容 |
| `/api/files` | GET | 获取目录文件列表 |
| `/api/nearby` | GET | 获取附近文件 |
| `/api/path-suggestions` | GET | 路径自动补全 |
| `/api/events` | GET | SSE 事件流 |
| `/api/scan-workspace` | POST | 扫描工作区文件树 |
| `/api/annotations` | GET/POST | 批注 CRUD |
| `/api/annotations/item` | POST | 创建/更新单条批注 |
| `/api/translate` | POST | PDF/文本翻译 |
| `/api/pdf-asset` | GET | 获取 PDF 文件（供 PDF.js 使用） |
| `/api/config` | GET | 客户端配置 |

---

## 十九、文件关系术语

| 术语 | 英文 | 说明 |
|------|------|------|
| 伴生文件 | sidecar file | 与主文件同名、不同扩展名的配套文件，放在同一目录下。例：`report.pdf` 旁边的 `report.pdf.toc.md`（目录缓存）或 `report.pdf.annotations.json`（批注数据）。 |

---

## 二十、键盘快捷键

| 快捷键 | 说明 |
|--------|------|
| `Cmd/Ctrl+K` | 聚焦搜索框 |
| `Cmd/Ctrl+W` | 关闭当前标签页 |
| `Cmd/Ctrl+F` | 打开页内查找栏 |
| `Cmd/Ctrl+G` / `Shift+Cmd/Ctrl+G` | 查找下一个/上一个 |
| `N` / `P`（Diff 模式） | 下一个/上一个差异块 |
| `Esc` | 关闭查找栏 / popover / 设置对话框 |
| `Cmd+Enter`（composer 输入框） | 提交批注 |

---

## 二十、Z-index 层级

| 变量 | 值 | 用途 |
|------|----|------|
| `--z-menu` | 20 | 普通菜单 |
| `--z-scrollbar` | 50 | 自定义滚动条 |
| `--z-sidebar` | 80 | 侧栏 |
| `--z-floating-btn` | 90 | 侧栏收起时的浮动按钮 |
| `--z-dropdown` | 1000 | 下拉菜单 |
| `--z-tab-manager` | 2100 | 标签页管理器 |
| `--z-autocomplete` | 2500 | 路径自动补全 |
| `--z-quick-action` | 2601 | 快速操作确认条 |
| `--z-overlay` | 9000 | 全屏遮罩 |
| `--z-popover` | 9998 | 批注 popover |
| `--z-quick-add` | 9999 | 批注 quick-add / composer |
| `--z-find-bar` | 10000 | 页内查找栏 |
