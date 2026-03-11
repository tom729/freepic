import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc, sql, like, or, and, inArray } from 'drizzle-orm';
import { getImageUrl } from '@/lib/cos';

// Cache configuration - ISR for 60 seconds, revalidate in background
export const revalidate = 60;

// Use nodejs runtime for database compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock image URLs mapping (using Unsplash)
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
// Build search query
// Build search query
async function buildSearchQuery(searchParams: URLSearchParams) {
  const conditions: (
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | ReturnType<typeof or>
    | undefined
  )[] = [eq(images.status, 'approved')];

  // Keyword search
  const query = searchParams.get('q');
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(like(images.exifData, searchPattern), like(users.email, searchPattern)));
  }
  // Camera filter
  const camera = searchParams.get('camera');
  if (camera) {
    conditions.push(like(images.exifData, `%${camera}%`));
  }

  // User ID filter
  const userId = searchParams.get('userId');
  if (userId) {
    conditions.push(eq(images.userId, userId));
  }

  // Exclude specific image
  const excludeId = searchParams.get('excludeId');
  if (excludeId) {
    conditions.push(sql`${images.id} != ${excludeId}`);
  }

  // Exclude specific user's images
  const excludeUserId = searchParams.get('excludeUserId');
  if (excludeUserId) {
    conditions.push(sql`${images.userId} != ${excludeUserId}`);
  }


  // Tag filter removed - now using semantic search instead

  return conditions.length > 1 ? and(...conditions) : conditions[0];
}

// Get image list (supports search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereCondition = await buildSearchQuery(searchParams);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .where(whereCondition);
    const total = countResult[0]?.count || 0;

    // Get images list - optimized query with select
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
        user: {
          email: users.email,
        },
      })
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    // Tags removed - now using semantic search

    // Format response
    const formattedImages = await Promise.all(
      imagesList.map(async (img) => {
        const exif = (img.exifData || {}) as {
          cameraMake?: string;
          cameraModel?: string;
        };
        const camera = exif.cameraModel
          ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
          : 'Unknown Camera';
        const email = img.user?.email || 'Unknown';
        const maskedEmail = email.includes('@')
          ? email.replace(/(.{2}).*(@.*)/, '$1***$2')
          : 'Unknown';

        // Tags removed - now using semantic search

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

    // Format response with cache headers
    const response = NextResponse.json({
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // Set cache headers for CDN/browser caching
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
