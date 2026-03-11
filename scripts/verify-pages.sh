#!/bin/bash

# 页面访问验证脚本
# 用法: ./scripts/verify-pages.sh [base_url]

BASE_URL="${1:-http://localhost:9000}"
FAILED=0

echo "🔍 验证关键页面..."
echo "基础URL: $BASE_URL"
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 验证函数
check_page() {
    local path=$1
    local name=$2
    local method="${3:-GET}"
    local expected_code="${4:-200}"
    
    local url="${BASE_URL}${path}"
    local temp_file=$(mktemp)
    local http_code
    
    if [ "$method" = "POST" ]; then
        http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X POST "$url" 2>/dev/null || echo "000")
    else
        http_code=$(curl -s -o "$temp_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    fi
    
    rm -f "$temp_file"
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅${NC} $name ($path) - HTTP $http_code"
        return 0
    else
        echo -e "${RED}❌${NC} $name ($path) - HTTP $http_code (期望 $expected_code)"
        return 1
    fi
}

check_api() {
    local path=$1
    local name=$2
    
    local url="${BASE_URL}${path}"
    local temp_file=$(mktemp)
    local http_code
    
    http_code=$(curl -s -o "$temp_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    rm -f "$temp_file"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        # API 返回 200/401/403 都算正常（需要认证是预期行为）
        echo -e "${GREEN}✅${NC} $name ($path) - HTTP $http_code"
        return 0
    else
        echo -e "${RED}❌${NC} $name ($path) - HTTP $http_code"
        return 1
    fi
}

echo "📄 页面检查:"
check_page "/" "首页" || ((FAILED++))
check_page "/search" "搜索页" || ((FAILED++))
check_page "/login" "登录页" || ((FAILED++))
check_page "/register" "注册页" || ((FAILED++))
check_page "/profile" "个人资料页" || ((FAILED++))
check_page "/upload" "上传页" || ((FAILED++))

echo ""
echo "🔌 API 检查:"
check_api "/api/images" "图片列表API" || ((FAILED++))
# check_api "/api/tags" "标签列表API" || ((FAILED++))
check_api "/api/users/me" "用户资料API" || ((FAILED++))

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有页面验证通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAILED 个页面验证失败${NC}"
    echo ""
    echo "调试提示:"
    echo "1. 确保开发服务器运行: npm run dev"
    echo "2. 检查端口是否正确: lsof -i :9000"
    echo "3. 查看服务器日志"
    exit 1
fi
