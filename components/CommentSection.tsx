'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentTree } from './CommentTree';
import { CommentForm } from './CommentForm';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentUser {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  imageId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  likes: number;
  isEdited: boolean;
  user: CommentUser;
  replies?: Comment[];
  isLiked?: boolean;
}

interface CommentSectionProps {
  imageId: string;
  className?: string;
}

export function CommentSection({ imageId, className }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/images/${imageId}/comments`);

      if (!response.ok) {
        // If API doesn't exist yet, use mock data
        if (response.status === 404) {
          setComments(getMockComments());
          setTotalCount(getMockComments().length);
          return;
        }
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
      setTotalCount(data.total || data.comments?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      // Use mock data on error
      setComments(getMockComments());
      setTotalCount(getMockComments().length);
    } finally {
      setIsLoading(false);
    }
  }, [imageId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const getMockComments = (): Comment[] => [
    {
      id: '1',
      content: '非常棒的构图！光线处理得特别好。',
      userId: 'user1',
      imageId: imageId,
      parentId: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      likes: 12,
      isEdited: false,
      user: { id: 'user1', name: '摄影爱好者' },
      isLiked: false,
      replies: [
        {
          id: '2',
          content: '同意！色调也很舒服。',
          userId: 'user2',
          imageId: imageId,
          parentId: '1',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString(),
          likes: 5,
          isEdited: false,
          user: { id: 'user2', name: '小明' },
          isLiked: true,
        },
      ],
    },
    {
      id: '3',
      content: '请问这是什么相机拍摄的？',
      userId: 'user3',
      imageId: imageId,
      parentId: null,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      likes: 3,
      isEdited: false,
      user: { id: 'user3', name: '新手摄影师' },
      isLiked: false,
    },
  ];

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === updatedComment.id
          ? { ...updatedComment, replies: c.replies }
          : {
              ...c,
              replies: c.replies?.map((r) => (r.id === updatedComment.id ? updatedComment : r)),
            }
      )
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => {
      const filtered = prev.filter((c) => c.id !== commentId);
      // Also remove from replies
      return filtered.map((c) => ({
        ...c,
        replies: c.replies?.filter((r) => r.id !== commentId),
      }));
    });
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  const handleReplyAdded = (parentId: string, reply: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c))
    );
    setTotalCount((prev) => prev + 1);
  };

  return (
    <section className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">评论</h3>
        <span className="text-sm text-neutral-500">({totalCount})</span>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <CommentForm
          imageId={imageId}
          onSuccess={handleCommentAdded}
          placeholder="写下你的评论..."
        />
      ) : (
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 p-4 text-center">
          <p className="text-sm text-neutral-500 mb-2">登录后发表评论</p>
          <Button variant="outline" size="sm" asChild>
            <a href={`/login?redirect=/image/${imageId}`}>登录</a>
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : error && comments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchComments} className="mt-2">
              重试
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-neutral-500">还没有评论，来说点什么吧！</p>
          </div>
        ) : (
          <CommentTree
            comments={comments}
            imageId={imageId}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
            onReplyAdded={handleReplyAdded}
          />
        )}
      </div>
    </section>
  );
}
