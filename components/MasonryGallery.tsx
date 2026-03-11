'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Masonry from 'react-masonry-css';
import { ImageCard, ImageItem } from './ImageCard';
import { Lightbox } from './Lightbox';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

const breakpointColumns = {
  default: 3,
  1280: 3,
  1024: 2,
  768: 2,
  640: 1,
};

interface ApiImage {
  id: string;
  cosKey: string;
  thumbnailUrl: string;
  smallUrl?: string;
  regularUrl?: string;
  fullUrl?: string;
  originalUrl: string;
  width: number;
  height: number;
  author: string;
  userId: string;
  camera?: string;
  likes: number;
  downloads: number;
  createdAt: string;
}

interface ApiResponse {
  images: ApiImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function MasonryGallery() {
  const router = useRouter();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state - still available for keyboard navigation or future use
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Initial load - runs only once
  useEffect(() => {
    let isMounted = true;

    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images?page=1&limit=20');

        if (!response.ok) {
          throw new Error('Failed to fetch: ' + response.status);
        }

        const data: ApiResponse = await response.json();

        if (!isMounted) return;

        if (data.images.length === 0) {
          setHasMore(false);
        } else {
          const newImages: ImageItem[] = data.images.map((img) => ({
            id: img.id,
            url: img.originalUrl,
            thumbnailUrl: img.thumbnailUrl,
            smallUrl: img.smallUrl,
            regularUrl: img.regularUrl,
            width: img.width,
            height: img.height,
            author: img.author,
            userId: img.userId,
            camera: img.camera || undefined,
            likes: img.likes,
          }));

          setImages(newImages);
          setPage(2);

          if (data.pagination.totalPages <= 1) {
            setHasMore(false);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load images:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load more images
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/images?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error('Failed to fetch: ' + response.status);
      }

      const data: ApiResponse = await response.json();

      if (data.images.length === 0) {
        setHasMore(false);
      } else {
        const newImages: ImageItem[] = data.images.map((img) => ({
          id: img.id,
          url: img.originalUrl,
          thumbnailUrl: img.thumbnailUrl,
          smallUrl: img.smallUrl,
          regularUrl: img.regularUrl,
          width: img.width,
          height: img.height,
          author: img.author,
          userId: img.userId,
          camera: img.camera || undefined,
          likes: img.likes,
        }));

        setImages((prev) => [...prev, ...newImages]);
        setPage((prev) => prev + 1);

        if (page >= data.pagination.totalPages) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  const { targetRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
  });

  const handleImageClick = (image: ImageItem) => {
    // Navigate to image detail page instead of opening lightbox
    router.push(`/image/${image.id}`);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxPrev = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleLightboxNext = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const currentImage = images[currentImageIndex];

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-2 text-sm font-medium text-red-700 hover:underline"
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && images.length === 0 && !error && (
        <div className="py-20 text-center">
          <div className="mb-4 text-6xl">📷</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">暂无图片</h3>
          <p className="text-gray-600">成为第一个上传图片的用户吧！</p>
        </div>
      )}

      {images.length > 0 && (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {images.map((image) => (
            <ImageCard key={image.id} image={image} onClick={() => handleImageClick(image)} />
          ))}
        </Masonry>
      )}

      <div ref={targetRef} className="flex items-center justify-center py-12">
        {isLoading && images.length === 0 && (
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        )}
        {isLoading && images.length > 0 && (
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">加载更多图片...</span>
          </div>
        )}
        {!hasMore && images.length > 0 && (
          <span className="text-sm text-neutral-400">没有更多图片了</span>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        imageUrl={currentImage?.url || ''}
        title={`${currentImage?.author || ''} 的作品`}
        onPrev={handleLightboxPrev}
        onNext={handleLightboxNext}
        hasPrev={images.length > 1}
        hasNext={images.length > 1}
      />
    </div>
  );
}
