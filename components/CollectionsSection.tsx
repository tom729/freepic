'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  imageCount: number;
}

function formatCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

export function CollectionsSection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(data.collections);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch collections:', err);
        setIsLoading(false);
      });
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 320;
    const newPosition =
      direction === 'left' ? scrollPosition - scrollAmount : scrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
    setScrollPosition(newPosition);
  };

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-neutral-950">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              <div className="mt-2 h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] sm:w-[300px] h-[200px] bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
              精选合集
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
              探索摄影师精心策划的主题作品集
            </p>
          </div>

          {/* View All Link */}
          <Link
            href="/collections"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            查看全部 →
          </Link>

          {/* Navigation Arrows - Desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Collections Grid/Scroll */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
            >
              <div className="relative h-[200px] sm:h-[220px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                {/* Cover Image */}
                <img
                  src={collection.coverImage}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-white/70 mb-1.5">
                    <Layers className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {formatCount(collection.imageCount)} 张图片
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-white/70 line-clamp-2">{collection.description}</p>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile scroll indicator */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
