# Supabase 配置指南

## 为什么选择 Supabase？

✅ **免费托管 PostgreSQL** - 500MB 免费额度，足够开发和测试
✅ **零配置** - 无需安装，开箱即用
✅ **可视化 Dashboard** - 在线管理数据库、查看数据
✅ **自动备份** - 数据安全有保障
✅ **Drizzle ORM 兼容** - 标准 PostgreSQL 协议

---

## 1. 注册和创建项目

### 步骤 1：注册 Supabase

```bash
open https://supabase.com/
```

- 使用 GitHub 账号登录（推荐）
- 或邮箱注册

### 步骤 2：创建项目

1. 点击 "New Project"
2. 填写信息：
   - **Organization**: 选择或创建（如 `freepic-org`）
   - **Project Name**: `freepic`
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择 `East Asia (Singapore)`（离中国最近）
3. 点击 "Create new project"
4. 等待 1-2 分钟项目创建完成

---

## 2. 获取数据库连接信息

### 连接字符串（Connection String）

1. 进入项目 Dashboard
2. 点击左侧 "Project Settings" → "Database"
3. 找到 "Connection string" 部分
4. 选择 **URI** 格式，复制：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres
```

**示例：**

```
postgresql://postgres:MyStrongPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

⚠️ **重要**：将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的密码

---

## 3. 配置 FreePic 项目

### 步骤 1：更新环境变量

编辑 `.env.local`：

```bash
# Supabase PostgreSQL 连接
DATABASE_URL=postgresql://postgres:你的密码@db.xxxxxxxxxxx.supabase.co:5432/postgres

# Supabase 项目信息（可选，用于后续扩展）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx
```

### 步骤 2：恢复 PostgreSQL 配置

#### 修改 `lib/db.ts`：

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Supabase 免费版连接数限制较低
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false, // Supabase 需要 SSL
  },
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

#### 修改 `drizzle.config.ts`：

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

#### 修改 `lib/schema.ts` 使用 PostgreSQL 类型：

```typescript
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
import { relations } from 'drizzle-orm';

// 示例：users 表
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email', { length: 255 }).notNull().unique(),
    password: text('password', { length: 255 }),
    isActive: boolean('is_active').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
    name: text('name', { length: 100 }),
    avatar: text('avatar'),
    bio: text('bio'),
    location: text('location', { length: 100 }),
    website: text('website', { length: 255 }),
    instagram: text('instagram', { length: 100 }),
    twitter: text('twitter', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// 其他表结构见完整 schema.ts
```

### 步骤 3：安装依赖

```bash
npm install pg
npm install -D @types/pg
```

---

## 4. 创建数据库迁移

### 生成迁移文件

```bash
npx drizzle-kit generate
```

### 应用迁移到 Supabase

```bash
npx drizzle-kit migrate
```

如果遇到 SSL 错误，添加环境变量：

```bash
export PGSSLMODE=require
npx drizzle-kit migrate
```

---

## 5. 验证连接

### 启动开发服务器

```bash
npm run dev
```

### 测试 API

```bash
# 测试数据库连接
curl http://localhost:9000/api/images

# 应该返回 200 和图片列表
```

### 查看 Supabase Dashboard

```bash
open https://app.supabase.com/project/你的项目ID
```

在 Dashboard 中可以：

- 📊 查看所有表和数据
- 🔍 使用 SQL Editor 执行查询
- 📈 查看数据库统计
- 🔒 管理用户和权限

---

## 6. 迁移现有 SQLite 数据（可选）

### 导出 SQLite 数据

```bash
# 安装 pgloader（用于 SQLite 到 PostgreSQL 迁移）
brew install pgloader

# 或使用 Node.js 脚本导出
npx tsx scripts/export-sqlite-to-json.ts
```

### 导入到 Supabase

```bash
# 使用 Supabase CLI
supabase login
supabase link --project-ref 你的项目ID

# 导入数据
supabase db dump > backup.sql
```

---

## 7. Supabase 免费额度

| 资源            | 免费额度    | 说明            |
| --------------- | ----------- | --------------- |
| **Database**    | 500MB       | PostgreSQL 存储 |
| **Auth**        | 50,000 用户 | 认证用户        |
| **Storage**     | 1GB         | 文件存储        |
| **Bandwidth**   | 2GB/月      | 出站流量        |
| **Connections** | 30          | 最大并发连接    |

💡 **提示**：对于开发和测试完全够用，生产环境可以考虑付费计划

---

## 8. 常见问题

### Q: 连接超时

```typescript
// 增加连接超时时间
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 增加到 10 秒
  ssl: { rejectUnauthorized: false },
});
```

### Q: SSL 错误

```typescript
// 确保启用 SSL
ssl: {
  rejectUnauthorized: false,
}
```

### Q: 连接数超限

```typescript
// 减少连接池大小（Supabase 免费版限制 30 连接）
max: 5, // 降低连接数
```

### Q: 数据库不存在

- 确认连接字符串正确
- 检查密码是否正确
- Supabase 默认数据库名是 `postgres`

---

## 9. 快速检查清单

- [ ] 注册 Supabase 账号
- [ ] 创建项目（选择 Singapore 区域）
- [ ] 复制 Connection string
- [ ] 更新 `.env.local` 的 DATABASE_URL
- [ ] 修改 `lib/db.ts` 添加 SSL 配置
- [ ] 修改 `drizzle.config.ts` 为 postgresql
- [ ] 修改 `lib/schema.ts` 使用 pgTable
- [ ] 运行 `npm install pg`
- [ ] 运行 `npx drizzle-kit generate`
- [ ] 运行 `npx drizzle-kit migrate`
- [ ] 启动 `npm run dev`
- [ ] 测试 `curl http://localhost:9000/api/images`

---

## 10. 下一步

Supabase 还可以用于：

- 🔐 **认证** - 替换自研 JWT 认证
- 📁 **存储** - 替换腾讯云 COS 存储图片
- ⚡ **实时** - 订阅数据库变化（WebSocket）

需要配置这些功能吗？

---

**Supabase 是最简单的 PostgreSQL 托管方案，推荐！** 🚀
