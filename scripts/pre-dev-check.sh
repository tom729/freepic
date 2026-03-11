#!/bin/bash
# scripts/pre-dev-check.sh - 开发前检查

set -e

echo "🔍 Running pre-development checks..."

# 1. 检查 Next.js 缓存是否损坏
if [ -d ".next" ]; then
  CACHE_SIZE=$(du -sh .next | cut -f1)
  echo "  ✓ Next.js cache exists ($CACHE_SIZE)"
  
  # 检查是否有超过 50MB 的日志/缓存文件
  LARGE_FILES=$(find .next -size +50M -type f 2>/dev/null | wc -l)
  if [ "$LARGE_FILES" -gt 0 ]; then
    echo "  ⚠️ Found large cache files, consider running: npm run clean"
  fi
fi

# 2. 检查 Tailwind 颜色一致性
echo "  Checking Tailwind colors..."
GRAY_COUNT=$(grep -r "bg-gray-50" --include="*.tsx" app/ components/ | wc -l)
NEUTRAL_COUNT=$(grep -r "bg-neutral-50" --include="*.tsx" app/ components/ | wc -l)
WHITE_COUNT=$(grep -r "bg-white" --include="*.tsx" app/ components/ | wc -l)

echo "    - bg-gray-50: $GRAY_COUNT occurrences"
echo "    - bg-neutral-50: $NEUTRAL_COUNT occurrences"
echo "    - bg-white: $WHITE_COUNT occurrences"

if [ "$NEUTRAL_COUNT" -gt 0 ]; then
  echo "  ⚠️ Warning: Found bg-neutral-50, should use bg-gray-50 for consistency"
fi

# 3. 检查数据库文件存在
if [ -f "database/sqlite.db" ]; then
  DB_SIZE=$(du -sh database/sqlite.db | cut -f1)
  echo "  ✓ Database exists ($DB_SIZE)"
else
  echo "  ❌ Database not found"
fi

# 4. TypeScript 检查
echo "  Running TypeScript check..."
npx tsc --noEmit 2>&1 | grep -E "error|Error" | head -5 || echo "    ✓ No TypeScript errors"

echo ""
echo "✅ Checks complete. Run 'npm run dev' to start."
