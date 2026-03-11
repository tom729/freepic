export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, users, images } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// Verify admin permission
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

// GET /api/admin/comments - Moderation queue (pending comments)
export async function GET(request: NextRequest) {
  try {
    // Verify admin permission
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate status parameter
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get total count
    const countResult = await db
      .select({ count: comments.id })
      .from(comments)
      .where(eq(comments.status, status as 'pending' | 'approved' | 'rejected'));
    const total = countResult.length;

    // Get comments list with user and image info
    const commentsList = await db
      .select({
        id: comments.id,
        content: comments.content,
        status: comments.status,
        likes: comments.likes,
        isEdited: comments.isEdited,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        parentId: comments.parentId,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
        image: {
          id: images.id,
          cosKey: images.cosKey,
          width: images.width,
          height: images.height,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(images, eq(comments.imageId, images.id))
      .where(eq(comments.status, status as 'pending' | 'approved' | 'rejected'))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      comments: commentsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch moderation queue:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
