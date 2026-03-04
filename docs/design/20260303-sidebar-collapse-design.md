# 侧边栏折叠交互设计方案

## 问题描述

当前 md-viewer 有左右两个侧边栏：
- **左侧**：文件列表/工作区树
- **右侧**：批注列表（280px，折叠后仍占用 40px）

**用户诉求**：折叠后不想占用任何垂直空间，需要完全隐藏。

---

## 业界设计模式研究

### 1. VS Code 模式（开发工具标准）

**特征：**
```
┌─────┬────────────────────────────┬─┐
│ 图标│   编辑器区域               │ │
│ 栏  │                            │ │
│ 48px│                            │ │
└─────┴────────────────────────────┴─┘
```

- 左侧保留 Activity Bar（约 48px）显示图标
- 点击图标切换不同侧边栏视图
- 快捷键：`Cmd+B`（主侧边栏）、`Cmd+J`（面板）
- 布局：Push 模式（侧边栏推挤内容区）

**优点：**
- 快速访问不同功能
- 图标提供视觉提示
- 适合多功能切换

**缺点：**
- 仍占用 48px 宽度
- 图标栏本身需要设计

---

### 2. Notion 模式（内容应用标准）

**特征：**
```
折叠后：
┌────────────────────────────────────┐
│ ☰  内容区域                        │
│                                    │
│                                    │
└────────────────────────────────────┘

展开后：
┌─────────┬──────────────────────────┐
│ 侧边栏  │  内容区域                │
│         │                          │
│         │                          │
└─────────┴──────────────────────────┘
```

- 完全隐藏侧边栏（0px）
- 左上角汉堡菜单（☰）按钮唤起
- 快捷键：`Cmd+\`
- 移动端用 Overlay 模式，桌面用 Push 模式

**优点：**
- 完全不占用空间
- 最大化内容展示
- 交互简洁

**缺点：**
- 需要额外操作才能访问
- 按钮位置需要固定

---

### 3. Figma 模式（设计工具标准）

**特征：**
```
折叠后：
┌────────────────────────────────────┐
│     画布区域（100%宽度）           │
│                                    │
│                                    │
└────────────────────────────────────┘

展开：通过顶部工具栏按钮
```

- 左右侧边栏完全隐藏
- 顶部工具栏有切换按钮
- 快捷键：`Cmd+\`（左）、`Cmd+.`（右）
- 最大化设计画布

**优点：**
- 完全沉浸式体验
- 适合需要大屏幕的场景

**缺点：**
- 按钮可能不够明显
- 需要记住快捷键

---

### 4. GitHub 模式（文档浏览标准）

**特征：**
```
文件浏览器可拖拽：
┌────────┬───────────────────────────┐
│ 文件树 │  文件内容                 │
│        │                           │
│ ←→拖拽 │                           │
└────────┴───────────────────────────┘

