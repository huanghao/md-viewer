# 文件路径输入提示设计方案

## 盘点与统一更新（2026-03-01）

### 当前可输入“本地路径”的入口（2 处）
1. 侧边栏「添加文件」输入框（`#fileInput`）：输入 Markdown 文件路径
2. 工作区「添加工作区」输入框（`#addWorkspacePathInput`）：输入目录路径

### 现状结论
- 之前已有完整设计（本文件），但实现范围主要聚焦在“添加文件”场景与工作区导航。
- 代码层面此前没有统一的路径补全组件，不同输入框行为不一致。

### 本次统一方案
- 新增统一路径建议 API：`GET /api/path-suggestions`
- 新增统一前端组件：`attachPathAutocomplete(...)`
- 两个入口复用同一套交互（方向键、Enter/Tab 选中、Esc 关闭）：
  - 添加文件：`kind=file` + `markdownOnly=true`
  - 添加工作区：`kind=directory`

### 设计原则
1. 最小惊扰：仅在路径输入场景触发补全，不影响其他输入框
2. 统一体验：相同键盘交互、相同下拉样式、相同错误兜底
3. 可扩展：后续新增路径输入点时，直接复用同一组件

## 用户场景分析（2026-02-28 更新）

### 实际使用场景
1. **多工程协作**：经常在多个工程的 md 文件间切换
2. **目录聚集**：文件通常在几个固定目录（如 docs/, docs/design/, docs/tasks/）
3. **同工程切换**：频繁在同一工程的不同子目录间切换文件
4. **配合 Agent 工作**：主要用于和 AI Agent 协作，查看设计文档、任务文档等

### 核心问题
不是"怎么输入路径"，而是"怎么快速找到想要的文件"

---

## 重新思考：从"输入"到"导航"

### 新方案：工作区 + 目录树导航

#### 核心思路
1. **工作区（Workspace）概念**
   - 记住用户常用的几个工程根目录
   - 在侧边栏显示工作区列表
   - 点击工作区展开其目录树

2. **目录树导航**
   - 在侧边栏显示当前工作区的目录结构
   - 只显示包含 .md 文件的目录
   - 点击目录展开/折叠，点击文件打开

3. **保留输入框作为快速跳转**
   - 输入时在**当前工作区**内搜索
   - 支持模糊匹配文件名
   - 不需要输入完整路径

#### 视觉设计
```
┌─────────────────────────────────────┐
│ 🔍 搜索当前工作区...                 │
├─────────────────────────────────────┤
│ 工作区                               │
│ ▼ 📁 md-viewer                      │  ← 当前工作区（展开）
│   ├─ 📁 docs                        │
│   │  ├─ 📁 design (3)               │  ← 显示文件数
│   │  ├─ 📁 tasks (2)                │
│   │  └─ 📄 README.md                │
│   ├─ 📄 TODO.md                     │
│   └─ 📄 AGENTS.md                   │
│                                     │
│ ▶ 📁 another-project                │  ← 其他工作区（折叠）
│ ▶ 📁 notes                          │
├─────────────────────────────────────┤
│ ➕ 添加工作区                        │
└─────────────────────────────────────┘
```

---

## 待决策选项（重新设计）

### 核心问题：采用哪种导航模式？

**方案 X：工作区 + 目录树（全新方案，推荐）**
```
侧边栏分为三部分：
┌─────────────────────────────────────┐
│ [1] 搜索区                           │
│ 🔍 搜索当前工作区...                 │
├─────────────────────────────────────┤
│ [2] 工作区导航                       │
│ ▼ 📁 md-viewer (当前)               │
│   ├─ 📁 docs                        │
│   │  ├─ 📁 design (3)               │
│   │  └─ 📁 tasks (2)                │
│   └─ 📄 TODO.md                     │
│                                     │
│ ▶ 📁 another-project                │
│ ▶ 📁 notes                          │
│                                     │
│ ➕ 添加工作区                        │
├─────────────────────────────────────┤
│ [3] 已打开文件（标签页列表）          │
│ 📄 TODO.md                    ×     │
│ 📄 design/sidebar.md          ×     │
└─────────────────────────────────────┘
```

