# PostgreSQL 迁移指南

## 1. 安装 PostgreSQL

### macOS

```bash
# 使用 Homebrew（如果可用）
brew install postgresql@15

# 或者使用 Postgres.app（推荐）
# 下载: https://postgresapp.com/

# 启动服务
brew services start postgresql@15
```

### 使用 Docker（最简单）

```bash
docker run --name freepic-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=freepic \
  -p 5432:5432 \
  -d postgres:15
```

## 2. 创建数据库

```bash
# 创建数据库
createdb freepic

# 或者使用 psql
psql -c "CREATE DATABASE freepic;"
```

## 3. 设置环境变量

在 `.env.local` 中添加：

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/freepic
```

如果使用本地默认安装：

```bash
DATABASE_URL=postgresql://localhost:5432/freepic
```

## 4. 运行迁移

```bash
# 生成迁移
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

## 5. 数据迁移（从 SQLite）

运行数据迁移脚本：

```bash
npx tsx scripts/migrate-sqlite-to-postgres.ts
```

## 常见问题

### Q: 连接失败

检查 PostgreSQL 服务是否运行：

```bash
pg_isready
```

### Q: 权限错误

确保用户有创建数据库的权限，或使用超级用户。

### Q: 端口冲突

如果 5432 被占用，可以修改连接字符串：

```bash
DATABASE_URL=postgresql://localhost:5433/freepic
```
