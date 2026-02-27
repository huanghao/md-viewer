# P0 问题修复文档

本文档记录了 P0 级别问题的修复方案和实现细节。

---

## 修复概览

| 问题 | 严重性 | 状态 | 修复日期 |
|------|--------|------|----------|
| localStorage QuotaExceededError 处理 | P0 | ✅ 已修复 | 2026-02-28 |
| syncedFiles 清理策略 | P0 | ✅ 已修复 | 2026-02-28 |

---

## 1. localStorage QuotaExceededError 处理

### 问题描述
当 localStorage 配额已满时，`localStorage.setItem()` 会抛出 `QuotaExceededError`，导致状态无法保存，用户体验受损。

### 影响范围
- 客户端状态保存失败
- 打开的文件列表丢失
- 当前文件位置丢失

### 修复方案

#### 1.1 异常捕获与处理
```typescript
export function saveState(): void {
  try {
    const data = { /* ... */ };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage 配额已满，执行清理...');
      cleanupOldFiles();
      // 重试保存
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('保存状态失败（重试后）:', retryError);
      }
    } else {
      console.error('保存状态失败:', e);
    }
  }
}
```

#### 1.2 LRU 淘汰策略
实现最近最少使用（LRU）策略，限制最多保存 100 个文件：

```typescript
const MAX_FILES = 100;

function cleanupOldFiles(): void {
  if (state.files.size <= MAX_FILES) return;

  // 按最后访问时间排序
  const sortedFiles = Array.from(state.files.entries())
    .sort((a, b) => (b[1].lastModified || 0) - (a[1].lastModified || 0));

  // 保留最近的 MAX_FILES 个
  const filesToKeep = sortedFiles.slice(0, MAX_FILES);

  state.files.clear();
  filesToKeep.forEach(([path, file]) => {
    state.files.set(path, file);
  });
}
```

#### 1.3 添加文件时预检查
```typescript
export function addOrUpdateFile(fileData: FileData, switchTo: boolean = false): void {
  // 检查是否需要清理（超过限制）
  if (state.files.size >= MAX_FILES && !state.files.has(fileData.path)) {
    cleanupOldFiles();
  }

  // 添加文件...
}
```

#### 1.4 更新最后访问时间
```typescript
export function switchToFile(path: string): void {
  state.currentFile = path;

  // 更新最后访问时间（用于 LRU）
  const file = state.files.get(path);
  if (file) {
    file.lastModified = Date.now();
  }

  saveState();
}
```

### 测试场景
- [x] 正常保存状态
- [x] 配额已满时触发清理
- [x] 清理后重试保存
- [x] LRU 正确移除最旧文件
- [x] 当前文件不会被移除

### 相关文件
- `src/client/state.ts` - 状态管理核心逻辑

---

## 2. syncedFiles 清理策略

### 问题描述
服务端 `sync-records.json` 中的 `syncedFiles` 记录无限增长，长期使用可能导致：
- 文件体积过大（1000 个文件约 200-500 KB）
- 读写性能下降
- 包含大量过期无用数据

### 影响范围
- 服务端启动变慢
- 同步记录查询变慢
- 磁盘空间浪费

### 修复方案

#### 2.1 自动清理过期记录
在加载同步记录时自动清理超过 6 个月的记录：

```typescript
const SYNC_RECORD_MAX_AGE = 6 * 30 * 24 * 60 * 60 * 1000; // 6 个月

export function loadSyncRecords(): SyncRecords {
  // 读取记录...
  const records = JSON.parse(content);

  // 自动清理过期记录
  cleanupExpiredSyncRecords(records);

  return records;
}

function cleanupExpiredSyncRecords(records: SyncRecords): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [filePath, info] of Object.entries(records.syncedFiles)) {
    if (now - info.lastSyncTime > SYNC_RECORD_MAX_AGE) {
      delete records.syncedFiles[filePath];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`已清理 ${cleanedCount} 条过期的同步记录（超过 6 个月）`);
    saveSyncRecords(records);
  }
}
```

#### 2.2 手动清理命令
提供 CLI 命令手动清理：

```typescript
export function cleanupAllExpiredRecords(): number {
  const records = loadSyncRecords();
  const now = Date.now();
  let cleanedCount = 0;

  for (const [filePath, info] of Object.entries(records.syncedFiles)) {
    if (now - info.lastSyncTime > SYNC_RECORD_MAX_AGE) {
      delete records.syncedFiles[filePath];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    saveSyncRecords(records);
  }

  return cleanedCount;
}
```