**优点：**
- 符合你的实际使用场景
- 不需要记路径，可视化浏览
- 工作区之间快速切换
- 目录结构清晰
- 搜索范围明确（当前工作区）

**缺点：**
- 改动较大，需要重新设计侧边栏
- 实现复杂度高

---

**方案 Y：智能面包屑 + 同目录文件列表（中等改动）**
```
当前文件：/Users/me/md-viewer/docs/design/sidebar.md

工具栏显示：
┌─────────────────────────────────────┐
│ md-viewer > docs > design           │  ← 面包屑，可点击
│                                     │
│ 同目录文件：                         │
│ • sidebar.md (当前)                 │
│ • file-input-redesign.md            │
│ • file-update-indicator.md          │
│ • red-dot-notification.md           │
└─────────────────────────────────────┘

点击 "docs" 显示：
┌─────────────────────────────────────┐
│ docs/ 下的文件和目录：               │
│ 📁 design (4)                       │
│ 📁 tasks (2)                        │
│ 📄 README.md                        │
│ 📄 AGENTS.md                        │
└─────────────────────────────────────┘
```

**优点：**
- 改动较小，基于现有结构
- 快速访问同目录文件（高频场景）
- 通过面包屑向上导航

**缺点：**
- 跨工程切换不方便
- 需要先打开一个文件才能导航

---

**方案 Z：增强的历史记录 + 收藏夹（最小改动）**
```
输入框下拉：
┌─────────────────────────────────────┐
│                                     │
├─────────────────────────────────────┤
│ ⭐ 收藏夹                            │
│ 📁 md-viewer/docs/design/           │  ← 收藏的目录
│ 📁 md-viewer/docs/tasks/            │
│ 📁 another-project/docs/            │
│ ─────────────────────────────       │
│ 🕐 最近打开                          │
│ 📄 TODO.md                          │
│ 📄 design/sidebar.md                │
└─────────────────────────────────────┘

点击收藏的目录：
┌─────────────────────────────────────┐
│ md-viewer/docs/design/              │
│ • file-input-redesign.md            │
│ • file-update-indicator.md          │
│ • sidebar-styling.md                │
│ • red-dot-notification.md           │
└─────────────────────────────────────┘
```

**优点：**
- 改动最小
- 快速访问常用目录
- 保留现有交互

**缺点：**
- 需要手动收藏目录
- 不够直观

---

### 问题 1：选择哪种导航模式？

**选项 X：工作区 + 目录树**（推荐，最符合使用场景）
- 完全重新设计侧边栏
- 类似 VS Code 的工作区概念
- 最适合多工程协作

**选项 Y：智能面包屑 + 同目录文件**
- 中等改动
- 基于当前文件的上下文导航
- 适合单工程内频繁切换

**选项 Z：收藏夹 + 历史记录**
- 最小改动
- 快速但不够系统化

---

### 问题 2：如果选择方案 X，工作区如何管理？

**选项 1：自动检测**
- 打开文件时自动将其所在的 git 仓库添加为工作区
- 优点：无需手动配置
- 缺点：可能添加不需要的工作区

**选项 2：手动添加**
- 提供"添加工作区"按钮，用户选择目录
- 优点：完全控制
- 缺点：初次使用需要配置

**选项 3：混合模式**（推荐）
- 首次打开文件时询问是否添加为工作区
- 提供手动添加/移除功能

---

### 问题 3：如果选择方案 X，目录树的展示范围？

**选项 1：只显示包含 .md 文件的目录**（推荐）
- 过滤掉 node_modules, .git 等无关目录
- 只显示有 md 文件的目录
- 界面简洁

**选项 2：显示所有目录**
- 完整的目录结构
- 用户可以看到工程全貌
- 可能很长

**选项 3：智能过滤**
- 默认只显示常见的文档目录（docs/, README.md 等）
- 提供"显示所有"选项

---

### 问题 4：搜索范围？

**选项 1：仅当前工作区**（推荐）
- 搜索当前选中工作区的所有 md 文件
- 范围明确，结果精准

