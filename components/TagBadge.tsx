'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  imageCount?: number;
}

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function TagBadge({
  tag,
  size = 'md',
  showCount = false,
  className,
  onClick,
}: TagBadgeProps) {
  // Parse color - expect hex format like #FF5733
  const tagColor = tag.color || '#6366f1'; // Default to indigo-500

  // Create lighter background color (20% opacity)
  const bgColor = `${tagColor}33`; // 33 is ~20% opacity in hex

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
        'hover:opacity-80 active:scale-95',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: tagColor,
      }}
      onClick={onClick}
    >
      <span className="truncate max-w-[150px]">{tag.name}</span>
      {showCount && tag.imageCount !== undefined && (
        <span className="opacity-60 text-[0.85em]">{tag.imageCount.toLocaleString()}</span>
      )}
    </span>
  );

  if (onClick) {
    return badgeContent;
  }

  return (
    <Link href={`/tags/${tag.slug}`} className="inline-block">
      {badgeContent}
    </Link>
  );
}

// Skeleton loader for TagBadge
export function TagBadgeSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse',
        sizeClasses[size]
      )}
    >
      <span className="invisible">加载中...</span>
    </span>
  );
}
