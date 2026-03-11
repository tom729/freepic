export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, imageViews, imageViewAggregates } from '@/lib/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthWithUser } from '@/lib/server-auth';
import crypto from 'crypto';

// Hash IP address for privacy protection
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
}

// Generate session ID from IP + User Agent (for anonymous tracking)
function generateSessionId(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}:${process.env.JWT_SECRET || 'secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Check if user has already viewed this image in the last 24 hours
async function hasRecentView(
  imageId: string,
  userId?: string,
  sessionId?: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (userId) {
    // Check by userId for logged-in users
    const existing = await db
      .select({ id: imageViews.id })
      .from(imageViews)
      .where(
        and(
          eq(imageViews.imageId, imageId),
          eq(imageViews.userId, userId),
          gte(imageViews.viewedAt, twentyFourHoursAgo)
        )
      )
      .limit(1);

    return existing.length > 0;
  }

  if (sessionId) {
    // Check by sessionId for anonymous users
    const existing = await db
      .select({ id: imageViews.id })
      .from(imageViews)
      .where(
        and(
          eq(imageViews.imageId, imageId),
          eq(imageViews.sessionId, sessionId),
          gte(imageViews.viewedAt, twentyFourHoursAgo)
        )
      )
      .limit(1);

    return existing.length > 0;
  }

  return false;
}

// Record a view for the image
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get client info for privacy-conscious tracking
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const dnt = request.headers.get('dnt'); // Do Not Track header

    // Respect Do Not Track header
    if (dnt === '1') {
      return NextResponse.json({ success: true, tracked: false, reason: 'DNT' });
    }

    // Check if image exists and is approved
    const image = await db
      .select({
        id: images.id,
        status: images.status,
      })
      .from(images)
      .where(eq(images.id, id))
      .limit(1);

    if (image.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image[0].status !== 'approved') {
      return NextResponse.json({ error: 'Image not available' }, { status: 403 });
    }

    // Verify user authentication
    const { userId, user } = await verifyAuthWithUser(request);

    // Generate session ID for anonymous tracking
    const sessionId = generateSessionId(ip, userAgent);

    // Check for recent view (deduplication within 24 hours)
    const recentViewExists = await hasRecentView(id, userId || undefined, sessionId);
    if (recentViewExists) {
      return NextResponse.json({ success: true, tracked: false, reason: 'duplicate' });
    }

    // Hash IP for privacy
    const ipHash = hashIp(ip);

    // Insert view record
    const viewId = uuidv4();
    await db.insert(imageViews).values({
      id: viewId,
      imageId: id,
      userId: userId || null,
      sessionId: userId ? null : sessionId, // Only store sessionId for anonymous users
      ipHash,
      userAgent: userAgent.substring(0, 500), // Limit length
      referrer: referrer.substring(0, 1000), // Limit length
      viewedAt: new Date(),
    });

    // Update or create daily aggregate (simple version - can be optimized)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try to update existing aggregate
    const updateResult = await db
      .update(imageViewAggregates)
      .set({
        totalViews: sql`${imageViewAggregates.totalViews} + 1`,
        // Only increment uniqueViews if this is a new viewer (not logged in or different session)
        uniqueViews: sql`${imageViewAggregates.uniqueViews} + ${userId ? 0 : 1}`,
        updatedAt: new Date(),
      })
      .where(and(eq(imageViewAggregates.imageId, id), eq(imageViewAggregates.date, today)))
      .returning();

    // If no existing aggregate, create one
    if (updateResult.length === 0) {
      await db.insert(imageViewAggregates).values({
        id: uuidv4(),
        imageId: id,
        date: today,
        totalViews: 1,
        uniqueViews: userId ? 0 : 1,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      viewId,
    });
  } catch (error) {
    console.error('Failed to record view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
