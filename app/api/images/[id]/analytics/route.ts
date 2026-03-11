export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, imageViews, imageViewAggregates } from '@/lib/schema';
import { eq, and, gte, lte, sql, count, desc } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// Get analytics for a specific image
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Parse date range (default to last 30 days)
    const days = parseInt(searchParams.get('days') || '30', 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Verify user authentication
    const { isAuthenticated, user } = await verifyAuthWithUser(request);

    if (!isAuthenticated) {
      return NextResponse.json({ error: '请先登录后查看分析数据' }, { status: 401 });
    }

    // Get image info to check ownership
    const image = await db
      .select({
        id: images.id,
        userId: images.userId,
        downloads: images.downloads,
        likes: images.likes,
        createdAt: images.createdAt,
      })
      .from(images)
      .where(eq(images.id, id))
      .limit(1);

    if (image.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const isOwner = image[0].userId === user?.id;
    const isAdmin = user?.isAdmin || false;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '无权查看此图片的分析数据' }, { status: 403 });
    }

    // Get total views from aggregates
    const aggregateStats = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${imageViewAggregates.totalViews}), 0)`,
        totalUniqueViews: sql<number>`COALESCE(SUM(${imageViewAggregates.uniqueViews}), 0)`,
      })
      .from(imageViewAggregates)
      .where(eq(imageViewAggregates.imageId, id));

    // Get daily breakdown from aggregates
    const dailyBreakdown = await db
      .select({
        date: imageViewAggregates.date,
        totalViews: imageViewAggregates.totalViews,
        uniqueViews: imageViewAggregates.uniqueViews,
      })
      .from(imageViewAggregates)
      .where(
        and(
          eq(imageViewAggregates.imageId, id),
          gte(imageViewAggregates.date, startDate),
          lte(imageViewAggregates.date, endDate)
        )
      )
      .orderBy(desc(imageViewAggregates.date));

    // Get unique viewers count (from imageViews table for more accuracy)
    const uniqueViewersResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT COALESCE(${imageViews.userId}, ${imageViews.sessionId}))`,
      })
      .from(imageViews)
      .where(eq(imageViews.imageId, id));

    // Get referrer stats (top 10)
    const referrerStats = await db
      .select({
        referrer: imageViews.referrer,
        count: sql<number>`COUNT(*)`,
      })
      .from(imageViews)
      .where(and(eq(imageViews.imageId, id), gte(imageViews.viewedAt, startDate)))
      .groupBy(imageViews.referrer)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // Get recent views (last 10)
    const recentViews = await db
      .select({
        id: imageViews.id,
        userId: imageViews.userId,
        viewedAt: imageViews.viewedAt,
        referrer: imageViews.referrer,
      })
      .from(imageViews)
      .where(eq(imageViews.imageId, id))
      .orderBy(desc(imageViews.viewedAt))
      .limit(10);

    return NextResponse.json({
      imageId: id,
      summary: {
        totalViews: aggregateStats[0]?.totalViews || 0,
        totalUniqueViews: aggregateStats[0]?.totalUniqueViews || 0,
        uniqueViewers: uniqueViewersResult[0]?.count || 0,
        downloads: image[0].downloads || 0,
        likes: image[0].likes || 0,
        uploadDate: image[0].createdAt,
      },
      dailyBreakdown: dailyBreakdown.map((day) => ({
        date: day.date.toISOString().split('T')[0],
        totalViews: day.totalViews,
        uniqueViews: day.uniqueViews,
      })),
      referrers: referrerStats.map((ref) => ({
        source: ref.referrer || 'Direct',
        count: ref.count,
      })),
      recentViews: recentViews.map((view) => ({
        id: view.id,
        isAnonymous: !view.userId,
        viewedAt: view.viewedAt,
        referrer: view.referrer || 'Direct',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
