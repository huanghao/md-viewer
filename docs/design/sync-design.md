# 学城同步功能设计文档（简化版）

> 2026-03-02 对齐说明：
> - 客户端会话文件集合字段已由 `state.sessionFiles` 更名为 `state.sessionFiles`。
> - 工作区删除态与列表差异状态已拆分到 `workspace-state` 模块，不与会话文件集合耦合。
> - 本文中的同步设计仅描述“同步域状态”，不再承担文件存在性/删除态语义。

## 功能概述

为 MD Viewer 添加将 Markdown 文件同步到学城（通过 km-cli）的功能，支持快速选择常用位置或手动输入目标位置。

---

## 用户场景

1. **首次同步**：用户打开一个 Markdown 文件，点击"同步"按钮
2. **弹出对话框**：选择最近位置或手动输入 parent-id
3. **执行同步**：调用 km-cli 创建文档
4. **状态标记**：同步成功后，按钮变为"已同步"，可以点击查看详情或重新同步

---

## 交互设计（简化版）

### 1. 工具栏同步按钮

```
┌─────────────────────────────────────────────────────┐
│ 📁 docs / api.md          [🔄 同步] 最后修改: 2分钟前│
│                            └─ 新增按钮                │
└─────────────────────────────────────────────────────┘
```

**按钮状态**（简化为 3 种）：
- 未同步：`🔄 同步`
- 已同步：`✓ 已同步` （绿色，点击可查看详情或重新同步）
- 同步中：`⏳ 同步中...` （禁用状态）

### 2. 点击未同步按钮弹出对话框

```
┌─────────────────────────────────────────────────────┐
│  同步到学城                                    [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📄 文件：api.md                                    │
│  📝 标题：[API 文档                          ]      │
│                                                     │
│  📍 选择位置：                                      │
│                                                     │
│  最近位置：                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ ○ 📚 技术文档 / API 参考                    │   │
│  │   最后使用：2小时前                         │   │
│  │                                             │   │
│  │ ○ 📘 项目文档 / 开发指南                    │   │
│  │   最后使用：昨天                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  或手动输入 Parent ID：                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ 123456                                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☑ 同步后打开学城页面                              │
│                                                     │
│             [取消]                 [确定]           │
└─────────────────────────────────────────────────────┘
```

**改动说明**：
- ✅ "开始同步" → "确定"
- ✅ 去掉 URL 输入（只支持 Parent ID）
- ✅ 简化最近位置显示（不显示 URL）

### 3. 同步成功后显示

```
┌─────────────────────────────────────────────────────┐
│  同步成功！                                    [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ 文档已成功同步到学城                            │
│                                                     │
│  📄 标题：API 文档                                  │
│  🔗 链接：https://km.com/pages/987654              │
│                                                     │
│            [在学城中打开]         [关闭]            │
└─────────────────────────────────────────────────────┘
```

### 4. 点击已同步按钮显示详情

```
┌─────────────────────────────────────────────────────┐
│  文档已同步                                    [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📄 标题：API 文档                                  │
│  🔗 链接：https://km.com/pages/987654              │
│  🕐 同步时间：2小时前                               │
│                                                     │
│         [在学城中打开]         [重新同步]           │
└─────────────────────────────────────────────────────┘
```

---

## 数据结构设计

### 1. 同步记录存储

存储位置：`~/.config/md-viewer/sync-records.json`

```json
{
  "recentParents": [
    {
      "id": "123456",
      "title": "技术文档 / API 参考",
      "url": "https://km.com/pages/123456",
      "lastUsed": 1709024400000,
      "useCount": 5
    },
    {
      "id": "789012",
      "title": "项目文档 / 开发指南",
      "url": "https://km.com/pages/789012",
      "lastUsed": 1708938000000,
      "useCount": 3
    }
  ],
  "syncedFiles": {
    "/path/to/api.md": {
      "kmDocId": "987654",
      "kmUrl": "https://km.com/pages/987654",
      "kmTitle": "API 文档",
      "parentId": "123456",
      "lastSyncTime": 1709024400000,
      "lastSyncHash": "abc123...",
      "localLastModified": 1709024300000
    },
    "/path/to/guide.md": {
      "kmDocId": "654321",
      "kmUrl": "https://km.com/pages/654321",
      "kmTitle": "开发指南",
      "parentId": "789012",
      "lastSyncTime": 1708938000000,
      "lastSyncHash": "def456...",
      "localLastModified": 1708938000000
    }
  },
  "defaultParentId": "123456"
}
```

