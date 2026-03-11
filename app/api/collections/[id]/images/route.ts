export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collections, images, collectionImages } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { randomUUID } from 'crypto';
import { createNotification } from '@/lib/notifications';
import { users } from '@/lib/schema';

// POST /api/collections/[id]/images - Add image to collection
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: collectionId } = params;
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, collectionId),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check ownership
    if (collection.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden - not the collection owner' }, { status: 403 });
    }

    const body = await request.json();
    const { imageId } = body;

    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Verify image exists
    const image = await db.query.images.findFirst({
      where: eq(images.id, imageId),
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if image is already in collection
    const existing = await db.query.collectionImages.findFirst({
      where: and(
        eq(collectionImages.collectionId, collectionId),
        eq(collectionImages.imageId, imageId)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: 'Image is already in this collection' }, { status: 409 });
    }

    // Get current max order
    const orderResult = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${collectionImages.order}), 0)` })
      .from(collectionImages)
      .where(eq(collectionImages.collectionId, collectionId));

    const newOrder = (orderResult[0]?.maxOrder || 0) + 1;

    // Add image to collection
    await db.insert(collectionImages).values({
      id: randomUUID(),
      collectionId,
      imageId,
      order: newOrder,
      addedAt: new Date(),
    });

    // Increment image count
    await db
      .update(collections)
      .set({
        imageCount: sql`${collections.imageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collectionId));

    // Notify image owner (non-blocking)
    try {
      // Don't notify if adding own image to own collection
      if (image.userId !== auth.userId) {
        // Get collection owner name
        const collectionOwner = await db.query.users.findFirst({
          where: eq(users.id, auth.userId),
          columns: { name: true },
        });

        const collectionOwnerName = collectionOwner?.name || 'Someone';

        await createNotification({
          userId: image.userId,
          type: 'collection_add',
          title: 'Your image was added to a collection',
          content: `${collectionOwnerName} added your image to their collection "${collection.name}"`,
          relatedId: imageId,
          relatedType: 'image',
          actionUrl: `/image/${imageId}`,
        });
      }
    } catch (notifyError) {
      // Don't fail the request if notification creation fails
      console.error('[Collection API] Failed to create notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Image added to collection',
      image: {
        id: image.id,
        collectionId,
        addedAt: new Date().toISOString(),
        order: newOrder,
      },
    });
  } catch (error) {
    console.error('Failed to add image to collection:', error);
    return NextResponse.json({ error: 'Failed to add image to collection' }, { status: 500 });
  }
}
