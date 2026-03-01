# MD Viewer 状态管理设计文档

## 概述

MD Viewer 采用客户端-服务端分离架构，状态管理分为三个层次：
1. **客户端内存状态**（浏览器运行时）
2. **客户端持久化状态**（localStorage）
3. **服务端持久化状态**（文件系统）

---

## 一、客户端状态管理

### 1.1 内存状态（运行时）

**位置**: `src/client/state.ts`

```typescript
export const state: AppState = {
  files: Map<string, FileInfo>,  // 打开的文件列表
  currentFile: string | null,    // 当前激活的文件路径
};
```

#### FileInfo 结构
```typescript
interface FileInfo {
  path: string;           // 文件路径（唯一标识）
  name: string;           // 文件名
  content: string;        // Markdown 内容
  lastModified: number;   // 最后修改时间戳
  isRemote: boolean;      // 是否为远程文件
  displayName?: string;   // 显示名称（去重后）
}
```

#### 生命周期
- **创建**: 用户添加文件时（手动输入、CLI 调用、拖拽、URL 参数）
- **更新**: 文件内容变化时（SSE 通知）
- **删除**: 用户关闭文件时（关闭标签页或从列表删除）
- **持久化**: 每次状态变化时自动保存到 localStorage

---

### 1.2 持久化状态（localStorage）

**存储键**: `md-viewer:openFiles`

**存储内容**:
```json
{
  "files": [
    ["/path/to/file.md", {
      "path": "/path/to/file.md",
      "name": "file.md",
      "isRemote": false
    }]
  ],
  "currentFile": "/path/to/file.md"
}
```

**注意事项**:
- ⚠️ **不保存 `content`**: 避免 localStorage 膨胀，页面加载时重新从服务器获取
- ⚠️ **不保存 `lastModified`**: 每次恢复时获取最新时间戳
- ✅ **自动清理**: 恢复时验证文件是否存在，不存在的自动移除

#### 数据大小评估
- 每个文件路径约 50-200 字节
- 假设打开 100 个文件 ≈ 5-20 KB
- localStorage 限制通常为 5-10 MB
- **结论**: 正常使用不会膨胀

---

### 1.3 状态膨胀风险分析

#### 风险点 1: 文件数量过多
**场景**: 用户长期使用，累积打开数百个文件

**缓解策略**:
- ❌ 当前无限制
- ✅ **建议**: 实现 LRU（最近最少使用）淘汰策略
  - 限制最多保存 50-100 个文件
  - 按最后访问时间排序，超出限制时移除最旧的

#### 风险点 2: 远程文件 URL 过长
**场景**: URL 包含大量查询参数

**缓解策略**:
- ✅ 当前已处理：只保存 path 和 name
- ✅ URL 本身作为 path，不会额外膨胀

#### 风险点 3: localStorage 配额
**场景**: 达到浏览器存储限制

**缓解策略**:
- ✅ 已实现自动清理无效文件
- ✅ 不保存文件内容
- ⚠️ **建议**: 添加异常处理，捕获 QuotaExceededError

---

## 二、服务端状态管理

### 2.1 SSE 客户端连接（内存）

**位置**: `src/sse.ts`

```typescript
const sseClients = new Set<SSEClient>();
```

#### 生命周期
- **创建**: 浏览器连接到 `/api/events`
- **删除**:
  - 浏览器关闭/刷新
  - 网络断开
  - 服务器重启
- **膨胀风险**: ⚠️ 低（通常只有 1-5 个连接）

**注意**: 服务器重启后，所有 SSE 连接丢失，客户端会自动重连

---

### 2.2 同步记录（持久化）

**位置**: `~/.config/md-viewer/sync-records.json`

```json
{
  "recentParents": [
    {
      "id": "parent-id-123",
      "title": "项目文档",
      "url": "https://xuecheng.com/doc/parent-id-123",
      "lastUsed": 1709012345678,
      "useCount": 5
    }
  ],
  "syncedFiles": {
    "/path/to/file.md": {
      "kmDocId": "doc-id-456",
      "kmUrl": "https://xuecheng.com/doc/doc-id-456",
      "kmTitle": "文档标题",
      "parentId": "parent-id-123",
      "lastSyncTime": 1709012345678,
      "command": "km-cli doc create ..."
    }
  },
  "defaultParentId": "parent-id-123"
}
```

#### 数据结构

##### recentParents（最近使用的父文档）
- **限制**: 最多保存 10 个
- **排序**: 按 `lastUsed` 降序
- **清理策略**: 自动保留最近 10 个

##### syncedFiles（已同步的文件）
- **限制**: ❌ 无限制
- **索引**: 以文件路径为 key
- **膨胀风险**: ⚠️ 中等

---

### 2.3 状态膨胀风险分析

#### 风险点 1: syncedFiles 无限增长
**场景**: 长期使用，同步数百个文件

**数据大小评估**:
- 每条记录约 200-500 字节
- 100 个文件 ≈ 20-50 KB
- 1000 个文件 ≈ 200-500 KB
- **影响**: 读写性能下降

**缓解策略**:
- ✅ **当前**: 无清理机制
- ⚠️ **建议**:
  1. 定期清理（保留最近 6 个月）
  2. 文件删除时自动移除记录
  3. 提供手动清理功能

