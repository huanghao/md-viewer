# 文件更新提示设计方案

## 设计原则

**核心原则：状态解耦，独立维护**

1. **本地文件更新状态**：独立判断
   - 只关心：磁盘文件是否比我们展示的内容新
   - 判断方式：对比 `lastModified`（磁盘文件时间戳）和 `displayedModified`（展示内容的时间戳）
   - 成本极低，可靠性高

2. **学城同步状态**：完全独立
   - 只在文件的管理生命周期内维护
   - 不与本地文件状态耦合
   - 不尝试判断本地文件和学城文档的唯一性关系
   - 只记录：这个文件是否在我们的管理下同步过

**为什么解耦？**
- 我们**没有**判断一份文档在本地和学城唯一性的手段
- 用户可能在学城上编辑，我们无法感知
- 用户可能同步到不同的学城位置
- 用户可能删除学城文档后重新同步
- 用户可能在本地重命名或移动文件

**因此：**
- 本地更新状态 = 简单的时间戳对比
- 学城同步状态 = 简单的"是否同步过"标记

## 状态定义

### 状态 1：本地文件更新 - Dirty 状态（独立）

**判断逻辑：**
```
if (lastModified > displayedModified) {
  → 显示 "文件已修改" 标识
}
```

**状态值：**
- `normal`：本地文件未更新
- `dirty`：本地文件已修改，需要手动刷新

**关键特性：**
- 这是一个 **dirty 状态**，类似于 Git 的 "M" (Modified) 标识
- 需要**手动刷新**才能消除，不是点击文件就能消除的
- 与"未读"（isNew）是**完全不同**的状态

**视觉提示：**
- 需要新的视觉符号（不能复用蓝色圆点）
- 候选方案见下文"视觉方案"

**交互：**
- 点击文件切换：不自动刷新，保持 dirty 状态
- 点击刷新按钮：重新加载文件内容
- 刷新后：`displayedModified = lastModified`，状态恢复为 normal

### 状态 2：学城同步（独立）

**判断逻辑：**
```
if (syncedDocId exists) {
  → 显示 "✓ 已同步"
}
```

**状态值：**
- `not-synced`：未同步过
- `synced`：已同步过（在管理生命周期内）

**视觉提示：**
- ✓ 绿色图标 + 学城链接
- 或者在同步按钮上显示"已同步"状态

**交互：**
- 点击图标：打开学城文档链接
- 点击同步按钮：
  - 如果未同步：正常同步流程
  - 如果已同步：提示用户（见下文"重复同步处理"）

### 状态 3：文件不存在（特殊状态）

**触发条件：**
- 本地文件被删除
- 本地文件被移动到其他位置
- 文件路径不再有效

**判断逻辑：**
```
// 通过 SSE 监听文件删除事件
watcher.on('unlink', (path) => {
  broadcast({ type: 'file-deleted', path });
});

// 或者在尝试加载文件时发现文件不存在
const data = await loadFile(path);
if (data.error === 'ENOENT') {
  → 文件不存在
}
```

**状态值：**
- `missing`：文件不存在

**视觉提示：**
- 文件名变灰色 + 删除线
- 或者文件名前显示 ⚠️ 图标
- 或者整行变成灰色背景

**交互：**
- 点击文件：提示"文件不存在"
- 提供操作选项：
  - **选项 1**：从列表中移除
  - **选项 2**：重新选择文件位置（如果文件被移动）
  - **选项 3**：保留在列表中（可能文件临时不可用）

### 状态组合说明

**重要：现在有四个独立的状态**

1. **isNew**（未读）：新加入的文件，从未被打开过
   - 视觉：🔵 蓝色圆点（已实现）
   - 消失时机：点击文件切换时自动消失

2. **isDirty**（已修改）：本地文件已修改，需要手动刷新
   - 视觉：待定（见下文"视觉方案"）
   - 消失时机：手动点击刷新按钮后消失

3. **isSynced**（已同步）：文件已同步到学城
   - 视觉：✓ 绿色勾（仅在工具栏显示）
   - 位置：工具栏/同步按钮区域

4. **isMissing**（文件不存在）：本地文件被删除或移动
   - 视觉：待定（灰色 + 删除线 / ⚠️ 图标 / 灰色背景）
   - 优先级：最高（覆盖其他状态）

