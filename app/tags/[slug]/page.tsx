import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TagBadge } from '@/components/TagBadge';
import { ImageGrid } from '@/components/ImageGrid';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TagDetailPageProps {
  params: {
    slug: string;
  };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  imageCount: number;
  createdAt: string;
}

interface TagResponse {
  tag: Tag;
  images: Array<{
    id: string;
    thumbnailUrl: string;
    smallUrl?: string;
    regularUrl?: string;
    originalUrl: string;
    width: number;
    height: number;
    author: string;
    userId: string;
    camera?: string;
    likes: number;
    downloads: number;
    blurHash?: string;
    dominantColor?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getTagData(slug: string): Promise<TagResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const response = await fetch(`${baseUrl}/api/tags/${slug}?limit=20`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch tag');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tag:', error);
    return null;
  }
}

export async function generateMetadata({ params }: TagDetailPageProps): Promise<Metadata> {
  const data = await getTagData(params.slug);

  if (!data) {
    return {
      title: '标签未找到 - FreePic',
    };
  }

  const { tag } = data;

  return {
    title: `${tag.name} - FreePic`,
    description: tag.description || `浏览 ${tag.imageCount} 张 ${tag.name} 相关图片`,
  };
}

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  const { slug } = params;
  const data = await getTagData(slug);

  if (!data) {
    notFound();
  }

  const { tag, images, pagination } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div
        className="relative"
        style={{
          backgroundColor: tag.color ? `${tag.color}15` : '#6366f115',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back Link */}
          <Link
            href="/tags"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回标签列表
          </Link>

          {/* Tag Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: tag.color || '#6366f1' }}
            >
              <ImageIcon className="h-8 w-8 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                {tag.name}
              </h1>

              {tag.description && (
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">{tag.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>{tag.imageCount.toLocaleString()} 张图片</span>
                <span>•</span>
                <span>创建于 {new Date(tag.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📷</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              暂无图片
            </h2>
            <p className="text-neutral-500">该标签下还没有图片</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">图片</h2>
              <span className="text-sm text-neutral-500">共 {pagination.total} 张</span>
            </div>

            <ImageGrid apiUrl={`/api/tags/${slug}`} showLoadMore={pagination.totalPages > 1} />
          </>
        )}
      </div>
    </div>
  );
}
