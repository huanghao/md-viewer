# 交互状态机规范与复杂度评分（SMF v1）

日期：2026-03-01

## 1. 目的
为“状态 + 交互 + UI 映射”建立统一表达方式，减少讨论歧义，并在每次迭代时量化复杂度变化。

## 2. 固定产物
每个功能建议维护 4 张表：

1. `State Table`（状态表）
- 字段：`StateId | 语义 | 入口条件 | 退出条件 | 不变量`

2. `Transition Table`（迁移表）
- 字段：`From | Event | Guard | Side Effects | To`

3. `View Mapping`（视图映射表）
- 字段：`StateId | Sidebar | Tabs | Content | Toolbar | Dialog/Popover`

4. `Invariant & Failure`（不变量与失败处理）
- 字段：`Invariant | 触发点 | 违规表现 | 保护措施`

## 3. 复杂度评分
定义：`Interaction Complexity Score (ICS)`

`ICS = 1.0*S + 1.2*T + 0.8*G + 1.5*A + 0.7*V`

变量说明：
- `S`：状态数（State Table 行数）
- `T`：迁移数（Transition Table 行数）
- `G`：Guard 条件分支数量
- `A`：异步副作用数量（网络、SSE、定时器、文件读写）
- `V`：需同步更新的视图区域数量

解释：
- `ICS` 上升不代表一定不好，但必须说明“新增价值 > 复杂度成本”。
- 连续两个迭代 `ICS` 上升时，应优先做简化重构评审。

## 4. 一致性评分
定义：`Consistency Score (CS, 0~100)`

`CS = 30*SC + 30*TC + 20*VC + 20*EC`

- `SC`：状态覆盖率（有无遗漏状态，0~1）
- `TC`：迁移覆盖率（有无未定义迁移，0~1）
- `VC`：视图映射完整度（状态与 UI 一致性，0~1）
- `EC`：测试覆盖度（关键分支是否有 testcase，0~1）

阈值建议：
- `CS >= 85`：可合并
- `70 <= CS < 85`：可试运行，但要补测试/映射
- `CS < 70`：不建议继续叠加新功能

## 5. 变更评审模板
每次涉及状态和交互修改时，附以下摘要：

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

## 6. 最小落地要求
- 至少维护 `State Table + Transition Table`。
- 每次合并交互变更时更新 `ICS/CS`。
- testcase 至少覆盖：成功、失败、异常/中断 三类路径。
