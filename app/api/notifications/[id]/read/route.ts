export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Verify notification belongs to user
    const notification = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, id), eq(notifications.userId, auth.userId)),
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Mark as read
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('[Notifications API] Failed to mark as read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
