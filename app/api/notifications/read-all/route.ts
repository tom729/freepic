export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update all unread notifications for this user
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, auth.userId), eq(notifications.isRead, false)))
      .returning({ id: notifications.id });

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.length,
    });
  } catch (error) {
    console.error('[Notifications API] Failed to mark all as read:', error);
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
