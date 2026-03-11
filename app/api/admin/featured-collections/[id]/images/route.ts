export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featuredCollections, featuredCollectionImages, images } from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { randomUUID } from 'crypto';

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

// POST /api/admin/featured-collections/[id]/images - Add image to featured collection (admin)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { imageId } = body;

    if (!imageId || typeof imageId !== 'string') {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Check if collection exists
    const collection = await db.query.featuredCollections.findFirst({
      where: eq(featuredCollections.id, id),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if image exists
    const image = await db.query.images.findFirst({
      where: eq(images.id, imageId),
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if image is already in the collection
    const existingEntry = await db.query.featuredCollectionImages.findFirst({
      where: and(
        eq(featuredCollectionImages.featuredCollectionId, id),
        eq(featuredCollectionImages.imageId, imageId)
      ),
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'Image is already in this collection' }, { status: 409 });
    }

    // Get the current max order for this collection
    const orderResult = await db
      .select({ maxOrder: featuredCollectionImages.order })
      .from(featuredCollectionImages)
      .where(eq(featuredCollectionImages.featuredCollectionId, id))
      .orderBy((t) => t.maxOrder)
      .limit(1);

    const nextOrder = orderResult.length > 0 ? (orderResult[0]?.maxOrder ?? 0) + 1 : 0;

    // Add image to collection
    const newEntry = await db
      .insert(featuredCollectionImages)
      .values({
        id: randomUUID(),
        featuredCollectionId: id,
        imageId: imageId,
        order: nextOrder,
        addedAt: new Date(),
      })
      .returning();

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
      entry: newEntry[0],
    });
  } catch (error) {
    console.error('Failed to add image to featured collection:', error);
    return NextResponse.json(
      { error: 'Failed to add image to featured collection' },
      { status: 500 }
    );
  }
}