#### 风险点 2: command 字段过长
**场景**: km-cli 命令包含长路径

**缓解策略**:
- ✅ 当前已保存完整命令（用于调试）
- ⚠️ **建议**: 可选择不保存 command 字段以节省空间

---

## 三、状态生命周期总览

### 3.1 文件打开流程

```
用户操作
  ↓
客户端: addOrUpdateFile()
  ↓
内存: state.files.set()
  ↓
持久化: localStorage.setItem()
  ↓
UI 更新: renderFiles() + renderTabs()
```

### 3.2 文件关闭流程

```
用户点击关闭
  ↓
客户端: removeFile()
  ↓
内存: state.files.delete()
  ↓
持久化: localStorage.setItem()
  ↓
UI 更新: renderFiles() + renderTabs()
```

### 3.3 文件同步流程

```
用户点击同步
  ↓
客户端: confirmSync()
  ↓
服务端: handleSyncExecute()
  ↓
调用 km-cli
  ↓
保存同步记录: saveSyncedFile()
  ↓
更新最近位置: addRecentParent()
  ↓
持久化: sync-records.json
```

### 3.4 页面刷新流程

```
页面加载
  ↓
客户端: restoreState()
  ↓
读取: localStorage.getItem()
  ↓
验证文件: loadFile() 逐个检查
  ↓
清理无效: 更新 localStorage
  ↓
恢复 currentFile
  ↓
UI 渲染
```

---

## 四、状态清理策略

### 4.1 已实现的清理机制

✅ **客户端 localStorage**
- 页面加载时验证文件是否存在
- 自动移除不存在的文件

✅ **服务端 recentParents**
- 自动限制最多 10 个
- 按时间排序，保留最新

### 4.2 待实现的清理机制

⚠️ **客户端 localStorage**
- [ ] LRU 淘汰策略（限制 50-100 个文件）
- [ ] QuotaExceededError 异常处理

⚠️ **服务端 syncedFiles**
- [ ] 定期清理（保留最近 6 个月）
- [ ] 文件删除时自动移除同步记录
- [ ] 手动清理命令（CLI）

⚠️ **服务端 SSE 连接**
- [ ] 心跳检测（检测僵尸连接）
- [ ] 连接超时清理

---

## 五、性能优化建议

### 5.1 客户端优化

1. **批量状态更新**
   - 当前每次状态变化都保存 localStorage
   - 建议: 使用 debounce 批量保存（300ms）

2. **虚拟滚动**
   - 当文件数量 > 100 时，使用虚拟滚动渲染列表
   - 避免 DOM 节点过多

3. **增量渲染**
   - 当前每次都重新渲染整个列表
   - 建议: 只更新变化的部分

### 5.2 服务端优化

1. **同步记录索引**
   - 当前使用对象存储，查询 O(1)
   - 如果需要按时间查询，考虑添加索引

2. **文件监听**
   - 当前无文件变化监听
   - 建议: 使用 chokidar 监听文件变化，自动推送更新

---

## 六、数据迁移与兼容性

### 6.1 localStorage 版本管理

**当前**: 无版本号

**建议**: 添加版本字段
```json
{
  "version": 1,
  "files": [...],
  "currentFile": "..."
}
```

**迁移策略**:
- v1 → v2: 移除 `active` 字段（已完成）
- 未来版本: 根据 version 字段执行迁移逻辑

### 6.2 sync-records.json 版本管理

**当前**: 无版本号

**建议**: 添加版本字段并实现迁移函数

---

## 七、监控与调试

### 7.1 状态监控指标

建议添加以下指标：

1. **客户端**
   - 打开文件数量
   - localStorage 使用大小
   - 状态保存频率

2. **服务端**
   - SSE 连接数量
   - 同步记录数量
   - sync-records.json 文件大小

### 7.2 调试工具

建议添加以下调试命令：

```bash
# 查看状态统计
md-viewer-cli stats

# 清理旧数据
md-viewer-cli clean --older-than 6m

# 导出状态
md-viewer-cli export-state > state.json

# 重置状态
md-viewer-cli reset-state
```

---

## 八、总结

### 当前状态管理评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 数据安全性 | ⭐⭐⭐⭐ | 自动保存，有验证机制 |
| 性能 | ⭐⭐⭐ | 正常使用无问题，极端情况待优化 |
| 可维护性 | ⭐⭐⭐⭐ | 代码清晰，职责分明 |
| 扩展性 | ⭐⭐⭐ | 缺少版本管理和迁移机制 |
| 膨胀风险 | ⭐⭐⭐ | 有风险但可控 |

### 优先级改进建议

**P0 (必须)**:
- [ ] localStorage QuotaExceededError 处理
- [ ] syncedFiles 清理策略

**P1 (重要)**:
- [ ] localStorage LRU 淘汰
- [ ] 添加版本管理
- [ ] 批量状态保存（debounce）

**P2 (可选)**:
- [ ] 虚拟滚动
- [ ] 文件变化监听
- [ ] 调试工具

---

**文档版本**: 1.0
**最后更新**: 2026-02-27
**维护者**: Claude
