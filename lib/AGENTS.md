# AGENTS.md - Core Libraries

**Scope:** Shared libraries (`lib/` directory)
**Last Updated:** 2026-03-05

## Overview

11 core library modules providing database, storage, authentication, and utility functions. Business logic layer for the FreePic application.

## Directory Structure

```
lib/
├── db.ts              # Database connection (better-sqlite3)
├── schema.ts          # Drizzle ORM schema definitions
├── password.ts        # Password hashing (bcryptjs)
├── server-auth.ts     # JWT authentication utilities
├── cos.ts             # Tencent Cloud COS client (624 lines, complex)
├── email.ts           # Email sending (nodemailer)
├── image-processing.ts # Sharp-based image processing
├── embedding.ts       # CLIP image embedding for semantic search
├── embedding-queue.ts # Async embedding generation queue
└── utils.ts           # General utilities
├── auth.ts            # Client-side auth hook (useAuth)
├── validation.ts      # Zod schemas for input validation
```

## Key Modules

### Database (`db.ts`, `schema.ts`)

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
export const db = drizzle(sqlite, { schema });

// Usage in API routes
const result = await db.query.users.findFirst({
  where: eq(users.email, email),
});
```

**Tables:** users, images, imageEmbeddings, downloads, activationTokens

### Storage (`cos.ts`) - 624 lines

Tencent Cloud Object Storage integration:

```typescript
import { uploadImage, getImageUrl, generateImageVariants } from '@/lib/cos';

// Upload
const result = await uploadImage(buffer, filename, contentType);
// Returns: { key, url, etag }

// Get signed URL
const url = await getImageUrl(key, { expires: 3600 });

// Generate variants
const variants = await generateImageVariants(key, width, height);
// Returns: { thumb, small, regular, full, original }
```

**Critical:** Always use signed URLs for private COS objects

### Authentication (`password.ts`, `server-auth.ts`)

```typescript
// Password hashing
import { hashPassword, comparePassword } from '@/lib/password';
const hashed = await hashPassword(password);

// JWT verification
import { verifyAuth } from '@/lib/server-auth';
const { userId, isAuthenticated } = verifyAuth(request);
```

### Image Processing (`image-processing.ts`)

```typescript
import { processImage } from '@/lib/image-processing';

const { blurHash, dominantColor, width, height } = await processImage(buffer);
```

**Functions:**

- `generateBlurHash()` - Creates blur placeholder
- `extractDominantColor()` - Extracts primary color
- `getImageDimensions()` - Gets image size

### CLIP Embedding (`embedding.ts`)

Semantic search using CLIP model:

```typescript
import { generateImageEmbedding, generateTextEmbedding, cosineSimilarity } from '@/lib/embedding';

// Generate embedding for image
const imageEmbedding = await generateImageEmbedding(imageUrl);

// Generate embedding for text query
const textEmbedding = await generateTextEmbedding('海边的日落');

// Calculate similarity
const score = cosineSimilarity(imageEmbedding, textEmbedding);
```

**Model:** Xenova/clip-vit-base-patch32 (quantized, ~150MB RAM)

### Email (`email.ts`)

```typescript
import { sendActivationEmail } from '@/lib/email';
await sendActivationEmail({ to: email, userId });
```

**SMTP Config:** Requires `SMTP_USER` and `SMTP_PASS` in `.env.local`

## Complex Files

| File                 | Lines | Complexity | Notes                                       |
| -------------------- | ----- | ---------- | ------------------------------------------- |
| `cos.ts`             | 624   | High       | COS operations, signed URLs, image variants |
| `embedding.ts`       | 156   | Medium     | CLIP semantic search embeddings             |
| `email.ts`           | 320   | Medium     | Email templates, SMTP configuration         |
| `embedding-queue.ts` | 133   | Medium     | Async embedding generation queue            |

## Where to Look

| Task                   | Location                                 |
| ---------------------- | ---------------------------------------- |
| Add database table     | `schema.ts` → run `drizzle-kit generate` |
| Modify storage logic   | `cos.ts`                                 |
| Change auth logic      | `password.ts`, `server-auth.ts`          |
| Add image processing   | `image-processing.ts`                    |
| Modify email templates | `email.ts`                               |
| Add semantic search    | `embedding.ts`, `embedding-queue.ts`     |

## Conventions

### Error Handling

```typescript
// Custom error classes
export class CosError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'CosError'
  }
}

// Usage
try {
  await uploadImage(...)
} catch (error) {
  throw new CosError('Upload failed', 'UPLOAD_ERROR', error)
}
```

### Type Exports

```typescript
// Always export inferred types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Anti-Patterns

1. **Don't import `db` in Client Components** - will fail at build time
2. **Don't use `fs` in lib files** intended for client use - check usage context
3. **Don't hardcode credentials** - always use environment variables
4. **Don't forget error codes** - all custom errors must have `readonly code`

## Environment Variables

Required variables (must be set in `.env.local`):

```bash
# Database
DATABASE_URL=file:./database/sqlite.db

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# COS (optional - demo mode works without)
TENCENT_COS_SECRET_ID=
TENCENT_COS_SECRET_KEY=
TENCENT_COS_REGION=
TENCENT_COS_BUCKET=

# Email (optional - dev mode logs to console)
SMTP_USER=
SMTP_PASS=
```

## Dependencies

- `better-sqlite3` + `drizzle-orm` - Database
- `@xenova/transformers` - CLIP model for semantic search
- `bcryptjs` - Password hashing
- `jose` - JWT signing/verification
- `cos-nodejs-sdk-v5` - Tencent COS
- `sharp` - Image processing
- `blurhash` - Blur hash generation
- `nodemailer` - Email sending

## Notes

- All lib files are isomorphic (can run in both Node.js and browser) unless they import Node-specific modules
- `db.ts` and `cos.ts` are server-only due to native dependencies
- `server-auth.ts` is server-only due to JWT secret handling
- lib files should never import from `app/` or `components/` to avoid circular dependencies
