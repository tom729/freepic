export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, tags, imageTags } from '@/lib/schema';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Add tags to image (authenticated, body: { tagIds: string[] })
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify user authentication
    const { userId, isAuthenticated } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: tagIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify image exists and user owns it
    const imageResult = await db
      .select({ id: images.id, userId: images.userId })
      .from(images)
      .where(eq(images.id, id))
      .limit(1);

    if (imageResult.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const image = imageResult[0];

    // Check ownership (allow admins to tag any image)
    const userResult = await db
      .select({ isAdmin: sql<boolean>`is_admin` })
      .from(sql`users`)
      .where(eq(sql`id`, userId))
      .limit(1);

    const isAdmin = userResult[0]?.isAdmin || false;

    if (image.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - not the image owner' }, { status: 403 });
    }

    // Verify all tags exist
    const existingTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(sql`${tags.id} IN (${tagIds.map((id: string) => `'${id}'`).join(',')})`);

    const existingTagIds = new Set(existingTags.map((t) => t.id));
    const invalidTagIds = tagIds.filter((tagId: string) => !existingTagIds.has(tagId));

    if (invalidTagIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid tag IDs: ${invalidTagIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Get existing image-tag relationships to avoid duplicates
    const existingRelations = await db
      .select({ tagId: imageTags.tagId })
      .from(imageTags)
      .where(eq(imageTags.imageId, id));

    const existingRelationTagIds = new Set(existingRelations.map((r) => r.tagId));

    // Filter out already existing relationships
    const newTagIds = tagIds.filter((tagId: string) => !existingRelationTagIds.has(tagId));

    // Insert new image-tag relationships
    if (newTagIds.length > 0) {
      const now = new Date();
      await db.insert(imageTags).values(
        newTagIds.map((tagId: string) => ({
          id: uuidv4(),
          imageId: id,
          tagId,
          createdAt: now,
        }))
      );

      // Update tag image counts
      for (const tagId of newTagIds) {
        await db
          .update(tags)
          .set({
            imageCount: sql`image_count + 1`,
          })
          .where(eq(tags.id, tagId));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${newTagIds.length} tags to image`,
      addedTagIds: newTagIds,
      skippedTagIds: tagIds.filter((tagId: string) => existingRelationTagIds.has(tagId)),
    });
  } catch (error) {
    console.error('Failed to add tags to image:', error);
    return NextResponse.json({ error: 'Failed to add tags to image' }, { status: 500 });
  }
}

// Remove tags from image (authenticated, body: { tagIds: string[] })
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify user authentication
    const { userId, isAuthenticated } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { tagIds } = body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: tagIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify image exists and user owns it
    const imageResult = await db
      .select({ id: images.id, userId: images.userId })
      .from(images)
      .where(eq(images.id, id))
      .limit(1);

    if (imageResult.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const image = imageResult[0];

    // Check ownership (allow admins to untag any image)
    const userResult = await db
      .select({ isAdmin: sql<boolean>`is_admin` })
      .from(sql`users`)
      .where(eq(sql`id`, userId))
      .limit(1);

    const isAdmin = userResult[0]?.isAdmin || false;

    if (image.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - not the image owner' }, { status: 403 });
    }

    // Delete image-tag relationships
    const deletedResult = await db
      .delete(imageTags)
      .where(
        and(
          eq(imageTags.imageId, id),
          sql`${imageTags.tagId} IN (${tagIds.map((id: string) => `'${id}'`).join(',')})`
        )
      )
      .returning({ tagId: imageTags.tagId });

    const deletedTagIds = deletedResult.map((r) => r.tagId);

    // Update tag image counts
    for (const tagId of deletedTagIds) {
      await db
        .update(tags)
        .set({
          imageCount: sql`GREATEST(image_count - 1, 0)`,
        })
        .where(eq(tags.id, tagId));
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${deletedTagIds.length} tags from image`,
      removedTagIds: deletedTagIds,
      notFoundTagIds: tagIds.filter((tagId: string) => !deletedTagIds.includes(tagId)),
    });
  } catch (error) {
    console.error('Failed to remove tags from image:', error);
    return NextResponse.json({ error: 'Failed to remove tags from image' }, { status: 500 });
  }
}
