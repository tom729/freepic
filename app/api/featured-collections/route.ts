export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featuredCollections, images, users } from '@/lib/schema';
import { eq, and, gte, lte, desc, asc, isNull, or } from 'drizzle-orm';

// GET /api/featured-collections - List active featured collections (public)
export async function GET() {
  try {
    const now = new Date();

    // Build where conditions for active collections
    const conditions = [
      eq(featuredCollections.isActive, true),
      // Either no start date OR start date is in the past
      or(isNull(featuredCollections.startDate), lte(featuredCollections.startDate, now)),
      // Either no end date OR end date is in the future
      or(isNull(featuredCollections.endDate), gte(featuredCollections.endDate, now)),
    ];

    // Get active collections sorted by displayOrder
    const collections = await db
      .select({
        id: featuredCollections.id,
        title: featuredCollections.title,
        description: featuredCollections.description,
        displayOrder: featuredCollections.displayOrder,
        imageCount: featuredCollections.imageCount,
        createdAt: featuredCollections.createdAt,
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
        },
      })
      .from(featuredCollections)
      .leftJoin(images, eq(featuredCollections.coverImageId, images.id))
      .leftJoin(users, eq(featuredCollections.curatorId, users.id))
      .where(and(...conditions))
      .orderBy(asc(featuredCollections.displayOrder), desc(featuredCollections.createdAt));

    return NextResponse.json({
      collections,
      total: collections.length,
    });
  } catch (error) {
    console.error('Failed to fetch featured collections:', error);
    return NextResponse.json({ error: 'Failed to fetch featured collections' }, { status: 500 });
  }
}