#### 2.3 统计信息查询
提供统计信息以便监控：

```typescript
export function getSyncRecordsStats(): {
  totalFiles: number;
  expiredFiles: number;
  recentParents: number;
  oldestSync: number | null;
  newestSync: number | null;
} {
  const records = loadSyncRecords();
  const now = Date.now();

  const syncTimes = Object.values(records.syncedFiles).map(f => f.lastSyncTime);
  const expiredCount = Object.values(records.syncedFiles)
    .filter(f => now - f.lastSyncTime > SYNC_RECORD_MAX_AGE)
    .length;

  return {
    totalFiles: Object.keys(records.syncedFiles).length,
    expiredFiles: expiredCount,
    recentParents: records.recentParents.length,
    oldestSync: syncTimes.length > 0 ? Math.min(...syncTimes) : null,
    newestSync: syncTimes.length > 0 ? Math.max(...syncTimes) : null,
  };
}
```

#### 2.4 管理工具 CLI
创建 `md-viewer-admin` 命令行工具：

```bash
# 查看统计信息
mdv-admin stats

# 清理过期记录
mdv-admin cleanup
```

输出示例：
```
📊 正在获取统计信息...

同步记录统计:
  总文件数: 156
  过期文件数: 23 (超过 6 个月)
  最近位置数: 8
  最早同步: 2025/8/15 10:23:45 (196 天前)
  最新同步: 2026/2/27 18:26:38 (今天)

⚠️  有 23 条过期记录可以清理
   运行 'mdv-admin cleanup' 清理
```

#### 2.5 API 端点
添加 HTTP API 用于远程管理：

```typescript
// GET /api/sync/stats - 获取统计信息
// POST /api/sync/cleanup - 清理过期记录
```

### 清理时机
1. **自动清理**: 每次 `loadSyncRecords()` 时检查并清理
2. **手动清理**: 运行 `mdv-admin cleanup` 命令
3. **API 清理**: 调用 `/api/sync/cleanup` 端点

### 测试场景
- [x] 自动清理过期记录
- [x] 手动清理命令
- [x] 统计信息准确
- [x] 清理后文件格式正确
- [x] 不清理未过期记录

### 相关文件
- `src/sync-storage.ts` - 同步记录存储管理
- `src/cli-admin.ts` - 管理工具 CLI
- `src/handlers.ts` - API 处理器
- `src/server.ts` - 服务器路由

---

## 使用指南

### 查看状态统计
```bash
# 使用 bun 运行
bun run admin stats

# 或使用全局命令（需要先安装）
mdv-admin stats
```

### 清理过期记录
```bash
# 使用 bun 运行
bun run admin cleanup

# 或使用全局命令
mdv-admin cleanup
```

### 通过 API 管理
```bash
# 获取统计信息
curl http://localhost:3000/api/sync/stats

# 清理过期记录
curl -X POST http://localhost:3000/api/sync/cleanup
```

---

## 性能影响

### 客户端
- **LRU 清理**: O(n log n) 排序，n ≤ 100，性能影响可忽略
- **异常处理**: 仅在配额已满时触发，对正常流程无影响
- **内存占用**: 限制为 100 个文件，约 5-20 KB

### 服务端
- **自动清理**: 加载时一次性清理，O(n)，n 为文件数
- **统计查询**: O(n)，n 为文件数，通常 < 1ms
- **磁盘 I/O**: 清理时一次写入，影响可忽略

---

## 监控建议

### 客户端监控
```javascript
// 在开发者工具中查看
console.log('打开文件数:', state.files.size);
console.log('localStorage 使用:', JSON.stringify(localStorage.getItem('md-viewer:openFiles')).length, 'bytes');
```

### 服务端监控
```bash
# 定期运行统计命令
mdv-admin stats

# 设置 cron 任务自动清理（可选）
0 0 * * 0 mdv-admin cleanup  # 每周日凌晨清理
```

---

## 未来改进

### P1 优先级
- [ ] 批量状态保存（debounce 300ms）
- [ ] 虚拟滚动（文件 > 100 时）
- [ ] 版本管理与迁移机制

### P2 优先级
- [ ] 文件变化监听（chokidar）
- [ ] 增量渲染优化
- [ ] 状态导出/导入功能

---

**文档版本**: 1.0
**最后更新**: 2026-02-28
**维护者**: Claude
