export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// GET /api/users/me/notifications - Get user's notifications (paginated)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const offset = (page - 1) * limit;

    // Build where condition
    let whereCondition = eq(notifications.userId, auth.userId);
    if (unreadOnly) {
      whereCondition = and(whereCondition, eq(notifications.isRead, false));
    }

    // Get total count
    const countResult = await db
      .select({ count: db.fn.count() })
      .from(notifications)
      .where(whereCondition);

    const total = Number(countResult[0]?.count || 0);

    // Get notifications
    const notificationsList = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        content: notifications.content,
        relatedId: notifications.relatedId,
        relatedType: notifications.relatedType,
        isRead: notifications.isRead,
        actionUrl: notifications.actionUrl,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      notifications: notificationsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + notificationsList.length < total,
      },
    });
  } catch (error) {
    console.error('[Notifications API] Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
