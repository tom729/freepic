export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { getImageUrl } from '@/lib/cos';

// 验证管理员权限（支持 Bearer token 和 NextAuth session）
async function verifyAdmin(request: NextRequest) {
  // 先尝试 Bearer token
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  if (isAuthenticated && user?.isAdmin) {
    return { isAdmin: true, user };
  }

  // 尝试 NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user.email!),
    });
    if (dbUser?.isAdmin) {
      return { isAdmin: true, user: dbUser };
    }
  }

  if (!isAuthenticated && !session) {
    return { isAdmin: false, error: '请先登录', status: 401 };
  }

  return { isAdmin: false, error: '无管理员权限', status: 403 };
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

    // Generate URLs for each image - use same logic as main images API
    const imagesWithUrls = await Promise.all(
      imagesList.map(async (img) => {
        let urls = {
          thumbnailUrl: '',
          smallUrl: '',
          regularUrl: '',
          fullUrl: '',
        };
        try {
          if (img.cosKey) {
            const baseUrl = await getImageUrl(img.cosKey, { expires: 86400 });
            const isCustomDomain = !baseUrl.includes('myqcloud.com');
            if (isCustomDomain) {
              urls = {
                thumbnailUrl: `${baseUrl}/thumb`,
                smallUrl: `${baseUrl}/small`,
                regularUrl: `${baseUrl}/regular`,
                fullUrl: `${baseUrl}/full`,
              };
            } else {
              const separator = baseUrl.includes('?') ? '&' : '?';
              urls = {
                thumbnailUrl: `${baseUrl}${separator}imageMogr2/style/thumb`,
                smallUrl: `${baseUrl}${separator}imageMogr2/style/small`,
                regularUrl: `${baseUrl}${separator}imageMogr2/style/regular`,
                fullUrl: `${baseUrl}${separator}imageMogr2/style/full`,
              };
            }
          }
        } catch (e) {
          console.error('Failed to generate URL', e);
        }
        return { ...img, ...urls };
      })
    );

    return NextResponse.json({
      images: imagesWithUrls,
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
