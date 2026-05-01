# IDE-Style Shortcuts & Keybinding System

**Date:** 2026-05-01  
**Status:** Approved

## Overview

Add an IDE-style keyboard shortcut system to md-viewer, consisting of three parts:

1. **Keybinding System** — a user-configurable action dispatch layer replacing the existing hardcoded key checks
2. **Quick Open** (`Ctrl+P`) — a center-screen file search palette
3. **Tab Cycling** (`Ctrl+Tab`, `Cmd+1~9`) — keyboard navigation between open files

## Architecture

Three layers:

```
┌─────────────────────────────────┐
│  Action Registry                │  action id / label / default key / handler / shouldActivate
├─────────────────────────────────┤
│  Keybinding Store               │  localStorage overlay: { actionId → keyCombo | null }
├─────────────────────────────────┤
│  Dispatcher (keydown listener)  │  normalize key → lookup → guard check → preventDefault → call handler
└─────────────────────────────────┘
```

### Key combo format

Normalized strings: `"Ctrl+Tab"`, `"Cmd+P"`, `"Alt+ArrowLeft"`. On Mac, `Cmd` maps to `metaKey`; on Windows/Linux, `Ctrl` maps to `ctrlKey`. Display layer converts to symbols (`⌘`, `⌃`, `⌥`, `⇧`).

### Browser key interception

Within the md-viewer page, `e.preventDefault()` on `keydown` suppresses browser defaults (e.g. `Ctrl+P` print, `Ctrl+Tab` tab switch). This only affects the md-viewer page — other browser tabs and pages are unaffected. OS-level shortcuts (`Alt+F4`, `Ctrl+T`) cannot be intercepted.

## Action Registry

All actions registered at startup. Existing shortcuts (`Ctrl+K`, `Ctrl+W`, `Esc`, `?`, diff `n/p`) migrate into the registry.

| Category | Action ID | Label | Default Key | Notes |
|----------|-----------|-------|-------------|-------|
| 导航 | `quick-open` | 快速打开文件 | `Ctrl+P` | intercepts browser print |
| 导航 | `cycle-tab-next` | 切换到下一个文件 | `Ctrl+Tab` | intercepts browser tab switch |
| 导航 | `cycle-tab-prev` | 切换到上一个文件 | `Ctrl+Shift+Tab` | |
| 导航 | `jump-to-tab-1` … `jump-to-tab-9` | 跳到第 N 个文件 | `Cmd+1` … `Cmd+9` (Mac) / `Ctrl+1` … `Ctrl+9` (Win/Linux) | `Cmd/Ctrl+9` always goes to last tab; intercepts browser |
| 文件 | `close-file` | 关闭当前文件 | `Ctrl+W` | migrated from existing |
| 视图 | `focus-search` | 聚焦搜索框 | `Ctrl+K` | migrated |
| 视图 | `toggle-shortcuts-help` | 显示快捷键帮助 | `?` | migrated |
| Diff | `diff-next` | 下一个变更块 | `n` | guard: diff must be active |
| Diff | `diff-prev` | 上一个变更块 | `p` | guard: diff must be active |

### shouldActivate guards

- `diff-next` / `diff-prev`: only when diff view is active; skipped when focus is in `<input>` or `<textarea>`
- `toggle-shortcuts-help` / `?`: skipped when focus is in `<input>` or `<textarea>`
- `focus-search`: skipped when focus is already in `<textarea>`
- All others: always active (key interception handles conflicts)

## Keybinding Store

- Storage key: `mdv-keybindings`
- Format: `{ [actionId]: string | null }` — string = user-chosen key combo; `null` = explicitly unset (no binding, ignores default)
- At startup: merge user overrides on top of registry defaults
- User can reset individual actions to default (removes the override entry) or clear them (`null`)

## Dispatcher

Single `keydown` listener on `document`, replaces `keyboard-shortcuts.ts`:

```
keydown → normalizeKeyCombo(e) → find matching action in merged binding map
        → check action.shouldActivate(e)
        → call e.preventDefault()
        → call action.handler()
```

The existing `keyboard-shortcuts.ts` file is deleted once all handlers are migrated.

## Quick Open Panel

Triggered by `quick-open` action. A centered modal overlaid on the page with a semi-transparent backdrop.

**Layout:**
- Search input at top with magnifier icon and "Esc 关闭" hint
- Results list below, split into two sections:
  - **已打开** — files already in `sessionFiles`, shown first; selecting switches to them without reload
  - **文件** — remaining matches from `getPathSuggestions` API
- Match characters highlighted in blue/bold
- Right side shows parent directory path (disambiguates same-name files)
- Footer: keyboard hints `↑↓ 选择 · ↵ 打开 · Esc 关闭`

**Behavior:**
- Keyboard-only operable (arrow keys, Enter, Esc)
- Esc closes panel; clicking outside backdrop closes it
- Searches filenames only (not content — content search remains in sidebar)
- Backend: reuses existing `getPathSuggestions` API
- Implemented in `src/client/ui/quick-open.ts`

## Tab Cycling

### cycle-tab-next / cycle-tab-prev

Cycles through `sessionFiles` in insertion order. Wraps around at ends.

### jump-to-tab-1 ~ jump-to-tab-9

- `Cmd+1` (Mac) / `Ctrl+1` (Win/Linux) → first file in `sessionFiles`
- `Cmd/Ctrl+2` → second file, etc.
- `Cmd/Ctrl+9` → always the last file, regardless of count
- `Cmd/Ctrl+N` where N > file count: no-op

All nine actions default-bound and intercept browser tab-switch shortcuts. The registry stores platform-neutral action IDs; the default key is resolved at runtime based on `navigator.platform`.

## Preferences Dialog (Settings UI)

The existing 480px `settingsDialogOverlay` is replaced by a new **Preferences** modal:

- **Width:** 700px, max-height: `calc(100vh - 80px)`
- **Layout:** Left sidebar (160px) with category nav + right content area
- **Categories (initial):** 外观 (existing settings), 快捷键 (new)

### Keybinding settings tab

- Actions grouped by category (导航, 文件, 视图, Diff)
- Each row: action label + current binding (`<kbd>` display) + edit (✎) button + reset (↺) button
- **Recording mode:** clicking ✎ enters recording state (pulsing "按下按键…" badge); next keypress sets the binding
- **Conflict warning:** if the chosen key combo is also used by another action, show inline warning; user can proceed or pick another key. No hard block.
- **Unset:** if no binding, shows "未设置" in grey italic
- **Reset:** resets that action to its registry default (removes user override)
- **Reset all:** button in footer resets all overrides
- Implemented in `src/client/ui/preferences.ts`; existing `settings.ts` logic migrated in

## File Structure Changes

```
src/client/
  keybindings.ts          ← NEW: ActionRegistry, KeybindingStore, dispatcher, normalizeKeyCombo
  ui/
    quick-open.ts         ← NEW: Quick Open panel component
    preferences.ts        ← NEW: Preferences modal (replaces settings.ts)
  keyboard-shortcuts.ts   ← DELETED after migration
  ui/settings.ts          ← DELETED after migration (or thin re-export during transition)
  main.ts                 ← wire action handlers, init dispatcher, open preferences
```

## Out of Scope

- Go-back / go-forward navigation history (may be added later; history stack entry can include optional `position` field without redesign)
- Keybinding import/export
- Conflict detection that blocks saving (warnings only, no hard block)
- Keybinding sync across devices
