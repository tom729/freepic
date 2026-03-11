# 开发规范与故障排除指南

## 🚨 常见错误与解决方案

### 1. Next.js 缓存损坏

**症状**:

```
Cannot find module './1682.js'
Module not found: Can't resolve '...'
```

**解决**:

```bash
npm run clean      # 快速清理缓存
npm run dev:clean  # 清理后启动
```

**预防**:

- 每 2-3 小时开发后主动清理一次
- 大规模重构前先 `npm run clean`
- 避免在服务器运行时删除文件

---

### 2. 样式不一致

**症状**: 页面有色块、闪烁、视觉跳跃

**根因**: 混用 `gray-*` 和 `neutral-*` 颜色

**规范**:
| 用途 | 颜色 |
|------|------|
| 页面背景 | `bg-gray-50` |
| 深色区块 | `bg-neutral-900` |
| 卡片背景 | `bg-white` |
| Footer | `bg-white` (设计区分) |

**检查**:

```bash
./scripts/pre-dev-check.sh
```

---

### 3. 数据库 Schema 不匹配

**症状**:

```
no such column: users.isActive
no such table: activation_tokens
```

**解决**:

```bash
# 查看当前表结构
sqlite3 database/sqlite.db ".schema"

# 手动添加缺失字段
sqlite3 database/sqlite.db "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 0 NOT NULL;"
```

**预防**: 修改 schema 后必须更新数据库 + 文档

---

### 4. TypeScript/ESLint 错误

**症状**: 构建失败，有大量 lint 错误

**解决**:

```bash
npm run lint       # 查看错误
npx prettier --write .  # 格式化
```

---

## 🛠️ 推荐开发流程

### 每次开发前

```bash
./scripts/pre-dev-check.sh  # 运行检查
npm run dev                 # 启动服务
```

### 发现问题时

```bash
# 步骤 1: 检查日志
curl -s http://localhost:9000/api/xxx | head -20

# 步骤 2: 如果是缓存问题
npm run clean && npm run dev

# 步骤 3: 如果是样式问题
# 检查统一使用 bg-gray-50

# 步骤 4: 如果是数据库问题
sqlite3 database/sqlite.db ".schema users"
```

### 提交代码前

```bash
npm run build      # 确保构建通过
npm run lint       # 确保无 lint 错误
./scripts/verify-core-flows.sh  # 运行核心流程验证
```

---

## 📋 调试清单

### API 不返回数据

- [ ] 服务器是否运行？`curl http://localhost:9000`
- [ ] 是否有缓存错误？`npm run clean`
- [ ] 数据库是否正常？`sqlite3 database/sqlite.db "SELECT COUNT(*) FROM images;"`

### 样式异常

- [ ] 检查背景色是否统一为 `bg-gray-50`
- [ ] 检查是否有 `neutral-50` 混用
- [ ] 清除浏览器缓存
- [ ] 重新构建 `npm run build`

### 构建失败

- [ ] `npm run clean`
- [ ] `npx tsc --noEmit` 检查类型错误
- [ ] `npm run lint` 检查 lint 错误
- [ ] 删除 `node_modules` 重新安装 (最后手段)
