import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Security: No hardcoded fallback - must be set in environment
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('[SECURITY] JWT_SECRET must be set in environment and be at least 32 characters');
}
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
);

export interface AuthResult {
  userId: string | null;
  isAuthenticated: boolean;
}

export interface AuthUserResult {
  userId: string | null;
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    isAdmin: boolean;
  } | null;
  isAdmin?: boolean;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, isAuthenticated: false };
  }

  const token = authHeader.substring(7);

  if (!token || token.length < 10) {
    return { userId: null, isAuthenticated: false };
  }

  // Security: Must verify JWT signature - no fallbacks
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload.userId || payload.sub || payload.id) as string | null;
    return {
      userId,
      isAuthenticated: !!userId,
    };
  } catch (error) {
    // Security: Invalid JWT = not authenticated
    console.error('[Auth] JWT verification failed:', error);
    return { userId: null, isAuthenticated: false };
  }
}

export async function verifyAuthWithUser(request: NextRequest): Promise<AuthUserResult> {
  // Try to get token from Authorization header first
  let token = null;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // If no header, try to get from cookie
  if (!token) {
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie) {
      token = tokenCookie.value;
    }
  }

  if (!token || token.length < 10) {
    return { userId: null, isAuthenticated: false, user: null };
  }

  try {
    // Verify JWT and get payload
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Support multiple possible user ID field names
    const userId = (payload.userId || payload.sub || payload.id) as string;

    if (!userId) {
      return { userId: null, isAuthenticated: false, user: null };
    }


    // Import db here to avoid circular dependency
    const { db } = await import('./db');
    const { users } = await import('./schema');
    const { eq } = await import('drizzle-orm');

    // Use direct SQL query to avoid potential Drizzle ORM issues
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return { userId: null, isAuthenticated: false, user: null };
    }

    return {
      userId,
      isAuthenticated: true,
      user,
    };
  } catch (error) {
    console.error('[Auth] Verification failed:', error);
    return { userId: null, isAuthenticated: false, user: null };
  }
}
