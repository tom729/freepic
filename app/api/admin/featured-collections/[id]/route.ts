export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featuredCollections, featuredCollectionImages, images, users } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';
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

// GET /api/admin/featured-collections/[id] - Get collection details with images (admin)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    // Get collection details
    const collectionResult = await db
      .select({
        id: featuredCollections.id,
        title: featuredCollections.title,
        description: featuredCollections.description,
        displayOrder: featuredCollections.displayOrder,
        isActive: featuredCollections.isActive,
        startDate: featuredCollections.startDate,
        endDate: featuredCollections.endDate,
        imageCount: featuredCollections.imageCount,
        createdAt: featuredCollections.createdAt,
        updatedAt: featuredCollections.updatedAt,
        coverImage: {
          id: images.id,
          cosKey: images.cosKey,
          width: images.width,
          height: images.height,
          blurHash: images.blurHash,
        },
        curator: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(featuredCollections)
      .leftJoin(images, eq(featuredCollections.coverImageId, images.id))
      .leftJoin(users, eq(featuredCollections.curatorId, users.id))
      .where(eq(featuredCollections.id, id))
      .limit(1);

    if (collectionResult.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const collection = collectionResult[0];

    // Get collection images
    const collectionImages = await db
      .select({
        id: featuredCollectionImages.id,
        order: featuredCollectionImages.order,
        addedAt: featuredCollectionImages.addedAt,
        image: {
          id: images.id,
          cosKey: images.cosKey,
          width: images.width,
          height: images.height,
          blurHash: images.blurHash,
          description: images.description,
          userId: images.userId,
        },
      })
      .from(featuredCollectionImages)
      .leftJoin(images, eq(featuredCollectionImages.imageId, images.id))
      .where(eq(featuredCollectionImages.featuredCollectionId, id))
      .orderBy(asc(featuredCollectionImages.order), desc(featuredCollectionImages.addedAt));

    return NextResponse.json({
      collection: {
        ...collection,
        images: collectionImages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch featured collection:', error);
    return NextResponse.json({ error: 'Failed to fetch featured collection' }, { status: 500 });
  }
}

// PATCH /api/admin/featured-collections/[id] - Update collection (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    // Check if collection exists
    const existingCollection = await db.query.featuredCollections.findFirst({
      where: eq(featuredCollections.id, id),
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, isActive, displayOrder, coverImageId, startDate, endDate } = body;

    // Build update object with only provided fields
    const updateData: Partial<typeof featuredCollections.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (displayOrder !== undefined) {
      updateData.displayOrder = displayOrder;
    }

    if (coverImageId !== undefined) {
      updateData.coverImageId = coverImageId || null;
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    // Update the collection
    const updatedCollection = await db
      .update(featuredCollections)
      .set(updateData)
      .where(eq(featuredCollections.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      collection: updatedCollection[0],
    });
  } catch (error) {
    console.error('Failed to update featured collection:', error);
    return NextResponse.json({ error: 'Failed to update featured collection' }, { status: 500 });
  }
}

// DELETE /api/admin/featured-collections/[id] - Delete collection (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    // Check if collection exists
    const existingCollection = await db.query.featuredCollections.findFirst({
      where: eq(featuredCollections.id, id),
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Delete all images in the collection first (cascade should handle this, but explicit is safer)
    await db
      .delete(featuredCollectionImages)
      .where(eq(featuredCollectionImages.featuredCollectionId, id));

    // Delete the collection
    await db.delete(featuredCollections).where(eq(featuredCollections.id, id));

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    console.error('Failed to delete featured collection:', error);
    return NextResponse.json({ error: 'Failed to delete featured collection' }, { status: 500 });
  }
}
