'use client';

import { CommentItem } from './CommentItem';
import type { Comment } from './CommentSection';

interface CommentTreeProps {
  comments: Comment[];
  imageId: string;
  onCommentUpdated: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  onReplyAdded: (parentId: string, reply: Comment) => void;
  depth?: number;
}

export function CommentTree({
  comments,
  imageId,
  onCommentUpdated,
  onCommentDeleted,
  onReplyAdded,
  depth = 0,
}: CommentTreeProps) {
  return (
    <div
      className={
        depth > 0
          ? 'ml-4 sm:ml-8 border-l-2 border-neutral-200 dark:border-neutral-800 pl-4'
          : 'space-y-4'
      }
    >
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            imageId={imageId}
            depth={depth}
            onCommentUpdated={onCommentUpdated}
            onCommentDeleted={onCommentDeleted}
            onReplyAdded={onReplyAdded}
          />

          {/* Render replies recursively */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <CommentTree
                comments={comment.replies}
                imageId={imageId}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                onReplyAdded={onReplyAdded}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
