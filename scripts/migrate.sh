#!/bin/sh
set -e

echo "🔍 Checking migration status..."

PRISMA_CONFIG="--config=prisma/prisma.config.mjs"

# Check if migrations folder exists and has migration files
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "📁 Migrations found, running migrate deploy..."
    npx prisma migrate deploy $PRISMA_CONFIG
else
    echo "📁 No migrations found, using db push for initial schema..."
    npx prisma db push $PRISMA_CONFIG
fi

echo "✅ Database migration completed!"

