import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, activationTokens } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    // Validate parameters
    if (!token || !userId) {
      return NextResponse.json({ error: '无效的激活链接' }, { status: 400 });
    }

    // Find the token in database
    const activationToken = await db.query.activationTokens.findFirst({
      where: and(
        eq(activationTokens.token, token),
        eq(activationTokens.userId, userId),
        isNull(activationTokens.usedAt)
      ),
    });

    if (!activationToken) {
      return NextResponse.json({ error: '激活链接无效或已过期' }, { status: 400 });
    }

    // Check if token is expired
    if (new Date() > activationToken.expiresAt) {
      return NextResponse.json({ error: '激活链接已过期，请重新注册' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // Check if already activated
    if (user.isActive) {
      return NextResponse.json(
        { message: '账号已激活，请直接登录', alreadyActive: true },
        { status: 200 }
      );
    }

    // Activate user account
    await db
      .update(users)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Mark token as used
    await db
      .update(activationTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(activationTokens.id, activationToken.id));

    // Return success with redirect to login
    return NextResponse.json({
      success: true,
      message: '账号激活成功！请登录',
    });
  } catch (error) {
    console.error('Account activation error:', error);
    return NextResponse.json({ error: '激活失败，请稍后重试' }, { status: 500 });
  }
}