**选项 2：所有工作区**
- 搜索所有已添加工作区
- 结果可能很多

**选项 3：可切换**
- 默认当前工作区
- 提供"搜索所有工作区"选项

---

## 方案 X 详细设计

### 侧边栏结构

```
┌─────────────────────────────────────┐
│ MD Viewer                           │
│                                     │
│ 🔍 [搜索当前工作区...]              │  ← 搜索框
├─────────────────────────────────────┤
│ 工作区                         [⚙️] │  ← 工作区管理
│                                     │
│ ▼ 📁 md-viewer                      │  ← 当前工作区
│   ├─ 📄 TODO.md                     │  ← 根目录文件
│   ├─ 📄 AGENTS.md                   │
│   ├─ 📁 docs                        │  ← 目录（可展开）
│   │  ├─ 📄 README.md                │
│   │  ├─ 📁 design (4) ▼            │  ← 子目录（已展开）
│   │  │  ├─ 📄 sidebar-styling.md   │
│   │  │  ├─ 📄 file-input.md        │
│   │  │  ├─ 📄 file-update.md       │
│   │  │  └─ 📄 red-dot.md           │
│   │  └─ 📁 tasks (2) ▶             │  ← 子目录（折叠）
│   └─ 📁 src                         │
│      └─ 📄 README.md                │
│                                     │
│ ▶ 📁 another-project                │  ← 其他工作区（折叠）
│ ▶ 📁 personal-notes                 │
│                                     │
│ ➕ 添加工作区                        │  ← 添加按钮
├─────────────────────────────────────┤
│ 已打开                               │  ← 已打开文件列表
│ 📄 TODO.md                    ×     │
│ 📄 sidebar-styling.md         ×     │
│ 📄 file-input.md              ×     │
└─────────────────────────────────────┘
```

### 交互设计

#### 1. 添加工作区
```
点击 "➕ 添加工作区"：

方式 1：选择目录
┌─────────────────────────────────────┐
│ 选择工作区根目录                     │
│                                     │
│ [📁 浏览...]                        │
│                                     │
│ 或输入路径：                         │
│ [/Users/me/projects/my-app    ]     │
│                                     │
│               [取消]  [添加]        │
└─────────────────────────────────────┘

方式 2：从已打开文件推断
如果用户打开了 /Users/me/md-viewer/docs/README.md
提示：
┌─────────────────────────────────────┐
│ 是否将 "md-viewer" 添加为工作区？    │
│                                     │
│ 路径：/Users/me/md-viewer           │
│                                     │
│          [取消]  [添加]             │
└─────────────────────────────────────┘
```

#### 2. 目录树交互
- **点击目录**：展开/折叠
- **点击文件**：打开文件
- **右键目录**：
  - 在此目录搜索
  - 在此目录添加文件
  - 在 Finder 中打开
- **右键工作区**：
  - 重命名
  - 移除工作区
  - 在 Finder 中打开

#### 3. 搜索交互
```
输入 "sidebar"：

┌─────────────────────────────────────┐
│ 🔍 sidebar                          │
├─────────────────────────────────────┤
│ 在 "md-viewer" 中搜索：              │
│                                     │
│ 📄 docs/design/20260228-sidebar-styling.md   │  ← 文件名匹配
│ 📄 docs/design/file-input.md        │  ← 内容匹配
│    ...包含 "sidebar" 的段落...      │
└─────────────────────────────────────┘
```

### 数据结构

```typescript
interface Workspace {
  id: string;
  name: string;           // 显示名称（默认为目录名）
  path: string;           // 绝对路径
  isExpanded: boolean;    // 是否展开
  lastAccessed: number;   // 最后访问时间
}

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  isExpanded?: boolean;
  fileCount?: number;     // 目录下的 md 文件数
}

interface AppState {
  workspaces: Workspace[];
  currentWorkspace: string | null;  // 当前工作区 ID
  openFiles: FileInfo[];            // 已打开的文件
  // ... 其他状态
}
```

### 技术实现

