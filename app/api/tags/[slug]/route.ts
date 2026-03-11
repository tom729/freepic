export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags, images, imageTags, users } from '@/lib/schema';
import { getImageUrl } from '@/lib/cos';
import { eq, desc, sql } from 'drizzle-orm';

// Mock image URLs mapping (using Unsplash) - same as images route
const mockImageUrls: Record<string, string> = {
  'images/mock/landscape-1.jpg': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'images/mock/portrait-1.jpg': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
  'images/mock/nature-1.jpg': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  'images/mock/city-1.jpg': 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
  'images/mock/abstract-1.jpg': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853',
  'images/mock/food-1.jpg': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
  'images/mock/tech-1.jpg': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  'images/mock/animal-1.jpg': 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca',
};

async function getImageUrls(cosKey: string) {
  // 1. Check if it's a mock image (Unsplash)
  if (mockImageUrls[cosKey]) {
    const baseUrl = mockImageUrls[cosKey];
    return {
      thumbnailUrl: `${baseUrl}?w=400&fm=webp&q=80`,
      smallUrl: `${baseUrl}?w=400&fm=webp&q=80`,
      regularUrl: `${baseUrl}?w=1080&fm=webp&q=85`,
      fullUrl: `${baseUrl}?w=1920&fm=webp&q=90`,
      originalUrl: `${baseUrl}?w=1920`,
    };
  }

  // 2. Check if it's a local upload
  if (cosKey.startsWith('uploads/')) {
    const baseUrl = `/${cosKey}`;
    return {
      thumbnailUrl: baseUrl,
      smallUrl: baseUrl,
      regularUrl: baseUrl,
      fullUrl: baseUrl,
      originalUrl: baseUrl,
    };
  }

  // 3. Otherwise, it's a COS image - generate signed URL
  try {
    const baseUrl = await getImageUrl(cosKey, { expires: 86400 }); // 24 hours

    // Check if using custom domain (path-based styles) or COS domain (query-based styles)
    const isCustomDomain = !baseUrl.includes('myqcloud.com');

    if (isCustomDomain) {
      // Custom domain: use path-based styles (/key/thumb)
      return {
        thumbnailUrl: `${baseUrl}/thumb`,
        smallUrl: `${baseUrl}/small`,
        regularUrl: `${baseUrl}/regular`,
        fullUrl: `${baseUrl}/full`,
        originalUrl: baseUrl,
      };
    } else {
      // COS domain: use query-based styles (?imageMogr2/style/thumb)
      const separator = baseUrl.includes('?') ? '&' : '?';
      return {
        thumbnailUrl: `${baseUrl}${separator}imageMogr2/style/thumb`,
        smallUrl: `${baseUrl}${separator}imageMogr2/style/small`,
        regularUrl: `${baseUrl}${separator}imageMogr2/style/regular`,
        fullUrl: `${baseUrl}${separator}imageMogr2/style/full`,
        originalUrl: baseUrl,
      };
    }
  } catch (error) {
    console.error('Failed to generate COS URL for', cosKey, error);
    // Fallback to placeholder
    const fallbackUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
    return {
      thumbnailUrl: `${fallbackUrl}?w=400`,
      smallUrl: `${fallbackUrl}?w=400`,
      regularUrl: `${fallbackUrl}?w=1080`,
      fullUrl: `${fallbackUrl}?w=1920`,
      originalUrl: fallbackUrl,
    };
  }
}

// Get tag details with paginated images
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get tag by slug
    const tagResult = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        imageCount: tags.imageCount,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (tagResult.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const tag = tagResult[0];

    // Get images with this tag
    const imagesList = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        width: images.width,
        height: images.height,
        likes: images.likes,
        downloads: images.downloads,
        createdAt: images.createdAt,
        exifData: images.exifData,
        blurHash: images.blurHash,
        dominantColor: images.dominantColor,
        userId: images.userId,
        userEmail: users.email,
      })
      .from(imageTags)
      .innerJoin(tags, eq(imageTags.tagId, tags.id))
      .innerJoin(images, eq(imageTags.imageId, images.id))
      .leftJoin(users, eq(images.userId, users.id))
      .where(eq(tags.slug, slug))
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageTags)
      .innerJoin(tags, eq(imageTags.tagId, tags.id))
      .where(eq(tags.slug, slug));

    const total = countResult[0]?.count || 0;

    // Format images
    const formattedImages = await Promise.all(
      imagesList.map(async (img) => {
        const exif = (img.exifData || {}) as {
          cameraMake?: string;
          cameraModel?: string;
        };
        const camera = exif.cameraModel
          ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
          : 'Unknown Camera';
        const email = img.userEmail || 'Unknown';
        const maskedEmail = email.includes('@')
          ? email.replace(/(.{2}).*(@.*)/, '$1***$2')
          : 'Unknown';

        const imageUrls = await getImageUrls(img.cosKey);

        return {
          id: img.id,
          cosKey: img.cosKey,
          ...imageUrls,
          width: img.width,
          height: img.height,
          author: maskedEmail,
          userId: img.userId,
          camera,
          likes: img.likes,
          downloads: img.downloads,
          blurHash: img.blurHash,
          dominantColor: img.dominantColor,
          createdAt: img.createdAt?.toISOString(),
          tags: [], // Tags removed - using semantic search
        };
      })
    );

    return NextResponse.json({
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        color: tag.color,
        imageCount: tag.imageCount,
        createdAt: tag.createdAt?.toISOString(),
      },
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch tag details:', error);
    return NextResponse.json({ error: 'Failed to fetch tag details' }, { status: 500 });
  }
}
