#!/bin/sh
set -e

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

if [ ! -f dist/server/wrangler.json ]; then
  echo "Build ausente. Rode npm run build antes de iniciar."
  exit 1
fi

if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
  cat > dist/server/.dev.vars <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
EOF
fi

cd dist/server
exec npx wrangler dev \
  --port "$PORT" \
  --ip "$HOST" \
  --local-protocol http