```typescript
// 扫描工作区，构建文件树
async function scanWorkspace(workspacePath: string): Promise<FileTreeNode> {
  const tree: FileTreeNode = {
    name: path.basename(workspacePath),
    path: workspacePath,
    type: 'directory',
    children: []
  };

  const entries = await fs.readdir(workspacePath, { withFileTypes: true });

  for (const entry of entries) {
    // 跳过隐藏文件和特殊目录
    if (entry.name.startsWith('.') ||
        ['node_modules', 'dist', 'build'].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(workspacePath, entry.name);

    if (entry.isDirectory()) {
      const subTree = await scanWorkspace(fullPath);
      // 只添加包含 md 文件的目录
      if (subTree.fileCount && subTree.fileCount > 0) {
        tree.children!.push(subTree);
      }
    } else if (entry.name.endsWith('.md')) {
      tree.children!.push({
        name: entry.name,
        path: fullPath,
        type: 'file'
      });
    }
  }

  // 计算文件数
  tree.fileCount = countMarkdownFiles(tree);

  return tree;
}

function countMarkdownFiles(node: FileTreeNode): number {
  if (node.type === 'file') return 1;

  return (node.children || []).reduce((sum, child) =>
    sum + countMarkdownFiles(child), 0
  );
}
```

---

## 对比：现有方案 vs 方案 X

| 维度 | 现有方案 | 方案 X（工作区） |
|-----|---------|----------------|
| 多工程切换 | ❌ 需要输入完整路径 | ✅ 点击工作区即可 |
| 同目录切换 | ❌ 需要重新输入 | ✅ 目录树可视化 |
| 发现新文件 | ❌ 需要知道路径 | ✅ 浏览目录树 |
| 学习成本 | ✅ 低 | ⚠️ 中等 |
| 实现复杂度 | ✅ 低 | ❌ 高 |
| 适合场景 | 临时查看单个文件 | 长期多工程协作 |

---

## 我的新推荐

基于你的实际使用场景，我推荐：

**方案 X（工作区 + 目录树）**

理由：
1. **完美匹配使用场景**：多工程、多目录、频繁切换
2. **降低认知负担**：不需要记路径，可视化浏览
3. **提高效率**：点击即可切换，不需要输入
4. **可扩展性强**：未来可以添加更多工作区功能（如收藏、标签等）

**实现策略：**
- 第一阶段：基础工作区 + 目录树
- 第二阶段：搜索增强（在工作区内搜索）
- 第三阶段：智能推荐（基于访问频率）

---

## 新的待决策问题

### 问题 1：是否采用方案 X（工作区模式）？
- **是**：完全重新设计侧边栏（推荐）
- **否**：回到原来的方案 B/D（历史记录/智能建议）

### 问题 2：如果采用方案 X，侧边栏布局？
- **选项 1**：三段式（搜索 + 工作区 + 已打开）
- **选项 2**：标签页（工作区 Tab + 已打开 Tab）

### 问题 3：工作区管理方式？
- **选项 1**：自动检测 git 仓库
- **选项 2**：手动添加
- **选项 3**：混合模式（推荐）

### 问题 4：是否需要"已打开文件"单独区域？
- **是**：方便看到所有打开的文件（推荐）
- **否**：保持现有的标签页方式

---

**这个方案改动较大，但我觉得更符合你的实际需求。你觉得呢？**

**方案 A：路径自动补全（类似终端）**
- 输入时显示匹配的路径建议
- Tab 键补全
- 支持相对路径和绝对路径
- 实时文件系统查询

**方案 B：历史记录下拉列表**
- 记录最近打开的文件路径
- 点击输入框显示历史记录
- 支持搜索过滤
- 无需文件系统访问

**方案 C：文件浏览器对话框**
- 点击"浏览"按钮打开原生文件选择器
- 可视化选择文件
- 支持多选
- 最直观但需要更多点击

**方案 D：智能建议（组合方案）**
- 历史记录 + 路径补全
- 输入时优先显示历史记录
- 继续输入时切换到路径补全
- 提供"浏览"按钮作为备选

**方案 E：拖拽 + 简单输入**
- 保持当前简单输入框
- 强化拖拽功能的提示
- 不增加复杂的自动补全
- 最简洁，学习成本低

