#!/usr/bin/env bash
# Aplica migrations no projeto remoto transpo-erp (tmjbzmjnqkgjwwkrxuxh)
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="tmjbzmjnqkgjwwkrxuxh"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx não encontrado."
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]] && [[ ! -f "$HOME/.config/supabase/access-token" ]]; then
  echo "→ Faça login: npx supabase login"
  echo "  (ou exporte SUPABASE_ACCESS_TOKEN)"
  npx supabase login
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  echo "→ Vinculando projeto $PROJECT_REF…"
  npx supabase link --project-ref "$PROJECT_REF"
fi

echo "→ Aplicando migrations…"
npx supabase db push

echo "✓ Migrations aplicadas. Ative Anonymous Sign-ins em Authentication → Providers."
