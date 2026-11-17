FROM node:23-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN npm run build --workspace=@ai-lead-finder/shared
RUN npm run build --workspace=@ai-lead-finder/frontend

FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
