export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featuredCollections, featuredCollectionImages } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const { isAuthenticated, user } = await verifyAuthWithUser(request);

  if (!isAuthenticated) {
    return { isAdmin: false, error: '请先登录', status: 401 };
  }

  if (!user?.isAdmin) {
    return { isAdmin: false, error: '无管理员权限', status: 403 };
  }

  return { isAdmin: true, user };
}

// DELETE /api/admin/featured-collections/[id]/images/[imageId] - Remove image from collection (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id, imageId } = params;

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Check if collection exists
    const collection = await db.query.featuredCollections.findFirst({
      where: eq(featuredCollections.id, id),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if the image exists in the collection
    const existingEntry = await db.query.featuredCollectionImages.findFirst({
      where: and(
        eq(featuredCollectionImages.featuredCollectionId, id),
        eq(featuredCollectionImages.imageId, imageId)
      ),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Image is not in this collection' }, { status: 404 });
    }

    // Remove image from collection
    await db
      .delete(featuredCollectionImages)
      .where(
        and(
          eq(featuredCollectionImages.featuredCollectionId, id),
          eq(featuredCollectionImages.imageId, imageId)
        )
      );

    // Update the image count in the collection
    const countResult = await db
      .select({ count: count() })
      .from(featuredCollectionImages)
      .where(eq(featuredCollectionImages.featuredCollectionId, id));

    await db
      .update(featuredCollections)
      .set({
        imageCount: countResult[0]?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(featuredCollections.id, id));

    return NextResponse.json({
      success: true,
      message: 'Image removed from collection successfully',
      removed: {
        collectionId: id,
        imageId: imageId,
      },
    });
  } catch (error) {
    console.error('Failed to remove image from featured collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove image from featured collection' },
      { status: 500 }
    );
  }
}
