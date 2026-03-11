# AGENTS.md - FreePic Knowledge Base

**Generated:** 2026-03-05
**Framework:** Next.js 14 + TypeScript + Tailwind CSS
**Database:** SQLite (better-sqlite3) + Drizzle ORM
**Lines of Code:** ~9,500 TypeScript

## Quick Start

```bash
npm run dev         # Dev server on :9000
npm run build       # Production build
npm run verify      # Run verification script
```

## Hierarchical Documentation

| Directory | Purpose | AGENTS.md |
|-----------|---------|-----------|
| `.` | Root (this file) | You are here |
| `app/` | Next.js App Router | [app/AGENTS.md](./app/AGENTS.md) |
| `lib/` | Core libraries | [lib/AGENTS.md](./lib/AGENTS.md) |
| `scripts/` | Utility scripts | [scripts/AGENTS.md](./scripts/AGENTS.md) |

## Project Structure

```
.
├── app/              # Next.js App Router (36 files)
│   ├── api/          # API routes (26 subdirs)
│   ├── upload/       # Upload page (690 lines)
│   ├── search/       # Search page (590 lines)
│   └── image/[id]/   # Image detail
├── lib/              # Core libraries (9 files)
│   ├── db.ts         # Database
│   ├── schema.ts     # Drizzle schema
├── cos.ts        # Tencent COS (624 lines)
│   └── email.ts      # Email sending
├── components/       # React components (11 files)
├── hooks/            # Custom hooks (1 file)
├── scripts/          # Utility scripts
└── database/         # SQLite database
```

## Where to Look

| Task | Location |
|------|----------|
| Add API endpoint | `app/api/` → see [app/AGENTS.md](./app/AGENTS.md) |
| Modify database | `lib/schema.ts` → see [lib/AGENTS.md](./lib/AGENTS.md) |
| Add image processing | `lib/cos.ts` → see [lib/AGENTS.md](./lib/AGENTS.md) |
| Change auth | `lib/password.ts`, `lib/server-auth.ts` |
| Add UI component | `components/` |
| Modify styles | `app/globals.css` |
| Run tests | `./scripts/verify-all-flows.sh` |

## Verification (REQUIRED after changes)

### 🔴 强制规则：每个任务完成后必须验证

**规则说明：**
每个开发任务（新增功能、修改页面、API变更等）完成后，**必须**运行页面验证脚本，确保关键页面可正常访问。

**验证命令：**
```bash
# 验证所有关键页面
npm run verify:pages

# 旧版核心功能验证
./scripts/verify-core-flows.sh
```

**验证失败 = 任务未完成**
- 如果任何关键页面返回非 200 状态码，任务不算完成
- 必须修复问题后重新验证，才能标记为 completed

### 关键页面清单

| 页面 | 路径 | 最低要求 |
|------|------|----------|
| 首页 | `/` | HTTP 200 |
| 搜索页 | `/search` | HTTP 200 |
| 登录页 | `/login` | HTTP 200 |
| 注册页 | `/register` | HTTP 200 |
| 个人资料 | `/profile` | HTTP 200 (需登录) |
| 上传页 | `/upload` | HTTP 200 (需登录) |
| 图片列表API | `/api/images` | HTTP 200/401 |
| 标签列表API | `/api/tags` | HTTP 200 |
| 用户资料API | `/api/users/me` | HTTP 200/401 |

### 快速验证（单个检查）

```bash
# Quick verification
./scripts/verify-all-flows.sh

# Individual checks
curl http://localhost:9000/api/images
curl http://localhost:9000/api/tags
```

## Critical Constraints

1. **Never use `as any`** - Fix types properly
2. **Client components need `"use client"`** at top
3. **Server Components are default** - no directive needed
4. **Upload validation**: Images require EXIF, max 50MB, JPG/PNG only
5. **Database**: SQLite (not PostgreSQL mentioned in old docs)
6. **Cache issues**: Run `npm run clean` if `Cannot find module` errors

## Conventions

### TypeScript
- Strict mode enabled - no `any` types
- Use interfaces for shapes, types for unions
- Custom errors: extend `Error` with `readonly code`

### Imports
```typescript
// 1. React/Next
import { useState } from 'react'

// 2. Third-party
import { drizzle } from 'drizzle-orm'

// 3. Absolute (@/*)
import { db } from '@/lib/db'

// 4. Relative (only when necessary)
import { helper } from './utils'
```

### Formatting (Prettier)
- Semi-colons: required
- Quotes: single
- Tab width: 2 spaces
- Print width: 100

## Commands

```bash
# Development
npm run dev              # Dev server :9000
npm run dev:clean        # Clean cache + dev

# Build
npm run build            # Production build
npm run clean            # Clean .next cache

# Code quality
npm run lint             # ESLint
npx prettier --check .   # Check format
npx prettier --write .   # Fix format

# Database
npx drizzle-kit generate # Generate migrations
npx drizzle-kit migrate  # Run migrations
npx drizzle-kit studio   # Drizzle Studio GUI
```

## Process Management

**Port 9000 is used for dev server.** Since you may have multiple Node services running, always use port to identify the process:

```bash
# Find process by port
lsof -ti:9000

# Kill dev server only
kill -9 $(lsof -ti:9000)

# Or combine: kill and restart
kill -9 $(lsof -ti:9000) && npm run dev
```

**Never use** `killall node` — it kills all Node processes on your machine.

## Environment Variables

Create `.env.local`:

```bash
# Required
JWT_SECRET=your-secret-key-min-32-characters

# Optional (demo mode works without)
TENCENT_COS_SECRET_ID=
TENCENT_COS_SECRET_KEY=
TENCENT_COS_REGION=
TENCENT_COS_BUCKET=
SMTP_USER=
SMTP_PASS=
```

## Dependencies to Know

| Package | Purpose |
|---------|---------|
| `drizzle-orm` + `drizzle-kit` | Database ORM |
| `better-sqlite3` | SQLite driver |
| `cos-nodejs-sdk-v5` | Tencent Cloud storage |
| `bcryptjs` | Password hashing |
| `jose` | JWT handling |
| `sharp` | Image processing |
| `piexifjs` | EXIF extraction |
| `zustand` | State management |

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Cannot find module './xxxx.js'` | Run `npm run clean` |
| Database errors | Check `database/sqlite.db` exists |
| Upload fails | Check COS credentials in `.env.local` |
| Email not sent | Check SMTP settings or use dev mode |

## Notes

- **Next.js Cache Issues**: Common during development. Fix: `rm -rf .next`
- **Database**: Uses SQLite (better-sqlite3), not PostgreSQL
- **Storage**: Supports both Tencent COS and local demo mode
- **Authentication**: JWT-based with email activation
- **Image Processing**: Sharp for thumbnails, BlurHash for placeholders

---

**Subdirectories with detailed docs:**
- [app/AGENTS.md](./app/AGENTS.md) - App Router patterns
- [app/AGENTS.md](./app/AGENTS.md) - App Router patterns
- [lib/AGENTS.md](./lib/AGENTS.md) - Core library docs
- [components/AGENTS.md](./components/AGENTS.md) - React components
- [scripts/AGENTS.md](./scripts/AGENTS.md) - Utility scripts
