import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Get all approved images
  const approvedImages = await db
    .select({
      id: images.id,
      updatedAt: images.updatedAt,
      createdAt: images.createdAt,
    })
    .from(images)
    .where(eq(images.status, 'approved'));

  const imagePages = approvedImages.map((image) => ({
    url: `${baseUrl}/image/${image.id}`,
    lastModified: image.updatedAt || image.createdAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Get all users with public profiles (have approved images)
  const usersWithImages = await db
    .selectDistinct({
      userId: images.userId,
    })
    .from(images)
    .where(eq(images.status, 'approved'));

  const userPages = usersWithImages.map((user) => ({
    url: `${baseUrl}/user/${user.userId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...imagePages, ...userPages];
}
