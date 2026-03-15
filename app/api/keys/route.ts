export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, users } from '@/lib/schema';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { createApiKey, getUserApiKeys, revokeApiKey, getAvailablePlans } from '@/lib/api-key';
import { eq } from 'drizzle-orm';

/**
 * 验证用户（支持 Bearer token 和 NextAuth session）
 */
async function verifyUser(request: NextRequest) {
  // 1. 先尝试 Bearer token
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  if (isAuthenticated && user) {
    return { isAuthenticated: true, user };
  }

  // 2. 尝试 NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (dbUser) {
      return {
        isAuthenticated: true,
        user: { id: dbUser.id, email: dbUser.email, isAdmin: dbUser.isAdmin },
      };
    }
  }

  return { isAuthenticated: false, user: null };
}

/**
 * GET /api/keys - 获取用户的 API Keys
 * POST /api/keys - 创建新的 API Key
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await getUserApiKeys(auth.user.id);
    const plans = await getAvailablePlans();

    return NextResponse.json({ keys, plans });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return NextResponse.json({ error: 'Failed to get API keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, planId, expiresAt } = body;

    const result = await createApiKey(auth.user.id, {
      name,
      description,
      planId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({
      success: true,
      key: result,
      // 重要：只在创建时返回完整 key
      warning: '请妥善保存此 key，关闭后将无法再次查看',
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
