export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featuredCollections, images, users } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';
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

// GET /api/admin/featured-collections - Admin management list (all collections)
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query - admin sees all collections including inactive
    let query = db
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
        },
        curator: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(featuredCollections)
      .leftJoin(images, eq(featuredCollections.coverImageId, images.id))
      .leftJoin(users, eq(featuredCollections.curatorId, users.id));

    // Get total count
    const countResult = await db
      .select({ count: featuredCollections.id })
      .from(featuredCollections);
    const total = countResult.length;

    // Apply ordering and pagination
    const collections = await query
      .orderBy(asc(featuredCollections.displayOrder), desc(featuredCollections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin featured collections:', error);
    return NextResponse.json({ error: 'Failed to fetch featured collections' }, { status: 500 });
  }
}

// POST /api/admin/featured-collections - Create featured collection (admin only)
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { title, description, isActive, displayOrder, startDate, endDate, coverImageId } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the collection
    const newCollection = await db
      .insert(featuredCollections)
      .values({
        id: randomUUID(),
        title: title.trim(),
        description: description?.trim() || null,
        curatorId: adminCheck.user!.id,
        displayOrder: displayOrder ?? 0,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        coverImageId: coverImageId || null,
        imageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      collection: newCollection[0],
    });
  } catch (error) {
    console.error('Failed to create featured collection:', error);
    return NextResponse.json({ error: 'Failed to create featured collection' }, { status: 500 });
  }
}