---

### 问题 2：如果实现自动补全，补全范围是？

**选项 1：仅当前工作目录及子目录**
- 性能好，补全快
- 适合项目内文件
- 不支持任意路径

**选项 2：完整文件系统**
- 支持任意路径
- 可能较慢
- 需要权限处理

**选项 3：工作目录 + 常用目录（如 ~/Documents, ~/Desktop）**
- 平衡性能和灵活性
- 覆盖常见使用场景

---

### 问题 3：交互方式？

**选项 1：下拉列表（类似浏览器地址栏）**
- 在输入框下方显示建议列表
- ↑↓ 键选择，Enter 确认
- 点击选择

**选项 2：内联补全（类似 VS Code）**
- 在输入框内显示灰色补全文字
- Tab 键接受补全
- 更简洁，不遮挡界面

**选项 3：浮动面板**
- 显示更多信息（文件大小、修改时间等）
- 支持预览
- 占用更多空间

---

## 业界参考

### 1. VS Code - 文件打开（Cmd/Ctrl+P）
```
┌─────────────────────────────────────┐
│ > README.md                         │  ← 输入框
├─────────────────────────────────────┤
│ 📄 README.md          docs/         │  ← 模糊搜索结果
│ 📄 README_CN.md       docs/         │
│ 📄 CONTRIBUTING.md    /              │
└─────────────────────────────────────┘
```

**特点：**
- 模糊搜索（fuzzy matching）
- 显示文件路径
- 实时过滤
- 键盘导航

**优点：**
- 快速定位
- 不需要记住完整路径
- 支持大量文件

**缺点：**
- 需要预先索引文件
- 对于外部文件支持较弱

---

### 2. Chrome - 地址栏
```
┌─────────────────────────────────────┐
│ file:///Users/username/Do           │  ← 输入中
├─────────────────────────────────────┤
│ 📁 file:///Users/username/Documents │  ← 路径补全
│ 📁 file:///Users/username/Downloads │
│ 🕐 file:///Users/username/Doc.pdf   │  ← 历史记录
└─────────────────────────────────────┘
```

**特点：**
- 历史记录 + 路径补全混合
- 实时匹配
- 图标区分类型
- 支持键盘和鼠标

**优点：**
- 智能建议
- 学习用户习惯
- 多种匹配方式

**缺点：**
- 实现复杂度高

---

### 3. macOS Finder - Go to Folder (Cmd+Shift+G)
```
┌─────────────────────────────────────┐
│ Go to the folder:                   │
│ /Users/username/Documents           │  ← 输入框
│                                     │
│               [Cancel]  [Go]        │
└─────────────────────────────────────┘
```

**特点：**
- 简单输入框
- 支持 Tab 补全
- 支持 ~ 和环境变量
- 按 Tab 显示补全选项

**优点：**
- 简洁
- 符合系统习惯
- 支持快捷方式

**缺点：**
- 不够直观
- 需要记住路径

---

### 4. Sublime Text - Open File
```
┌─────────────────────────────────────┐
│ [Browse...]                         │  ← 浏览按钮
│                                     │
│ Or enter path:                      │
│ [/path/to/file.md              ]    │  ← 输入框
│                                     │
│ Recent Files:                       │
│ • README.md                         │  ← 历史记录
│ • guide.md                          │
│ • tutorial.md                       │
└─────────────────────────────────────┘
```

**特点：**
- 浏览按钮 + 输入框 + 历史记录
- 三种方式并存
- 灵活性高

**优点：**
- 适合不同用户习惯
- 历史记录方便快速访问

**缺点：**
- 界面较复杂

---

### 5. Terminal - 路径补全
```
$ vim ~/Docu[Tab]
$ vim ~/Documents/
$ vim ~/Documents/re[Tab]
$ vim ~/Documents/README.md
```

**特点：**
- Tab 键补全
- 支持通配符
- 实时文件系统查询
- 可以连续补全

**优点：**
- 高效
- 熟悉的交互方式
- 不需要鼠标

**缺点：**
- 需要学习
- 对新手不友好

---

