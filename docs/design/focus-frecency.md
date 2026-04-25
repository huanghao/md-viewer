# 焦点列表 Frecency 设计方案

## 问题

当前焦点列表用 `lastModified` + 时间窗口硬截断：
- 窗口小（8h）：噪音少，但容易漏掉真正关心的文件
- 窗口大（2d）：agent 批量生成/修改的文件大量涌入，列表失去焦点
- 本质：`mtime` 无法区分「用户主动关注」和「agent 机械写入」

---

## 核心思路：Frecency 热度分

每个文件维护一个**热度分**，由多种信号叠加，随时间指数衰减。热度分低于阈值自动从列表消失，不需要时间窗口的概念。

```
score(file) = Σ signal_i × e^(−λ × age_i_in_hours)
```

衰减系数 `λ` 决定半衰期：`λ = ln(2) / half_life_hours`

### 信号权重（初始建议值）

| 信号 | 权重 | 半衰期 | 说明 |
|------|------|--------|------|
| 用户打开文件（tab 切换） | 10 | 48h | `switchToFile()` 触发 |
| 用户写评论（annotation:created） | 15 | 48h | 主动标注，强意图信号 |
| 仅 agent 修改（mtime 变化，无用户交互） | 1 | 8h | 快速衰减 |
| 用户 pin 文件 | — | 永久 | 不参与衰减，始终置顶 |

### 显示阈值

score < 2.0 时不显示（相当于一次「打开」信号衰减约 100h 后消失）。

---

## 信号采集

### 区分「用户打开」vs「agent 修改」

- **用户打开**：`switchToFile()` 被调用（来自 `handleFocusFileClick` / `switchFile`）
- **agent 修改**：只有 `lastModified` 更新，没有 `switchToFile()` 调用

现有调用链天然区分，不需要额外埋点逻辑。

### 3 处埋点位置

| 位置 | 信号类型 | 文件 |
|------|---------|------|
| `switchToFile()` 末尾 | `open` | `src/client/state.ts:207` |
| `annotation:created` 事件监听 | `annotate` | `src/client/annotation.ts` initAnnotationElements 里 |
| 工作区扫描，mtime 有变化时 | `mtime` | `src/client/workspace.ts` scanWorkspace 里 |

---

## 数据存储：本地文件（不进 git）

信号写入项目内 `logs/focus-signals.jsonl`，每行一条记录（JSONL 格式）。

```
logs/                  ← 已在 .gitignore
  focus-signals.jsonl  ← 信号流水账
```

每行格式：
```json
{"ts":1745123456789,"type":"open","file":"/abs/path/to/file.md"}
{"ts":1745123460000,"type":"mtime","file":"/abs/path/to/other.md"}
{"ts":1745123480000,"type":"annotate","file":"/abs/path/to/file.md"}
```

写入方式：通过 `/api/focus-signal` 接口从客户端 POST 到服务端追加写文件（fetch + fire-and-forget，不阻塞 UI）。

服务端接口极简：
```typescript
app.post('/api/focus-signal', async (c) => {
  const { type, file } = await c.req.json<{ type: string; file: string }>();
  const line = JSON.stringify({ ts: Date.now(), type, file }) + '\n';
  await Bun.file('logs/focus-signals.jsonl').writer().write(line);  // append
  return c.json({ ok: true });
});
```

---

## 分析脚本

`scripts/analyze-focus.ts` — 由 Claude 定期运行，输出结论。

### 功能

1. 读取 `logs/focus-signals.jsonl`
2. 计算每个文件的 frecency score（用设计中的权重和半衰期）
3. 读取各工作区当前文件树（调用扫描或读缓存），得到 mtime 列表
4. 对比两个列表，输出：

```
=== Frecency vs mtime 对比分析 ===
时间范围：最近 7 天（N 条信号）

【frecency 独有，mtime 漏掉】（用户关注但 mtime 窗口外）
  score=18.3  /path/to/file-a.md   最近打开 2 次，写评论 1 次
  score= 6.1  /path/to/file-b.md   最近打开 1 次

【mtime 独有，frecency 过滤掉】（噪音：agent 写入但用户未关注）
  mtime=1h    /path/to/generated-c.md   仅 mtime 信号 3 次，无用户交互
  mtime=3h    /path/to/generated-d.md   仅 mtime 信号 1 次

【两者共有】
  score=24.1  mtime=30min  /path/to/active-e.md
  ...（共 N 个）

【结论】
  噪音过滤率：X%（mtime 有但 frecency 过滤的 / mtime 总数）
  召回率：Y%（frecency 有且 mtime 也有 / frecency 总数）
  建议：当前参数 [合理 / 阈值偏高（漏了 N 个用户关注文件）/ 阈值偏低（还有 N 个噪音）]
```

5. 输出调参建议（尝试不同阈值，找噪音过滤率和召回率的最优点）

---

## 实现步骤

### Step 1：服务端接口 + 日志目录

- `src/server.ts`：加 `POST /api/focus-signal` 路由，追加写 `logs/focus-signals.jsonl`
- 确认 `logs/` 在 `.gitignore`（已有）

### Step 2：客户端信号采集模块

新建 `src/client/utils/focus-signals.ts`：

```typescript
export type SignalType = 'open' | 'annotate' | 'mtime';

export function recordSignal(filePath: string, type: SignalType): void {
  // fire-and-forget，不阻塞
  fetch('/api/focus-signal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, file: filePath }),
  }).catch(() => {}); // 静默失败，不影响主流程
}
```

### Step 3：3 处埋点

**`src/client/state.ts` — switchToFile() 末尾**
```typescript
import { recordSignal } from './utils/focus-signals';
// state.currentFile = path 之后：
recordSignal(path, 'open');
```

**`src/client/annotation.ts` — initAnnotationElements() 里**
```typescript
import { recordSignal } from './utils/focus-signals';
document.addEventListener('annotation:created', (e: Event) => {
  const { filePath } = (e as CustomEvent).detail;
  if (filePath) recordSignal(filePath, 'annotate');
});
```

**`src/client/workspace.ts` — scanWorkspace() 里，更新 fileTree 后**
```typescript
import { recordSignal } from './utils/focus-signals';
// 对比旧 mtime：
if (oldNode && oldNode.lastModified !== newNode.lastModified) {
  recordSignal(newNode.path, 'mtime');
}
```

### Step 4：分析脚本

新建 `scripts/analyze-focus.ts`，用 `bun scripts/analyze-focus.ts` 运行。

---

## 替换时机

分析脚本输出「建议：合理」且持续稳定一段时间后：

1. `getActiveFiles()` 改为接受 `scores: Map<string, number>` 参数
2. 过滤条件改为 `score >= threshold || pinned`
3. 排序改为 `score` 降序
4. 移除时间窗口选择 UI

---

## 风险与 fallback

- **冷启动**：`logs/focus-signals.jsonl` 不存在时，`getActiveFiles()` 保持现有 mtime 逻辑不变
- **服务器未启动**：`recordSignal` 的 fetch 静默失败，不影响任何功能
- **文件过大**：脚本分析时自动只读最近 30 天的行；服务端可按天 rotate（后续再加）
