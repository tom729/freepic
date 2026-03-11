import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
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

export function verifyAuth(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, isAuthenticated: false };
  }

  const token = authHeader.substring(7);

  // 简单验证：检查 token 是否存在且不为空
  // 在实际生产环境中，这里应该验证 JWT 签名
  if (!token || token.length < 10) {
    return { userId: null, isAuthenticated: false };
  }

  // 从 token 中解析用户 ID（这里简化处理，实际应该解码 JWT）
  // 临时方案：token 格式假设为包含用户 ID
  try {
    // 简单 base64 解码获取用户信息
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
    return {
      userId: payload.sub || payload.userId || null,
      isAuthenticated: true,
    };
  } catch {
    // 如果解码失败，假设 token 就是用户 ID（演示模式）
    return { userId: token, isAuthenticated: true };
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
    console.log('[Auth] Verifying token...');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('[Auth] Token payload:', payload);
    // Support multiple possible user ID field names
    const userId = (payload.userId || payload.sub || payload.id) as string;
    
    console.log('[Auth] Extracted userId:', userId, 'from fields:', Object.keys(payload));

    if (!userId) {
      console.log('[Auth] No userId in token, payload keys:', Object.keys(payload));
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

    console.log('[Auth] User query result:', { userId, found: !!user, userIdFromResult: user?.id });
    console.log('[Auth] User query result:', user);

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
