# AGENTS.md

## Important

- Do not auto-modify this file.
- If you think this file should change, propose suggestions to the user first.

## 任务处理规则
- 我会不定期往`TODO.md`里追加任务，你从这里和`docs/steward/`下选择任务进行工作

1) 任务分类
- 普通任务：几乎不需要我的参与。完成后提交代码，继续选择新任务
- 设计类任务：可能需要我的参与
    - 在`docs/design/`下编写文档，等待我确认
    - 把待决策的选项放到设计文档最前面
    - 涉及到体验变化，比如命令行参数、交互、视觉等，或者复杂的策略变化，必须先做设计方案
    - 设计方案以产品、流程设计为主，可以写API/接口设计，但不用贴具体代码（除非帮助理解的小段核心代码）
    - 你在完成普通任务过程中，遇到了不能继续的情况，可以把任务提升为设计类任务。比如我可能把某个任务想简单了
- 清洁工任务：不同的任务之间可能需求/设计/实现有冲突，你需要发现它们并追加到`docs/steward/`下
- Harness：10000x倍速进化

2) 任务处理
- 你每次从中挑选一个任务执行
- 如果我提供了屏幕截图参考，请先处理变小，减少上下文消耗

3) 任务维护
- 任务状态：开始（默认状态）、🔄进行中、⏳等待、✅完成、🚫放弃
- 你每次新拿到任务，立刻更新状态，避免另一个agent拿到同一个任务
- 在`TODO.md`中更新任务状态、时间、和你产生的其他文件链接等精简信息
- 处理完任务更新`docs/tasks_dashboard.md`，用表格展示任务状态
- 当处理完成任务数量超过一半时，开始清理`TODO.md`。
    - 重排的时候**不要**改动任务描述本身，只用整体进行清理和排序
    - 分类状态排序: 等待 > 未开始 > 继续 > 进行中 > 放弃 > 完成

## 设计约束

- 默认不要使用模态框（system `alert/confirm/prompt` 或自定义 modal）承载常规输入/编辑流程。
- 优先使用非模态交互：页面内嵌输入、侧栏表单、行内编辑或抽屉。
- 仅在高风险且不可逆操作（如删除）中允许确认框。

## Agent协作规则

1) 开始任务前：
- 先阅读 `TODO.md`，避免领取冲突任务。
- 领取任务后立刻更新任务状态为 `🔄进行中 - Agent-ID - 时间`。

2) 开发与提交节奏
- 建议每 5-10 分钟提交一次进展（允许 `WIP`）。
- 提交应聚焦单一目标，避免把无关改动混入同一 commit。
- 完成或放弃任务后，立即更新状态为 `✅完成` 或 `🚫放弃`（带时间）。

3) Commit Message 规范
- 统一格式：`<type>: <description> (by <agent-id>)`
- 类型：`feat`、`fix`、`docs`、`refactor`、`test`、`chore`
- 增加 Co-Authored-By 模型名称和版本

4) 冲突处理

1. Git 冲突：
- 不确定时保留双方意图，不轻易删除他人实现。
- 在代码或任务中添加 `TODO(@human)` 记录冲突背景与待决策点。
- 解决后继续 rebase 流程。

2. 任务冲突：
- 若任务 30+ 分钟无更新，可接管。
- 接管时在任务状态中注明接管信息与已完成/待继续内容。

3. 设计冲突：
- 在设计文档中并列记录方案 A/B。
- 在 `TODO.md` 添加等待人类决策任务。

## 文档更新规则

修改了命令行参数和配置代码后：
- 更新`man/md-viewer.1`
- 更新`man/md-viewer.config.5`
- Keep `showHelp()` output and man pages consistent
- Put detailed config docs in: `docs/配置说明.md`

## References

- Build and packaging: `BUILD.md`