### 6. Notion - 文件导入
```
┌─────────────────────────────────────┐
│ Import                              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Drag and drop files here   │   │  ← 拖拽区域
│  │  or click to browse         │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**特点：**
- 拖拽优先
- 点击打开文件选择器
- 不显示输入框

**优点：**
- 最简单直观
- 适合非技术用户

**缺点：**
- 不支持快速输入路径
- 不适合频繁操作

---

## 推荐方案对比

| 方案 | 实现难度 | 用户体验 | 性能 | 适用场景 | 推荐度 |
|-----|---------|---------|------|---------|--------|
| A - 路径自动补全 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 熟悉路径的用户 | ⭐⭐⭐⭐ |
| B - 历史记录 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 重复打开文件 | ⭐⭐⭐⭐⭐ |
| C - 文件浏览器 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 不记得路径 | ⭐⭐⭐ |
| D - 智能建议 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 所有场景 | ⭐⭐⭐⭐⭐ |
| E - 保持简单 | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | 拖拽为主 | ⭐⭐ |

---

## 详细设计方案

### 方案 A：路径自动补全（类似终端）

#### 视觉设计
```
输入框：
┌─────────────────────────────────────┐
│ ~/Documents/pro                     │  ← 用户输入
└─────────────────────────────────────┘

补全列表：
┌─────────────────────────────────────┐
│ 📁 ~/Documents/projects/            │  ← 目录
│ 📁 ~/Documents/profile/             │
│ 📄 ~/Documents/proposal.md          │  ← 文件
└─────────────────────────────────────┘
```

#### 交互流程
1. 用户输入路径片段
2. 实时查询文件系统，匹配前缀
3. 显示匹配的目录和文件
4. 用户可以：
   - 继续输入过滤
   - ↑↓ 键选择
   - Tab 键补全到选中项
   - Enter 添加文件
   - Esc 关闭列表

#### 技术实现
```typescript
// 路径补全逻辑
async function getPathSuggestions(input: string): Promise<PathItem[]> {
  // 1. 解析输入路径
  const normalized = normalizePath(input);
  const dir = path.dirname(normalized);
  const prefix = path.basename(normalized);

  // 2. 读取目录
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // 3. 过滤匹配项
  return entries
    .filter(entry => entry.name.startsWith(prefix))
    .map(entry => ({
      path: path.join(dir, entry.name),
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isMarkdown: entry.name.endsWith('.md')
    }))
    .filter(item => item.isDirectory || item.isMarkdown);
}
```

#### 优点
- 熟悉的交互方式（终端用户）
- 支持浏览文件系统
- 快速定位文件

#### 缺点
- 需要记住部分路径
- 实现复杂度较高
- 需要处理权限问题

---

### 方案 B：历史记录下拉列表

#### 视觉设计
```
输入框（未聚焦）：
┌─────────────────────────────────────┐
│ 输入文件路径并回车                   │
└─────────────────────────────────────┘

输入框（聚焦时）：
┌─────────────────────────────────────┐
│                                     │  ← 空输入
├─────────────────────────────────────┤
│ 最近打开                             │
│ 📄 /Users/me/docs/README.md         │
│ 📄 /Users/me/docs/guide.md          │
│ 📄 /Users/me/notes/todo.md          │
└─────────────────────────────────────┘

输入框（输入时）：
┌─────────────────────────────────────┐
│ guide                               │  ← 过滤关键词
├─────────────────────────────────────┤
│ 📄 /Users/me/docs/guide.md          │  ← 匹配结果
│ 📄 /Users/me/tutorial/guide_cn.md   │
└─────────────────────────────────────┘
```

#### 交互流程
1. 点击输入框 → 显示历史记录
2. 输入关键词 → 过滤历史记录
3. ↑↓ 键选择，Enter 添加
4. 如果没有匹配的历史记录，Enter 按原路径添加

#### 技术实现
```typescript
// 历史记录管理
interface FileHistory {
  recentFiles: string[];  // 最近打开的文件路径
  maxSize: number;        // 最多保存数量
}

