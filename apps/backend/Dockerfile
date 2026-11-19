FROM node:23-alpine AS builder

WORKDIR /app

# Copy root workspace configs and dependencies manifests
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY prisma/ ./prisma/
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm ci

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# Generate Prisma client and build typescript packages
RUN npm run prisma:generate --workspace=@ai-lead-finder/backend
RUN npm run build --workspace=@ai-lead-finder/shared
RUN npm run build --workspace=@ai-lead-finder/backend

# Prune development dependencies so node_modules contains only production packages
# Note: prisma CLI is preserved because it is declared in dependencies of @ai-lead-finder/backend
RUN npm prune --omit=dev

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy production artifacts, entrypoint, and pruned node_modules from builder (no host context re-reads)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/server.js"]
