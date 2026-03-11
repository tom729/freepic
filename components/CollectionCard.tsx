'use client';

import Link from 'next/link';
import { Layers, Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CollectionCardProps {
  collection: Collection;
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

export function CollectionCard({
  collection,
  variant = 'default',
  className,
}: CollectionCardProps) {
  const { name, description, coverImage, imageCount, isPublic, user } = collection;

  if (variant === 'hero') {
    return (
      <Link
        href={`/collections/${collection.id}`}
        className={cn(
          'group relative block overflow-hidden rounded-2xl',
          'aspect-[4/3] sm:aspect-[16/10]',
          className
        )}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {coverImage ? (
            <img
              src={coverImage}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          {/* Visibility Badge */}
          <div className="absolute top-4 right-4">
            {!isPublic && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
                <Lock className="h-3 w-3" />
                私密
              </span>
            )}
          </div>

          {/* Image Count */}
          <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
            <Layers className="h-4 w-4" />
            <span>{imageCount.toLocaleString()} 张图片</span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 line-clamp-1">{name}</h3>

          {/* Description */}
          {description && <p className="text-sm text-white/70 line-clamp-2 mb-3">{description}</p>}

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white text-xs font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white/80 truncate">{user.name}</span>
          </div>
        </div>

        {/* Hover Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-colors" />
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/collections/${collection.id}`}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-xl',
          'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
          'hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors',
          className
        )}
      >
        {/* Cover */}
        <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {coverImage ? (
            <img
              src={coverImage}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 dark:text-white truncate">{name}</h4>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>{imageCount} 张图片</span>
            {!isPublic && <Lock className="h-3 w-3" />}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/collections/${collection.id}`}
      className={cn(
        'group block overflow-hidden rounded-xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700',
        'transition-all duration-300',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <Layers className="h-12 w-12 text-indigo-400" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Visibility Badge */}
        <div className="absolute top-3 right-3">
          {!isPublic && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              私密
            </span>
          )}
        </div>

        {/* Image Count Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Layers className="h-4 w-4" />
          <span>{imageCount.toLocaleString()} 张图片</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 line-clamp-1">{name}</h3>
        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {user.name}
            </span>
          </div>

          <div className="flex items-center gap-1 text-neutral-500 text-sm">
            <Eye className="h-3.5 w-3.5" />
            <span>{imageCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader
export function CollectionCardSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'compact' | 'hero';
}) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse">
        <div className="h-16 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse">
      <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-800" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
          <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    </div>
  );
}