### 2. 客户端状态扩展（简化版）

在现有的 `state.sessionFiles` 中添加同步信息：

```javascript
state.sessionFiles.set(path, {
  path: '/path/to/api.md',
  name: 'api.md',
  content: '# API 文档...',
  active: true,
  lastModified: 1709024300000,
  isRemote: false,

  // 新增同步相关字段（简化）
  syncStatus: 'synced',  // 'none' | 'syncing' | 'synced'
  kmDocId: '987654',
  kmUrl: 'https://km.com/pages/987654',
  kmTitle: 'API 文档',
  lastSyncTime: 1709024400000
});
```

---

## 技术实现方案

### 1. 后端 API 设计

#### `/api/sync/recent-parents` - 获取最近使用的位置

```typescript
GET /api/sync/recent-parents

Response:
{
  "parents": [
    {
      "id": "123456",
      "title": "技术文档 / API 参考",
      "url": "https://km.com/pages/123456",
      "lastUsed": 1709024400000
    }
  ],
  "defaultParentId": "123456"
}
```

#### `/api/sync/execute` - 执行同步

```typescript
POST /api/sync/execute
{
  "filePath": "/path/to/api.md",
  "parentId": "123456",
  "title": "API 文档",  // 可选，默认使用文件名
  "openAfterSync": true  // 是否同步后打开
}

Response (成功):
{
  "success": true,
  "kmDocId": "987654",
  "kmUrl": "https://km.com/pages/987654",
  "kmTitle": "API 文档"
}

Response (失败):
{
  "success": false,
  "error": "命令执行失败",
  "output": "Error: invalid parent-id\nat createDoc..."  // km-cli 原始输出
}
```

#### `/api/sync/status` - 获取文件同步状态

```typescript
GET /api/sync/status?path=/path/to/api.md

Response:
{
  "synced": true,
  "kmDocId": "987654",
  "kmUrl": "https://km.com/pages/987654",
  "kmTitle": "API 文档",
  "lastSyncTime": 1709024400000
}
```

### 2. km-cli 调用封装

创建 `src/km-cli.ts`：

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function createKmDoc(options: {
  parentId: string;
  title: string;
  markdownFile: string;
}): Promise<{ docId: string; url: string }> {
  const cmd = `km-cli doc create --parent-id "${options.parentId}" --title "${options.title}" --markdown-file "${options.markdownFile}" --json`;

  const { stdout } = await execAsync(cmd);
  const result = JSON.parse(stdout);

  return {
    docId: result.id,
    url: result.url
  };
}

export async function getKmDocMeta(contentId: string) {
  const cmd = `km-cli doc get-meta --content-id "${contentId}" --json`;
  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}

export async function validateParentId(parentId: string): Promise<boolean> {
  try {
    await getKmDocMeta(parentId);
    return true;
  } catch {
    return false;
  }
}
```

### 3. 前端 UI 组件

创建同步对话框组件，包含：
- 标题输入框（默认从 Markdown 第一个 # 提取）
- 最近位置选择器（单选框列表）
- 手动输入框
- 同步选项（是否打开）
- 提交按钮

### 4. 状态管理

- 监听文件修改，更新 `needsSync` 标记
- 同步成功后更新本地记录
- 定期检查同步状态（可选）

---

## 视觉设计

### 同步状态图标

- 未同步：无图标
- 已同步：`✓` 绿色勾（#2ea44f）
- 需要同步：`⚠` 黄色警告（#bf8700）
- 同步中：`⏳` 灰色加载动画
- 同步失败：`✗` 红色叉（#cf222e）

### 同步按钮样式

```css
.sync-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5da;
  background: #fff;
}

.sync-button:hover {
  background: #f6f8fa;
}

