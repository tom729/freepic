export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collections, collectionImages } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// DELETE /api/collections/[id]/images/[imageId] - Remove image from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id: collectionId, imageId } = params;
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

    // Check if image is in collection
    const existing = await db.query.collectionImages.findFirst({
      where: and(
        eq(collectionImages.collectionId, collectionId),
        eq(collectionImages.imageId, imageId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Image is not in this collection' }, { status: 404 });
    }

    // Remove image from collection
    await db
      .delete(collectionImages)
      .where(
        and(eq(collectionImages.collectionId, collectionId), eq(collectionImages.imageId, imageId))
      );

    // Decrement image count
    await db
      .update(collections)
      .set({
        imageCount: sql`GREATEST(${collections.imageCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collectionId));

    return NextResponse.json({
      success: true,
      message: 'Image removed from collection',
    });
  } catch (error) {
    console.error('Failed to remove image from collection:', error);
    return NextResponse.json({ error: 'Failed to remove image from collection' }, { status: 500 });
  }
}
