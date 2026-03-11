import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { comparePassword } from '@/lib/password';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

// JWT Secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    // 查找用户
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 检查账号是否已激活
    if (!user.isActive) {
      return NextResponse.json(
        {
          error: '账号未激活，请先查收激活邮件并完成激活',
          requiresActivation: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // 生成 JWT Token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        instagram: user.instagram,
        twitter: user.twitter,
        createdAt: user.createdAt,
        isActive: user.isActive,
      },
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
