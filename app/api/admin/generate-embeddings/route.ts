import { initializeServer, getBackgroundTaskStatus } from '@/lib/init';

import { NextRequest, NextResponse } from 'next/server';
import { generateMissingEmbeddings } from '@/lib/embedding-batch';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Helper to check admin (supports both Bearer token and NextAuth session)
async function verifyAdmin(request: NextRequest) {
  // Try Bearer token first
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  if (isAuthenticated && user?.isAdmin) {
    return true;
  }

  // Try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user.email!),
    });
    if (dbUser?.isAdmin) {
      return true;
    }
  }

  return false;
}

/**
 * Admin endpoint to generate embeddings for all images without them
 * This is useful when:
 * 1. First time setting up semantic search
 * 2. After database migrations
 * 3. When embeddings are missing/corrupted
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize server background tasks (safe to call multiple times)
    initializeServer();

    // Verify admin authentication
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    console.log('[Generate Embeddings] Starting batch process...');

    const result = await generateMissingEmbeddings();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      errors: result.errors,
      message: `Processed ${result.processed} images, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('[Generate Embeddings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check embedding status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Initialize server background tasks (safe to call multiple times)
    initializeServer();

    const { db } = await import('@/lib/db');
    const { imageEmbeddings, images } = await import('@/lib/schema');
    const { count, eq, and, sql } = await import('drizzle-orm');

    // Count approved images
    const approvedImages = await db
      .select({ count: count() })
      .from(images)
      .where(eq(images.status, 'approved'));

    // Count total images
    const totalImages = await db.select({ count: count() }).from(images);

    // Count embeddings
    const totalEmbeddings = await db.select({ count: count() }).from(imageEmbeddings);

    // Count approved images without embeddings
    const approvedWithoutEmbeddings = await db
      .select({ count: count() })
      .from(images)
      .leftJoin(imageEmbeddings, eq(images.id, imageEmbeddings.imageId))
      .where(and(
        eq(images.status, 'approved'),
        sql`${imageEmbeddings.id} IS NULL`
      ));

    // Get background task status
    const backgroundStatus = getBackgroundTaskStatus();

    return NextResponse.json({
      totalImages: totalImages[0]?.count || 0,
      approvedImages: approvedImages[0]?.count || 0,
      pendingImages: (totalImages[0]?.count || 0) - (approvedImages[0]?.count || 0),
      totalEmbeddings: totalEmbeddings[0]?.count || 0,
      pendingEmbeddings: approvedWithoutEmbeddings[0]?.count || 0,
      backgroundTasks: {
        isInitialized: backgroundStatus.isInitialized,
        embeddingQueue: backgroundStatus.embeddingQueue,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status', details: String(error) },
      { status: 500 }
    );
  }
}
