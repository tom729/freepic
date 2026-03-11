import { db } from '@/lib/db';
import { images, users, downloads } from '@/lib/schema';
import { sql } from 'drizzle-orm';

async function getStats() {
  try {
    const [imageCount] = await db.select({ count: sql<number>`count(*)` }).from(images);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [downloadCount] = await db.select({ count: sql<number>`count(*)` }).from(downloads);

    return {
      images: imageCount?.count ?? 0,
      photographers: userCount?.count ?? 0,
      downloads: downloadCount?.count ?? 0,
    };
  } catch {
    return {
      images: 0,
      photographers: 0,
      downloads: 0,
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export async function StatisticsSection() {
  const stats = await getStats();

  const statItems = [
    { label: '图片数量', value: stats.images },
    { label: '摄影师', value: stats.photographers },
    { label: '下载次数', value: stats.downloads },
  ];

  return (
    <section className="bg-neutral-900 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {statItems.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {formatNumber(stat.value)}
              </div>
              <div className="mt-2 text-sm font-medium text-neutral-400 sm:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
