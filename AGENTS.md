# AGENTS.md

This file is a lightweight index of agent rules for this repository.

## Important

- Do not auto-modify this file.
- If you think this file should change, propose suggestions to the user first.

## Working Principles

- Keep tasks and commits focused.
- Update `TODO.md` and `docs/tasks_dashboard.md` when task status changes.
- Run `bun tsc --noEmit` after TypeScript changes.
- Test both CLI and web behavior after feature changes.

## UI Constraint

- 默认不要使用模态框（system `alert/confirm/prompt` 或自定义 modal）承载常规输入/编辑流程。
- 优先使用非模态交互：页面内嵌输入、侧栏表单、行内编辑或抽屉。
- 仅在高风险且不可逆操作（如删除）中允许确认框。

## CLI/Config Change Rules (Concise)

When modifying CLI parameters or configuration behavior:

1. Update CLI man page: `man/md-viewer.1`
2. Update config man page: `man/md-viewer.config.5`
3. Keep `showHelp()` output and man pages consistent
4. Put detailed config docs in: `docs/配置说明.md`

## References

- Build and packaging: `BUILD.md`
- Configuration docs: `docs/配置说明.md`
- Multi-agent collaboration: `docs/multi-agent-collaboration.md`
- Config strategy design: `docs/design/config-strategy.md`

