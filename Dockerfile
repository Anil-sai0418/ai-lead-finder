FROM node:23-alpine AS builder

WORKDIR /app

# Copy root workspace configs and dependencies manifests
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY prisma/ ./prisma/

RUN npm ci

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# Generate Prisma client and build typescript packages
RUN npm run prisma:generate --workspace=@ai-lead-finder/backend
RUN npm run build --workspace=@ai-lead-finder/shared
RUN npm run build --workspace=@ai-lead-finder/backend

# Prune development dependencies so node_modules contains only production packages
RUN npm prune --omit=dev

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy production artifacts and pruned node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5001

CMD ["node", "apps/backend/dist/server.js"]
