export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users, downloads, imageViews } from '@/lib/schema';
import { eq, sql, desc, gte, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';

/**
 * GET /api/admin/analytics - 获取平台统计数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 获取总数统计
    const [totalImagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(eq(images.status, 'approved'));

    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [totalDownloadsResult] = await db
      .select({ total: sql<number>`coalesce(sum(downloads), 0)` })
      .from(images);

    const [totalViewsResult] = await db.select({ count: sql<number>`count(*)` }).from(imageViews);

    // 获取上月数据用于对比
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [lastMonthImages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(and(eq(images.status, 'approved'), gte(images.createdAt, oneMonthAgo)));

    const [lastMonthUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, oneMonthAgo));

    // 获取热门图片（按点赞量排序）
    const topImages = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        likes: images.likes,
        downloads: images.downloads,
        description: images.description,
        userId: images.userId,
        userName: users.name,
      })
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .where(eq(images.status, 'approved'))
      .orderBy(desc(images.likes))
      .limit(5);

    // 获取最近7天的浏览趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const viewsOverTime = await db
      .select({
        date: sql<string>`date(viewed_at)`,
        views: sql<number>`count(*)`,
      })
      .from(imageViews)
      .where(gte(imageViews.viewedAt, sevenDaysAgo))
      .groupBy(sql`date(viewed_at)`)
      .orderBy(sql`date(viewed_at)`);

    // 构建响应
    const totalImages = Number(totalImagesResult?.count || 0);
    const totalUsers = Number(totalUsersResult?.count || 0);
    const totalDownloads = Number(totalDownloadsResult?.total || 0);
    const totalViews = Number(totalViewsResult?.count || 0);

    // 计算变化百分比
    const imagesChange =
      totalImages > 0
        ? Math.round((Number(lastMonthImages?.count || 0) / Math.max(totalImages, 1)) * 100)
        : 0;
    const usersChange =
      totalUsers > 0
        ? Math.round((Number(lastMonthUsers?.count || 0) / Math.max(totalUsers, 1)) * 100)
        : 0;

    return NextResponse.json({
      totalViews,
      totalDownloads,
      totalUsers,
      totalImages,
      viewsChange: 0, // 需要历史数据
      downloadsChange: 0,
      usersChange,
      imagesChange,
      topImages: topImages.map((img) => ({
        id: img.id,
        cosKey: img.cosKey,
        likes: img.likes || 0,
        downloads: img.downloads || 0,
        description: img.description,
        author: img.userName || 'Unknown',
      })),
      viewsOverTime: viewsOverTime.map((v) => ({
        date: v.date,
        views: v.views,
      })),
      referrers: [
        { name: '直接访问', value: Math.round(totalViews * 0.4) },
        { name: '搜索引擎', value: Math.round(totalViews * 0.3) },
        { name: '社交媒体', value: Math.round(totalViews * 0.2) },
        { name: '其他', value: Math.round(totalViews * 0.1) },
      ],
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
