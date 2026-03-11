'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CommentForm } from './CommentForm';
import { Heart, MessageCircle, Edit2, Trash2, MoreHorizontal, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Comment } from './CommentSection';

interface CommentItemProps {
  comment: Comment;
  imageId: string;
  depth: number;
  onCommentUpdated: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  onReplyAdded: (parentId: string, reply: Comment) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return date.toLocaleDateString('zh-CN');
  }
  if (days > 0) {
    return `${days}天前`;
  }
  if (hours > 0) {
    return `${hours}小时前`;
  }
  if (minutes > 0) {
    return `${minutes}分钟前`;
  }
  return '刚刚';
}

export function CommentItem({
  comment,
  imageId,
  depth,
  onCommentUpdated,
  onCommentDeleted,
  onReplyAdded,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock current user - in real app, get from auth context
  const currentUserId = 'current-user';
  const isOwner = comment.userId === currentUserId;

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLocalLikes((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });

      if (!response.ok) {
        // Revert on error
        setIsLiked(!newLiked);
        setLocalLikes((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    } catch {
      // Revert on error
      setIsLiked(!newLiked);
      setLocalLikes((prev) => (newLiked ? prev - 1 : prev + 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm('确定要删除这条评论吗？');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = (updatedComment: Comment) => {
    setIsEditing(false);
    onCommentUpdated(updatedComment);
  };

  const handleReplySuccess = (reply: Comment) => {
    setIsReplying(false);
    onReplyAdded(comment.id, reply);
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-medium">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              comment.user.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-xs text-neutral-400">{formatTimeAgo(comment.createdAt)}</span>
            {comment.isEdited && <span className="text-xs text-neutral-400">(已编辑)</span>}
          </div>

          {isEditing ? (
            <CommentForm
              imageId={imageId}
              commentId={comment.id}
              initialContent={comment.content}
              isEdit
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
              placeholder="编辑你的评论..."
            />
          ) : (
            <>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    'h-7 px-2 text-xs gap-1',
                    isLiked && 'text-red-500 hover:text-red-600'
                  )}
                >
                  <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
                  <span>{localLikes || '赞'}</span>
                </Button>

                {depth < 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>回复</span>
                  </Button>
                )}

                {/* More actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner ? (
                      <>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem>
                        <Flag className="mr-2 h-4 w-4" />
                        举报
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Reply Form */}
          {isReplying && !isEditing && (
            <div className="mt-3">
              <CommentForm
                imageId={imageId}
                parentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setIsReplying(false)}
                placeholder={`回复 ${comment.user.name}...`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
