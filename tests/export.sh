#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
OPENAI_KEY="${OPENAI_KEY:-}"
DEEPSEEK_KEY="${DEEPSEEK_KEY:-}"
curl -fsS -X POST "$BASE_URL/api/export" \
  -H "Content-Type: application/json" \
  ${OPENAI_KEY:+-H "X-OpenAI-Key: $OPENAI_KEY"} \
  ${DEEPSEEK_KEY:+-H "X-DeepSeek-Key: $DEEPSEEK_KEY"} \
  -d '{"mode":"raw","name":"qaadi_export.zip","files":[{"path":"hello.txt","content":"Hello from Qaadi"}]}' \
  -o export.zip

echo "Saved to export.zip"
