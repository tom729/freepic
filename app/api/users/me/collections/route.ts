export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collections, images } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getImageUrl } from '@/lib/cos';
import { randomUUID } from 'crypto';

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

async function getCoverImageUrl(cosKey: string | null): Promise<string | null> {
  if (!cosKey) return null;

  if (mockImageUrls[cosKey]) {
    return `${mockImageUrls[cosKey]}?w=600`;
  }

  if (cosKey.startsWith('uploads/')) {
    return `/${cosKey}`;
  }

  try {
    return await getImageUrl(cosKey, { size: 'small', expires: 86400 });
  } catch (error) {
    console.error('Failed to get cover image URL:', error);
    return null;
  }
}

// GET /api/users/me/collections - List current user's collections
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get user's collections (both public and private)
    const collectionsList = await db.query.collections.findMany({
      where: eq(collections.userId, auth.userId),
      orderBy: desc(collections.createdAt),
      limit,
      offset,
    });

    // Format with cover images
    const formattedCollections = await Promise.all(
      collectionsList.map(async (collection) => {
        let coverImageUrl: string | null = null;

        if (collection.coverImageId) {
          const coverImage = await db.query.images.findFirst({
            where: eq(images.id, collection.coverImageId),
            columns: { cosKey: true },
          });
          if (coverImage) {
            coverImageUrl = await getCoverImageUrl(coverImage.cosKey);
          }
        }

        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: coverImageUrl,
          imageCount: collection.imageCount || 0,
          isPublic: collection.isPublic,
          createdAt: collection.createdAt?.toISOString(),
          updatedAt: collection.updatedAt?.toISOString(),
        };
      })
    );

    return NextResponse.json({
      collections: formattedCollections,
    });
  } catch (error) {
    console.error('Failed to fetch user collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST /api/users/me/collections - Create new collection
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic = true } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Collection name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Create collection
    const newCollection = await db
      .insert(collections)
      .values({
        id: randomUUID(),
        userId: auth.userId,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic),
        imageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        collection: {
          id: newCollection[0].id,
          name: newCollection[0].name,
          description: newCollection[0].description,
          imageCount: 0,
          isPublic: newCollection[0].isPublic,
          createdAt: newCollection[0].createdAt?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
