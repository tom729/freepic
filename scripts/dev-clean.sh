#!/bin/bash
# scripts/dev-clean.sh - 清理开发缓存并重启

echo "🧹 Cleaning Next.js cache..."
pkill -f "next dev" 2>/dev/null
sleep 1
rm -rf .next

echo "🚀 Starting dev server..."
npm run dev
