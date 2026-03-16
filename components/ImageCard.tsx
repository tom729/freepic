'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Camera, User, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  smallUrl?: string;
  regularUrl?: string;
  width: number;
  height: number;
  author: string;
  userId?: string;
  camera?: string;
  likes: number;
  downloads?: number;
  // Progressive loading fields
  blurHash?: string;
  dominantColor?: string;
  status?: 'pending' | 'approved' | 'rejected';
  // SEO fields
  description?: string;
}

interface ImageCardProps {
  image: ImageItem;
  onClick?: (image: ImageItem) => void;
  onDelete?: (image: ImageItem) => Promise<void> | void;
  priority?: boolean;
}

export function ImageCard({ image, onClick, onDelete, priority = false }: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [isDeleting, setIsDeleting] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Fallback: force show image after 3 seconds
  useEffect(() => {
    if (isInView && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInView, isLoaded]);

  // Determine aspect ratio
  const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : '4 / 3';

  // Check if the image is from an external domain (Unsplash)
  const isExternalImage = (image.regularUrl || image.thumbnailUrl).startsWith('https://');

  // Use regularUrl (1080px) for better quality in gallery view
  const displayUrl = image.regularUrl || image.thumbnailUrl;
  return (
    <div
      ref={imageRef}
      className="group relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
      style={{ aspectRatio }}
      onClick={() => onClick?.(image)}
    >
      {/* Layer 1: Dominant color background (instant) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: image.dominantColor || '#e5e5e5',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
        }}
      />

      {/* Layer 2: Shimmer/Blur placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: image.dominantColor || '#e5e5e5',
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Avoid blur edges
          }}
        >
          <div
            className="h-full w-full animate-pulse"
            style={{
              background: `linear-gradient(
                90deg,
                ${image.dominantColor || '#e5e5e5'} 0%,
                rgba(255,255,255,0.2) 50%,
                ${image.dominantColor || '#e5e5e5'} 100%
              )`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
          <div className="text-center text-neutral-500">
            <div className="text-4xl mb-2">🖼️</div>
            <div className="text-sm">加载失败</div>
          </div>
        </div>
      )}

      {/* Layer 3: Full image - Using Next.js Image for external images, img for local */}
      {isInView && !hasError && (
        <>
          {isExternalImage ? (
            <Image
              src={displayUrl}
              alt={image.description || `Photo by ${image.author}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 33vw"
              className={`object-cover transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } group-hover:scale-105`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={image.description || `Photo by ${image.author}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } group-hover:scale-105`}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              loading={priority ? 'eager' : 'lazy'}
            />
          )}
        </>
      )}

      {/* Overlay with metadata */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
          {/* Author info - clickable */}
          <Link
            href={image.userId ? `/user/${image.userId}` : '#'}
            className="flex items-center gap-2 mb-1.5 md:mb-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
            </div>
            <span className="text-xs md:text-sm font-medium text-white truncate">
              {image.author}
            </span>
          </Link>

          {/* Camera info - hidden on small mobile */}
          {image.camera && (
            <div className="hidden sm:flex items-center gap-1.5 text-white/80">
              <Camera className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="text-xs">{image.camera}</span>
            </div>
          )}

          {/* Likes */}
          <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 text-white fill-white/80" />
            <span className="text-xs md:text-sm font-medium text-white">
              {image.likes.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top gradient for better text readability on light images */}
      <div className="absolute inset-x-0 top-0 h-12 md:h-20 bg-gradient-to-b from-black/20 md:from-black/30 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />

      {/* Delete button - only shown if onDelete is provided */}
      {onDelete && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (isDeleting) return;

            const confirmed = window.confirm('确定要删除这张图片吗？此操作不可撤销。');
            if (!confirmed) return;

            setIsDeleting(true);
            try {
              await onDelete(image);
            } catch {
              // Error handling is done by the parent
            } finally {
              setIsDeleting(false);
            }
          }}
          disabled={isDeleting}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-all duration-200 hover:bg-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="删除图片"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Shimmer animation style */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `,
        }}
      />
    </div>
  );
}

export function ImageCardSkeleton() {
  return (
    <div className="group relative mb-4 break-inside-avoid overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse">
      {/* Skeleton image placeholder */}
      <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800" />

      {/* Skeleton overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
        {/* Author skeleton */}
        <div className="flex items-center gap-2 mb-1.5 md:mb-2">
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/20" />
          <div className="h-3.5 md:h-4 w-20 bg-white/20 rounded" />
        </div>

        {/* Camera skeleton */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="h-3 w-3 md:h-3.5 md:w-3.5 bg-white/20 rounded" />
          <div className="h-3 w-24 bg-white/20 rounded" />
        </div>

        {/* Likes skeleton */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-1">
          <div className="h-3.5 w-3.5 md:h-4 md:w-4 bg-white/20 rounded" />
          <div className="h-3 md:h-4 w-8 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}