.sync-button.synced {
  color: #2ea44f;
  border-color: #2ea44f;
}

.sync-button.syncing {
  color: #586069;
  cursor: not-allowed;
}
```

---

## 错误处理

### 1. km-cli 未安装

```
┌─────────────────────────────────────┐
│ ⚠ km-cli 未安装                     │
│                                     │
│ 请先安装 km-cli：                   │
│ $ go install github.com/...         │
│                                     │
│           [了解更多]      [关闭]    │
└─────────────────────────────────────┘
```

### 2. 认证失败

```
┌─────────────────────────────────────┐
│ ⚠ 学城认证失败                      │
│                                     │
│ 请先登录：                          │
│ $ km-cli auth login                 │
│                                     │
│           [重试]          [关闭]    │
└─────────────────────────────────────┘
```

### 3. Parent ID 无效

```
输入框变红，显示错误提示：
┌─────────────────────────────────┐
│ 123456xxx                       │ ← 红色边框
└─────────────────────────────────┘
  ✗ 无效的 Parent ID 或无权限访问
```

### 4. 同步失败（简化版）

```
┌─────────────────────────────────────────────────────┐
│  同步失败                                      [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✗ 执行 km-cli 失败                                 │
│                                                     │
│  命令输出：                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ Error: invalid parent-id                    │   │ ← 可选中复制
│  │ at createDoc (km-cli.js:123)                │   │
│  │ ...                                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│             [复制错误信息]         [关闭]           │
└─────────────────────────────────────────────────────┘
```

**改动说明**：
- ✅ 不分析具体原因
- ✅ 直接显示 km-cli 输出
- ✅ 可复制错误信息

---

## 配置项

在 `~/.config/md-viewer/config.json` 中添加：

```json
{
  "sync": {
    "enabled": true,
    "autoSync": false,  // 是否自动同步修改
    "maxRecentParents": 10,  // 最多保存多少个最近位置
    "defaultOpenAfterSync": true,  // 默认是否同步后打开
    "syncRecordsPath": "~/.config/md-viewer/sync-records.json"
  }
}
```

---

## 实现范围（简化版）

### 要实现的功能：
1. ✅ 工具栏同步按钮（未同步/已同步/同步中 三种状态）
2. ✅ 点击按钮弹出对话框
3. ✅ 对话框包含：标题输入、最近位置列表、手动输入 Parent ID
4. ✅ 调用 km-cli 创建文档
5. ✅ 同步成功后显示链接，可打开学城
6. ✅ 已同步文件点击按钮可查看详情/重新同步
7. ✅ 失败时显示命令输出（可复制）
8. ✅ 保存最近使用的位置（最多 10 个）
9. ✅ 保存文件的同步记录（持久化到 `~/.config/md-viewer/sync-records.json`）

### 不实现的功能：
1. ❌ 左侧列表的同步状态图标
2. ❌ 文件修改检测（needsSync 标记）
3. ❌ 从 URL 提取 parent-id（只支持直接输入 ID）
4. ❌ 批量同步
5. ❌ 冲突处理
6. ❌ 双向同步

---

## 用户流程示例

### 首次同步流程

1. 用户打开 `api.md`
2. 点击工具栏的 `🔄 同步` 按钮
3. 弹出对话框：
   - 标题自动填充为 "API 文档"（从 `# API 文档` 提取）
   - 没有最近位置（首次使用）
   - 手动输入 parent-id: `123456`
   - 勾选"同步后打开学城页面"
4. 点击"确定"
5. 按钮变为 `⏳ 同步中...`（禁用）
6. 同步成功，显示成功对话框，可点击"在学城中打开"
7. 按钮变为 `✓ 已同步`（绿色）

### 查看已同步文件

1. 用户打开已同步过的 `api.md`
2. 工具栏显示 `✓ 已同步`（绿色）
3. 点击按钮，弹出详情对话框：
   - 显示标题、链接、同步时间
   - 可以"在学城中打开"或"重新同步"

### 重新同步流程

1. 在详情对话框点击"重新同步"
2. 弹出同步对话框，自动选中上次使用的位置
3. 点击"确定"
4. 更新文档到学城
