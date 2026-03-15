export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { getImageUrl } from '@/lib/cos';

/**
 * ANP 图片列表接口
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sort = searchParams.get('sort') || 'new';

    const offset = (page - 1) * limit;

    let orderByClause;
    switch (sort) {
      case 'popular':
        orderByClause = desc(images.likes);
        break;
      case 'random':
        orderByClause = sql`RANDOM()`;
        break;
      default:
        orderByClause = desc(images.createdAt);
    }

    const imageList = await db
      .select({
        id: images.id,
        description: images.description,
        width: images.width,
        height: images.height,
        blurHash: images.blurHash,
        dominantColor: images.dominantColor,
        likes: images.likes,
        downloads: images.downloads,
        createdAt: images.createdAt,
        userId: images.userId,
        cosKey: images.cosKey,
      })
      .from(images)
      .where(eq(images.status, 'approved'))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const userIds = Array.from(new Set(imageList.map((img) => img.userId)));
    const userMap = new Map();
    if (userIds.length > 0) {
      const userList = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        })
        .from(users)
        .where(sql`${users.id} IN ${userIds}`);

      userList.forEach((user) => {
        userMap.set(user.id, user);
      });
    }

    // 构建响应
    const result = imageList.map((img) => {
      const user = userMap.get(img.userId);
      return {
        id: img.id,
        description: img.description,
        width: img.width,
        height: img.height,
        blurHash: img.blurHash,
        dominantColor: img.dominantColor,
        likes: img.likes,
        downloads: img.downloads,
        createdAt: img.createdAt,
        urls: {
          small: getImageUrl(img.cosKey + '/small'),
          regular: getImageUrl(img.cosKey + '/regular'),
          full: getImageUrl(img.cosKey),
        },
        author: user
          ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            }
          : null,
      };
    });

    // 获取总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(eq(images.status, 'approved'));

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        pages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Failed to get images:', error);
    return NextResponse.json({ error: 'Failed to get images' }, { status: 500 });
  }
}
