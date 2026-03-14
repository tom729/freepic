import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';

export const dynamic = 'force-dynamic';

// Helper to get user ID from either Bearer token or NextAuth session
async function getUserId(request: NextRequest): Promise<string | null> {
  // First try Bearer token
  const auth = await verifyAuth(request);
  if (auth.isAuthenticated && auth.userId) {
    return auth.userId;
  }

  // Try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user.email!),
    });
    return user?.id || null;
  }

  return null;
}

// GET /api/users/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        instagram: true,
        twitter: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/me - 更新当前用户信息
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, location, website, instagram, twitter } = body;

    // 验证输入
    if (name && name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 });
    }
    if (bio && bio.length > 500) {
      return NextResponse.json({ error: 'Bio too long (max 500 chars)' }, { status: 400 });
    }
    if (location && location.length > 100) {
      return NextResponse.json({ error: 'Location too long (max 100 chars)' }, { status: 400 });
    }
    if (website && website.length > 255) {
      return NextResponse.json({ error: 'Website too long (max 255 chars)' }, { status: 400 });
    }
    if (instagram && instagram.length > 100) {
      return NextResponse.json(
        { error: 'Instagram handle too long (max 100 chars)' },
        { status: 400 }
      );
    }
    if (twitter && twitter.length > 100) {
      return NextResponse.json(
        { error: 'Twitter handle too long (max 100 chars)' },
        { status: 400 }
      );
    }

    // 清理社交账号输入（去掉@符号）
    const cleanInstagram = instagram ? instagram.replace(/^@/, '').trim() : null;
    const cleanTwitter = twitter ? twitter.replace(/^@/, '').trim() : null;

    // 更新用户资料
    await db
      .update(users)
      .set({
        name: name || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
        instagram: cleanInstagram || null,
        twitter: cleanTwitter || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 获取更新后的用户信息
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        instagram: true,
        twitter: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