### 四个状态的组合显示

**优先级规则：**
```
isMissing > isDirty > isNew > 正常
```

当多个状态同时存在时，只显示优先级最高的那个。

| isMissing | isNew | isDirty | isSynced | 文件列表显示 | 工具栏显示 | 说明 |
|-----------|-------|---------|----------|------------|----------|------|
| - | ✓ | - | - | 🔵 文件名 | [🔄 同步] | 只有新文件 |
| - | - | ✓ | - | M 文件名 | [刷新] [🔄 同步] | 只有修改 |
| - | - | - | ✓ | 📄 文件名 | [🔄 同步] ✓ 已同步 | 只有同步 |
| - | ✓ | ✓ | - | M 文件名 | [刷新] [🔄 同步] | **新+修改：只显示 M** |
| - | - | ✓ | ✓ | M 文件名 | [刷新] [🔄 同步] ✓ 已同步 | 修改+同步 |
| ✓ | - | - | - | D 文件名 | 文件不存在 [移除] | 文件不存在 |
| ✓ | - | - | ✓ | D 文件名 | 文件不存在 [移除] | 不存在+同步 |

**注：**
- M = Modified（橙色），D = Deleted（红色），🔵 = Untracked（蓝点）
- **关键变化**：当 isDirty 和 isNew 同时存在时，只显示 M，不显示蓝点
- isMissing 优先级最高，当文件不存在时，其他状态不再显示

### 示例场景（使用 VS Code 风格）

**场景 1：新文件，未修改，未同步**
```
文件列表：
│ 🔵 new-doc.md            │  ← 蓝点（未读）

工具栏：
│ 📄 new-doc.md        [🔄 同步] │
```

**场景 2：已读，已修改，未同步**
```
文件列表：
│ M guide.md              │  ← M 橙色（已修改）

工具栏：
│ 📄 guide.md   [刷新] [🔄 同步] │  ← 显示刷新按钮
```

**场景 3：新文件 + 已修改 + 未同步**
```
文件列表：
│ M doc.md                │  ← 只显示 M 橙色（不显示蓝点）

工具栏：
│ 📄 doc.md   [刷新] [🔄 同步] │
```

**说明：** 当文件既是新文件又已修改时，只显示 M，隐藏蓝点。
理由：修改状态优先级更高，且更需要用户关注。

**场景 4：已读，已修改，已同步**
```
文件列表：
│ M tutorial.md           │  ← M 橙色（已修改）

工具栏：
│ 📄 tutorial.md  [刷新] [🔄 同步] ✓ 已同步 │
│                 xuecheng.com/doc/xxx    │
```

**场景 5：文件不存在**
```
文件列表：
│ D deleted.md            │  ← D 红色（已删除）

标签页（如果打开）：
│ deleted.md              │  ← 红色文字 + 删除线
│ （红色+删除线）          │

工具栏：
│ ⚠️ deleted.md                          │
│ 文件不存在                              │
│ [从列表中移除] [重新选择位置]            │
```

**场景 6：文件不存在 + 已同步**
```
文件列表：
│ D old-doc.md            │  ← D 红色（已删除）

标签页（如果打开）：
│ old-doc.md              │  ← 红色文字 + 删除线
│ （红色+删除线）          │

工具栏：
│ ⚠️ old-doc.md                          │
│ 文件不存在（已同步到学城）               │
│ [从列表中移除] [在学城中查看]            │
│ xuecheng.com/doc/xxx                   │
```

## 业界参考

### 1. VS Code
- **文件修改标识**：标签页上显示白色圆点
- **Git 状态**：文件列表中用颜色标识（M=修改，U=未追踪）
- **外部修改提示**：弹出通知"文件已被外部程序修改，是否重新加载？"

### 2. Notion
- **同步状态**：右上角显示"已保存"或"正在保存..."
- **冲突处理**：检测到冲突时提示用户选择保留哪个版本

### 3. Google Docs
- **自动保存**：实时显示"所有更改已保存到云端硬盘"
- **版本历史**：可以查看和恢复历史版本

### 4. GitHub Desktop
- **文件状态**：用图标和颜色标识文件状态（新增、修改、删除）
- **差异对比**：点击文件可以查看 diff

