# AGENTS.md

This document contains conventions and guidelines for AI agents working on the MD Viewer project.

## Man Page Maintenance Convention

When modifying CLI parameters or configuration-related code, agents MUST update the corresponding man pages.

### CLI Parameter Changes

When adding, removing, or modifying CLI options in `src/cli.ts`:

1. Update `man/md-viewer.1`:
   - Add/remove the option in the OPTIONS section
   - Update the EXAMPLES section if needed
   - Update the SYNOPSIS if command syntax changes

2. Ensure consistency between:
   - `showHelp()` output in `src/cli.ts`
   - `man/md-viewer.1` OPTIONS section
   - This document's CLI reference

### Configuration Changes

When adding, removing, or modifying configuration options:

1. Update `man/md-viewer.config.5`:
   - Add/remove the option in the appropriate section
   - Update the EXAMPLE CONFIGURATION section
   - Document the default value and valid ranges

2. 更新 `docs/配置说明.md`

3. Update configuration loading code in the appropriate module

4. Consider backward compatibility:
   - Mark deprecated options in the man page
   - Maintain support for old option names when possible

## Current Configuration Options

See `man/md-viewer.config.5` for the authoritative reference.

Categories:
- `server.*` - Server behavior (port, host)
- `client.*` - UI behavior (theme, focus)
- `editor.*` - Display options (font size, line height)
- `files.*` - File handling (auto-refresh, remember open)

## Build System

The project uses esbuild to bundle client-side code:

- Client code is in `src/client/main.ts` (and will be split into modules)
- Build output goes to `dist/client.js`
- Server reads the bundled client code from `dist/client.js`

### Build Commands

- `bun run build:client` - Build client code once
- `bun run build:client:watch` - Watch and rebuild on changes
- `bun run build` - Full production build (client + server binary)

### Development Workflow

When modifying client-side code:

1. Run `bun run build:client:watch` in one terminal (auto-rebuilds on save)
2. Run `bun run dev` in another terminal (auto-reloads server on changes)
3. Both will watch and reload automatically
4. 默认agent **DO NOT restart the server** - 因为我在终端已经运行了 `bun run dev` handles auto-reload

When modifying server-side code:

- Just run `bun run dev` - it auto-reloads on changes
- No manual build step needed

### Important Notes

- Always build client code before starting the server in production
- The server will fail to start if `dist/client.js` doesn't exist
- Client code changes require a rebuild (use watch mode during development)

## Development Reminders

- Always run `bun tsc --noEmit` after TypeScript changes
- Test both CLI and web interface after modifications
- Update TODO.md when completing tasks
- Build client code before committing if you changed client files

---

## Multi-Agent Collaboration Rules

本节定义多个 AI agent 在同一项目中协作的规则，避免冲突，提高效率。

### Task Assignment Rules

#### 1. Before Selecting a Task
- ✅ Execute `git pull` to get latest status
- ✅ Read `TODO.md` and `docs/tasks_dashboard.md`
- ✅ Check task status, avoid claimed tasks

#### 2. Claiming a Task
Immediately update task status to 🔄进行中:

```markdown
## Task Title [🔄进行中 - Agent-ID - 2026-03-01 10:30]
```

Example:
```markdown
## 优化在iterm2中的体验 [🔄进行中 - Claude-A - 2026-03-01 14:25]
```

#### 3. During Task Execution
- ✅ Commit progress every 5-10 minutes (avoid long occupation)
- ✅ Update key progress in TODO.md
- ✅ Add explanation if task exceeds expected time

#### 4. On Completion or Abandonment
Immediately update task status:

```markdown
## Task Title [✅完成 - 2026-03-01 15:00]
## Task Title [🚫放弃 - 2026-03-01 15:00]
Reason: Depends on external service, temporarily unimplementable
```

---

### File Editing Rules

#### 1. Priority Principle
Prefer tasks that reduce conflicts:
- ✅ Tasks creating new files
- ✅ Tasks modifying independent modules
- ✅ Documentation tasks (docs/)
- ⚠️ Be cautious with core shared files (e.g., `TODO.md`, `src/server.ts`)

#### 2. Before Modifying Shared Files
```bash
# Check recent commits
git log -5 --oneline -- path/to/file

# Check if other agents are modifying
git diff origin/main -- path/to/file
```

