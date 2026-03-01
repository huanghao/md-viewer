# AGENTS.md

## Scope

This file defines durable, project-specific principles.
Do not place tool-operational playbooks here unless they are temporary workarounds.

## What Belongs Here

- Project context the model cannot reliably infer
- Decision boundaries and priorities
- Stable constraints that should survive model capability changes

## Task Principles

- 任务来源：优先从 `TODO.md` 与 `docs/steward/` 选择。
- 任务状态使用统一语义：开始、🔄进行中、⏳等待、✅完成、🚫放弃。
- 任务事实源以 `TODO.md` 为主，`docs/tasks_dashboard.md` 作为同步看板。
- 当完成任务超过一半时，可进行 `TODO.md` 清理重排；不得改写原任务描述语义。
- 用户偏好参考`USER_STYLE.md`

## Design Principles

- 涉及体验变化（参数、交互、视觉）或复杂策略变化时，先做设计方案再实现。
- 设计文档放在 `docs/design/`，并把待决策项放在文档最前。
- 设计文档以产品与流程为主，代码仅用于帮助理解。
- 如果视觉效果上有明显变化，就不需要再toast通知，不要增加这种干扰效果。

## Interaction Constraints

- 默认不使用模态框（system `alert/confirm/prompt` 或自定义 modal）承载常规输入/编辑流程。
- 优先使用非模态交互：页面内嵌输入、侧栏表单、行内编辑、抽屉。
- 仅在高风险且不可逆操作中允许确认交互。

## Collaboration Principles

- 提交应聚焦单一目标，避免把无关改动混入同一提交。
- 多方实现冲突时，优先保留双方意图并显式标注待人工决策点。
- 设计冲突应并列记录方案并等待人类决策。

## Documentation Consistency

当 CLI 参数或配置行为发生变化时，保持以下文档一致：

- `man/md-viewer.1`
- `man/md-viewer.config.5`
- `docs/配置说明.md`
- `showHelp()` 输出

## Operational Playbooks (Elsewhere)

具体操作流程（如 Git 命令步骤、冲突处置流程、提交节奏）不在本文件维护，统一放在：

- `docs/multi-agent-collaboration.md`
- `BUILD.md`

若某条操作细节仅为短期 workaround，可临时写入本文件，并标注到期删除条件。
