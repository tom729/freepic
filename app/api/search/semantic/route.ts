import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, imageEmbeddings, users } from '@/lib/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { generateTextEmbedding, cosineSimilarity, deserializeEmbedding } from '@/lib/embedding';

export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  smallUrl: string;
  regularUrl: string;
  fullUrl: string;
  originalUrl: string;
  width: number | null;
  height: number | null;
  author: string;
  userId: string;
  camera: string;
  likes: number;
  downloads: number;
  blurHash: string | null;
  dominantColor: string | null;
  createdAt: string;
  similarity: number;
}

// Mock image URLs mapping
const mockImageUrls: Record<string, string> = {
  'images/mock/landscape-1.jpg': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'images/mock/portrait-1.jpg': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
  'images/mock/nature-1.jpg': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  'images/mock/city-1.jpg': 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
  'images/mock/abstract-1.jpg': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853',
  'images/mock/food-1.jpg': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
  'images/mock/tech-1.jpg': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  'images/mock/animal-1.jpg': 'https://images.unsplash.com/photo-1474511320723-9a56873571b7',
};

async function getImageUrls(cosKey: string) {
  if (cosKey.startsWith('uploads/')) {
    const baseUrl = `/${cosKey}`;
    return {
      url: baseUrl,
      thumbnailUrl: baseUrl,
      smallUrl: baseUrl,
      regularUrl: baseUrl,
      fullUrl: baseUrl,
      originalUrl: baseUrl,
    };
  }

  if (cosKey.startsWith('users/')) {
    const { getImageUrl } = await import('@/lib/cos');
    const baseUrl = await getImageUrl(cosKey, { expires: 86400 });
    const isCustomDomain = !baseUrl.includes('myqcloud.com');

    if (isCustomDomain) {
      return {
        url: baseUrl,
        thumbnailUrl: `${baseUrl}/thumb`,
        smallUrl: `${baseUrl}/small`,
        regularUrl: `${baseUrl}/regular`,
        fullUrl: `${baseUrl}/full`,
        originalUrl: baseUrl,
      };
    } else {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return {
        url: baseUrl,
        thumbnailUrl: `${baseUrl}${separator}imageMogr2/style/thumb`,
        smallUrl: `${baseUrl}${separator}imageMogr2/style/small`,
        regularUrl: `${baseUrl}${separator}imageMogr2/style/regular`,
        fullUrl: `${baseUrl}${separator}imageMogr2/style/full`,
        originalUrl: baseUrl,
      };
    }
  }

  const baseUrl =
    mockImageUrls[cosKey] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
  return {
    url: `${baseUrl}?w=1920`,
    thumbnailUrl: `${baseUrl}?w=400`,
    smallUrl: `${baseUrl}?w=400`,
    regularUrl: `${baseUrl}?w=1080`,
    fullUrl: `${baseUrl}?w=1920`,
    originalUrl: `${baseUrl}?w=1920`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('[Semantic Search] Query:', query);

    // Generate text embedding for the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateTextEmbedding(query);
    } catch (error) {
      console.error('[Semantic Search] Failed to generate embedding:', error);
      return NextResponse.json({ error: 'Failed to process search query' }, { status: 500 });
    }

    // Fetch all images with embeddings
    // Note: In production with pgvector, this would be a vector similarity query
    const embeddingsData = await db
      .select({
        imageId: imageEmbeddings.imageId,
        embedding: imageEmbeddings.embedding,
      })
      .from(imageEmbeddings);

    if (embeddingsData.length === 0) {
      return NextResponse.json({
        images: [],
        query,
        total: 0,
        message: '图片索引为空。请上传新图片或联系管理员生成现有图片的索引。',
        hint: '新上传的图片会自动生成索引，现有图片需要手动处理',
      });
    }

    // Calculate similarity scores in JavaScript
    const scoredImages = embeddingsData.map((item) => {
      try {
        const imageEmbedding = deserializeEmbedding(item.embedding as string);
        const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);
        return { imageId: item.imageId, similarity };
      } catch {
        return { imageId: item.imageId, similarity: 0 };
      }
    });

    // Sort by similarity and take top results
    const topResults = scoredImages.sort((a, b) => b.similarity - a.similarity).slice(0, limit);

    if (topResults.length === 0) {
      return NextResponse.json({
        images: [],
        query,
        total: 0,
      });
    }

    // Fetch full image details
    const imageIds = topResults.map((r) => r.imageId);
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
      .from(images)
      .leftJoin(users, eq(images.userId, users.id))
      .where(and(
        eq(images.status, 'approved'),
        inArray(images.id, imageIds)
      ));

    // Format results
    const formattedImages: SearchResult[] = await Promise.all(
      imagesList.map(async (img) => {
        const similarity = topResults.find((r) => r.imageId === img.id)?.similarity || 0;
        const exif = (img.exifData || {}) as { cameraMake?: string; cameraModel?: string };
        const camera = exif.cameraModel
          ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
          : 'Unknown Camera';
        const email = img.userEmail || 'Unknown';
        const maskedEmail = email.includes('@')
          ? email.replace(/(.{2}).*(@.*)/, '$1***$2')
          : 'Unknown';

        return {
          id: img.id,
          ...(await getImageUrls(img.cosKey)),
          width: img.width,
          height: img.height,
          author: maskedEmail,
          userId: img.userId,
          camera,
          likes: img.likes || 0,
          downloads: img.downloads || 0,
          blurHash: img.blurHash,
          dominantColor: img.dominantColor,
          createdAt: img.createdAt?.toISOString() || new Date().toISOString(),
          similarity: Math.round(similarity * 100) / 100,
        };
      })
    );

    // Sort by similarity
    formattedImages.sort((a, b) => b.similarity - a.similarity);

    console.log(`[Semantic Search] Found ${formattedImages.length} results`);

    return NextResponse.json({
      images: formattedImages,
      query,
      total: formattedImages.length,
    });
  } catch (error) {
    console.error('[Semantic Search] Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
