---
description: Run reviewer subagent on current uncommitted diff
---

1. Run `git diff` and `git diff --staged` to gather the change set.
2. Spawn `reviewer` subagent with the diff and changed file paths as context.
3. Print its verdict.
4. If verdict is `BLOCKED`, do NOT propose to commit. List the blocking issues and stop.
5. If `CHANGES REQUESTED`, propose specific edits (do not auto-apply).
6. If `APPROVED`, propose a commit message.
