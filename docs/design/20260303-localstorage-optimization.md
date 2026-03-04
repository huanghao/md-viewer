# LocalStorage 存储优化方案

## 当前存储结构分析

### 存储项清单

根据代码分析，md-viewer 在 localStorage 中存储以下数据：

| Key | 用途 | 数据结构 | 预估大小 |
|-----|------|---------|---------|
| `md-viewer:openFiles` | 打开的文件列表和状态 | JSON 对象数组 | 中等 |
| `md-viewer:config` | 应用配置（侧边栏模式、工作区） | JSON 对象 | 小 |
| `md-viewer:syncState` | 同步状态元数据 | Map 序列化 | 中等 |
| `md-viewer:workspace-state` | 工作区状态（展开/折叠） | JSON 对象 | 小 |
| `md-viewer:annotations:{filePath}` | 每个文件的批注数据 | JSON 数组 | **大** |
| `md-viewer:sidebar-width` | 侧边栏宽度 | 数字字符串 | 极小 |
| `md-viewer:annotation-sidebar-collapsed` | 批注栏折叠状态 | 布尔字符串 | 极小 |
| `fontScale` | 字体缩放比例 | 数字字符串 | 极小 |

---

## 规模推算

### 假设场景

#### 场景 1：轻度使用
- **文件数**：10 个
- **批注**：每文件 5 条，每条 150 字符
- **打开文件**：5 个

**存储占用估算：**
```
批注数据：
  10 文件 × 5 条 × 200 字节 = 10 KB

打开文件状态：
  5 文件 × 500 字节 = 2.5 KB

配置和其他：
  约 2 KB

总计：约 15 KB
```

---

#### 场景 2：中度使用
- **文件数**：50 个
- **批注**：每文件 10 条，每条 150 字符
- **打开文件**：20 个

**存储占用估算：**
```
批注数据：
  50 文件 × 10 条 × 200 字节 = 100 KB

打开文件状态：
  20 文件 × 500 字节 = 10 KB

同步状态：
  50 文件 × 100 字节 = 5 KB

配置和其他：
  约 5 KB

总计：约 120 KB
```

---

#### 场景 3：重度使用
- **文件数**：200 个
- **批注**：每文件 20 条，每条 200 字符
- **打开文件**：50 个

**存储占用估算：**
```
批注数据：
  200 文件 × 20 条 × 250 字节 = 1 MB

打开文件状态：
  50 文件 × 500 字节 = 25 KB

同步状态：
  200 文件 × 100 字节 = 20 KB

工作区状态：
  约 10 KB

配置和其他：
  约 5 KB

总计：约 1.06 MB
```

---

#### 场景 4：极端使用
- **文件数**：500 个
- **批注**：每文件 50 条，每条 250 字符
- **打开文件**：100 个

**存储占用估算：**
```
批注数据：
  500 文件 × 50 条 × 300 字节 = 7.5 MB

打开文件状态：
  100 文件 × 500 字节 = 50 KB

同步状态：
  500 文件 × 100 字节 = 50 KB

工作区状态：
  约 20 KB

配置和其他：
  约 10 KB

总计：约 7.63 MB
```

**⚠️ 风险：接近 localStorage 的 5-10MB 限制！**

---

## 占比结构分析

### 典型中度使用场景（120 KB）

```
批注数据：      100 KB  (83%)  ████████████████████
打开文件状态：   10 KB  (8%)   ██
同步状态：        5 KB  (4%)   █
配置和其他：      5 KB  (5%)   █
```

### 重度使用场景（1 MB）

```
批注数据：     1000 KB  (94%)  ████████████████████
打开文件状态：   25 KB  (2%)
同步状态：       20 KB  (2%)
工作区状态：     10 KB  (1%)
配置和其他：      5 KB  (1%)
```

**结论：批注数据是存储占用的主要来源（80-95%）**

---

## 存在的问题

