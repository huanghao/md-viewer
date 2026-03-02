# 非 MD 文件处理设计方案

## 问题背景

用户在使用过程中发现：
- 添加了 HTML 文件后，渲染效果不符合预期
- 布局可能出现异常（如文件切换时的布局跳动）
- 当前系统没有对文件类型进行限制或提示

## 设计目标

1. **防止误操作**：提醒用户 MD Viewer 主要用于查看 Markdown 文件
2. **提供灵活性**：允许用户查看其他文本文件（如 .txt, .html），但要明确标识
3. **视觉区分**：在界面上清晰区分 MD 文件和非 MD 文件
4. **用户体验**：不要过于打扰用户，但要提供足够的信息

---

## 文件类型分类

### 1. **推荐类型**（绿灯）
- `.md` - Markdown 文件
- `.markdown` - Markdown 文件（完整扩展名）

### 2. **支持但不推荐**（黄灯）
- `.txt` - 纯文本文件（可以渲染，但没有格式）
- `.html` - HTML 文件（浏览器会渲染，但样式可能异常）
- `.json` - JSON 文件（可以查看，但没有语法高亮）
- 其他文本文件

### 3. **不支持**（红灯）
- 二进制文件（图片、视频、PDF 等）
- 会导致浏览器崩溃或无法显示的文件

---

## 方案对比

### 方案 A: 严格限制 + 确认对话框

**行为**：
- 用户输入非 .md/.markdown 文件时，弹出确认对话框
- 对话框内容：
  ```
  此文件不是 Markdown 文件 (.html)

  MD Viewer 主要用于查看 Markdown 文件。
  其他文件类型可能显示异常。

  [仍然添加]  [取消]
  ```
- 用户确认后才添加

**优点**：
- ✅ 强提醒，用户不会误操作
- ✅ 明确告知风险

**缺点**：
- ❌ 打扰用户，每次都要点击确认
- ❌ 对于经常查看其他文件的用户很烦人
- ❌ 模态对话框打断工作流

---

### 方案 B: 软提示 + 视觉标识（推荐）

**行为**：
1. **添加时**：
   - 非 MD 文件添加成功后，显示 Toast 提示：
     ```
     ⚠️ 已添加非 Markdown 文件 (file.html)
     可能显示异常
     ```
   - Toast 3 秒后自动消失
   - 只在首次添加非 MD 文件时提示（会话级别）

2. **文件列表中**：
   - MD 文件：正常显示（无特殊标识）
   - 非 MD 文件：添加视觉标识
     - 文件名后显示扩展名徽章：`.html` `.txt` `.json`
     - 徽章样式：浅灰色背景 + 深灰色文字
     - 或者：文件名前显示 ⚠️ 图标

3. **标签页中**：
   - 非 MD 文件的标签页也显示徽章或图标

**优点**：
- ✅ 不打断用户工作流
- ✅ 提供足够的视觉反馈
- ✅ 首次提示后，用户知道了就不再重复提示
- ✅ 在文件列表中可以一眼看出哪些是非 MD 文件

**缺点**：
- ⚠️ 用户可能忽略 Toast 提示
- ⚠️ 需要设计徽章样式

---

### 方案 C: 完全禁止

**行为**：
- 只允许添加 .md/.markdown 文件
- 输入其他文件时，显示错误提示：
  ```
  ❌ 仅支持 Markdown 文件 (.md, .markdown)
  ```

**优点**：
- ✅ 最简单，逻辑清晰
- ✅ 避免所有潜在问题

**缺点**：
- ❌ 限制了灵活性
- ❌ 用户可能想查看 README.txt 等文件
- ❌ 过于严格

---

### 方案 D: 静默处理 + 仅视觉标识

**行为**：
- 不显示任何提示
- 仅在文件列表和标签页中添加视觉标识（徽章或图标）

**优点**：
- ✅ 完全不打扰用户
- ✅ 简洁

**缺点**：
- ❌ 用户可能不知道为什么显示异常
- ❌ 缺少教育性提示

---

## 推荐方案：方案 B（软提示 + 视觉标识）

### 实现细节

#### 1. 文件类型检测
```typescript
function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function isMarkdownFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'md' || ext === 'markdown';
}
```

#### 2. 添加文件时的提示
```typescript
async function addFileByPath(path: string, focus: boolean = true) {
  if (!path.trim()) return;

  const data = await loadFile(path);
  if (data) {
    await onFileLoaded(data, focus);
    await openFile(path, focus);

    // 检查文件类型
    if (!isMarkdownFile(path)) {
      // 检查是否已经提示过（会话级别）
      if (!sessionStorage.getItem('non-md-warning-shown')) {
        const ext = getFileExtension(path);
        showWarning(`已添加非 Markdown 文件 (.${ext})，可能显示异常`, 3000);
        sessionStorage.setItem('non-md-warning-shown', 'true');
      }
    }

    // 清空输入框
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }
}
```

#### 3. 视觉标识设计

**选项 3A: 扩展名徽章**（推荐）
```
📄 README.md
📄 TODO.md
📄 design.html  [.html]
📄 notes.txt    [.txt]
```

徽章样式：
- 背景：`#f3f4f6`（浅灰）
- 文字：`#6b7280`（中灰）
- 圆角：`4px`
- 字体大小：`11px`
- 内边距：`2px 6px`

**选项 3B: 警告图标**
```
📄 README.md
📄 TODO.md
⚠️ design.html
⚠️ notes.txt
```

**选项 3C: 颜色区分**
```
📄 README.md     (正常颜色)
📄 TODO.md       (正常颜色)
📄 design.html   (橙色文字)
📄 notes.txt     (橙色文字)
```

**推荐**: **选项 3A（扩展名徽章）**
- 信息最丰富（直接显示扩展名）
- 视觉不突兀
- 符合现代 UI 设计

#### 4. 标签页中的标识

标签页也显示徽章：
```
[README.md] [×]
[design.html .html] [×]
```

---

## 实现计划

### Phase 1: 核心功能
1. 添加文件类型检测函数
2. 在 `addFileByPath` 中添加警告提示
3. 在文件列表中添加徽章显示
4. 在标签页中添加徽章显示

### Phase 2: 样式优化
1. 设计徽章样式
2. 确保在不同主题下都清晰可见
3. 响应式设计

### Phase 3: 测试
1. 测试各种文件类型
2. 测试提示显示逻辑
3. 测试视觉效果

---

## 开放问题

1. **是否需要配置选项？**
   - 允许用户关闭警告提示？
   - 允许用户自定义支持的文件类型？

2. **是否需要更详细的文件类型图标？**
   - `.md` → 📝
   - `.html` → 🌐
   - `.txt` → 📄
   - `.json` → {}

3. **是否需要在内容区域也显示提示？**
   - 在渲染区域顶部显示：
     ```
     ⚠️ 此文件不是 Markdown 文件，可能显示异常
     ```

---

## 决策

请选择：
- **方案选择**: A / **B (推荐)** / C / D
- **视觉标识**: 3A (徽章) / 3B (图标) / 3C (颜色)
- **开放问题**: 是否需要配置选项？是否需要详细图标？
