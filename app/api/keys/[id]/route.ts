export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { revokeApiKey } from '@/lib/api-key';
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
 * DELETE /api/keys/[id] - 禁用 API Key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUser(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await revokeApiKey(id, auth.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
