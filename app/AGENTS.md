# AGENTS.md - App Router Knowledge Base

**Scope:** Next.js 14 App Router (`app/` directory)
**Last Updated:** 2026-03-05

## Overview

App Router implementation with 36 routes including pages, API endpoints, and nested layouts. Follows Next.js 14 conventions with Server Components by default.

## Directory Structure

```
app/
├── page.tsx                 # Home (Server Component)
├── layout.tsx               # Root layout with providers
├── globals.css              # Tailwind + custom styles
├── loading.tsx              # Global loading UI
├── error.tsx                # Global error boundary
│
├── api/                     # API Routes (26 subdirs, 30+ routes)
│   ├── auth/               # Authentication (login, register, activate)
│   ├── images/             # Image CRUD + download
│   ├── upload/             # File upload with EXIF validation
│   ├── tags/               # Tag management
│   ├── search/             # Search + visual search
│   └── admin/              # Admin moderation APIs
│
├── upload/                 # Upload page (690 lines, complex)
│   └── page.tsx
├── search/                 # Search page (590 lines)
│   └── page.tsx
├── image/[id]/             # Image detail page (271 lines)
│   └── page.tsx
├── profile/                # User profile
├── login/                  # Login page
├── register/               # Registration
└── admin/moderation/       # Content moderation UI
│
├── user/[id]/              # User public profile
```

## Key Conventions

### Server vs Client Components

```typescript
// Server Component (default) - for data fetching
export default async function Page() {
  const data = await db.query(...)
  return <Component data={data} />
}

// Client Component - for interactivity
"use client"
export default function InteractivePage() {
  const [state, setState] = useState()
  return <div />
}
```

**Rules:**

- Use Server Components for data fetching, SEO, static content
- Use Client Components only when need: `useState`, `useEffect`, browser APIs, event handlers
- Keep Client Components as small as possible, lift data fetching to Server Components

### API Route Patterns

```typescript
// app/api/example/route.ts
export const dynamic = 'force-dynamic'; // or 'auto', 'force-static'

export async function GET(request: NextRequest) {
  // Always wrap in try-catch
  try {
    const data = await fetchData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Dynamic Routes

| Pattern       | Example               | Usage              |
| ------------- | --------------------- | ------------------ |
| `[id]`        | `image/[id]/page.tsx` | Single resource    |
| `[...slug]`   | `blog/[...slug]`      | Catch-all routes   |
| `[[...slug]]` | `shop/[[...slug]]`    | Optional catch-all |

## Complex Pages

| Page                  | Lines | Complexity | Notes                                                       |
| --------------------- | ----- | ---------- | ----------------------------------------------------------- |
| `upload/page.tsx`     | 690   | High       | File upload, EXIF extraction, progress tracking, AI tagging |
| `search/page.tsx`     | 590   | High       | Filters, pagination, masonry grid, search history           |
| `api/upload/route.ts` | 312   | High       | File validation, COS upload, EXIF processing                |
| `image/[id]/page.tsx` | 281   | Medium     | Image detail, related images, download                      |

## Where to Look

| Task                 | Location                                  |
| -------------------- | ----------------------------------------- |
| Add new API endpoint | `app/api/{name}/route.ts`                 |
| Add new page         | `app/{name}/page.tsx`                     |
| Modify auth logic    | `app/api/auth/*`                          |
| Add image processing | `app/api/upload/route.ts`                 |
| Modify search        | `app/search/page.tsx`, `app/api/search/*` |
| Admin functions      | `app/admin/*`, `app/api/admin/*`          |

## Anti-Patterns

1. **Don't use `export const runtime = 'edge'`** with better-sqlite3 (incompatible)
2. **Don't fetch data in Client Components** unless necessary - use Server Components
3. **Don't forget `force-dynamic`** for routes using database with changing data
4. **Don't use `fs` module** in Client Components (build will fail)
5. **Don't forget `export const dynamic = 'force-dynamic'`** for routes using database with changing data

## Common Tasks

```bash
# Add new API endpoint
mkdir app/api/feature-name
cat > app/api/feature-name/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  return NextResponse.json({ data: [] })
}
EOF

# Add new page
mkdir app/page-name
cat > app/page-name/page.tsx << 'EOF'
export default function Page() {
  return <div>Content</div>
}
EOF
```

## Dependencies to Know

- `next/server` - NextRequest, NextResponse
- `next/navigation` - useRouter, redirect, notFound
- `next/image` - Image optimization
- `next/link` - Client-side navigation
- `next/headers` - cookies, headers (Server Components)

## Notes

- All API routes in `app/api/` use Node.js runtime (not Edge) due to better-sqlite3
- Cache headers set via `response.headers.set()` in route handlers
- Type-safe routes via `next/types/app/*` (auto-generated by Next.js)
- Loading states via `loading.tsx` files
- Error handling via `error.tsx` files (must be Client Components)
