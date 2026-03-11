import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, images } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/users/[id] - 获取公开用户信息
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 获取用户公开信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
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

    // 获取用户上传的公开图片数量
    const imagesCount = await db.$count(
      images,
      and(eq(images.userId, id), eq(images.status, 'approved'))
    );

    // 获取总下载量
    const userImages = await db
      .select({ downloads: images.downloads })
      .from(images)
      .where(and(eq(images.userId, id), eq(images.status, 'approved')));

    const totalDownloads = userImages.reduce((sum, img) => sum + (img.downloads || 0), 0);

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          imagesCount,
          totalDownloads,
        },
      },
    });
  } catch (error) {
    console.error('Get public user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