## 视觉方案

### 原则

1. **文件列表**：显示 isNew（蓝点）和 isDirty（待定符号），不显示学城同步状态
2. **工具栏**：显示学城同步状态（✓ 已同步）和刷新按钮（当 isDirty 时）

### 方案 A：橙色圆点（推荐）

```
文件列表：
┌────────────────────────────┐
│ 📄 README.md              │  ← 正常
│ 🔵 new-doc.md             │  ← 新文件（蓝点）
│ 🟠 guide.md               │  ← 已修改（橙点）
│ 🔵 🟠 doc.md              │  ← 新文件 + 已修改（蓝点 + 橙点）
└────────────────────────────┘
```

**特点：**
- 橙色圆点表示 dirty 状态
- 与蓝色圆点（未读）视觉上一致，但颜色不同
- 可以同时显示两个圆点

**优点：**
- 视觉统一，都是圆点
- 橙色有"警告/需要注意"的含义
- 不占用额外空间

**缺点：**
- 可能不够直观，需要用户学习颜色含义

### 方案 B：文字标识 [M]

```
文件列表：
┌────────────────────────────┐
│ 📄 README.md              │  ← 正常
│ 🔵 new-doc.md             │  ← 新文件（蓝点）
│ M guide.md                │  ← 已修改（M 标识）
│ 🔵 M doc.md               │  ← 新文件 + 已修改
└────────────────────────────┘
```

**特点：**
- 使用 "M" (Modified) 字母，类似 Git 和 VS Code
- 位置：文件图标左侧或文件名前

**优点：**
- 含义清晰，开发者熟悉
- 不需要学习新的颜色含义

**缺点：**
- 增加了文字元素，可能显得杂乱
- 与文件名混在一起

### 方案 C：文件名颜色变化

```
文件列表：
┌────────────────────────────┐
│ 📄 README.md              │  ← 正常（黑色）
│ 🔵 new-doc.md             │  ← 新文件（蓝点）
│ 📄 guide.md               │  ← 已修改（橙色文字）
│ 🔵 doc.md                 │  ← 新文件 + 已修改（蓝点 + 橙色文字）
└────────────────────────────┘
```

**特点：**
- 文件名本身变成橙色
- 不增加额外元素

**优点：**
- 简洁，不占用空间
- 整体视觉统一

**缺点：**
- 可能不够醒目
- 颜色变化可能被忽略

### 方案 D：文件图标变化

```
文件列表：
┌────────────────────────────┐
│ 📄 README.md              │  ← 正常
│ 🔵 new-doc.md             │  ← 新文件（蓝点）
│ 📝 guide.md               │  ← 已修改（不同图标）
│ 🔵 📝 doc.md              │  ← 新文件 + 已修改
└────────────────────────────┘
```

**特点：**
- 使用不同的文件图标（如 📝 表示已编辑）
- 或者在图标上叠加一个小标记

**优点：**
- 图标语义清晰

**缺点：**
- 可能与文件类型图标冲突
- 不够统一

### 方案 E：VS Code 风格（推荐）

参考 VS Code 的 Git 状态标识：

```
文件列表：
┌────────────────────────────┐
│ 📄 README.md              │  ← 正常
│ 🔵 new-doc.md             │  ← 新文件（蓝点，保持现有）
│ M guide.md                │  ← 已修改（M 橙色）
│ 🔵 M doc.md               │  ← 新文件 + 已修改
│ D deleted.md              │  ← 已删除（D 红色）
└────────────────────────────┘

标签页（可选）：
┌────────────────────────────┐
│ README.md │ guide.md │ deleted.md │
│           │          │ （红色+删除线）│
└────────────────────────────┘
```

**特点：**
- **M**（Modified）：橙色，表示已修改
- **D**（Deleted）：红色，表示已删除
- **U**（Untracked）：我们用蓝点替代（已实现）
- 字母位置：文件图标左侧
- 字体：等宽字体，加粗
- 标签页：删除的文件显示红色文字 + 删除线

**CSS 样式：**
```css
.file-status-badge {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  font-weight: 600;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.file-status-modified {
  color: #ff9500;  /* 橙色 */
}

.file-status-deleted {
  color: #ff3b30;  /* 红色 */
}

/* 标签页中的删除文件 */
.tab.deleted .tab-name {
  color: #ff3b30;
  text-decoration: line-through;
}
```