### 1. 批注数据爆炸
- **问题**：每个文件的批注独立存储，随文件数线性增长
- **风险**：500+ 文件且批注较多时，可能超出 localStorage 限制
- **影响**：导致存储失败，批注丢失

### 2. 无清理机制
- **问题**：删除文件后，批注数据仍保留
- **风险**：累积大量无用数据
- **影响**：浪费存储空间，影响性能

### 3. 全量存储
- **问题**：每次保存都是全量 JSON
- **风险**：频繁操作时性能开销大
- **影响**：可能阻塞 UI

### 4. 无压缩
- **问题**：文本数据未压缩
- **风险**：浪费存储空间
- **影响**：更快达到限制

### 5. 无备份/导出
- **问题**：数据只在 localStorage，清除浏览器数据会丢失
- **风险**：数据丢失无法恢复
- **影响**：用户体验差

---

## 优化方案

### 方案 1：批注数据压缩（短期，P0）

#### 实现方式

使用 LZ-String 等轻量级压缩库：

```typescript
import LZString from 'lz-string';

export function saveAnnotations(filePath: string, annotations: Annotation[]): void {
  const json = JSON.stringify(annotations);
  const compressed = LZString.compress(json);
  localStorage.setItem(getStorageKey(filePath), compressed);
}

export function loadAnnotations(filePath: string): Annotation[] {
  try {
    const compressed = localStorage.getItem(getStorageKey(filePath));
    if (!compressed) return [];
    const json = LZString.decompress(compressed);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}
```

#### 效果预估

- **压缩率**：50-70%（文本数据）
- **性能开销**：可忽略（< 10ms）
- **存储节省**：
  - 中度使用：100 KB → 40 KB（节省 60 KB）
  - 重度使用：1 MB → 400 KB（节省 600 KB）

**优点：**
- ✅ 实现简单，改动小
- ✅ 显著降低存储占用
- ✅ 性能开销小

**缺点：**
- ⚠️ 增加依赖（约 3 KB）
- ⚠️ 调试时不可读

---

### 方案 2：LRU 清理机制（短期，P0）

#### 实现方式

限制批注数据总量，超出时删除最久未访问的文件批注：

```typescript
const MAX_ANNOTATION_FILES = 100; // 最多保留 100 个文件的批注
const MAX_ANNOTATIONS_PER_FILE = 50; // 每文件最多 50 条批注

// 记录访问时间
function recordAccess(filePath: string): void {
  const key = `md-viewer:annotation-access:${filePath}`;
  localStorage.setItem(key, String(Date.now()));
}

// 清理旧批注
function cleanupOldAnnotations(): void {
  const annotationKeys: Array<{ key: string; time: number }> = [];

  // 收集所有批注文件
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('md-viewer:annotations:')) {
      const filePath = key.replace('md-viewer:annotations:', '');
      const accessKey = `md-viewer:annotation-access:${filePath}`;
      const time = Number(localStorage.getItem(accessKey)) || 0;
      annotationKeys.push({ key, time });
    }
  }

  // 按访问时间排序
  annotationKeys.sort((a, b) => b.time - a.time);

  // 删除超出限制的
  if (annotationKeys.length > MAX_ANNOTATION_FILES) {
    const toRemove = annotationKeys.slice(MAX_ANNOTATION_FILES);
    toRemove.forEach(({ key }) => {
      localStorage.removeItem(key);
      const filePath = key.replace('md-viewer:annotations:', '');
      localStorage.removeItem(`md-viewer:annotation-access:${filePath}`);
    });
  }
}

// 限制单文件批注数量
export function saveAnnotations(filePath: string, annotations: Annotation[]): void {
  // 限制数量
  const limited = annotations.slice(-MAX_ANNOTATIONS_PER_FILE);

  localStorage.setItem(getStorageKey(filePath), JSON.stringify(limited));
  recordAccess(filePath);

  // 定期清理
  if (Math.random() < 0.1) { // 10% 概率触发
    cleanupOldAnnotations();
  }
}
```

