'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CollectionGrid } from '@/components/CollectionGrid';
import { CreateCollectionModal } from '@/components/CreateCollectionModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Plus, Lock, Globe, Loader2 } from 'lucide-react';

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

export default function ProfileCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/collections?user=true');

      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateSuccess = () => {
    fetchCollections();
  };

  const filteredCollections = collections.filter((c) => {
    if (activeTab === 'public') return c.isPublic;
    if (activeTab === 'private') return !c.isPublic;
    return true;
  });

  const stats = {
    total: collections.length,
    public: collections.filter((c) => c.isPublic).length,
    private: collections.filter((c) => !c.isPublic).length,
    totalImages: collections.reduce((sum, c) => sum + c.imageCount, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              我的合集
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">管理你创建的图片合集</p>
          </div>

          <CreateCollectionModal
            onSuccess={handleCreateSuccess}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                创建合集
              </Button>
            }
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-1">合集总数</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-1">公开合集</p>
            <p className="text-2xl font-bold">{stats.public}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-1">私密合集</p>
            <p className="text-2xl font-bold">{stats.private}</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-1">图片总数</p>
            <p className="text-2xl font-bold">{stats.totalImages}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
            <TabsTrigger value="public">
              <Globe className="h-4 w-4 mr-1.5" />
              公开 ({stats.public})
            </TabsTrigger>
            <TabsTrigger value="private">
              <Lock className="h-4 w-4 mr-1.5" />
              私密 ({stats.private})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <CollectionsGrid
              collections={filteredCollections}
              isLoading={isLoading}
              onCreateClick={() => {}}
            />
          </TabsContent>

          <TabsContent value="public" className="mt-0">
            <CollectionsGrid collections={filteredCollections} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="private" className="mt-0">
            <CollectionsGrid collections={filteredCollections} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Sub-component for collections grid
function CollectionsGrid({
  collections,
  isLoading,
  onCreateClick,
}: {
  collections: Collection[];
  isLoading: boolean;
  onCreateClick?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="text-4xl mb-3">📁</div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">暂无合集</h3>
        <p className="text-neutral-500 mb-4">创建你的第一个合集来整理图片</p>
        {onCreateClick && (
          <CreateCollectionModal
            onSuccess={() => window.location.reload()}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                创建合集
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.id}`}
          className="group block overflow-hidden rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all"
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            {collection.coverImage ? (
              <img
                src={collection.coverImage}
                alt={collection.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <Layers className="h-12 w-12 text-indigo-400" />
              </div>
            )}

            <div className="absolute top-3 right-3">
              {!collection.isPublic && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
                  <Lock className="h-3 w-3" />
                  私密
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                {collection.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-neutral-500">
              <span>{collection.imageCount} 张图片</span>
              <span>{new Date(collection.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
