FROM node:23-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY prisma ./prisma

RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Generate Prisma client and build
RUN npm run prisma:generate --workspace=@ai-lead-finder/backend
RUN npm run build --workspace=@ai-lead-finder/shared
RUN npm run build --workspace=@ai-lead-finder/backend

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY prisma ./prisma

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 5001

CMD ["node", "apps/backend/dist/server.js"]
