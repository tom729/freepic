export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  
  if (!isAuthenticated) {
    return { isAdmin: false, error: '请先登录', status: 401 };
  }
  
  if (!user?.isAdmin) {
    return { isAdmin: false, error: '无管理员权限', status: 403 };
  }
  
  return { isAdmin: true, user };
}

// 获取待审核图片列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 验证状态参数
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 获取总数
    const countResult = await db
      .select({ count: images.id })
      .from(images)
      .where(eq(images.status, status as 'pending' | 'approved' | 'rejected'));
    const total = countResult.length;

    // 获取图片列表
    const imagesList = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        status: images.status,
        width: images.width,
        height: images.height,
        fileSize: images.fileSize,
        exifData: images.exifData,
        createdAt: images.createdAt,
        user: {
          id: users.id,
          email: users.email,
        },
      })
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .where(eq(images.status, status as 'pending' | 'approved' | 'rejected'))
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      images: imagesList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch moderation list:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
