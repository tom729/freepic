import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users, imageEmbeddings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { generateImageEmbedding, cosineSimilarity, deserializeEmbedding } from '@/lib/embedding';

export const dynamic = 'force-dynamic';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// Minimum similarity threshold for visual search results
// Images with similarity below this will be filtered out
const MIN_SIMILARITY = 0.75;
interface ImageResult {
  id: string;
  cosKey: string;
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
  likes: number | null;
  downloads: number | null;
  blurHash: string | null;
  dominantColor: string | null;
  createdAt: string;
  similarity: number;
}

// Convert image file to base64 string
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

// Get image URLs based on storage type
async function getImageUrls(cosKey: string) {
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

// Search images by semantic similarity using CLIP embeddings
async function searchImagesByEmbedding(
  queryEmbedding: number[],
  limit: number = 20
): Promise<ImageResult[]> {
  // Fetch all images with embeddings
  const embeddingsData = await db
    .select({
      imageId: imageEmbeddings.imageId,
      embedding: imageEmbeddings.embedding,
    })
    .from(imageEmbeddings);

  if (embeddingsData.length === 0) {
    return [];
  }

  // Calculate similarity scores
  const scoredImages = embeddingsData.map((item) => {
    try {
      const imageEmbedding = deserializeEmbedding(item.embedding as string);
      const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);
      return { imageId: item.imageId, similarity };
    } catch {
      return { imageId: item.imageId, similarity: 0 };
    }
  });

  // Filter by minimum similarity threshold, then sort and take top results
  const topResults = scoredImages
    .filter((item) => item.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`[Visual Search] Found ${scoredImages.length} matches, ${topResults.length} above threshold ${MIN_SIMILARITY}`);
  if (topResults.length === 0) {
    return [];
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
      user: {
        email: users.email,
      },
    })
    .from(images)
    .leftJoin(users, eq(images.userId, users.id))
    .where(and(eq(images.status, 'approved')));

  // Filter to only include images from our top results
  const resultImages = imagesList.filter((img) => imageIds.includes(img.id));

  // Format results
  const formattedImages: ImageResult[] = await Promise.all(
    resultImages.map(async (img) => {
      const similarity = topResults.find((r) => r.imageId === img.id)?.similarity || 0;
      const exif = (img.exifData || {}) as {
        cameraMake?: string;
        cameraModel?: string;
      };
      const camera = exif.cameraModel
        ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
        : 'Unknown Camera';
      const email = (img.user && 'email' in img.user ? img.user.email : null) || 'Unknown';
      const maskedEmail = email.includes('@')
        ? email.replace(/(.{2}).*(@.*)/, '$1***$2')
        : 'Unknown';

      return {
        id: img.id,
        cosKey: img.cosKey,
        ...(await getImageUrls(img.cosKey)),
        width: img.width,
        height: img.height,
        author: maskedEmail,
        userId: img.userId,
        camera,
        likes: img.likes,
        downloads: img.downloads,
        blurHash: img.blurHash,
        dominantColor: img.dominantColor,
        createdAt: img.createdAt?.toISOString() || new Date().toISOString(),
        similarity: Math.round(similarity * 100) / 100,
      };
    })
  );

  // Sort by similarity
  return formattedImages.sort((a, b) => b.similarity - a.similarity);
}

// POST handler for visual search
export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Generate CLIP embedding for the uploaded image
    console.log('[Visual Search] Generating embedding for uploaded image...');
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateImageEmbedding(dataUrl);
    } catch (error) {
      console.error('[Visual Search] Failed to generate embedding:', error);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    // Search for similar images using embedding similarity
    console.log('[Visual Search] Searching for similar images...');
    const similarImages = await searchImagesByEmbedding(queryEmbedding, 20);

    // Return response with threshold info
    const response: {
      images: ImageResult[];
      total: number;
      threshold: number;
      message?: string;
    } = {
      images: similarImages,
      total: similarImages.length,
      threshold: MIN_SIMILARITY,
    };

    // Add message if no good matches found
    if (similarImages.length === 0) {
      response.message = '未找到相似的图片，请尝试其他图片或关键词搜索';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visual search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Visual search failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
