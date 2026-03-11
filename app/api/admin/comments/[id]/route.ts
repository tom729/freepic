export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
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

// PATCH /api/admin/comments/[id] - Approve/reject comment
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin permission
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Validate parameters
    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Update status
    await db
      .update(comments)
      .set({
        status: status as 'approved' | 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id));

    return NextResponse.json({
      success: true,
      commentId: id,
      status,
      message: `Comment ${status} successfully`,
    });
  } catch (error) {
    console.error('Failed to moderate comment:', error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }
}

// DELETE /api/admin/comments/[id] - Admin delete comment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin permission
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check if comment exists
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Delete comment (cascade will handle related records)
    await db.delete(comments).where(eq(comments.id, id));

    return NextResponse.json({
      success: true,
      commentId: id,
      action: 'delete',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