**优点：**
- ✅ 防止无限增长
- ✅ 自动清理旧数据
- ✅ 保留常用数据

**缺点：**
- ⚠️ 可能删除有用数据
- ⚠️ 需要用户理解机制

---

### 方案 3：IndexedDB 迁移（中期，P1）

#### 实现方式

将批注数据从 localStorage 迁移到 IndexedDB：

```typescript
// 使用 idb 库简化操作
import { openDB, DBSchema } from 'idb';

interface AnnotationDB extends DBSchema {
  annotations: {
    key: string; // filePath
    value: {
      filePath: string;
      annotations: Annotation[];
      updatedAt: number;
    };
  };
}

const dbPromise = openDB<AnnotationDB>('md-viewer', 1, {
  upgrade(db) {
    db.createObjectStore('annotations', { keyPath: 'filePath' });
  },
});

export async function saveAnnotations(
  filePath: string,
  annotations: Annotation[]
): Promise<void> {
  const db = await dbPromise;
  await db.put('annotations', {
    filePath,
    annotations,
    updatedAt: Date.now(),
  });
}

export async function loadAnnotations(filePath: string): Promise<Annotation[]> {
  try {
    const db = await dbPromise;
    const record = await db.get('annotations', filePath);
    return record?.annotations || [];
  } catch (_err) {
    return [];
  }
}

// 批量清理
export async function cleanupOldAnnotations(daysOld: number = 90): Promise<void> {
  const db = await dbPromise;
  const threshold = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  const tx = db.transaction('annotations', 'readwrite');
  const store = tx.objectStore('annotations');
  const cursor = await store.openCursor();

  while (cursor) {
    if (cursor.value.updatedAt < threshold) {
      await cursor.delete();
    }
    await cursor.continue();
  }
}
```

**优点：**
- ✅ 存储容量大（几百 MB）
- ✅ 异步操作，不阻塞 UI
- ✅ 支持索引和查询
- ✅ 更好的性能

**缺点：**
- ⚠️ 实现复杂度高
- ⚠️ 需要迁移现有数据
- ⚠️ 增加依赖

---

### 方案 4：服务端同步（长期，P2）

#### 实现方式

将批注数据同步到服务端（可选）：

```typescript
// 本地优先，异步同步
export async function saveAnnotations(
  filePath: string,
  annotations: Annotation[]
): Promise<void> {
  // 1. 立即保存到本地
  await saveToIndexedDB(filePath, annotations);

  // 2. 异步同步到服务端
  syncToServer(filePath, annotations).catch(err => {
    console.warn('同步失败，将在后台重试:', err);
    queueRetry(filePath, annotations);
  });
}

async function syncToServer(
  filePath: string,
  annotations: Annotation[]
): Promise<void> {
  await fetch('/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, annotations }),
  });
}

// 离线队列
const syncQueue: Array<{ filePath: string; annotations: Annotation[] }> = [];

function queueRetry(filePath: string, annotations: Annotation[]): void {
  syncQueue.push({ filePath, annotations });
  // 定期重试
  setTimeout(processSyncQueue, 60000); // 1 分钟后重试
}

async function processSyncQueue(): Promise<void> {
  while (syncQueue.length > 0) {
    const item = syncQueue.shift();
    if (!item) break;
    try {
      await syncToServer(item.filePath, item.annotations);
    } catch (err) {
      // 重新入队
      syncQueue.push(item);
      break;
    }
  }
}
```

**优点：**
- ✅ 数据不会丢失
- ✅ 跨设备同步
- ✅ 无存储限制

**缺点：**
- ⚠️ 需要后端支持
- ⚠️ 网络依赖
- ⚠️ 隐私和安全问题

---

### 方案 5：导出/导入功能（短期，P1）

#### 实现方式

允许用户手动导出和导入批注数据：

