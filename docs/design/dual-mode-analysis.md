# 双模式设计分析

## 需求

同时支持两种侧边栏模式：
1. **简单模式**（现有）：输入框 + 文件列表
2. **工作区模式**（新设计）：工作区 + 目录树 + 已打开文件

用户可以通过配置或界面切换。

---

## 方案对比

### 方案 A：运行时切换（动态切换）

#### 设计
在侧边栏顶部添加模式切换按钮：
```
┌─────────────────────────────────────┐
│ MD Viewer              [简单] [工作区] │  ← 切换按钮
│ ...                                 │
└─────────────────────────────────────┘
```

点击按钮即时切换侧边栏布局。

#### 技术实现
```typescript
interface AppConfig {
  sidebarMode: 'simple' | 'workspace';
}

function renderSidebar() {
  const mode = state.config.sidebarMode;

  if (mode === 'simple') {
    renderSimpleSidebar();
  } else {
    renderWorkspaceSidebar();
  }
}

function switchMode(mode: 'simple' | 'workspace') {
  state.config.sidebarMode = mode;
  saveConfig();
  renderSidebar();
}
```

#### 优点
- ✅ 用户体验最好，随时切换
- ✅ 可以根据场景选择合适的模式
- ✅ 新老用户都满意

#### 缺点
- ❌ 需要维护两套 UI 渲染逻辑
- ❌ 状态管理复杂（两种模式的状态需要兼容）
- ❌ 测试成本翻倍

#### 成本评估
- 开发成本：⭐⭐⭐⭐（高）
- 维护成本：⭐⭐⭐⭐⭐（很高）
- 稳定性风险：⭐⭐⭐⭐（较高）

---

### 方案 B：配置文件切换（静态切换）

#### 设计
在配置文件中设置模式，重启生效：
```json
// config.json
{
  "sidebarMode": "workspace"  // 或 "simple"
}
```

或者通过命令行参数：
```bash
mdv --sidebar-mode=workspace
```

#### 技术实现
```typescript
// 启动时读取配置
function initApp() {
  const config = loadConfig();
  const mode = config.sidebarMode || 'simple';

  if (mode === 'workspace') {
    renderWorkspaceSidebar();
  } else {
    renderSimpleSidebar();
  }
}
```

#### 优点
- ✅ 实现简单，逻辑清晰
- ✅ 两种模式完全隔离，互不干扰
- ✅ 测试简单，稳定性高
- ✅ 维护成本低

#### 缺点
- ❌ 切换需要重启应用
- ❌ 用户不能随时切换

#### 成本评估
- 开发成本：⭐⭐（低）
- 维护成本：⭐⭐（低）
- 稳定性风险：⭐（很低）

---

### 方案 C：渐进式迁移（推荐）

#### 设计思路
不是"两种模式并存"，而是"逐步升级"：

**阶段 1：保持简单模式（当前）**
- 现有功能不变
- 添加工作区模式作为实验性功能

**阶段 2：工作区模式成熟后**
- 默认使用工作区模式
- 简单模式作为降级选项（配置切换）

**阶段 3：完全迁移**
- 移除简单模式
- 只保留工作区模式

#### 技术实现
```typescript
// 配置文件
interface AppConfig {
  sidebarMode: 'simple' | 'workspace';
  // 未来可能移除 'simple'
}

// 启动时根据配置选择模式
function initSidebar() {
  const mode = config.sidebarMode || 'workspace'; // 默认工作区模式

  if (mode === 'workspace') {
    initWorkspaceMode();
  } else {
    initSimpleMode();
  }
}
```

#### 优点
- ✅ 降低风险，逐步验证
- ✅ 给用户适应时间
- ✅ 维护成本可控
- ✅ 最终目标清晰（统一到工作区模式）

#### 缺点
- ⚠️ 需要较长时间完成迁移
- ⚠️ 阶段 1-2 期间需要维护两套代码

#### 成本评估
- 开发成本：⭐⭐⭐（中等）
- 维护成本：⭐⭐⭐（中期较高，长期低）
- 稳定性风险：⭐⭐（低）

---

## 详细分析

### 1. 代码结构兼容性

#### 现有代码结构
```typescript
interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  displayedModified: number;
  isRemote: boolean;
  displayName?: string;
  isNew?: boolean;
  syncedDocId?: string;
  syncedUrl?: string;
  syncedAt?: number;
}

interface AppState {
  files: Map<string, FileInfo>;  // 所有打开的文件
  currentFile: string | null;     // 当前文件路径
}
```

#### 工作区模式需要的新结构
```typescript
interface Workspace {
  id: string;
  name: string;
  path: string;
  isExpanded: boolean;
}

interface AppState {
  // 现有字段
  files: Map<string, FileInfo>;
  currentFile: string | null;

  // 新增字段（工作区模式）
  workspaces?: Workspace[];           // 工作区列表
  currentWorkspace?: string | null;   // 当前工作区
  fileTree?: Map<string, FileTreeNode>; // 文件树缓存
}
```

