# 状态管理分析报告

日期: 2026-02-27

## 1. 本地持久化状态清单

### 1.1 localStorage - 'md-viewer:openFiles'

**存储内容:**
```javascript
{
  files: [
    [path, { path, name, active, isRemote }],
    ...
  ],
  currentFile: string
}
```

**明确不存:** `content`、`lastModified`

**生命周期:**
- 创建: 首次打开文件时
- 更新: 打开/切换/关闭/删除文件时
- 销毁: **永不主动销毁**（除用户清理浏览器数据）

**触发 saveState():**
| 操作 | 触发点 |
|------|--------|
| 打开文件 | `onFileLoaded()` - CLI/SSE/拖拽/URL/手动添加 |
| 切换文件 | `switchFile()` - 点击文件/标签 |
| 关闭标签 | `closeFile()` - 右侧标签页 × |
| 删除文件 | `removeFile()` - 左侧列表 × |

**触发 restoreState():**
- 页面加载时 `init()` 调用

---

### 1.2 内存状态 (页面关闭即消失)

```javascript
state = {
  files: Map(path -> { path, name, content, active, lastModified, isRemote }),
  currentFile: string
}
```

**关键区别:** 内存里有 `content`，localStorage 里没有。

**内容加载流程:**
```
页面刷新
  → restoreState() 从 localStorage 读路径列表
  → 对每个 path 调用 loadFile() 从服务器获取 content
  → 成功: 加入 state.files
  → 失败: 跳过（不加入 state.files，也不清理 localStorage）
```

---

## 2. 长期健康性分析

### 结论: ✅ **已修复** (2026-02-27)

**原问题机制:**

```
第1天: 打开 /path/a.md
       localStorage = [a.md]

第2天: 外部删除 a.md，刷新页面
       restoreState: a.md 加载失败 → 跳过
       localStorage 仍为 [a.md]（没有 saveState 覆盖）

第3天: 再刷新
       还是尝试加载 a.md，还是失败，还是跳过
       localStorage 永远 = [a.md]
```

**修复方案:**
- 在 `restoreState()` 加载完成后，用实际存在的文件覆盖 localStorage
- 只有当文件数变化时才写入，避免无意义的更新

**代码变更:** `src/client/app.ts` - `restoreState()` 函数

---

## 3. 对策 (已采用方案 A)

### ✅ 方案 A: restoreState 时同步清理

**实现:**
```javascript
async function restoreState() {
  const validFiles = [];
  for (const [path, fileInfo] of data.files) {
    const fileData = await loadFile(path, true);
    if (fileData) {
      state.files.set(path, {...});
      validFiles.push([path, fileInfo]);
    }
  }

  // 清理：只有当有文件失效时才覆盖 localStorage
  if (validFiles.length !== data.files.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      files: validFiles,
      currentFile: state.files.has(data.currentFile) ? data.currentFile : null
    }));
  }
}
```

**特点:**
- 自动清理，无感知
- 只有变化时才写入，减少不必要的 IO
- 当前文件失效时正确更新

---

## 4. 状态矩阵（最终版）

| # | 客户端有文件名<br>(localStorage) | 客户端有内容<br>(内存) | 服务端存在 | 场景 | 处理 | 状态 |
|---|:---:|:---:|:---:|:---|:---|:---|
| 1 | ✓ | ✓ | ✓ | 正常打开 | 显示 | ✅ |
| 2 | ✓ | ✗ | ✓ | 刷新后 | 重新加载显示 | ✅ |
| 3 | ✓ | ✓ | ✗ | 打开后被外部删除 | 显示旧内容 | ⚠️ 可优化标记 |
| 4 | ✗ | ✗ | ✗ | 刷新后文件已删 | 从 localStorage 清理 | ✅ 已修复 |
| 5 | ✗ | ✓ | ✓ | 不可能 | - | - |
| 6 | ✗ | ✗ | ✓ | 未打开的文件 | - | ✅ |
| 7 | ✗ | ✓ | ✗ | 不可能 | - | - |
| 8 | ✗ | ✗ | ✗ | 全新会话 | - | ✅ |

**遗留优化:**
- #3: 文件打开期间被外部删除，可显示"文件已删除"标记或自动刷新提示

---

## 5. 修复记录

| 日期 | 问题 | 解决 |
|------|------|------|
| 2026-02-27 | localStorage 只增不减 | restoreState 同步清理无效文件 |
