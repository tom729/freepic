'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewCounterProps {
  imageId: string;
  viewCount?: number;
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function ViewCounter({
  imageId,
  viewCount: initialCount,
  className,
  size = 'sm',
  showIcon = true,
}: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialCount || 0);
  const [hasTracked, setHasTracked] = useState(false);

  // Track view on mount (only once)
  useEffect(() => {
    if (hasTracked || initialCount !== undefined) return;

    const trackView = async () => {
      try {
        const response = await fetch(`/api/images/${imageId}/view`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setViewCount(data.views || 0);
        }
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    trackView();
    setHasTracked(true);
  }, [imageId, hasTracked, initialCount]);

  // Update view count if prop changes
  useEffect(() => {
    if (initialCount !== undefined) {
      setViewCount(initialCount);
    }
  }, [initialCount]);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-neutral-500',
        sizeClasses[size],
        className
      )}
      title={`${viewCount.toLocaleString()} 次浏览`}
    >
      {showIcon && <Eye className="h-3.5 w-3.5" />}
      <span>{formatCount(viewCount)}</span>
    </span>
  );
}

// Simple view count display without tracking
export function ViewCountDisplay({
  count,
  className,
  size = 'sm',
  showIcon = true,
}: {
  count: number;
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-neutral-500',
        sizeClasses[size],
        className
      )}
      title={`${count.toLocaleString()} 次浏览`}
    >
      {showIcon && <Eye className="h-3.5 w-3.5" />}
      <span>{formatCount(count)}</span>
    </span>
  );
}
