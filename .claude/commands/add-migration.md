---
description: Generate a Drizzle migration with diff-check
---

Add migration: $ARGUMENTS

1. Spawn `migration-writer` subagent.
2. After it returns, read the generated SQL.
3. Run `cd packages/db && pnpm drizzle-kit check`.
4. If any warnings or unexpected drops, halt and ask the user.
5. Stage the migration file and the schema file together.
6. Suggest a commit message `feat(db): <description>`.
