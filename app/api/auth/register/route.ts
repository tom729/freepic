import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, validatePassword } from '@/lib/password';
import { v4 as uuidv4 } from 'uuid';
import { sendActivationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json();

    // 验证输入
    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      return NextResponse.json({ error: '两次输入的密码不一致' }, { status: 400 });
    }

    // 检查邮箱是否已注册
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户（未激活状态）
    const [newUser] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isActive: false, // 未激活
        createdAt: new Date(),
      })
      .returning();

    // 发送激活邮件
    const emailResult = await sendActivationEmail({
      to: newUser.email,
      userId: newUser.id,
    });

    if (!emailResult.success) {
      console.error('Failed to send activation email:', emailResult.error);
      // 即使邮件发送失败，也继续返回注册成功，但提示用户联系管理员
      return NextResponse.json({
        success: true,
        message: '注册成功，但激活邮件发送失败，请联系管理员',
        requiresActivation: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: '注册成功，请查收激活邮件完成账号激活',
      requiresActivation: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