function addToHistory(filePath: string) {
  const history = loadHistory();

  // 移除重复项
  history.recentFiles = history.recentFiles.filter(p => p !== filePath);

  // 添加到开头
  history.recentFiles.unshift(filePath);

  // 限制数量
  if (history.recentFiles.length > history.maxSize) {
    history.recentFiles = history.recentFiles.slice(0, history.maxSize);
  }

  saveHistory(history);
}

function filterHistory(query: string): string[] {
  const history = loadHistory();

  if (!query) return history.recentFiles;

  // 支持模糊匹配
  return history.recentFiles.filter(path =>
    path.toLowerCase().includes(query.toLowerCase())
  );
}
```

#### 优点
- 实现简单
- 性能好（无需文件系统访问）
- 适合重复打开文件的场景
- 学习成本低

#### 缺点
- 首次使用无历史记录
- 不支持浏览新文件
- 依赖历史数据

---

### 方案 C：文件浏览器对话框

#### 视觉设计
```
输入区域：
┌─────────────────────────────────────┐
│ [输入文件路径...]  [📁 浏览]         │
└─────────────────────────────────────┘

点击"浏览"后打开原生文件选择器：
┌─────────────────────────────────────┐
│ ⬅ Documents                         │
│                                     │
│ 📁 projects                         │
│ 📁 notes                            │
│ 📄 README.md                        │
│ 📄 guide.md                         │
│                                     │
│               [Cancel]  [Open]      │
└─────────────────────────────────────┘
```

#### 交互流程
1. 点击"浏览"按钮
2. 打开原生文件选择器
3. 可视化选择文件
4. 选择后自动添加到列表

#### 技术实现
```typescript
// 使用原生文件选择器
async function openFilePicker() {
  // 方案 1：使用 HTML5 file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.markdown';
  input.multiple = true;

  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      for (const file of files) {
        addFile(file.path);
      }
    }
  };

  input.click();

  // 方案 2：如果是 Electron 应用，使用 dialog
  // const { dialog } = require('electron');
  // const result = await dialog.showOpenDialog({
  //   properties: ['openFile', 'multiSelections'],
  //   filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  // });
}
```

#### 优点
- 最直观
- 不需要记住路径
- 支持多选
- 符合传统应用习惯

#### 缺点
- 需要更多点击
- 效率较低
- 对键盘用户不友好

---

### 方案 D：智能建议（推荐）

#### 视觉设计
```
初始状态（聚焦时）：
┌─────────────────────────────────────┐
│                              [📁]   │  ← 浏览按钮
├─────────────────────────────────────┤
│ 最近打开                             │
│ 📄 /Users/me/docs/README.md         │  ← 历史记录
│ 📄 /Users/me/docs/guide.md          │
│ 📄 /Users/me/notes/todo.md          │
└─────────────────────────────────────┘

输入路径时：
┌─────────────────────────────────────┐
│ ~/Documents/pr                [📁]  │  ← 输入 + 浏览按钮
├─────────────────────────────────────┤
│ 📁 ~/Documents/projects/            │  ← 路径补全
│ 📁 ~/Documents/profile/             │
│ ─────────────────────────────       │
│ 📄 /path/to/project.md              │  ← 匹配的历史记录
└─────────────────────────────────────┘

输入关键词时：
┌─────────────────────────────────────┐
│ guide                         [📁]  │  ← 输入关键词
├─────────────────────────────────────┤
│ 📄 /Users/me/docs/guide.md          │  ← 历史记录匹配
│ 📄 /Users/me/tutorial/guide_cn.md   │
└─────────────────────────────────────┘
```

#### 交互流程
1. **聚焦输入框**
   - 显示历史记录列表

2. **输入路径片段（如 ~/Doc）**
   - 优先显示路径补全
   - 其次显示匹配的历史记录
   - 分隔线区分两类建议

3. **输入关键词（如 guide）**
   - 在历史记录中模糊搜索
   - 如果没有匹配，尝试在当前目录搜索

4. **点击浏览按钮**
   - 打开原生文件选择器

5. **键盘操作**
   - ↑↓ 选择建议
   - Tab 补全到选中项（如果是路径）
   - Enter 添加文件
   - Esc 关闭建议列表

#### 技术实现
```typescript
interface Suggestion {
  type: 'history' | 'path' | 'search';
  path: string;
  name: string;
  icon: string;
  isDirectory?: boolean;
}

