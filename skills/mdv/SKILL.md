---
name: mdv
description: Use when the user asks to read, handle, review, or apply mdv comments on a local Markdown file, including "看评论", "处理批注", "按 mdv 批注修改", or "继续下一轮". Reads and resolves local annotations with the mdv CLI. Not for 学城, Confluence, Word, or online documents.
---

# mdv

Use `mdv` to read and resolve annotations attached to local Markdown files. Handle comments directly instead of only summarizing them to the user.

## Select The File

- Use the path supplied by the user when present.
- Otherwise use the most recently created or edited local Markdown file in the conversation.
- If the target is still unclear, run `mdv comments list`, which shows files with open comments.
- When several files are relevant, handle the most relevant one or two and report which files changed.

```bash
mdv comments list
mdv comments get --file <file.md>
```

Comments contain a sequence number, quoted source text, and reviewer text.

## Link This Session (Claude Code only)

The md-viewer app's Agent tab resumes its CLI session per document, so whatever this
session discussed about the doc is available to future runs — but only if this
session is the one linked to it. Link it for every file this invocation touches,
before editing, so later Agent-tab runs (or a future `/mdv`) resume from here and
see this conversation, not just the raw comment text:

```bash
if [ -n "$CLAUDE_CODE_SESSION_ID" ]; then
  CONFIG=~/.config/md-viewer/config.json
  PORT=$(grep -o '"port"[[:space:]]*:[[:space:]]*[0-9]*' "$CONFIG" 2>/dev/null | head -1 | grep -o '[0-9]*$')
  PORT=${PORT:-3000}
  curl -s -X POST "http://localhost:${PORT}/api/agent/session/link" \
    -H 'Content-Type: application/json' \
    -d "{\"path\":\"$(realpath "<file.md>")\",\"sessionId\":\"$CLAUDE_CODE_SESSION_ID\"}" \
    >/dev/null 2>&1 || true
fi
```

Best-effort: skip silently under Codex (no `$CLAUDE_CODE_SESSION_ID`) or if the
server isn't running. Don't let this block comment processing.

## Apply Comments

Apply every actionable comment without waiting for confirmation:

- Rewrite unclear wording so a first-time reader understands it from the start.
- Add missing content in the section where it naturally belongs.
- Integrate explanations into normal prose instead of preserving a question-and-answer trace.
- Verify current or external claims before editing.
- Fix broken Markdown or LaTeX when a comment identifies a rendering problem.

Write for a new reader, not only for the commenter. Prefer rewriting the unclear passage over appending a detached explanation. After editing, reread from the previous heading through the changed text and confirm the section remains coherent.

## Reply To Comments

Reply only after updating the document. Use `claude` as the author in Claude Code and `codex` in Codex.

```bash
mdv comments reply --file <file.md> --author <agent> --seq <n> --text "<short reply>"
```

Prefer a batch reply when handling multiple comments:

```bash
mdv comments reply-batch --file <file.md> --author <agent> --input '[
  {"seq": 1, "text": "已更新相关表述"},
  {"seq": 2, "text": "已补充说明"}
]'
```

Keep each reply to one concise sentence describing what changed. Put durable explanations in the document, not the reply. `--input` accepts inline JSON, a file path, or `-` for stdin; it accepts either an array or `{"replies": [...]}`. Quote inline JSON with single quotes.

## Continue The Next Round

When the user says "继续下一轮", keep the current document unless they specify another one. Run `mdv comments get` again, apply new open comments, and reply in batch.

## Maintain Comment Data

Run maintenance only when the user requests cleanup:

```bash
mdv comments tidy                    # resolved/orphaned comments older than 7 days
mdv comments tidy --days 30          # use a different age threshold
mdv comments tidy --missing          # also remove comments for deleted files
mdv comments tidy --days 30 --missing
```
