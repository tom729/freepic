import { Metadata } from 'next';
import Link from 'next/link';
import { CollectionGrid } from '@/components/CollectionGrid';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '浏览合集 - FreePic',
  description: '探索摄影师精心策划的图片合集',
};

export const dynamic = 'force-dynamic';

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                浏览合集
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                探索摄影师精心策划的主题作品集
              </p>
            </div>

            <Button asChild>
              <Link href="/profile/collections" className="gap-2">
                <Layers className="h-4 w-4" />
                我的合集
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <CollectionGrid apiUrl="/api/collections" columns={3} />
      </div>
    </div>
  );
}
