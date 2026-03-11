export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, users, commentLikes, images } from '@/lib/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { createNotification } from '@/lib/notifications';
import crypto from 'crypto';

interface CommentWithUser {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  parentId: string | null;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  replies?: CommentWithUser[];
  userLiked?: boolean;
}

// Helper function to build comment tree
function buildCommentTree(
  comments: CommentWithUser[],
  parentId: string | null = null
): CommentWithUser[] {
  const result: CommentWithUser[] = [];

  for (const comment of comments) {
    if (comment.parentId === parentId) {
      const replies = buildCommentTree(comments, comment.id);
      if (replies.length > 0) {
        comment.replies = replies;
      }
      result.push(comment);
    }
  }

  return result;
}

// GET /api/images/[id]/comments - Get approved comments (tree structure)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify user to check if admin
    const authResult = await verifyAuthWithUser(request);
    const isAdmin = authResult.user?.isAdmin || false;
    const userId = authResult.userId;

    // Build where condition based on user role
    let whereCondition: any;
    if (isAdmin) {
      // Admin can see all comments
      whereCondition = eq(comments.imageId, id);
    } else {
      // Non-admin users only see approved comments
      whereCondition = and(eq(comments.imageId, id), eq(comments.status, 'approved'));
    }

    // Fetch comments with user info
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
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(comments.createdAt));

    // If user is authenticated, check which comments they liked
    let userLikedCommentIds: Set<string> = new Set();
    if (userId) {
      const userLikes = await db
        .select({ commentId: commentLikes.commentId })
        .from(commentLikes)
        .where(eq(commentLikes.userId, userId));
      userLikedCommentIds = new Set(userLikes.map((like) => like.commentId));
    }

    // Mark user liked status
    const commentsWithLikedStatus = commentsList.map((comment) => ({
      ...comment,
      userLiked: userLikedCommentIds.has(comment.id),
    }));

    // Build tree structure
    const commentTree = buildCommentTree(commentsWithLikedStatus);

    return NextResponse.json({
      comments: commentTree,
      pagination: {
        page,
        limit,
        total: commentsList.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/images/[id]/comments - Post new comment (authenticated)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: imageId } = params;

    // Verify authentication
    const { userId, isAuthenticated } = await verifyAuthWithUser(request);
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, parentId } = body;

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

    // Validate parentId if provided (for replies)
    if (parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      if (parentComment.imageId !== imageId) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this image' },
          { status: 400 }
        );
      }
    }

    // Generate UUID
    const commentId = crypto.randomUUID();

    // Insert comment (defaults to pending status)
    await db.insert(comments).values({
      id: commentId,
      imageId,
      userId,
      parentId: parentId || null,
      content: content.trim(),
      status: 'pending',
      likes: 0,
      isEdited: false,
    });

    // Send notifications (non-blocking)
    try {
      // Get image owner info
      const image = await db.query.images.findFirst({
        where: eq(images.id, imageId),
        columns: { userId: true },
        with: {
          user: {
            columns: { name: true },
          },
        },
      });

      const commenterName = newComment[0]?.user?.name || 'Someone';

      // 1. Notify image owner of new comment (if not the commenter)
      if (image && image.userId !== userId) {
        await createNotification({
          userId: image.userId,
          type: 'new_comment',
          title: 'New comment on your image',
          content: `${commenterName} commented on your image`,
          relatedId: imageId,
          relatedType: 'image',
          actionUrl: `/image/${imageId}`,
        });
      }

      // 2. Notify parent comment author of reply (if it's a reply)
      if (parentId) {
        const parentComment = await db.query.comments.findFirst({
          where: eq(comments.id, parentId),
          columns: { userId: true },
        });

        if (parentComment && parentComment.userId !== userId) {
          await createNotification({
            userId: parentComment.userId,
            type: 'comment_reply',
            title: 'Someone replied to your comment',
            content: `${commenterName} replied to your comment`,
            relatedId: commentId,
            relatedType: 'comment',
            actionUrl: `/image/${imageId}`,
          });
        }
      }
    } catch (notifyError) {
      // Don't fail the request if notification creation fails
      console.error('[Comments API] Failed to create notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      comment: newComment[0],
      message: 'Comment posted successfully and is pending approval',
    });

    return NextResponse.json({
      success: true,
      comment: newComment[0],
      message: 'Comment posted successfully and is pending approval',
    });
  } catch (error) {
    console.error('Failed to post comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
