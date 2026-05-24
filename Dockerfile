# TanStack Start (build Cloudflare Worker) — deploy em VPS / EasyPanel
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variáveis VITE_* são embutidas no bundle do cliente no build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY scripts/docker-start.sh ./scripts/docker-start.sh
RUN chmod +x ./scripts/docker-start.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./scripts/docker-start.sh"]
