#!/usr/bin/env bash
# PostToolUse hook — runs lint+format on edited file
set -euo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  exit 0
fi

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md)
    pnpm prettier --write "$FILE" >/dev/null 2>&1 || true
    ;;
esac

exit 0
