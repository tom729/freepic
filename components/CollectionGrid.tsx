'use client';

import { useState, useEffect, useCallback } from 'react';
import { CollectionCard, CollectionCardSkeleton } from './CollectionCard';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionUser {
  id: string;
  name: string;
  avatar?: string | null;
}

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  imageCount: number;
  isPublic: boolean;
  createdAt: string;
  user: CollectionUser;
}

interface CollectionGridProps {
  apiUrl?: string;
  collections?: Collection[];
  userId?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function CollectionGrid({
  apiUrl = '/api/collections',
  collections: initialCollections,
  userId,
  showCreateButton = false,
  onCreateClick,
  columns = 3,
  className,
}: CollectionGridProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections || []);
  const [isLoading, setIsLoading] = useState(!initialCollections);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCollections = useCallback(
    async (pageNum: number) => {
      try {
        setIsLoading(true);
        const url = new URL(apiUrl, window.location.origin);
        url.searchParams.set('page', pageNum.toString());
        url.searchParams.set('limit', '12');
        if (userId) {
          url.searchParams.set('userId', userId);
        }

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch collections');

        const data = await response.json();
        const newCollections = data.collections || [];

        if (pageNum === 1) {
          setCollections(newCollections);
        } else {
          setCollections((prev) => [...prev, ...newCollections]);
        }

        setHasMore(newCollections.length === 12 && pageNum < (data.pagination?.totalPages || 1));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collections');
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, userId]
  );

  useEffect(() => {
    if (!initialCollections) {
      fetchCollections(1);
    }
  }, [fetchCollections, initialCollections]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCollections(nextPage);
    }
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => fetchCollections(1)}
            className="text-sm text-red-700 hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const showSkeletons = isLoading && collections.length === 0;

  return (
    <div className={className}>
      <div className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}>
        {/* Create Button */}
        {showCreateButton && (
          <button
            onClick={onCreateClick}
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors min-h-[200px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">创建合集</span>
            <span className="text-sm text-neutral-500">整理你喜欢的图片</span>
          </button>
        )}

        {/* Skeletons */}
        {showSkeletons &&
          [...Array(6)].map((_, i) => <CollectionCardSkeleton key={`skeleton-${i}`} />)}

        {/* Collections */}
        {!showSkeletons &&
          collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
      </div>

      {/* Empty State */}
      {!isLoading && collections.length === 0 && !showCreateButton && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">暂无合集</h3>
          <p className="text-neutral-500">还没有创建任何合集</p>
        </div>
      )}

      {/* Load More */}
      {collections.length > 0 && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