**优点：**
- 开发者非常熟悉（VS Code 用户众多）
- 字母含义清晰，无需学习
- 与现有蓝点（U）风格统一
- 颜色编码符合直觉（橙色=警告，红色=错误）

**缺点：**
- 增加了文字元素
- 对非开发者可能不够直观

**推荐理由：**
1. VS Code 是最流行的编辑器，用户熟悉度高
2. 字母标识比图标更精确
3. 颜色 + 字母双重编码，识别度高
4. 与现有蓝点可以很好地共存

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|-----|------|------|--------|
| A - 橙色圆点 | 视觉统一，不占空间 | 需要学习颜色含义 | ⭐⭐⭐⭐ |
| B - 文字 [M] | 含义清晰，开发者熟悉 | 可能显得杂乱 | ⭐⭐⭐⭐ |
| C - 文件名颜色 | 简洁，不占空间 | 不够醒目 | ⭐⭐⭐ |
| D - 图标变化 | 语义清晰 | 可能冲突 | ⭐⭐ |
| E - VS Code 风格 | 用户熟悉度高，含义清晰 | 增加文字元素 | ⭐⭐⭐⭐⭐ |

**推荐：方案 E（VS Code 风格）**
- VS Code 用户众多，熟悉度最高
- M（橙色）/D（红色）含义清晰
- 与现有蓝点（U）风格统一
- 字母 + 颜色双重编码，识别度高
- 标签页中删除文件显示红色 + 删除线

### 学城同步状态（已明确）

**位置：**
- 只在工具栏/同步按钮区域显示
- 不在文件列表中显示

**视觉标识：**
- 未同步：`[🔄 同步]` 普通按钮
- 已同步：`[🔄 同步] ✓ 已同步` + 学城链接

**交互：**
- 点击同步按钮：打开同步对话框（已同步时弹出确认框）
- 点击 ✓ 或链接：打开学城文档

## 技术实现

### 数据结构

```typescript
export interface FileInfo {
  path: string;
  name: string;
  content: string;              // 当前展示的内容
  lastModified: number;         // 磁盘文件的最后修改时间
  displayedModified: number;    // 展示内容对应的修改时间
  isRemote: boolean;
  displayName?: string;
  isNew?: boolean;              // 未读状态
  isMissing?: boolean;          // 文件不存在状态（新增）

  // 同步相关（独立状态）
  syncedDocId?: string;         // 学城文档 ID（存在即表示已同步过）
  syncedUrl?: string;           // 学城文档 URL
  syncedAt?: number;            // 同步时间（用于显示）
}
```

**字段说明：**
- `isNew`：手动设置，点击文件时清除
- `isDirty`：不需要字段，通过 `lastModified > displayedModified` 计算
- `isMissing`：手动设置，当收到 `file-deleted` 事件时设置为 true
- `isSynced`：不需要字段，通过 `syncedDocId` 是否存在判断

### 状态判断逻辑

```typescript
// 获取文件在列表中的显示状态（按优先级）
function getFileListStatus(file: FileInfo): FileListStatus {
  // 优先级 1：文件不存在
  if (file.isMissing) {
    return {
      badge: 'D',
      color: '#ff3b30',  // 红色
      type: 'deleted'
    };
  }

  // 优先级 2：文件已修改（dirty）
  const isDirty = file.lastModified > file.displayedModified;
  if (isDirty) {
    return {
      badge: 'M',
      color: '#ff9500',  // 橙色
      type: 'modified'
    };
  }

  // 优先级 3：新文件（未读）
  if (file.isNew) {
    return {
      badge: 'dot',      // 蓝色圆点
      color: '#007AFF',
      type: 'new'
    };
  }

  // 正常状态
  return {
    badge: null,
    color: null,
    type: 'normal'
  };
}

// 获取学城同步状态（仅在工具栏显示）
function getSyncStatus(file: FileInfo): SyncStatus {
  const isSynced = !!file.syncedDocId;

  return {
    type: isSynced ? 'synced' : 'not-synced',
    icon: isSynced ? '✓' : '',
    color: isSynced ? '#2ea44f' : '',  // 绿色
    url: file.syncedUrl,
    syncedAt: file.syncedAt
  };
}
```

