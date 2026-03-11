export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getOrCreateUserPreferences } from '@/lib/notifications';

// GET /api/users/me/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await getOrCreateUserPreferences(auth.userId);

    if (!prefs) {
      return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('[Preferences API] Failed to get preferences:', error);
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
  }
}

// PATCH /api/users/me/preferences - Update user notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailNotifications,
      notifyOnComment,
      notifyOnReply,
      notifyOnFollow,
      notifyOnImageStatus,
    } = body;

    // Build update object with only provided fields
    const updateData: Partial<typeof userPreferences.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof emailNotifications === 'boolean') {
      updateData.emailNotifications = emailNotifications;
    }
    if (typeof notifyOnComment === 'boolean') {
      updateData.notifyOnComment = notifyOnComment;
    }
    if (typeof notifyOnReply === 'boolean') {
      updateData.notifyOnReply = notifyOnReply;
    }
    if (typeof notifyOnFollow === 'boolean') {
      updateData.notifyOnFollow = notifyOnFollow;
    }
    if (typeof notifyOnImageStatus === 'boolean') {
      updateData.notifyOnImageStatus = notifyOnImageStatus;
    }

    // Check if preferences exist
    const existingPrefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, auth.userId),
    });

    if (!existingPrefs) {
      // Create with defaults and updates
      await getOrCreateUserPreferences(auth.userId);
      await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, auth.userId));
    } else {
      // Update existing
      await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, auth.userId));
    }

    // Get updated preferences
    const updatedPrefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, auth.userId),
    });

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs,
    });
  } catch (error) {
    console.error('[Preferences API] Failed to update preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
