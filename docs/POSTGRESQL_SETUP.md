# PostgreSQL 安装与配置指南

## 方案一：Docker 安装（推荐，最简单）

### 1. 安装 Docker Desktop

```bash
# 访问官网下载
open https://www.docker.com/products/docker-desktop/

# 或使用 Homebrew（如果可用）
brew install --cask docker
```

### 2. 启动 PostgreSQL 容器

```bash
# 创建并启动 PostgreSQL 容器
docker run --name freepic-postgres \
  -e POSTGRES_USER=freepic \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=freepic \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15

# 参数说明：
# --name: 容器名称
# -e POSTGRES_USER: 数据库用户名
# -e POSTGRES_PASSWORD: 数据库密码
# -e POSTGRES_DB: 默认数据库名
# -p 5432:5432: 端口映射
# -v: 数据持久化卷
# -d: 后台运行
```

### 3. 验证安装

```bash
# 查看容器状态
docker ps

# 进入容器测试
docker exec -it freepic-postgres psql -U freepic -d freepic -c "SELECT 1;"
```

---

## 方案二：Postgres.app（macOS 推荐）

### 1. 下载安装

```bash
open https://postgresapp.com/
# 下载后拖入应用程序文件夹
```

### 2. 启动服务

- 打开 Postgres.app
- 点击 "Initialize" 初始化
- PostgreSQL 会自动在后台运行

### 3. 配置环境变量

```bash
# 添加到 ~/.zshrc 或 ~/.bash_profile
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# 重新加载配置
source ~/.zshrc
```

### 4. 创建数据库

```bash
# 使用 psql 命令行
createdb freepic

# 或进入 psql
psql -c "CREATE DATABASE freepic;"
```

---

## 方案三：Homebrew 安装（传统方式）

```bash
# 安装 PostgreSQL 15
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 创建数据库
createdb freepic

# 验证
psql -d freepic -c "SELECT version();"
```

---

## 🔧 FreePic 项目配置

### 1. 更新环境变量

编辑 `.env.local`：

```bash
# Docker 方案使用这个
DATABASE_URL=postgresql://freepic:your_password@localhost:5432/freepic

# Postgres.app 或 Homebrew 使用这个
DATABASE_URL=postgresql://localhost:5432/freepic
```

### 2. 切换数据库配置

**恢复 PostgreSQL 数据库配置：**

编辑 `lib/db.ts`：

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/freepic',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export { schema };

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}

export { pool };
```

编辑 `drizzle.config.ts`：

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/freepic',
  },
  verbose: true,
  strict: true,
});
```

编辑 `lib/schema.ts`：

```typescript
// 将所有 sqliteTable 改为 pgTable
// 将所有 integer('...', { mode: 'boolean' }) 改为 boolean('...')
// 将所有 integer('...', { mode: 'timestamp' }) 改为 timestamp('...', { withTimezone: true })
// 将所有 text('...', { mode: 'json' }) 改为 jsonb('...')

import {
  pgTable,
  text,
  integer,
  index,
  timestamp,
  jsonb,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

// 示例修改：
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').default(false).notNull(), // 修改这里
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), // 修改这里
  // ... 其他字段
});
```

### 3. 运行数据库迁移

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 验证连接

```bash
# 测试 API
curl http://localhost:9000/api/images

# 应该返回 200 和图片列表
```

---

## 🔍 常见问题

### Q: 端口被占用

```bash
# 查看占用 5432 端口的进程
lsof -i :5432

# 停止冲突的服务
brew services stop postgresql@14  # 如果有旧版本

# 或更换端口
docker run -p 5433:5432 postgres:15  # 使用 5433 端口
```

### Q: 连接被拒绝

```bash
# 检查 PostgreSQL 是否运行
docker ps  # Docker 方案
brew services list  # Homebrew 方案

# 检查环境变量
echo $DATABASE_URL
```

### Q: 权限错误

```bash
# Docker 方案：确保用户名密码正确
# Postgres.app：默认无需密码
# Homebrew：使用当前系统用户
```

### Q: 迁移失败

```bash
# 删除旧迁移重新生成
rm -rf database/migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 📊 推荐方案对比

| 方案         | 难度      | 优点                           | 缺点                |
| ------------ | --------- | ------------------------------ | ------------------- |
| Docker       | ⭐ 简单   | 一键启动、隔离环境、数据持久化 | 需要安装 Docker     |
| Postgres.app | ⭐ 简单   | macOS 原生、GUI 管理           | 仅限 macOS          |
| Homebrew     | ⭐⭐ 中等 | 系统集成、命令行控制           | macOS 15 可能不支持 |

---

## ✅ 快速开始（推荐 Docker）

```bash
# 1. 启动 PostgreSQL
docker run --name freepic-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=freepic \
  -p 5432:5432 \
  -d postgres:15

# 2. 更新 .env.local
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/freepic" >> .env.local

# 3. 恢复 PostgreSQL 配置（按照上面的步骤）

# 4. 运行迁移
npx drizzle-kit generate
npx drizzle-kit migrate

# 5. 启动
npm run dev
```

完成！🎉