### 初始化文件时

```typescript
export function addOrUpdateFile(fileData: FileData, switchTo: boolean = false): void {
  const existing = state.files.get(fileData.path);

  state.files.set(fileData.path, {
    path: fileData.path,
    name: fileData.filename,
    content: fileData.content,
    lastModified: fileData.lastModified,
    displayedModified: fileData.lastModified,  // 初始化时两者相同
    isRemote: fileData.isRemote || false,
    isNew: !existing && !switchTo,
    // 保留已有的同步状态
    syncedDocId: existing?.syncedDocId,
    syncedUrl: existing?.syncedUrl,
    syncedAt: existing?.syncedAt
  });

  // ...
}
```

### 关键：如何检测文件状态变化

**SSE 文件监听**

服务端通过 `chokidar` 监听文件变化，通过 SSE 推送事件：

```typescript
// 服务端（需要扩展）
const watcher = chokidar.watch(paths, { /* options */ });

// 文件内容变化
watcher.on('change', (path) => {
  broadcast({
    type: 'file-changed',
    path: path,
    lastModified: fs.statSync(path).mtimeMs
  });
});

// 文件删除
watcher.on('unlink', (path) => {
  broadcast({
    type: 'file-deleted',
    path: path
  });
});

// 文件移动/重命名（可选）
watcher.on('add', (path) => {
  // 可能是文件被移动过来
  broadcast({
    type: 'file-added',
    path: path
  });
});
```

**客户端接收并更新状态**

```typescript
// 客户端
const eventSource = new EventSource('/api/events');

// 文件内容变化
eventSource.addEventListener('file-changed', async (e: any) => {
  const data = JSON.parse(e.data);
  const file = state.files.get(data.path);

  if (file) {
    // 关键：只更新 lastModified，不更新 content 和 displayedModified
    // 这样 lastModified > displayedModified，触发 isDirty 状态
    file.lastModified = data.lastModified;

    // 重新渲染文件列表，显示 dirty 标识
    renderFiles();
  }
});

// 文件删除
eventSource.addEventListener('file-deleted', async (e: any) => {
  const data = JSON.parse(e.data);
  const file = state.files.get(data.path);

  if (file) {
    // 标记文件为不存在
    file.isMissing = true;

    // 重新渲染文件列表，显示灰色 + 警告
    renderFiles();

    // 如果当前正在查看这个文件，显示提示
    if (state.currentFile === data.path) {
      showFileMissingDialog(data.path);
    }
  }
});
```

**为什么这样设计？**
1. SSE 推送成本极低，实时性高
2. 只更新时间戳或状态标记，不重新加载文件内容
3. 用户主动操作时才处理（刷新/移除）
4. 避免不必要的文件读取和渲染

### 切换文件时的行为

**重要：不自动刷新**

```typescript
// 修改 switchFile 函数
function switchFile(path: string) {
  // 切换当前文件
  switchToFile(path);  // 这会标记 isNew = false（如果有蓝点）

  // 渲染
  renderFiles();  // 蓝点消失，但橙点保留
  renderTabs();
  renderContent();  // 显示旧内容

  // 如果文件是 dirty 状态，工具栏会显示"刷新"按钮
  updateToolbar();
}
```

**关键点：**
1. 点击文件切换时，**不自动刷新**内容
2. `isNew`（蓝点）会消失（因为文件已被打开过）
3. `isDirty`（橙点）会保留，需要手动点击刷新按钮
4. 工具栏显示"刷新"按钮，提示用户可以刷新

### 手动刷新文件

**触发方式：**
- 点击工具栏的"刷新"按钮
- 或者点击文件列表中的橙点（可选）

**刷新逻辑：**

```typescript
async function refreshFile(path: string) {
  const file = state.files.get(path);
  if (!file) return;

  const oldContent = file.content;
  const data = await loadFile(path);

  if (data) {
    const newContent = data.content;

    // 更新文件
    file.content = newContent;
    file.lastModified = data.lastModified;
    file.displayedModified = data.lastModified;  // 同步时间戳，消除 dirty 状态

    // 如果需要差异高亮，计算 diff
    if (shouldShowDiff) {
      const diff = computeLineDiff(oldContent, newContent);
      renderContentWithHighlight(diff);
    } else {
      renderContent();
    }

    // 重新渲染文件列表（橙点消失）
    renderFiles();
  }
}
```

