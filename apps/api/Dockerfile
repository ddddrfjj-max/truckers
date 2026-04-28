FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Install all dependencies ──────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
# Copy prisma schema so postinstall (prisma generate) can find it
COPY apps/api/prisma ./apps/api/prisma
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api
RUN pnpm --filter api build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy node_modules from builder (includes prisma CLI + generated client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy prisma schema + migrations + compiled output
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3002

CMD ["sh", "-c", "\
  PRISMA=/app/apps/api/node_modules/.bin/prisma; \
  SCHEMA=./prisma/schema.prisma; \
  $PRISMA migrate deploy --schema=$SCHEMA; \
  STATUS=$?; \
  if [ $STATUS -ne 0 ]; then \
    echo 'migrate deploy failed — attempting to resolve any failed migrations and retrying'; \
    $PRISMA migrate resolve --rolled-back 20260427000000_add_bid_counter_offer --schema=$SCHEMA 2>/dev/null || true; \
    $PRISMA migrate resolve --rolled-back 20260427120000_add_bid_chat --schema=$SCHEMA 2>/dev/null || true; \
    $PRISMA migrate deploy --schema=$SCHEMA; \
  fi; \
  node dist/src/main"]
