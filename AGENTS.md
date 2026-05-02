# AGENTS.md

## Scope

This file defines durable, project-specific principles.
Do not place tool-operational playbooks here unless they are temporary workarounds.

## What Belongs Here

- Project context the model cannot reliably infer
- Decision boundaries and priorities
- Stable constraints that should survive model capability changes

## 开发原则

- 完成功能后考虑增加测试，特别是逻辑复杂的业务功能
- 相似的代码、功能不要在多个地方重写。如果少量代码重复，但出现在多处，在代码附近加上注释，让agent能注意到关联代码，避免下次修改的时候遗漏

## Design Principles

- 涉及体验变化（参数、交互、视觉）或复杂策略变化时，先做设计方案再实现。
- 设计文档放在 `docs/design/`，并把待决策项放在文档最前。
- 设计文档以产品与流程为主，代码仅用于帮助理解。
- 功能用效果直接说话，不要增加冗余的页面：如果视觉效果上有明显变化，就不需要用另一种形式再来通知一遍，比如 toast、或者状态成功的落地页。

## Interaction Constraints

- 默认不使用模态框（system `alert/confirm/prompt` 或自定义 modal）承载常规输入/编辑流程。
- 优先使用非模态交互：页面内嵌输入、侧栏表单、行内编辑、抽屉。
- 仅在高风险且不可逆操作中允许确认交互。

## No `window.*` Globals for Inter-Component Communication

禁止用 `(window as any).xxx = fn` 或 `window.xxx = fn` 的方式在模块间传递函数或触发行为。这种模式绕过 TypeScript 类型系统，使重命名/查找引用完全失效，并让模块间依赖在 IDE 中不可见。

已知存量代码（`sidebar-workspace.ts`、`workspace-focus.ts` 等）使用了这种模式，这是技术债，不是可效仿的先例。

**替代方案：**
- HTML 模板内的 `onclick` 处理：用事件委托（`data-action` + `data-*` 属性 + 父级 `addEventListener`），在同一文件内处理
- 跨模块触发行为：用 `CustomEvent` + `document.dispatchEvent`，接收方 `addEventListener`
- 需要向子模块注入回调：通过函数参数或导出的 `init(callbacks)` 模式传入

## Count/Badge Consistency

凡是涉及"计数"的地方（badge、tab 数字、摘要 API），必须使用同一个判断函数，不得内联重写条件：

- 批注 open 计数统一用 `isOpen(status)`（来自 `annotation-status.ts`），禁止写 `status !== 'resolved'` 或 `status === 'anchored'` 等等价但分散的条件
- 服务端聚合（`calculateOpenCount`）、客户端增量（`adjustAnnotationCount` 的调用处）、UI 过滤（`matchesFilter`）三处逻辑必须基于同一函数，改一处必须同步检查其他处
- 新增状态枚举值时，必须同步更新 `annotation-status.ts` 中的所有判断函数，并补充 `annotation-count-badge.test.ts` 中的覆盖用例

## Collaboration Principles

- 提交应聚焦单一目标，避免把无关改动混入同一提交。
- 多方实现冲突时，优先保留双方意图并显式标注待人工决策点。

## Documentation Consistency

当 CLI 参数或配置行为发生变化时，同步更新 `showHelp()` 输出。

文档治理规范：`docs/文档治理规范.md`