拖到边缘自动折叠：
┌──────────────────────────────────┐
│ ▶ 文件内容                        │
│                                  │
│                                  │
└──────────────────────────────────┘
```

- 拖拽分隔线调整宽度
- 拖到边缘自动折叠
- 折叠后显示小箭头按钮（▶）
- 小屏自动响应式折叠

**优点：**
- 自然的拖拽交互
- 保留恢复按钮
- 响应式设计

**缺点：**
- 拖拽可能不够明显
- 小按钮可能难以发现

---

## 推荐方案：混合模式

### 设计原则

1. **完全隐藏**：折叠后不占用任何空间（0px）
2. **快速访问**：通过浮动按钮或快捷键快速恢复
3. **状态持久化**：记住用户偏好
4. **响应式**：适配不同屏幕尺寸

### 方案 A：浮动按钮触发（推荐）

#### 视觉设计

**折叠后：**
```
┌────────────────────────────────────┐
│                                    │
│  [≡]  内容区域           [📝]      │
│   ↑                        ↑       │
│  左侧                     右侧      │
│  触发                     触发      │
│  按钮                     按钮      │
└────────────────────────────────────┘
```

**展开后：**
```
┌─────────┬──────────────────┬───────┐
│ 文件列表│   内容区域       │ 批注  │
│ [‹]     │                  │ [›]   │
│         │                  │       │
└─────────┴──────────────────┴───────┘
```

#### 实现细节

**左侧边栏：**
- 折叠后显示浮动按钮（固定在左上角）
  - 图标：`≡` 或 `▶`
  - 位置：`left: 8px, top: 8px`
  - 样式：半透明背景，悬停高亮
- 点击按钮或快捷键 `Cmd+B` 展开
- 展开后按钮变为 `‹` 折叠图标

**右侧边栏：**
- 折叠后显示浮动按钮（固定在右上角）
  - 图标：`📝` 或 `◀`
  - 位置：`right: 8px, top: 8px`
  - 样式：同左侧
- 点击按钮或快捷键 `Cmd+.` 展开
- 展开后按钮变为 `›` 折叠图标

**CSS 实现：**
```css
/* 侧边栏折叠状态 */
.sidebar.collapsed {
  width: 0;
  overflow: hidden;
  transition: width 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* 浮动触发按钮 */
.sidebar-trigger {
  position: fixed;
  z-index: 1000;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}

.sidebar-trigger:hover {
  opacity: 1;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sidebar-trigger.left {
  left: 8px;
  top: 8px;
}

.sidebar-trigger.right {
  right: 8px;
  top: 8px;
}

/* 展开状态下的折叠按钮 */
.sidebar-header .collapse-btn {
  padding: 4px 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-header .collapse-btn:hover {
  background: #f6f8fa;
  border-color: #0969da;
}
```

**优点：**
- ✅ 完全不占用空间（0px）
- ✅ 浮动按钮始终可见
- ✅ 交互直观，易于发现
- ✅ 不影响内容布局

**缺点：**
- ⚠️ 浮动按钮可能遮挡内容（可通过半透明解决）
- ⚠️ 需要额外的 UI 元素

---

### 方案 B：边缘触发区域

#### 视觉设计

**折叠后：**
```
┌────────────────────────────────────┐
│█                                  █│
│█  内容区域                        █│
│█                                  █│
│█  (鼠标移至边缘触发)              █│
└────────────────────────────────────┘
 ↑                                  ↑
 8px                               8px
 触发区                            触发区
```

**悬停展开（临时）：**
```
┌─────────┬──────────────────┬───────┐
│ 文件列表│   内容区域       │ 批注  │
│ (浮层) │                  │(浮层) │
│         │                  │       │
└─────────┴──────────────────┴───────┘
```

#### 实现细节

- 折叠后在左右边缘保留 8px 透明触发区
- 鼠标移入触发区 → 侧边栏以 Overlay 模式浮出
- 移出后自动收回
- 点击侧边栏内的"固定"按钮 → 切换为 Push 模式

**优点：**
- ✅ 完全不占用空间
- ✅ 无需额外按钮
- ✅ 类似 VS Code 的 hover 体验

**缺点：**
- ⚠️ 可能误触
- ⚠️ 不够直观，需要用户学习
- ⚠️ 触摸设备不友好

---

### 方案 C：顶部工具栏按钮

#### 视觉设计

**顶部工具栏：**
```
┌────────────────────────────────────┐
│ [≡] [📝]  MD Viewer  [设置] [帮助] │
├────────────────────────────────────┤
│                                    │
│  内容区域                          │
│                                    │
└────────────────────────────────────┘
```

- 顶部工具栏添加切换按钮
- 左侧：`≡` 文件列表
- 右侧：`📝` 批注列表
- 点击切换显示/隐藏

**优点：**
- ✅ 按钮位置固定，易于发现
- ✅ 不遮挡内容
- ✅ 适合触摸设备

**缺点：**
- ⚠️ 需要顶部工具栏（当前没有）
- ⚠️ 增加 UI 复杂度

---

## 最终推荐：方案 A + 快捷键

### 实现方案

#### 1. 折叠后的视觉

- **完全隐藏**：`width: 0`，不占用任何空间
- **浮动按钮**：
  - 左侧：`≡` 图标，固定在 `left: 8px, top: 8px`
  - 右侧：`📝` 图标，固定在 `right: 8px, top: 8px`
  - 样式：半透明白色背景，悬停高亮

#### 2. 展开方式

- **点击浮动按钮**：立即展开（Push 模式）
- **快捷键**：
  - `Cmd/Ctrl + B`：切换左侧边栏
  - `Cmd/Ctrl + .`：切换右侧边栏
- **拖拽分隔线**：拖到边缘自动折叠

#### 3. 动画效果

```css
transition: width 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
```

- 展开/折叠动画时长：200ms
- 缓动曲线：Material Design 标准曲线

#### 4. 状态持久化

```javascript
// 保存折叠状态
localStorage.setItem('md-viewer:sidebar-left-collapsed', 'true');
localStorage.setItem('md-viewer:annotation-sidebar-collapsed', 'true');
```

#### 5. 响应式策略

- **宽屏（>1200px）**：默认展开
- **中屏（768-1200px）**：默认折叠右侧
- **窄屏（<768px）**：默认折叠两侧，Overlay 模式

---

## 实现清单

### HTML 结构

```html
<!-- 左侧边栏 -->
<aside class="sidebar left" id="sidebar">
  <div class="sidebar-header">
    <h3>文件列表</h3>
    <button class="collapse-btn" id="sidebarCollapseBtn">‹</button>
  </div>
  <!-- 内容 -->
</aside>

<!-- 左侧触发按钮（折叠时显示） -->
<button class="sidebar-trigger left hidden" id="sidebarTrigger">≡</button>

<!-- 右侧批注栏 -->
<aside class="annotation-sidebar" id="annotationSidebar">
  <div class="annotation-sidebar-header">
    <h3>批注列表</h3>
    <button class="collapse-btn" id="annotationCollapseBtn">›</button>
  </div>
  <!-- 内容 -->
</aside>

<!-- 右侧触发按钮（折叠时显示） -->
<button class="sidebar-trigger right hidden" id="annotationTrigger">📝</button>
```

### CSS 样式

```css
/* 侧边栏基础样式 */
.sidebar, .annotation-sidebar {
  transition: width 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.sidebar.collapsed, .annotation-sidebar.collapsed {
  width: 0;
  min-width: 0;
  overflow: hidden;
}

/* 浮动触发按钮 */
.sidebar-trigger {
  position: fixed;
  z-index: 1000;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
  font-size: 18px;
}

.sidebar-trigger:hover {
  opacity: 1;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
}

.sidebar-trigger.left {
  left: 8px;
  top: 8px;
}

.sidebar-trigger.right {
  right: 8px;
  top: 8px;
}

.sidebar-trigger.hidden {
  display: none;
}

/* 折叠按钮 */
.collapse-btn {
  padding: 4px 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  line-height: 1;
}

.collapse-btn:hover {
  background: #f6f8fa;
  border-color: #0969da;
  color: #0969da;
}
```

### JavaScript 逻辑

```typescript
// 切换侧边栏状态
function toggleSidebar(side: 'left' | 'right'): void {
  const sidebar = side === 'left'
    ? document.getElementById('sidebar')
    : document.getElementById('annotationSidebar');
  const trigger = side === 'left'
    ? document.getElementById('sidebarTrigger')
    : document.getElementById('annotationTrigger');

  if (!sidebar || !trigger) return;

  const isCollapsed = sidebar.classList.contains('collapsed');

  if (isCollapsed) {
    // 展开
    sidebar.classList.remove('collapsed');
    trigger.classList.add('hidden');
  } else {
    // 折叠
    sidebar.classList.add('collapsed');
    trigger.classList.remove('hidden');
  }

  // 保存状态
  const key = side === 'left'
    ? 'md-viewer:sidebar-collapsed'
    : 'md-viewer:annotation-sidebar-collapsed';
  localStorage.setItem(key, String(!isCollapsed));
}

// 快捷键支持
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault();
    toggleSidebar('left');
  }
  if ((e.metaKey || e.ctrlKey) && e.key === '.') {
    e.preventDefault();
    toggleSidebar('right');
  }
});

// 初始化状态
function initSidebars(): void {
  const leftCollapsed = localStorage.getItem('md-viewer:sidebar-collapsed') === 'true';
  const rightCollapsed = localStorage.getItem('md-viewer:annotation-sidebar-collapsed') === 'true';

  if (leftCollapsed) {
    document.getElementById('sidebar')?.classList.add('collapsed');
    document.getElementById('sidebarTrigger')?.classList.remove('hidden');
  }

  if (rightCollapsed) {
    document.getElementById('annotationSidebar')?.classList.add('collapsed');
    document.getElementById('annotationTrigger')?.classList.remove('hidden');
  }
}
```

---

## ASCII 原型

### 状态 1：两侧展开（默认）

```
┌─────────────┬──────────────────────────────┬─────────────┐
│ 文件列表    │         内容区域             │  批注列表   │
│ [‹]         │                              │ [›]         │
│             │                              │             │
│ 📄 file1.md │  # 标题                      │ #1 批注1    │
│ 📄 file2.md │                              │             │
│ 📁 folder/  │  正文内容...                 │ #2 批注2    │
│             │                              │             │
│             │                              │             │
│ 260px       │        flex-grow             │  280px      │
└─────────────┴──────────────────────────────┴─────────────┘
```

### 状态 2：左侧折叠

```
┌──────────────────────────────────────────┬─────────────┐
│ [≡]       内容区域                       │  批注列表   │
│                                          │ [›]         │
│                                          │             │
│  # 标题                                  │ #1 批注1    │
│                                          │             │
│  正文内容...                             │ #2 批注2    │
│                                          │             │
│                                          │             │
│           flex-grow                      │  280px      │
└──────────────────────────────────────────┴─────────────┘
```

### 状态 3：右侧折叠

```
┌─────────────┬────────────────────────────────────────┐
│ 文件列表    │         内容区域                [📝]   │
│ [‹]         │                                        │
│             │                                        │
│ 📄 file1.md │  # 标题                                │
│ 📄 file2.md │                                        │
│ 📁 folder/  │  正文内容...                           │
│             │                                        │
│             │                                        │
│ 260px       │        flex-grow                       │
└─────────────┴────────────────────────────────────────┘
```

### 状态 4：两侧折叠（最大化内容）

```
┌────────────────────────────────────────────────────┐
│ [≡]       内容区域                          [📝]   │
│                                                    │
│                                                    │
│  # 标题                                            │
│                                                    │
│  正文内容...                                       │
│                                                    │
│                                                    │
│                  100% 宽度                         │
└────────────────────────────────────────────────────┘
```

---

## 总结

**最终方案：**
- ✅ 折叠后完全隐藏（0px）
- ✅ 浮动按钮快速访问
- ✅ 快捷键支持（`Cmd+B` / `Cmd+.`）
- ✅ 平滑动画过渡
- ✅ 状态持久化
- ✅ 响应式设计

**用户体验：**
- 最大化阅读空间
- 快速访问侧边栏
- 交互直观，易于发现
- 适配不同屏幕尺寸

**技术实现：**
- 简单的 CSS 动画
- 最小的 JavaScript 逻辑
- 无需额外依赖
- 易于维护
