#!/bin/bash
# verify-all-flows.sh - 全面验证 FreePic 主流程

set -e

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:9000}"
TEST_EMAIL="testverify@example.com"
TEST_PASSWORD="Test1234"
TOKEN=""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 计数器
PASSED=0
FAILED=0
SKIPPED=0

run_test() {
    local test_name="$1"
    local test_cmd="$2"
    
    echo -n "Testing: $test_name ... "
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo "========================================"
echo "🧪 FreePic 主流程全面验证"
echo "========================================"
echo "测试地址: $APP_URL"
echo ""

# 等待服务器就绪
echo "⏳ 等待服务器就绪..."
for i in {1..30}; do
    if curl -s "${APP_URL}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务器已就绪${NC}\n"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ 服务器未启动${NC}"
        exit 1
    fi
done

# 1. 基础健康检查
echo "📋 1. 基础健康检查"
echo "----------------------------------------"
run_test "首页可访问" "curl -s '${APP_URL}' | grep -q 'FreePic'"
run_test "图片列表 API" "curl -s '${APP_URL}/api/images?page=1&limit=10' | grep -q 'images'"
run_test "标签列表 API" "curl -s '${APP_URL}/api/tags' | grep -q 'tags'"

echo ""

# 2. 页面加载测试
echo "📋 2. 页面加载测试"
echo "----------------------------------------"
run_test "搜索页面" "curl -s '${APP_URL}/search' | grep -q 'search'"
run_test "登录页面" "curl -s '${APP_URL}/login' | grep -q '登录'"
run_test "注册页面" "curl -s '${APP_URL}/register' | grep -q '注册'"
run_test "上传页面" "curl -s '${APP_URL}/upload' | grep -q '上传'"
run_test "个人资料页面" "curl -s '${APP_URL}/profile' | grep -q '个人'"

echo ""

# 3. 图片详情和搜索
echo "📋 3. 图片详情和搜索"
echo "----------------------------------------"
IMAGE_ID=$(curl -s "${APP_URL}/api/images?page=1&limit=1" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$IMAGE_ID" ]; then
    run_test "图片详情页" "curl -s '${APP_URL}/image/${IMAGE_ID}' | grep -q 'image'"
    run_test "搜索 API" "curl -s '${APP_URL}/api/images?q=test&page=1' | grep -q 'images'"
else
    echo -e "${YELLOW}⚠ 无图片数据，跳过相关测试${NC}"
    ((SKIPPED+=2))
fi

echo ""

# 4. 数据库检查
echo "📋 4. 数据库检查"
echo "----------------------------------------"
if [ -f "./database/sqlite.db" ]; then
    run_test "数据库文件" "test -f ./database/sqlite.db"
    echo -n "Testing: 数据库表结构 ... "
    tables=$(sqlite3 ./database/sqlite.db ".tables" 2>/dev/null | wc -w)
    if [ "$tables" -gt 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} ($tables 个表)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ 数据库不存在${NC}"
    ((SKIPPED++))
fi

echo ""

# 汇总
echo "========================================"
echo "📊 验证结果汇总"
echo "========================================"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${YELLOW}跳过: $SKIPPED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo "----------------------------------------"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED 个测试失败${NC}"
    exit 1
fi
