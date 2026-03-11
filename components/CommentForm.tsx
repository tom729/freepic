'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from './CommentSection';

interface CommentFormProps {
  imageId: string;
  parentId?: string | null;
  placeholder?: string;
  onSuccess: (comment: Comment) => void;
  onCancel?: () => void;
  initialContent?: string;
  isEdit?: boolean;
  commentId?: string;
  className?: string;
}

export function CommentForm({
  imageId,
  parentId,
  placeholder = '写下你的评论...',
  onSuccess,
  onCancel,
  initialContent = '',
  isEdit = false,
  commentId,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('请输入评论内容');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;

      if (isEdit && commentId) {
        // Update existing comment
        response = await fetch(`/api/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });
      } else {
        // Create new comment
        response = await fetch(`/api/images/${imageId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content.trim(),
            parentId: parentId || undefined,
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || (isEdit ? '更新失败' : '发布失败'));
      }

      const comment = await response.json();

      // Reset form
      setContent('');

      // Call success callback
      onSuccess(comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        rows={3}
        disabled={isLoading}
        className={cn('resize-none', error && 'border-red-500 focus-visible:ring-red-500')}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{content.length}/500</span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
              取消
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isLoading || !content.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                {isEdit ? '更新中...' : '发布中...'}
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                {isEdit ? '更新' : '发布'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
