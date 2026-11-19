#!/bin/sh
set -e

echo "=================================================="
echo "🚀 [Startup] AI Lead Finder Backend Initializing"
echo "=================================================="

# Ensure DIRECT_URL is set; fallback to DATABASE_URL if not explicitly provided
if [ -z "$DIRECT_URL" ]; then
  echo "ℹ️  [Startup] DIRECT_URL not set. Falling back to DATABASE_URL for migrations."
  export DIRECT_URL="$DATABASE_URL"
fi

echo "📦 [Startup] Applying database migrations via 'prisma migrate deploy'..."

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -f "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx prisma"
fi

if $PRISMA_BIN migrate deploy --schema=prisma/schema.prisma; then
  echo "✅ [Startup] Database migrations applied successfully."
else
  echo "❌ [Startup] Database migration failed!"
  echo "❌ [Startup] Halting container boot to avoid running against an unmigrated database."
  exit 1
fi

echo "🚀 [Startup] Starting Express server..."
echo "=================================================="
exec "$@"
