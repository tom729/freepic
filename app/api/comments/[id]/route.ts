export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, commentLikes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// PATCH /api/comments/[id] - Edit own comment
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify authentication
    const { userId, isAuthenticated, user } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Fetch the comment
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check ownership or admin status
    const isOwner = comment.userId === userId;
    const isAdmin = user?.isAdmin || false;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - you can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update comment
    await db
      .update(comments)
      .set({
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id));

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    console.error('Failed to update comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE /api/comments/[id] - Delete own comment or admin delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify authentication
    const { userId, isAuthenticated, user } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the comment
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check ownership or admin status
    const isOwner = comment.userId === userId;
    const isAdmin = user?.isAdmin || false;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - you can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment likes first (cascade should handle this, but let's be explicit)
    await db.delete(commentLikes).where(eq(commentLikes.commentId, id));

    // Delete the comment
    await db.delete(comments).where(eq(comments.id, id));

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
