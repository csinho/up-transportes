#!/usr/bin/env bash
# Deploy do TanStack Start na Cloudflare Workers
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.local}"

if [[ -f "$ENV_FILE" ]]; then
  echo "→ Carregando variáveis de $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Erro: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
  echo "  Copie .env.example → .env.local e preencha, ou exporte as variáveis."
  exit 1
fi

if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "→ Faça login na Cloudflare:"
  npx wrangler login
fi

echo "→ Build de produção (VITE_* embutidas no bundle)…"
npm run build

echo "→ Deploy na Cloudflare Workers…"
npx wrangler deploy "$@"

echo ""
echo "✓ Deploy concluído."
echo "  Próximos passos:"
echo "  1. Workers → Settings → Domains → Add Custom Domain (opcional)"
echo "  2. Supabase → Authentication → URL Configuration → Site URL + Redirect URLs"
echo "     (use a URL *.workers.dev ou seu domínio customizado)"
