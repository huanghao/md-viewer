# MD Viewer 设计系统

## 什么叫统一

**统一的UI设计**指的是：
1. **视觉一致性** - 颜色、字体、间距、圆角等视觉元素保持一致
2. **交互一致性** - 相似的操作使用相同的交互模式
3. **语义一致性** - 相同的含义使用相同的视觉表达
4. **体验一致性** - 用户在不同场景下有相同的心智模型

## 包含哪些部分

### 1. 设计令牌 (Design Tokens)
- **颜色** - 主色、辅助色、状态色、中性色
- **字体** - 字体族、字号、行高、字重
- **间距** - 4px/8px 网格系统
- **圆角** - 按钮、卡片、输入框的圆角
- **阴影** - 层级阴影
- **动画** - 过渡时长、缓动函数

### 2. 组件库
- **按钮** - 主按钮、次按钮、文本按钮、图标按钮
- **输入框** - 文本输入、搜索框、下拉菜单
- **列表** - 文件列表、菜单列表
- **对话框** - 模态对话框、确认框
- **Toast** - 成功、错误、警告、信息提示
- **标签** - 状态标签、文件类型标签

### 3. 布局系统
- **网格** - 8px 基础网格
- **间距** - 4px, 8px, 12px, 16px, 24px, 32px
- **断点** - 响应式断点（如果需要）

## 业界标准和经验

### 设计系统参考

#### 1. **Material Design (Google)**
- 8dp 网格系统
- 颜色系统：Primary, Secondary, Surface, Background, Error
- 高度系统：0dp - 24dp
- 动画：标准曲线 (cubic-bezier)
- 字体：Roboto

#### 2. **Human Interface Guidelines (Apple)**
- 4pt/8pt 网格
- SF Pro 字体
- 圆角：6pt, 8pt, 12pt
- 阴影：柔和、自然
- 动画：spring 动画

#### 3. **Fluent Design (Microsoft)**
- Acrylic 材质（毛玻璃效果）
- Reveal 高亮
- 深度和层次
- 动画：连贯、自然

#### 4. **Carbon Design (IBM)**
- 2px 网格系统
- 黑白为主，蓝色点缀
- 清晰的层级
- 数据可视化友好

#### 5. **Ant Design (蚂蚁金服)**
- 中后台设计
- 8px 网格
- 简洁、高效
- 组件丰富

### 设计原则

#### 1. **少即是多 (Less is More)**
- 减少视觉噪音
- 只保留必要元素
- 留白很重要

#### 2. **一致性 (Consistency)**
- 相同的操作用相同的方式
- 相同的状态用相同的颜色
- 相同的层级用相同的大小

#### 3. **可访问性 (Accessibility)**
- 颜色对比度 ≥ 4.5:1
- 可键盘操作
- 清晰的焦点状态

#### 4. **反馈 (Feedback)**
- 操作有即时反馈
- 状态变化有视觉提示
- 错误有明确说明

#### 5. **容错性 (Forgiveness)**
- 可撤销操作
- 确认重要操作
- 清晰的错误提示

## MD Viewer 当前设计分析

### 优点
✅ 整体简洁现代
✅ 蓝色主题统一 (#3b82f6)
✅ 等宽字体用于按钮，有程序员风格
✅ 纯文本按钮，极简美学

### 不足
⚠️ 缺少明确的设计令牌定义
⚠️ 圆角不统一（4px, 6px, 8px 混用）
⚠️ 间距不统一（4px, 5px, 6px, 8px, 12px 混用）
⚠️ 颜色值硬编码，没有语义化命名
⚠️ 缺少统一的组件样式

## 推荐方案：建立 MD Viewer 设计系统

### 1. 设计令牌

#### 颜色系统
```css
:root {
  /* 主色 */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-light: #dbeafe;

  /* 成功 */
  --color-success: #1a7f37;
  --color-success-light: #e6f7ed;

  /* 警告 */
  --color-warning: #ff9500;
  --color-warning-light: #fff8e6;

  /* 错误 */
  --color-error: #cf222e;
  --color-error-light: #ffebe9;

  /* 中性色 */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* 语义化颜色 */
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-tertiary: var(--color-gray-400);
  --color-border: var(--color-gray-200);
  --color-background: #ffffff;
  --color-background-secondary: var(--color-gray-50);
}
```

#### 字体系统
```css
:root {
  /* 字体族 */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;

  /* 字号 */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 24px;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
}
```

#### 间距系统（8px 网格）
```css
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
}
```

#### 圆角系统
```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;
}
```

#### 阴影系统
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

#### 动画系统
```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
}
```

### 2. 组件规范

#### 按钮
```css
/* 主按钮 */
.button-primary {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

/* 文本按钮（当前工具栏按钮） */
.button-text {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-family: var(--font-mono);
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}

.button-text:hover {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}
```

#### 输入框
```css
.input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-background);
  transition: border-color var(--duration-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

#### 状态标签
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-mono);
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}
```

### 3. 实施步骤

#### P0 - 定义设计令牌
1. 创建 `src/client/design-tokens.ts`
2. 导出 CSS 变量
3. 在 `css.ts` 中使用

#### P1 - 重构现有组件
1. 按钮统一使用设计令牌
2. 输入框统一样式
3. 对话框统一样式
4. Toast 统一样式

#### P2 - 文档化
1. 创建设计系统文档
2. 组件使用示例
3. 设计原则说明

## 总结

**设计统一的核心：**
1. 定义设计令牌（颜色、字体、间距、圆角、阴影、动画）
2. 建立组件规范
3. 一致性应用

**MD Viewer 的风格定位：**
- 极简现代
- 程序员友好（等宽字体、纯文本按钮）
- 蓝色主题
- 清晰的层次
- 快速响应

**下一步：**
创建 `design-tokens.ts`，统一管理所有设计变量。