### 内容刷新时的差异高亮（可选功能）

**灵感来源：**
- **Gmail**：新邮件到达时，邮件行闪烁黄色高亮
- **IDE（VS Code）**：文件外部修改后重新加载，变化的行显示黄色背景
- **Git diff**：新增行绿色，删除行红色，修改行黄色

**方案 A：行级高亮（推荐）**

刷新文件后，对比新旧内容，高亮变化的行：

```typescript
function renderContentWithHighlight(diff: LineDiff) {
  // 渲染 Markdown
  const html = marked.parse(file.content);

  // 在对应的行上添加高亮类
  // 新增的行：浅绿色背景 (#e6ffed)
  // 修改的行：浅黄色背景 (#fff8c5)
  // 删除的行：浅红色背景 (#ffebe9)（可选：显示在旁边或折叠）

  // 3秒后淡出高亮
  setTimeout(() => {
    document.querySelectorAll('.diff-highlight').forEach(el => {
      el.classList.add('fade-out');
    });
  }, 3000);
}
```

**视觉效果：**
```
刷新后的内容：
┌────────────────────────────────┐
│ # 文档标题                      │
│                                │
│ 这是第一段。                    │  ← 正常
│ 这是第二段，已修改。            │  ← 黄色背景（修改）
│ 这是新增的第三段。              │  ← 绿色背景（新增）
│                                │
└────────────────────────────────┘

3秒后高亮淡出
```

**实现挑战：**
- Markdown 渲染后是 HTML，难以对应到原始行
- 需要在 Markdown 层面做 diff，然后映射到渲染后的 HTML
- 或者在渲染前对 Markdown 文本做行级高亮标记

**方案 B：整体闪烁**

不做行级对比，整个内容区域闪烁一次黄色：

```typescript
function renderContentWithFlash() {
  const container = document.getElementById('content');
  if (!container) return;

  // 添加闪烁动画类
  container.classList.add('content-flash');

  // 1秒后移除
  setTimeout(() => {
    container.classList.remove('content-flash');
  }, 1000);
}
```

```css
@keyframes flash {
  0% { background: #fff8c5; }
  100% { background: transparent; }
}

.content-flash {
  animation: flash 1s ease-out;
}
```

**方案 C：不做高亮**

直接刷新内容，不做任何视觉提示。

**方案对比：**

| 方案 | 优点 | 缺点 | 推荐度 |
|-----|------|------|--------|
| A - 行级高亮 | 精确显示变化位置 | 实现复杂，Markdown 难以对应 | ⭐⭐⭐⭐ |
| B - 整体闪烁 | 实现简单，提示已刷新 | 不知道哪里变了 | ⭐⭐⭐⭐ |
| C - 不做高亮 | 最简单 | 没有视觉反馈 | ⭐⭐ |

**我的推荐：方案 B（整体闪烁）**
- 实现简单，效果明显
- 提示用户内容已刷新
- 行级高亮在 Markdown 场景下实现难度较大

### 同步时保存状态

```typescript
async function confirmSync() {
  // ... 执行同步 ...

  if (result.success) {
    const file = state.files.get(state.currentFile!);
    if (file) {
      // 只保存同步标记，不保存内容
      file.syncedDocId = result.docId;
      file.syncedUrl = result.url;
      file.syncedAt = Date.now();
      saveState();
    }
  }
}
```

### 重复同步处理

当用户点击同步按钮时，检查是否已同步过：

```typescript
async function handleSyncButtonClick() {
  if (!state.currentFile) return;

  const file = state.files.get(state.currentFile);
  if (!file) return;

  // 如果已经同步过，提示用户
  if (file.syncedDocId) {
    const confirmed = confirm(
      `此文件已同步到学城（${file.syncedUrl}）\n\n` +
      `再次同步将创建新文档。是否继续？\n\n` +
      `建议：修改标题以区分版本（如添加 v2）`
    );

    if (!confirmed) return;
  }

  // 继续同步流程
  showSyncDialog();
}
```

## UI 设计细节

### 文件列表状态图标