**兼容性分析：**
- ✅ 现有的 `files` 和 `currentFile` 两种模式都需要
- ✅ 新增字段使用可选属性，不影响简单模式
- ✅ 数据结构兼容性好

---

### 2. 渲染逻辑复杂度

#### 简单模式渲染
```typescript
function renderSimpleSidebar() {
  return `
    <div class="sidebar-header">...</div>
    <div class="add-file-section">...</div>
    <div class="file-list">
      ${Array.from(state.files.values()).map(renderFileItem).join('')}
    </div>
  `;
}
```

#### 工作区模式渲染
```typescript
function renderWorkspaceSidebar() {
  return `
    <div class="sidebar-header">...</div>
    <div class="workspace-section">
      ${state.workspaces.map(renderWorkspace).join('')}
    </div>
    <div class="open-files-section">
      ${Array.from(state.files.values()).map(renderOpenFile).join('')}
    </div>
  `;
}

function renderWorkspace(ws: Workspace) {
  const tree = state.fileTree.get(ws.id);
  return `
    <div class="workspace-item">
      <div class="workspace-header">...</div>
      <div class="file-tree">
        ${renderFileTree(tree)}
      </div>
    </div>
  `;
}
```

**复杂度分析：**
- ⚠️ 两套完全不同的渲染逻辑
- ⚠️ 工作区模式需要递归渲染文件树
- ⚠️ 事件绑定逻辑不同

---

### 3. 状态同步问题

#### 问题场景
用户在工作区模式打开了文件，然后切换到简单模式：
- 文件列表如何显示？
- 当前文件状态如何保持？
- 工作区状态是否保存？

#### 解决方案
```typescript
function switchMode(newMode: 'simple' | 'workspace') {
  // 1. 保存当前状态
  const currentState = {
    openFiles: Array.from(state.files.keys()),
    currentFile: state.currentFile,
    workspaces: state.workspaces // 如果是工作区模式
  };

  // 2. 切换模式
  state.config.sidebarMode = newMode;

  // 3. 恢复状态
  if (newMode === 'simple') {
    // 简单模式：保留打开的文件
    // 丢弃工作区状态（但保存到配置）
  } else {
    // 工作区模式：恢复工作区状态
    // 从打开的文件推断工作区
  }

  // 4. 重新渲染
  renderSidebar();
}
```

**复杂度：**
- ⚠️ 需要仔细设计状态转换逻辑
- ⚠️ 边界情况多，容易出 bug

---

### 4. 用户配置持久化

#### 配置文件结构
```json
{
  "sidebarMode": "workspace",
  "workspaces": [
    {
      "id": "ws-1",
      "name": "md-viewer",
      "path": "/Users/me/md-viewer",
      "isExpanded": true
    },
    {
      "id": "ws-2",
      "name": "another-project",
      "path": "/Users/me/another-project",
      "isExpanded": false
    }
  ],
  "lastOpenFiles": [
    "/Users/me/md-viewer/TODO.md",
    "/Users/me/md-viewer/docs/design/sidebar.md"
  ]
}
```

**持久化策略：**
- ✅ 两种模式的配置可以共存
- ✅ 切换模式不丢失数据
- ✅ 使用 localStorage 或配置文件

---

### 5. 测试成本

#### 需要测试的场景

**简单模式：**
1. 添加文件
2. 切换文件
3. 关闭文件
4. 搜索文件
5. 拖拽添加

**工作区模式：**
1. 添加工作区
2. 移除工作区
3. 展开/折叠工作区
4. 展开/折叠目录
5. 点击文件打开
6. 搜索工作区内文件
7. 工作区切换

**模式切换：**
1. 简单 → 工作区（状态保持）
2. 工作区 → 简单（状态保持）
3. 切换后操作正常
4. 配置持久化

**总计：** 至少 15+ 个测试场景

---

## 推荐方案

### 方案 C：渐进式迁移 + 配置切换

#### 实施步骤

**第一阶段：实现工作区模式（1-2 周）**
1. 实现工作区模式的所有功能
2. 通过配置文件切换：`sidebarMode: 'workspace'`
3. 默认仍使用简单模式
4. 充分测试工作区模式

**第二阶段：用户试用（2-4 周）**
1. 你自己试用工作区模式
2. 收集问题和反馈
3. 修复 bug，优化体验
4. 确认工作区模式稳定

**第三阶段：切换默认模式（1 天）**
1. 将默认模式改为工作区模式
2. 简单模式作为降级选项保留
3. 更新文档说明

**第四阶段：移除简单模式（可选，未来）**
1. 如果工作区模式完全满足需求
2. 移除简单模式相关代码
3. 简化维护

#### 配置设计
```json
// ~/.mdv/config.json
{
  "sidebarMode": "workspace",  // 或 "simple"

  // 工作区模式配置
  "workspaces": [...],

  // 简单模式配置
  "recentFiles": [...]
}
```

#### 代码结构
```
src/client/
├── ui/
│   ├── sidebar/
│   │   ├── simple.ts      # 简单模式
│   │   ├── workspace.ts   # 工作区模式
│   │   └── index.ts       # 模式选择器
│   └── ...
└── state.ts
```

