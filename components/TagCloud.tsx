'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TagBadge } from './TagBadge';
import { Loader2 } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  imageCount: number;
}

interface TagCloudProps {
  tags?: Tag[];
  maxTags?: number;
  className?: string;
  showAll?: boolean;
}

// Calculate font size based on image count
function getTagSize(count: number, maxCount: number): 'sm' | 'md' | 'lg' {
  if (maxCount === 0) return 'md';
  const ratio = count / maxCount;
  if (ratio > 0.7) return 'lg';
  if (ratio > 0.3) return 'md';
  return 'sm';
}

export function TagCloud({
  tags: initialTags,
  maxTags = 50,
  className,
  showAll = false,
}: TagCloudProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [isLoading, setIsLoading] = useState(!initialTags);
  const [error, setError] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(showAll);

  useEffect(() => {
    if (initialTags) {
      setTags(initialTags);
      return;
    }

    const fetchTags = async () => {
      try {
        const response = await fetch(`/api/tags?limit=${maxTags}`);
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        setTags(data.tags || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [initialTags, maxTags]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex flex-wrap gap-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"
              style={{ width: `${60 + Math.random() * 80}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-neutral-500">暂无标签</p>
      </div>
    );
  }

  const maxCount = Math.max(...tags.map((t) => t.imageCount));
  const displayedTags = showAllTags ? tags : tags.slice(0, 30);
  const hasMore = tags.length > 30 && !showAll;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {displayedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size={getTagSize(tag.imageCount, maxCount)}
            showCount={false}
          />
        ))}
      </div>

      {hasMore && !showAllTags && (
        <button
          onClick={() => setShowAllTags(true)}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          显示全部 {tags.length} 个标签 →
        </button>
      )}
    </div>
  );
}

// Compact version for sidebar/footer
export function TagCloudCompact({ tags: initialTags, className }: TagCloudProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [isLoading, setIsLoading] = useState(!initialTags);

  useEffect(() => {
    if (initialTags) {
      setTags(initialTags);
      return;
    }

    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags?limit=15');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        setTags(data.tags || []);
      } catch {
        // Silent fail for compact version
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [initialTags]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex flex-wrap gap-1.5">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-5 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 15).map((tag) => (
          <TagBadge key={tag.id} tag={tag} size="sm" />
        ))}
      </div>
      <Link
        href="/tags"
        className="inline-block mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
      >
        浏览全部标签 →
      </Link>
    </div>
  );
}