```css
.file-status {
  margin-left: auto;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.file-status.local-updated {
  color: #ff9500;
}

.file-status.synced {
  color: #2ea44f;
}

.file-status.need-resync {
  color: #bf8700;
}

.file-status:hover {
  background: rgba(0, 0, 0, 0.05);
}
```

### 工具栏状态显示

```html
<div class="toolbar">
  <div class="file-status-bar">
    <span class="file-status-item local-updated">
      🔄 文件已更新
      <button class="refresh-btn">刷新</button>
    </span>
    <span class="file-status-item synced">
      ✓ 已同步
    </span>
  </div>
</div>
```

## 待决策

### 问题 1：Dirty 状态的视觉符号？

- **方案 A**：橙色圆点 🟠
  - 与蓝点视觉统一
  - 橙色表示"需要注意"
  - 可以与蓝点同时显示
  - 优点：视觉统一，不占空间
  - 缺点：需要学习颜色含义

- **方案 B**：文字标识 [M] 或 M
  - 类似 Git 和 VS Code 的 Modified 标识
  - 位置：文件图标左侧或文件名前
  - 优点：含义清晰，开发者熟悉
  - 缺点：可能显得杂乱

- **方案 C**：文件名颜色变化
  - 文件名本身变成橙色
  - 优点：简洁，不占空间
  - 缺点：可能不够醒目

- **方案 D**：文件图标变化
  - 使用不同的图标（如 📝）
  - 优点：语义清晰
  - 缺点：可能与文件类型图标冲突

