import { db } from './db';
import { imageEmbeddings, images } from './schema';
import { generateImageEmbedding, serializeEmbedding } from './embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getImageUrl } from './cos';

/**
 * Generate embeddings for all approved images that don't have one
 * Run this after database migrations or when adding semantic search to existing data
 * Safe to run multiple times - will skip images that already have embeddings
 */
export async function generateMissingEmbeddings(): Promise<{
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Find all approved images
    const allApprovedImages = await db.query.images.findMany({
      where: eq(images.status, 'approved'),
      columns: {
        id: true,
        cosKey: true,
      },
    });

    console.log(`[EmbeddingBatch] Found ${allApprovedImages.length} approved images`);

    // Process each image with duplicate check inside the loop
    // This prevents race conditions if multiple instances run simultaneously
    for (const image of allApprovedImages) {
      try {
        // Double-check if embedding already exists (prevents race conditions)
        const existing = await db.query.imageEmbeddings.findFirst({
          where: eq(imageEmbeddings.imageId, image.id),
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // 生成图片 URL（使用小图，因为原图有访问保护）
        let imageUrl = '';
        if (image.cosKey.startsWith('users/')) {
          imageUrl = `https://tukupic.mepai.me/${image.cosKey}`;
        } else {
          imageUrl = await getImageUrl(image.cosKey, { expires: 3600, size: 'small' });
        }

        console.log(`[EmbeddingBatch] Processing: ${imageUrl}`);

        // Generate embedding
        const embedding = await generateImageEmbedding(imageUrl);
        const serialized = serializeEmbedding(embedding);

        // Save to database
        await db.insert(imageEmbeddings).values({
          id: uuidv4(),
          imageId: image.id,
          embedding: serialized,
          createdAt: new Date(),
        });

        result.processed++;
        console.log(`[EmbeddingBatch] ✓ Generated for ${image.id}`);
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Image ${image.id}: ${errorMsg}`);
        console.error(`[EmbeddingBatch] ✗ Failed for ${image.id}:`, errorMsg);
      }
    }

    console.log(
      `[EmbeddingBatch] Complete: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`
    );

    return result;
  } catch (error) {
    console.error('[EmbeddingBatch] Fatal error:', error);
    throw error;
  }
}