async function getSuggestions(input: string): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // 1. 如果输入为空，返回历史记录
  if (!input) {
    const history = loadHistory();
    return history.recentFiles.map(path => ({
      type: 'history',
      path,
      name: path.split('/').pop() || path,
      icon: '📄'
    }));
  }

  // 2. 判断是路径还是关键词
  const isPath = input.includes('/') || input.startsWith('~');

  if (isPath) {
    // 路径补全
    const pathSuggestions = await getPathSuggestions(input);
    suggestions.push(...pathSuggestions.map(item => ({
      type: 'path' as const,
      path: item.path,
      name: item.name,
      icon: item.isDirectory ? '📁' : '📄',
      isDirectory: item.isDirectory
    })));
  }

  // 3. 在历史记录中搜索
  const history = loadHistory();
  const matchedHistory = history.recentFiles.filter(path =>
    path.toLowerCase().includes(input.toLowerCase())
  );

  suggestions.push(...matchedHistory.map(path => ({
    type: 'history' as const,
    path,
    name: path.split('/').pop() || path,
    icon: '📄'
  })));

  return suggestions;
}
```

#### 优点
- 适应不同用户习惯
- 智能化程度高
- 效率高
- 覆盖所有使用场景

#### 缺点
- 实现复杂度最高
- 需要平衡不同建议来源的优先级

---

### 方案 E：保持简单

#### 设计理念
- 当前的输入框已经足够简单
- 拖拽功能是主要的添加方式
- 输入路径是次要方式
- 不增加额外复杂度

#### 优化方向
1. 强化拖拽提示
2. 添加"浏览"按钮作为备选
3. 保存最后一次输入的目录（下次打开时默认）

#### 视觉设计
```
┌─────────────────────────────────────┐
│ ➕ 添加文件                          │
│ [输入文件路径并回车]          [📁]  │
│                                     │
│ 💡 提示：可以直接拖拽文件到此处       │
└─────────────────────────────────────┘
```

#### 优点
- 最简单
- 学习成本低
- 性能最好

#### 缺点
- 功能较弱
- 不适合频繁输入路径

---

## 实现优先级

### P0（核心功能）
- [ ] 选择方案
- [ ] 实现基础交互
- [ ] 测试主要场景

### P1（增强功能）
- [ ] 键盘导航优化
- [ ] 视觉反馈
- [ ] 性能优化

### P2（可选功能）
- [ ] 预览功能
- [ ] 文件信息显示
- [ ] 快捷键支持

---

## 我的推荐

**推荐方案 B（历史记录）作为第一阶段实现**

理由：
1. **实现成本低**：不需要文件系统访问，纯前端实现
2. **性能好**：无需实时查询
3. **覆盖主要场景**：用户通常重复打开相同的文件
4. **可扩展**：未来可以升级到方案 D

**未来可升级到方案 D（智能建议）**

当需要更强大的功能时：
1. 添加路径补全
2. 添加浏览按钮
3. 优化建议排序算法

---

## 待决策

### 问题 1：选择哪个方案？
- 方案 A：路径自动补全
- **方案 B：历史记录（推荐作为第一阶段）**
- 方案 C：文件浏览器
- **方案 D：智能建议（推荐作为最终目标）**
- 方案 E：保持简单

### 问题 2：如果选择方案 B 或 D，历史记录保存多少条？
- 选项 1：10 条
- **选项 2：20 条（推荐）**
- 选项 3：50 条
- 选项 4：不限制

### 问题 3：是否需要"浏览"按钮？
- **选项 1：需要（推荐）** - 作为输入路径的备选方案
- 选项 2：不需要 - 保持简洁

### 问题 4：建议列表的显示方式？
- **选项 1：下拉列表（推荐）** - 类似浏览器地址栏
- 选项 2：浮动面板 - 显示更多信息
- 选项 3：内联补全 - 最简洁

---

**等待确认后开始实现**
