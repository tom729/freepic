export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collections, users, images, collectionImages } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { getImageUrl } from '@/lib/cos';

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

  try {
    const baseUrl = await getImageUrl(cosKey, { expires: 86400 });
    const isCustomDomain = !baseUrl.includes('myqcloud.com');

    if (isCustomDomain) {
      return {
        thumbnailUrl: `${baseUrl}/thumb`,
        smallUrl: `${baseUrl}/small`,
        regularUrl: `${baseUrl}/regular`,
        fullUrl: `${baseUrl}/full`,
        originalUrl: baseUrl,
      };
    } else {
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
    console.error('Failed to generate image URL:', error);
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

// GET /api/collections/[id] - Get collection details with images
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const auth = await verifyAuthWithUser(request);

    // Get collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = auth.isAuthenticated && auth.userId === collection.userId;
    if (!collection.isPublic && !isOwner) {
      return NextResponse.json({ error: 'Forbidden - collection is private' }, { status: 403 });
    }

    // Get collection images
    const collectionImageList = await db
      .select({
        imageId: collectionImages.imageId,
        addedAt: collectionImages.addedAt,
        order: collectionImages.order,
      })
      .from(collectionImages)
      .where(eq(collectionImages.collectionId, id))
      .orderBy(collectionImages.order);

    // Get full image details
    const imageDetails = await Promise.all(
      collectionImageList.map(async (ci) => {
        const image = await db.query.images.findFirst({
          where: eq(images.id, ci.imageId),
          with: {
            user: {
              columns: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!image) return null;

        const imageUrls = await getImageUrls(image.cosKey);
        const authorEmail = (image.user && 'email' in image.user) ? image.user.email : 'Unknown';
        const maskedAuthor = authorEmail.includes('@')
          ? authorEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
          : 'Unknown';

        return {
          id: image.id,
          ...imageUrls,
          width: image.width,
          height: image.height,
          description: image.description,
          author: maskedAuthor,
          userId: image.userId,
          likes: image.likes || 0,
          downloads: image.downloads || 0,
          blurHash: image.blurHash,
          dominantColor: image.dominantColor,
          addedAt: ci.addedAt?.toISOString(),
        };
      })
    );

    const validImages = imageDetails.filter((img): img is NonNullable<typeof img> => img !== null);

    const ownerName =
      collection.user?.name ||
      (collection.user?.email ? collection.user.email.split('@')[0] : 'Unknown');

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        imageCount: collection.imageCount || 0,
        isPublic: collection.isPublic,
        createdAt: collection.createdAt?.toISOString(),
        updatedAt: collection.updatedAt?.toISOString(),
        owner: {
          id: collection.userId,
          name: ownerName,
        },
        isOwner,
      },
      images: validImages,
    });
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

// PATCH /api/collections/[id] - Update collection
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, id),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check ownership
    if (collection.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden - not the collection owner' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isPublic, coverImageId } = body;

    // Validate inputs
    const updates: Partial<typeof collections.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Collection name cannot be empty' }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Collection name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
      updates.description = description?.trim() || null;
    }

    if (isPublic !== undefined) {
      updates.isPublic = Boolean(isPublic);
    }

    if (coverImageId !== undefined) {
      // Verify the image exists
      if (coverImageId !== null) {
        const image = await db.query.images.findFirst({
          where: eq(images.id, coverImageId),
        });
        if (!image) {
          return NextResponse.json({ error: 'Cover image not found' }, { status: 400 });
        }
      }
      updates.coverImageId = coverImageId;
    }

    // Update collection
    await db.update(collections).set(updates).where(eq(collections.id, id));

    // Get updated collection
    const updatedCollection = await db.query.collections.findFirst({
      where: eq(collections.id, id),
    });

    return NextResponse.json({
      collection: {
        id: updatedCollection!.id,
        name: updatedCollection!.name,
        description: updatedCollection!.description,
        imageCount: updatedCollection!.imageCount || 0,
        isPublic: updatedCollection!.isPublic,
        coverImageId: updatedCollection!.coverImageId,
        createdAt: updatedCollection!.createdAt?.toISOString(),
        updatedAt: updatedCollection!.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

// DELETE /api/collections/[id] - Delete collection
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const auth = await verifyAuthWithUser(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, id),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check ownership
    if (collection.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden - not the collection owner' }, { status: 403 });
    }

    // Delete collection (cascade will delete collection_images)
    await db.delete(collections).where(eq(collections.id, id));

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
