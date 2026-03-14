import Link from 'next/link';
import { db } from '@/lib/db';
import { users, images } from '@/lib/schema';
import { sql, eq, desc } from 'drizzle-orm';

interface Photographer {
  id: string;
  email: string;
  imageCount: number;
}

async function getFeaturedPhotographers(): Promise<Photographer[]> {
  try {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        imageCount: sql<number>`count(${images.id})`.as('image_count'),
      })
      .from(users)
      .leftJoin(images, eq(users.id, images.userId))
      .where(eq(images.status, 'approved'))
      .groupBy(users.id)
      .orderBy(desc(sql`count(${images.id})`))
      .limit(4);

    return result.map((r) => ({
      id: r.id,
      email: r.email,
      imageCount: r.imageCount ?? 0,
    }));
  } catch {
    return [];
  }
}

function getInitials(email: string): string {
  // Extract first 2 characters from email as initials
  const prefix = email.split('@')[0];
  return prefix.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-fuchsia-500',
  ];
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function formatEmail(email: string): string {
  // Mask email: ab***@example.com
  if (email.includes('@')) {
    return email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  return email;
}

export async function FeaturedPhotographersSection() {
  const photographers = await getFeaturedPhotographers();

  if (photographers.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-16 dark:bg-neutral-900/50 sm:py-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            精选摄影师
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">发现社区中最活跃的创作者</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {photographers.map((photographer) => (
            <Link
              key={photographer.id}
              href={`/user/${photographer.id}`}
              className="group flex flex-col items-center rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24 sm:text-2xl ${getAvatarColor(photographer.id)}`}
              >
                {getInitials(photographer.email)}
              </div>
              <div className="mt-4 text-center">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {formatEmail(photographer.email)}
                </div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {photographer.imageCount} 张作品
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
