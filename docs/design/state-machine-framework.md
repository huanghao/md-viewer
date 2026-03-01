# 交互状态机规范与复杂度评分（SMF v2）

日期：2026-03-02

## 1. 目的

用于统一描述：
- 状态
- 迁移
- UI 映射
- 复杂度与一致性评分

并要求文档与当前实现同步。

---

## 2. 固定产物

每个核心交互维护以下 4 张表：

1. `State Table`
- 字段：`StateId | 语义 | 入口条件 | 退出条件 | 不变量`

2. `Transition Table`
- 字段：`From | Event | Guard | Side Effects | To`

3. `View Mapping`
- 字段：`StateId | Sidebar | Tabs | Content | Toolbar | Dialog/Popover`

4. `Invariant & Failure`
- 字段：`Invariant | 触发点 | 违规表现 | 保护措施`

---

## 3. 复杂度评分（ICS）

`ICS = 1.0*S + 1.2*T + 0.8*G + 1.5*A + 0.7*V`

- `S`：状态数
- `T`：迁移数
- `G`：Guard 分支数
- `A`：异步副作用数（网络、SSE、定时器、文件读写）
- `V`：联动视图区域数

解释：
- `ICS` 上升不一定是坏事，但必须有新增价值。
- 连续两次上升应触发简化评审。

## 4. 一致性评分（CS）

`CS = 30*SC + 30*TC + 20*VC + 20*EC`，范围 `0~100`

- `SC`：状态覆盖率
- `TC`：迁移覆盖率
- `VC`：视图映射完整度
- `EC`：测试覆盖度

阈值：
- `CS >= 85`：可合并
- `70 <= CS < 85`：可试运行，需补项
- `CS < 70`：不建议继续叠加功能

---

## 5. 当前功能实例（文件删除态）

### 5.1 State Table（简化）

| StateId | 语义 | 入口条件 | 退出条件 | 不变量 |
|---|---|---|---|---|
| `W.Normal` | 工作区正常文件 | 扫描存在路径 | 删除/消失 | 无 `D` |
| `W.Missing` | 工作区删除态 | 删除事件或扫描消失 | 文件恢复 | 有 `D` + 划线 |
| `S.Opened` | 会话已打开 | 点击或 CLI open | 关闭文件 | 在 `sessionFiles` |
| `S.Deleted` | 已打开但被删 | `file-deleted` 命中会话文件 | 文件恢复/关闭 | `isMissing=true` |

### 5.2 Transition Table（简化）

| From | Event | Guard | Side Effects | To |
|---|---|---|---|---|
| `W.Normal` | `scan diff: missing` | path 不在 scannedSet | `markWorkspacePathMissing` | `W.Missing` |
| `W.Missing` | `scan diff: reappeared` | path 在 scannedSet | `clearWorkspacePathMissing` | `W.Normal` |
| `S.Opened` | `file-deleted` | path 在 `sessionFiles` | `isMissing=true` | `S.Deleted` |
| `W.Missing` | `click + load success` | 文件恢复 | `addOrUpdateFile` + `clearMissing` | `W.Normal + S.Opened` |
| `W.Missing` | `click + load fail` | 无缓存 | `markFileMissing` | `W.Missing + S.Deleted` |

### 5.3 View Mapping（简化）

| StateId | Sidebar | Tabs | Content |
|---|---|---|---|
| `W.Normal` | 正常行/可蓝点 | - | - |
| `W.Missing` | `D + 红色 + 划线` | 不强制出现 | - |
| `S.Opened` | 可高亮当前 | 正常 tab | 正常正文 |
| `S.Deleted` | 删除态 | 红色划线 tab | 删除提示 + 缓存/占位正文 |

### 5.4 Invariant & Failure（关键）

| Invariant | 触发点 | 违规表现 | 保护措施 |
|---|---|---|---|
| 未打开文件删除也必须可见 | `rm` 后 | 没有 `D`，点击才报错 | `workspaceMissingPaths` 独立维护 + case-15 |
| 会话缓存不等于工作区真实态 | 代码演进 | 逻辑耦合/误判 | `sessionFiles` 命名与模块拆分 |

---

## 6. 当前评分（删除态相关）

- 版本：2026-03-02
- 估算：
  - `S=4, T=5, G=4, A=3, V=3`
  - `ICS = 4 + 6 + 3.2 + 4.5 + 2.1 = 19.8`
- 一致性估算：
  - `SC=1.0, TC=0.95, VC=0.9, EC=0.95`
  - `CS = 30 + 28.5 + 18 + 19 = 95.5`

注：分值用于回归比较，不是绝对质量分。

---

## 7. 变更评审模板

```text
[State Machine Delta]
- Added states: ...
- Removed states: ...
- Added transitions: ...
- Removed transitions: ...
- ICS: old -> new (delta: ...)
- CS: old -> new (delta: ...)
- Risk: ...
- Mitigation: ...
```

