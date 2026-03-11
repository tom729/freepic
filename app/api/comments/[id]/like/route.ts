export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, commentLikes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import crypto from 'crypto';

// POST /api/comments/[id]/like - Like/unlike comment (toggle)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: commentId } = params;

    // Verify authentication
    const { userId, isAuthenticated } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if comment exists
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user already liked this comment
    const existingLike = await db.query.commentLikes.findFirst({
      where: and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
    });

    if (existingLike) {
      // Unlike: Remove the like
      await db
        .delete(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

      // Decrement likes count
      await db
        .update(comments)
        .set({
          likes: Math.max(0, comment.likes - 1),
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        success: true,
        liked: false,
        likes: Math.max(0, comment.likes - 1),
        message: 'Comment unliked',
      });
    } else {
      // Like: Add new like
      const likeId = crypto.randomUUID();
      await db.insert(commentLikes).values({
        id: likeId,
        commentId,
        userId,
      });

      // Increment likes count
      await db
        .update(comments)
        .set({
          likes: comment.likes + 1,
        })
        .where(eq(comments.id, commentId));

      return NextResponse.json({
        success: true,
        liked: true,
        likes: comment.likes + 1,
        message: 'Comment liked',
      });
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json({ error: 'Failed to process like' }, { status: 500 });
  }
}