```typescript
// 导出所有批注
export function exportAnnotations(): string {
  const allAnnotations: Record<string, Annotation[]> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('md-viewer:annotations:')) {
      const filePath = key.replace('md-viewer:annotations:', '');
      allAnnotations[filePath] = loadAnnotations(filePath);
    }
  }

  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    annotations: allAnnotations,
  }, null, 2);
}

// 导入批注
export function importAnnotations(json: string): void {
  try {
    const data = JSON.parse(json);
    if (data.version !== 1) {
      throw new Error('不支持的导出版本');
    }

    Object.entries(data.annotations).forEach(([filePath, annotations]) => {
      saveAnnotations(filePath, annotations as Annotation[]);
    });

    showSuccess(`成功导入 ${Object.keys(data.annotations).length} 个文件的批注`);
  } catch (err) {
    showError('导入失败：' + (err as Error).message);
  }
}

// UI 按钮
<button onclick="downloadAnnotations()">导出批注</button>
<input type="file" accept=".json" onchange="uploadAnnotations(event)">

function downloadAnnotations(): void {
  const json = exportAnnotations();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `md-viewer-annotations-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function uploadAnnotations(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const json = e.target?.result as string;
    importAnnotations(json);
  };
  reader.readAsText(file);
}
```

**优点：**
- ✅ 用户掌控数据
- ✅ 备份和恢复
- ✅ 跨浏览器迁移

**缺点：**
- ⚠️ 需要手动操作
- ⚠️ 不是自动化方案

---

### 方案 6：存储监控和警告（短期，P0）

#### 实现方式

监控 localStorage 使用情况，接近限制时警告用户：

```typescript
// 计算 localStorage 使用量
function getLocalStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return total * 2; // UTF-16 编码，每字符 2 字节
}

// 检查存储空间
function checkStorageSpace(): void {
  const used = getLocalStorageSize();
  const usedMB = (used / 1024 / 1024).toFixed(2);
  const limit = 5 * 1024 * 1024; // 假设 5MB 限制
  const percentage = (used / limit) * 100;

  console.log(`LocalStorage 使用: ${usedMB} MB (${percentage.toFixed(1)}%)`);

  if (percentage > 80) {
    showWarning(`存储空间即将用尽（${percentage.toFixed(0)}%），建议清理旧批注或导出数据`);
  } else if (percentage > 90) {
    showError(`存储空间严重不足（${percentage.toFixed(0)}%），请立即清理数据！`);
  }
}