#### 3. Before Committing
```bash
# Pull and rebase
git pull --rebase

# If conflicts, resolve and continue
git rebase --continue
```

#### 4. Commit Message Format
```bash
git commit -m "feat: add font scaling feature (by Claude-A)"
git commit -m "fix: fix workspace rendering bug (by Claude-B)"
git commit -m "docs: update iTerm2 integration design (by Claude-C)"
```

Format: `<type>: <description> (by <agent-id>)`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Build/tools

---

### Conflict Resolution

#### Scenario 1: Git Conflicts

When encountering merge conflicts:

```bash
# 1. View conflicted files
git status

# 2. Manually resolve conflicts
# - Keep both versions' functionality (don't delete others' code)
# - If uncertain, keep both and add comments

# 3. Add TODO comment
# Example:
# TODO(@human): Agent-A and Agent-B implementation conflict, needs human decision
#   - Agent-A approach: use WebSocket
#   - Agent-B approach: use SSE
#   Related commits: abc123, def456

# 4. Mark conflict resolved
git add .
git rebase --continue

# 5. Add conflict resolution task in TODO.md
```

Add to TODO.md:
```markdown
## Resolve Agent-A and Agent-B implementation conflict [⏳等待]
- File: src/server.ts
- Conflict: WebSocket vs SSE implementation
- Needs human decision
- Related commits: abc123, def456
```

---

#### Scenario 2: Task Conflicts

When discovering another agent is working on the same task:

1. **Check progress:**
   - View task status timestamp
   - Check recent commits

2. **Decide whether to take over:**
   - If no update for 30+ minutes → can take over
   - If continuous updates → choose another task

3. **When taking over:**
   ```markdown
   ## Task Title [🔄进行中 - Claude-B - 2026-03-01 15:30]
   Took over from Claude-A (no update for 30 minutes)
   Completed: XXX
   Continuing: YYY
   ```

---

#### Scenario 3: Design Conflicts

When two agents propose different designs:

1. **Document in design doc:**
   ```markdown
   # Feature X Design

   ## Approach Comparison

   ### Approach A (by Claude-A)
   - Pros: XXX
   - Cons: YYY

   ### Approach B (by Claude-B)
   - Pros: XXX
   - Cons: YYY

   ## Decision Needed
   @human: Please choose A or B, or propose C
   ```

2. **Add waiting task in TODO.md:**
   ```markdown
   ## Feature X design decision [⏳等待]
   - Design doc: docs/design/feature-x.md
   - Needs human decision: Approach A vs B
   ```

---

### Communication Protocol

#### In Code Comments

```typescript
// @agent:Claude-B
// I implemented WebSocket connection, you can use in handleSyncExecute
// Usage: await wsManager.broadcast({ type: 'sync', data })

// @agent:Claude-A
// Got it, will integrate WebSocket notification in sync feature
```

#### In TODO.md

```markdown
## Sync feature optimization [🔄进行中 - Claude-A - 2026-03-01]
@Claude-B: I saw your WebSocket implementation, will integrate in sync
Progress:
- ✅ Backend API complete
- 🔄 Frontend integration in progress
- ⏳ Waiting for your WebSocket docs
```

---

### Monitoring & Optimization

#### Daily Check

```bash
# Check conflict frequency
git log --since="1 day ago" --grep="conflict"

# Check agent efficiency
git log --since="1 day ago" --author="Claude" --oneline | wc -l
```

**Optimization Targets:**
- Task conflict rate < 5%
- Git conflict rate < 10%
- Average resolution time < 10 minutes

---

### FAQ

**Q: How often should I commit?**
A: Every 5-10 minutes recommended, even if incomplete. Use `WIP:` prefix.

**Q: What if I'm unsure about conflicts?**
A: Prefer independent tasks. If must modify shared files, check `git log` and task status first.

**Q: What if I encounter unresolvable conflicts?**
A: Keep both versions, add TODO comment, create decision task in TODO.md for human intervention.

**Q: Can I modify other agents' code?**
A: Yes, but carefully:
- ✅ Bug fixes: can fix directly
- ✅ Small optimizations: can improve
- ⚠️ Refactoring: discuss in design doc first
- ❌ Removing features: needs human confirmation

---

**Remember: Communication > Rules, Collaboration > Efficiency, Quality > Speed**