- **方案 E**：VS Code 风格 - M（橙色）（推荐）
  - 文件图标左侧显示 "M"（Modified）
  - 字体：等宽，加粗，橙色 (#ff9500)
  - 与现有蓝点风格统一
  - 优点：用户熟悉度高，含义清晰
  - 缺点：增加文字元素

### 问题 1.5：文件不存在的视觉符号？

- **方案 A**：灰色文件名 + 删除线 + ⚠️ 图标
  - 文件名变灰色并加删除线
  - 文件图标左侧显示 ⚠️
  - 优点：视觉明确，表示"已失效"
  - 缺点：删除线可能不够醒目

- **方案 B**：灰色背景 + ⚠️ 图标
  - 整行变成浅灰色背景
  - 文件名前显示 ⚠️
  - 优点：整行醒目
  - 缺点：占用视觉空间

- **方案 C**：红色文件名 + ⚠️ 图标
  - 文件名变红色
  - 文件图标左侧显示 ⚠️
  - 优点：红色警告性强
  - 缺点：可能过于刺眼

- **方案 D**：保持原样 + ⚠️ 图标
  - 只在文件图标左侧显示 ⚠️
  - 文件名不变
  - 优点：最简洁
  - 缺点：可能不够明显

- **方案 E**：VS Code 风格 - D（红色）（推荐）
  - 文件图标左侧显示 "D"（Deleted）
  - 字体：等宽，加粗，红色 (#ff3b30)
  - 标签页中：红色文字 + 删除线
  - 优点：与 VS Code 一致，用户熟悉
  - 缺点：需要标签页配合显示删除线

### 问题 2：刷新时的差异高亮方案？

- **方案 A**：行级高亮
  - 新增行绿色，修改行黄色，3秒淡出
  - 优点：精确显示变化位置
  - 缺点：实现复杂，Markdown 难以对应到 HTML 行

- **方案 B**：整体闪烁（推荐）
  - 整个内容区域闪烁黄色，1秒恢复
  - 优点：实现简单，提示已刷新
  - 缺点：不知道具体哪里变了

- **方案 C**：不做高亮
  - 直接刷新，无视觉提示
  - 优点：最简单
  - 缺点：没有反馈

### 问题 3：点击橙点的交互？

当用户点击文件列表中的橙点时：
- **选项 1**：触发刷新（推荐）
  - 橙点既是提示，也是操作入口
  - 用户可以快速刷新文件
  - 类似点击蓝点切换文件

- **选项 2**：不做任何操作
  - 橙点仅作提示
  - 必须点击工具栏的刷新按钮
  - 更保守

### 问题 4：点击文件不存在的文件时？

当用户点击一个不存在的文件时：
- **选项 1**：显示对话框（推荐）
  - 提示"文件不存在"
  - 提供操作：[从列表中移除] [取消]
  - 如果已同步，额外提供：[在学城中查看]

- **选项 2**：在工具栏显示提示
  - 工具栏显示"文件不存在"
  - 提供操作按钮
  - 不弹窗，更温和

- **选项 3**：自动从列表移除
  - 直接移除，不询问
  - Toast 提示"文件已不存在，已从列表移除"
  - 最激进

### 问题 5：重复同步的处理？

当用户尝试同步一个已经同步过的文档时：
- **选项 1**：弹出确认框（推荐）
  - 提示"此文件已同步，再次同步将创建新文档"
  - 建议修改标题以区分版本
  - 用户可以取消

- **选项 2**：同步对话框中显示警告
  - 在对话框顶部显示黄色警告条
  - 不打断流程

- **选项 3**：不做特殊处理
  - 让用户自己决定

## 测试场景

### 本地文件更新状态

1. **外部修改文件**
   - 用编辑器修改文件并保存
   - SSE 通知到达 → 更新 lastModified
   - 文件列表显示 🔄 图标

2. **刷新文件**
   - 点击刷新按钮/图标
   - 重新加载文件内容
   - displayedModified = lastModified
   - 🔄 图标消失

3. **切换文件再切换回来**
   - 🔄 图标仍然显示（状态保持）

### 学城同步状态

1. **首次同步**
   - 文件未同步过（无 ✓ 图标）
   - 点击同步按钮 → 正常同步流程
   - 同步成功 → 显示 ✓ 图标

2. **重复同步**
   - 文件已同步过（有 ✓ 图标）
   - 点击同步按钮 → 弹出确认框
   - 用户确认 → 继续同步（创建新文档）
   - 用户取消 → 取消同步

3. **点击同步图标**
   - 点击 ✓ 图标 → 打开学城文档链接

### 组合状态

1. **本地更新 + 未同步**
   - 显示 🔄 图标
   - 无 ✓ 图标

2. **本地更新 + 已同步**
   - 同时显示 🔄 和 ✓ 图标
   - 刷新后 🔄 消失，✓ 保留

3. **本地正常 + 已同步**
   - 只显示 ✓ 图标

### 持久化

1. **页面刷新**
   - 所有状态保持（包括 syncedDocId, syncedUrl, syncedAt, isMissing）
   - displayedModified 和 lastModified 保持
   - isDirty 状态通过时间戳对比重新计算

2. **关闭浏览器重新打开**
   - 从 localStorage 恢复状态
   - 同步状态保持
   - isMissing 状态保持（直到用户手动移除）

3. **文件恢复**
   - 如果文件被标记为 isMissing，但后来文件又出现了（重新创建或移回）
   - SSE 会推送 `file-added` 事件
   - 可以清除 isMissing 标记，恢复正常状态
   - 或者提示用户"文件已恢复"

## 设计优势

按照新的设计原则，我们获得了以下优势：

### 1. 简单可靠
- **本地更新**：只需对比时间戳，成本极低，100% 可靠
- **同步状态**：只需维护一个标记，不需要内容对比

### 2. 清晰解耦
- 两个状态完全独立，互不影响
- 代码逻辑清晰，易于维护
- 未来扩展不会相互干扰

### 3. 存储高效
- 不需要保存 syncedContent
- 只保存必要的元数据（docId, url, timestamp）
- localStorage 占用更少

### 4. 用户体验
- 状态含义清晰，用户容易理解
- 不会出现混淆的状态组合
- 操作简单直接

### 5. 可扩展性
- 未来可以独立扩展任一状态
- 例如：添加"自动刷新"功能只影响本地更新状态
- 例如：添加"同步历史"功能只影响同步状态

## 后续优化（可选）

### 本地更新状态相关

1. **差异对比**
   - 点击 🔄 图标时显示 diff 视图
   - 让用户看到哪些内容发生了变化

2. **自动刷新**
   - 提供"自动刷新"选项
   - 文件变化时自动重新加载（可选）

### 学城同步状态相关

1. **同步历史**
   - 记录多次同步的历史
   - 显示同步时间线

2. **批量同步**
   - 支持一次同步多个文件

3. **同步统计**
   - 显示已同步文件数量
   - 显示最近同步时间