```typescript
// src/client/ui/sidebar/index.ts
export function initSidebar() {
  const mode = state.config.sidebarMode || 'simple';

  if (mode === 'workspace') {
    initWorkspaceMode();
  } else {
    initSimpleMode();
  }
}

// 两种模式的代码完全隔离
// src/client/ui/sidebar/simple.ts
export function initSimpleMode() {
  renderSimpleSidebar();
  bindSimpleEvents();
}

// src/client/ui/sidebar/workspace.ts
export function initWorkspaceMode() {
  renderWorkspaceSidebar();
  bindWorkspaceEvents();
  loadWorkspaces();
}
```

---

## 成本总结

### 方案 A：运行时切换
| 维度 | 评分 | 说明 |
|-----|------|------|
| 开发成本 | ⭐⭐⭐⭐ | 需要实现切换逻辑、状态转换 |
| 维护成本 | ⭐⭐⭐⭐⭐ | 长期维护两套代码，互相影响 |
| 测试成本 | ⭐⭐⭐⭐⭐ | 测试场景翻倍 |
| 稳定性 | ⭐⭐⭐ | 切换可能出问题 |
| 用户体验 | ⭐⭐⭐⭐⭐ | 随时切换，最灵活 |

### 方案 B：配置切换
| 维度 | 评分 | 说明 |
|-----|------|------|
| 开发成本 | ⭐⭐ | 只需读配置，选择渲染 |
| 维护成本 | ⭐⭐ | 两套代码隔离，互不影响 |
| 测试成本 | ⭐⭐⭐ | 分别测试，不需要测试切换 |
| 稳定性 | ⭐⭐⭐⭐⭐ | 两种模式完全隔离 |
| 用户体验 | ⭐⭐⭐ | 需要重启，但可接受 |

### 方案 C：渐进式迁移
| 维度 | 评分 | 说明 |
|-----|------|------|
| 开发成本 | ⭐⭐⭐ | 分阶段实施，风险可控 |
| 维护成本 | ⭐⭐⭐ | 中期较高，长期低（最终统一） |
| 测试成本 | ⭐⭐⭐ | 分阶段测试，压力分散 |
| 稳定性 | ⭐⭐⭐⭐ | 逐步验证，风险低 |
| 用户体验 | ⭐⭐⭐⭐ | 给用户适应时间，最终统一 |

---

## 我的建议

**推荐：方案 C（渐进式迁移 + 配置切换）**

### 理由

1. **风险最低**
   - 分阶段实施，每个阶段都可以充分测试
   - 出问题可以快速回退到简单模式

2. **成本可控**
   - 不需要实现复杂的运行时切换逻辑
   - 两套代码完全隔离，互不影响
   - 最终会移除简单模式，长期维护成本低

3. **用户体验好**
   - 你可以先试用工作区模式，确认好用再推广
   - 如果工作区模式有问题，可以降级到简单模式
   - 配置切换需要重启，但对于这个工具来说可以接受

4. **技术债务少**
   - 不会产生"两套代码长期并存"的技术债
   - 最终目标清晰：统一到工作区模式

### 具体实施

**现在立即做：**
1. 实现工作区模式
2. 添加配置项 `sidebarMode`
3. 默认值设为 `simple`（保持现状）
4. 你自己改配置为 `workspace` 试用

**试用 1-2 周后：**
- 如果好用 → 改默认值为 `workspace`
- 如果有问题 → 继续优化

**未来（可选）：**
- 如果工作区模式完全满足需求 → 移除简单模式

---

## 配置文件设计

```json
// ~/.mdv/config.json
{
  // 侧边栏模式：simple | workspace
  "sidebarMode": "simple",

  // 工作区配置（仅工作区模式使用）
  "workspaces": [
    {
      "id": "ws-md-viewer",
      "name": "md-viewer",
      "path": "/Users/huanghao/workspace/md-viewer",
      "isExpanded": true
    }
  ],

  // 最近打开的文件（两种模式共用）
  "recentFiles": [
    "/Users/huanghao/workspace/md-viewer/TODO.md",
    "/Users/huanghao/workspace/md-viewer/docs/design/sidebar.md"
  ],

  // 同步配置
  "sync": {
    "openInBrowser": true  // 同步后是否在浏览器打开
  }
}
```

---

## 总结

| 方案 | 开发成本 | 维护成本 | 稳定性 | 用户体验 | 推荐度 |
|-----|---------|---------|--------|---------|--------|
| A - 运行时切换 | 高 | 很高 | 中 | 很好 | ⭐⭐ |
| B - 配置切换 | 低 | 低 | 很好 | 好 | ⭐⭐⭐⭐ |
| C - 渐进式迁移 | 中 | 中→低 | 好 | 好 | ⭐⭐⭐⭐⭐ |

**推荐：方案 C**
- 通过配置文件切换（需重启）
- 渐进式迁移，降低风险
- 最终统一到工作区模式

你觉得这个方案如何？
