# Multi-Agent Collaboration Rules

This file is the operational playbook (step-level workflows and command-level guidance).

## Task Lifecycle

1. Before selecting a task:
- `git pull`
- Read `TODO.md` and `docs/tasks_dashboard.md`
- Avoid claimed tasks

2. Claim immediately:

```markdown
## Task Title [🔄进行中 - Agent-ID - 2026-03-01 10:30]
```

3. During execution:
- Commit progress every 5-10 minutes (WIP allowed)
- Update key progress in `TODO.md`

4. Finish or abandon immediately:

```markdown
## Task Title [✅完成 - 2026-03-01 15:00]
## Task Title [🚫放弃 - 2026-03-01 15:00]
```

## Shared File Safety

Before editing shared files (e.g. `TODO.md`, `src/server.ts`):

```bash
git log -5 --oneline -- path/to/file
git diff origin/main -- path/to/file
```

Before commit:

```bash
git pull --rebase
```

## Commit Message Format

```text
<type>: <description> (by <agent-id>)
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Conflict Handling

1. Git conflicts:
- Keep both sides' intent if unsure
- Add `TODO(@human)` with decision context
- Resolve and continue rebase

2. Task conflicts:
- If no update for 30+ min, takeover allowed
- Record takeover note in task status

3. Design conflicts:
- Document A/B in design doc
- Add waiting task in `TODO.md` for human decision