// 定期检查（每次保存时）
export function saveAnnotations(filePath: string, annotations: Annotation[]): void {
  try {
    localStorage.setItem(getStorageKey(filePath), JSON.stringify(annotations));

    // 每 10 次保存检查一次
    if (Math.random() < 0.1) {
      checkStorageSpace();
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      showError('存储空间已满，无法保存批注！请清理数据或导出备份。');
      // 尝试自动清理
      cleanupOldAnnotations();
    }
  }
}
```

**优点：**
- ✅ 实现简单
- ✅ 提前预警
- ✅ 避免数据丢失

**缺点：**
- ⚠️ 只是提醒，不解决问题

---

## 推荐实施路线图

### 阶段 1：紧急优化（1-2 天）

**目标：防止存储爆炸**

1. **存储监控和警告**（方案 6）
   - 实现存储空间检查
   - 接近限制时警告用户
   - 捕获 QuotaExceededError

2. **LRU 清理机制**（方案 2）
   - 限制批注文件数（100 个）
   - 限制单文件批注数（50 条）
   - 自动清理最久未访问

3. **导出/导入功能**（方案 5）
   - 添加导出按钮
   - 添加导入功能
   - 提供备份能力

**预期效果：**
- ✅ 防止存储溢出
- ✅ 用户可备份数据
- ✅ 自动清理旧数据

---

### 阶段 2：性能优化（3-5 天）

**目标：降低存储占用**

1. **批注数据压缩**（方案 1）
   - 集成 LZ-String
   - 压缩批注 JSON
   - 兼容旧数据

2. **优化数据结构**
   - 移除冗余字段
   - 使用更紧凑的格式
   - 例如：`createdAt` 使用时间戳而非 ISO 字符串

**预期效果：**
- ✅ 存储占用减少 50-70%
- ✅ 延长可用时间
- ✅ 性能基本无影响

---

### 阶段 3：架构升级（1-2 周）

**目标：彻底解决存储限制**

1. **IndexedDB 迁移**（方案 3）
   - 创建 IndexedDB 数据库
   - 迁移现有数据
   - 实现新的存储 API

2. **自动清理策略**
   - 定期清理 90 天未访问的批注
   - 用户可配置保留时间
   - 提供清理预览

**预期效果：**
- ✅ 存储容量提升 100 倍
- ✅ 性能更好
- ✅ 支持更多功能

---

### 阶段 4：云端同步（长期规划）

**目标：跨设备数据同步**

1. **服务端 API**（方案 4）
   - 设计 RESTful API
   - 实现增量同步
   - 离线队列和冲突解决

2. **用户账号系统**
   - OAuth 登录
   - 数据加密
   - 隐私保护

**预期效果：**
- ✅ 数据永不丢失
- ✅ 跨设备同步
- ✅ 团队协作能力

---

## 数据结构优化建议

### 当前批注数据结构

```typescript
interface Annotation {
  id: string;              // "ann-1709467200000-a1b2c3"
  start: number;           // 123
  length: number;          // 45
  quote: string;           // "被批注的文本内容"
  note: string;            // "批注内容"
  createdAt: number;       // 1709467200000
}
```

### 优化后的数据结构

```typescript
// 压缩版本（减少字段名长度）
interface CompactAnnotation {
  i: string;    // id
  s: number;    // start
  l: number;    // length
  q: string;    // quote
  n: string;    // note
  t: number;    // createdAt (timestamp)
}

// 存储时
const compact = annotations.map(a => ({
  i: a.id,
  s: a.start,
  l: a.length,
  q: a.quote,
  n: a.note,
  t: a.createdAt,
}));

// 读取时
const full = compact.map(c => ({
  id: c.i,
  start: c.s,
  length: c.l,
  quote: c.q,
  note: c.n,
  createdAt: c.t,
}));
```

**节省空间：**
- 字段名从 ~50 字符减少到 ~10 字符
- 每条批注节省约 40 字节
- 1000 条批注节省约 40 KB

---

## 总结

### 存储占用分析

| 使用场景 | 文件数 | 批注数 | 预估占用 | 风险等级 |
|---------|-------|--------|---------|---------|
| 轻度使用 | 10 | 50 | 15 KB | ✅ 安全 |
| 中度使用 | 50 | 500 | 120 KB | ✅ 安全 |
| 重度使用 | 200 | 4000 | 1 MB | ⚠️ 注意 |
| 极端使用 | 500 | 25000 | 7.6 MB | ❌ 危险 |

### 推荐优化方案优先级

| 方案 | 优先级 | 实施难度 | 效果 | 时间 |
|-----|-------|---------|------|------|
| 存储监控和警告 | P0 | 低 | 中 | 0.5 天 |
| LRU 清理机制 | P0 | 中 | 高 | 1 天 |
| 导出/导入功能 | P1 | 低 | 中 | 1 天 |
| 批注数据压缩 | P1 | 低 | 高 | 1 天 |
| IndexedDB 迁移 | P1 | 高 | 极高 | 1 周 |
| 服务端同步 | P2 | 极高 | 极高 | 2-4 周 |

### 立即行动建议

**第一步（今天）：**
1. 实现存储监控
2. 添加 QuotaExceededError 捕获
3. 警告用户接近限制

**第二步（本周）：**
1. 实现 LRU 清理
2. 添加导出/导入功能
3. 集成数据压缩

**第三步（下周）：**
1. 迁移到 IndexedDB
2. 优化数据结构
3. 自动清理策略

通过这些优化，md-viewer 可以支持：
- ✅ 500+ 文件
- ✅ 10,000+ 批注
- ✅ 长期稳定运行
- ✅ 数据不丢失
