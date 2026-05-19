---
description: End-to-end feature pipeline — spec → plan → implement → test → review → commit
---

Ship feature: $ARGUMENTS

Steps:
1. Write a short spec to `/specs/<slug>.md` covering: goal, user story, API surface, DB changes, edge cases, tests.
2. Read `CLAUDE.md` and any relevant `.claude/skills/*/SKILL.md` for the area.
3. Use Plan mode to design the implementation (file paths, types, sequence). Capture it in the spec.
4. Spawn `implementer` subagent with the spec as context.
5. After implementer returns, spawn `test-writer` subagent with the implementer's hand-off.
6. Spawn `reviewer` subagent on the diff. If `BLOCKED`, loop back to step 4.
7. Run `pnpm typecheck && pnpm test && pnpm lint`. Fix any failures.
8. Stage, commit with conventional-commit message (`feat: …`, `fix: …`).
9. Push to current branch and (optionally) open a PR.
