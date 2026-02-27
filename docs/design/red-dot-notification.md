# 小红点 - 新文件未读标识设计方案

## 需求描述
- 文件是新的，我没点开过
- 需要在文件列表中标识哪些文件是新添加但用户还未查看过的

## 业界参考

### 1. macOS Finder
- 使用蓝色圆点标识新下载的文件
- 位置：文件名左侧
- 颜色：蓝色 (#007AFF)
- 大小：6-8px
- 消失条件：打开文件后自动消失

### 2. 微信/钉钉等聊天软件
- 使用红色圆点标识未读消息
- 位置：头像右上角
- 颜色：红色 (#FF3B30)
- 可选：显示未读数量
- 消失条件：查看消息后消失

### 3. VS Code
- 使用圆点标识文件修改状态
- 位置：标签页标题旁边
- 颜色：白色或主题色
- 用途：标识未保存的文件

### 4. Chrome 标签页
- 使用蓝色圆点标识有更新的标签
- 位置：favicon 位置
- 颜色：蓝色
- 用途：标识后台标签有新内容

## 设计方案

### 方案 A：左侧红点（推荐）
```
侧边栏文件列表：
┌────────────────────────┐
│ 🔴 README.md          │  ← 新文件，未读
│ 📄 guide.md           │  ← 已读过的文件
│ 🔴 tutorial.md        │  ← 新文件，未读
└────────────────────────┘
```

**特点：**
- 位置：文件图标左侧
- 颜色：红色 (#FF3B30)
- 大小：6px 圆点
- 视觉效果：醒目，符合国内用户习惯
- 消失时机：用户点击文件切换到该文件时

**优点：**
- 符合微信、钉钉等国内主流应用的习惯
- 红色醒目，容易引起注意
- 位置不占用额外空间

**缺点：**
- 红色可能给人"警告"的感觉
- 与西方应用（如 macOS）的蓝点习惯不同

### 方案 B：右侧蓝点
```
侧边栏文件列表：
┌────────────────────────┐
│ 📄 README.md        🔵 │  ← 新文件，未读
│ 📄 guide.md            │  ← 已读过的文件
│ 📄 tutorial.md      🔵 │  ← 新文件，未读
└────────────────────────┘
```

**特点：**
- 位置：文件名右侧
- 颜色：蓝色 (#007AFF)
- 大小：6px 圆点
- 视觉效果：柔和，符合 macOS 风格
- 消失时机：用户点击文件切换到该文件时

**优点：**
- 符合 macOS Finder 的设计习惯
- 蓝色相对柔和，不会给人压迫感
- 与现有的蓝色主题色一致

**缺点：**
- 位置在右侧，可能不如左侧醒目
- 对于国内用户可能不够直观

### 方案 C：文件名加粗
```
侧边栏文件列表：
┌────────────────────────┐
│ 📄 README.md          │  ← 新文件，加粗显示
│ 📄 guide.md            │  ← 已读，正常字重
│ 📄 tutorial.md        │  ← 新文件，加粗显示
└────────────────────────┘
```

**特点：**
- 视觉方式：加粗文字（font-weight: 600）
- 无额外标识符
- 消失时机：用户点击文件切换到该文件时

**优点：**
- 简洁，不增加额外元素
- 符合邮件客户端的未读邮件标识方式

**缺点：**
- 不够醒目，容易被忽略
- 与当前文件的加粗样式可能冲突

## 技术实现

### 数据结构
在 `FileData` 类型中添加 `isNew` 字段：

```typescript
export interface FileData {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  isNew?: boolean;  // 新增：标识是否为新文件
}
```

### 状态管理
在 `src/client/state.ts` 中：

```typescript
// 添加文件时标记为新文件
export function addOrUpdateFile(data: FileData, focus: boolean = false) {
  const existing = state.files.get(data.path);

  if (!existing) {
    // 新添加的文件，标记为 isNew
    data.isNew = true;
  }

  state.files.set(data.path, data);

  if (focus) {
    state.currentFile = data.path;
    // 切换到文件时，标记为已读
    markFileAsRead(data.path);
  }

  saveState();
}

// 标记文件为已读
export function markFileAsRead(path: string) {
  const file = state.files.get(path);
  if (file && file.isNew) {
    file.isNew = false;
    saveState();
  }
}
```

### UI 渲染
在 `src/client/ui/sidebar.ts` 中修改文件列表渲染：

**方案 A 实现（左侧红点）：**
```typescript
export function renderFiles() {
  // ...
  const fileHTML = filteredFiles.map(([path, file]) => {
    const isCurrent = path === state.currentFile;
    const newDot = file.isNew ? '<span class="new-dot"></span>' : '';

    return `
      <div class="file-item ${isCurrent ? 'current' : ''}" onclick="window.switchFile('${escapeAttr(path)}')">
        ${newDot}
        <span class="icon">📄</span>
        <span class="name">${displayName}</span>
        <span class="close" onclick="event.stopPropagation(); window.removeFile('${escapeAttr(path)}')">&times;</span>
      </div>
    `;
  }).join('');
  // ...
}
```

### CSS 样式
在 `src/client/css.ts` 中添加：

**方案 A 样式（左侧红点）：**
```css
.new-dot {
  width: 6px;
  height: 6px;
  background: #FF3B30;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}
```

**方案 B 样式（右侧蓝点）：**
```css
.new-dot {
  width: 6px;
  height: 6px;
  background: #007AFF;
  border-radius: 50%;
  margin-left: auto;
  margin-right: 8px;
  flex-shrink: 0;
}
```

### 切换文件时标记已读
在 `src/client/main.ts` 的 `switchFile` 函数中：

```typescript
function switchFile(path: string) {
  switchToFile(path);
  markFileAsRead(path);  // 新增：标记为已读
  renderFiles();
  renderTabs();
  renderContent();
}
```

## 持久化存储
- 使用现有的 `localStorage` 机制
- `isNew` 字段会随 state 一起保存
- 页面刷新后状态保持

## 边界情况

### 1. 通过 CLI 打开文件
- 如果是新文件且 `focus=true`，立即标记为已读
- 如果是新文件且 `focus=false`，保持未读状态

### 2. 通过 SSE 接收文件打开事件
- 根据 `focus` 参数决定是否立即标记为已读

### 3. 文件内容更新
- 文件内容更新不影响 `isNew` 状态
- 已读过的文件即使内容更新也不会重新变成未读
- （文件更新提示是另一个独立功能，见 TODO 中的"文件更新提示"任务）

### 4. 搜索过滤
- 搜索时，新文件的红点仍然显示
- 不影响已读/未读状态

## 待决策

### 问题 1：选择哪个方案？
- **方案 A（左侧红点）**：符合国内习惯，醒目
- **方案 B（右侧蓝点）**：符合 macOS 习惯，柔和
- **方案 C（加粗文字）**：简洁但不够醒目

**我的推荐：方案 A（左侧红点）**
理由：
1. 目标用户主要是国内用户，红点更符合使用习惯
2. 红色更醒目，能有效提醒用户有新文件
3. 左侧位置更容易被注意到

### 问题 2：红点的颜色？
如果选择方案 A：
- **选项 1**：使用红色 (#FF3B30) - 醒目，符合国内习惯
- **选项 2**：使用蓝色 (#007AFF) - 柔和，与主题色一致
- **选项 3**：使用橙色 (#FF9500) - 折中方案

### 问题 3：是否需要数字角标？
- **选项 1**：只显示红点，不显示数量
- **选项 2**：在侧边栏顶部显示"未读文件总数"
- **选项 3**：每个文件都显示"New"文字标签

我的推荐：选项 1（只显示红点）
理由：
1. 文件列表不会太长，用户可以一眼看到所有未读文件
2. 数字角标会增加视觉负担
3. 保持界面简洁

## 测试场景

1. **添加新文件**
   - 通过输入框添加文件 → 显示红点
   - 通过拖拽添加文件 → 显示红点
   - 通过 CLI 添加文件（focus=false）→ 显示红点
   - 通过附近文件添加（focus=false）→ 显示红点

2. **查看文件**
   - 点击文件切换 → 红点消失
   - 通过 CLI 打开文件（focus=true）→ 红点消失

3. **持久化**
   - 刷新页面 → 未读状态保持
   - 关闭后重新打开 → 未读状态保持

4. **搜索**
   - 搜索时 → 红点正常显示
   - 清除搜索 → 红点正常显示

## 后续优化（可选）

1. **动画效果**
   - 红点出现时添加淡入动画
   - 红点消失时添加淡出动画

2. **键盘快捷键**
   - 添加快捷键跳转到下一个未读文件

3. **统计信息**
   - 在侧边栏顶部显示未读文件数量（如"3 个未读"）
