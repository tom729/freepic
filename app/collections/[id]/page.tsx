import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ImageGrid } from '@/components/ImageGrid';
import { CollectionCard } from '@/components/CollectionCard';
import { ArrowLeft, Layers, Lock, Globe, Calendar, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CollectionDetailPageProps {
  params: {
    id: string;
  };
}

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  imageCount: number;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface CollectionResponse {
  collection: Collection;
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
}

async function getCollectionData(id: string): Promise<CollectionResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const response = await fetch(`${baseUrl}/api/collections/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch collection');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const data = await getCollectionData(params.id);

  if (!data) {
    return {
      title: '合集未找到 - FreePic',
    };
  }

  const { collection } = data;

  return {
    title: `${collection.name} - FreePic`,
    description: collection.description || `浏览 ${collection.name} 图片合集`,
  };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = params;
  const data = await getCollectionData(id);

  if (!data) {
    notFound();
  }

  const { collection, images } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回合集列表
          </Link>

          {/* Collection Info */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Cover Image */}
            <div className="w-full md:w-64 lg:w-80 flex-shrink-0">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {collection.coverImage ? (
                  <img
                    src={collection.coverImage}
                    alt={collection.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Layers className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {collection.isPublic ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <Globe className="h-3 w-3" />
                    公开
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
                    <Lock className="h-3 w-3" />
                    私密
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                {collection.name}
              </h1>

              {collection.description && (
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {collection.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <Link
                    href={`/user/${collection.user.id}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {collection.user.name}
                  </Link>
                </span>

                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  {collection.imageCount.toLocaleString()} 张图片
                </span>

                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(collection.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📁</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              合集为空
            </h2>
            <p className="text-neutral-500">该合集还没有添加任何图片</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">图片</h2>
              <span className="text-sm text-neutral-500">共 {collection.imageCount} 张</span>
            </div>

            <ImageGrid
              apiUrl={`/api/collections/${id}`}
              showLoadMore={collection.imageCount > images.length}
            />
          </>
        )}
      </div>
    </div>
  );
}
