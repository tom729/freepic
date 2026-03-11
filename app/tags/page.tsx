import { Metadata } from 'next';
import Link from 'next/link';
import { TagCloud } from '@/components/TagCloud';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: '浏览标签 - FreePic',
  description: '浏览所有图片标签，发现你感兴趣的主题',
};

export const dynamic = 'force-dynamic';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  imageCount: number;
}

async function getTags(): Promise<Tag[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
    const response = await fetch(`${baseUrl}/api/tags?limit=100`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }

    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              浏览标签
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              发现感兴趣的主题，探索精选图片合集
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="搜索标签..."
                className="block w-full pl-10 pr-3 py-3 border border-neutral-300 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tags Cloud */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏷️</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              暂无标签
            </h2>
            <p className="text-neutral-500">标签将在图片上传后自动生成</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">所有标签</h2>
              <span className="text-sm text-neutral-500">共 {tags.length} 个标签</span>
            </div>

            <TagCloud tags={tags} showAll />
          </>
        )}
      </div>

      {/* Popular Tags Section */}
      {tags.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
              热门标签
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {tags
                .sort((a, b) => b.imageCount - a.imageCount)
                .slice(0, 12)
                .map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="group block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: tag.color || '#6366f1' }}
                    />
                    <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {tag.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {tag.imageCount.toLocaleString()} 张图片
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
