export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// GET /api/users/me/notifications/unread-count - Get unread count for badge
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.userId, auth.userId), eq(notifications.isRead, false)));

    const count = Number(result[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[Notifications API] Failed to get unread count:', error);
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 });
  }
}
