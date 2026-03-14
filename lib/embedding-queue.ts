/**
 * Embedding Generation Queue
 * Async processing of image embeddings to avoid blocking uploads
 */

import { db } from './db';
import { imageEmbeddings, images } from './schema';
import { eq } from 'drizzle-orm';
import { generateImageEmbedding, serializeEmbedding } from './embedding';
import { v4 as uuidv4 } from 'uuid';

import { getImageUrl } from './cos';

// Simple in-memory queue for processing embeddings
// Accepts either cosKey (preferred) or imageUrl for backwards compatibility
const embeddingQueue: Array<{ imageId: string; cosKey?: string; imageUrl?: string; retryCount?: number }> = [];
// Track failed embeddings for debugging
// Track failed embeddings for debugging

let isProcessing = false;

// Track failed embeddings for debugging
const failedEmbeddings: Array<{ imageId: string; error: string; timestamp: Date }> = [];
const MAX_RETRIES = 3;
const MAX_FAILED_RECORDS = 100;
/**
 * Add an image to the embedding generation queue
 */
export function queueEmbeddingGeneration(imageId: string, cosKeyOrUrl: string, retryCount = 0): void {
  console.log(`[EmbeddingQueue] Queued image ${imageId} (retry: ${retryCount})`);
  
  // 判断是 cosKey 还是 URL
  const isCosKey = !cosKeyOrUrl.startsWith('http');
  const item = isCosKey 
    ? { imageId, cosKey: cosKeyOrUrl, retryCount }
    : { imageId, imageUrl: cosKeyOrUrl, retryCount };
  
  embeddingQueue.push(item);

  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }
}
/**
 * Process the embedding queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || embeddingQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log(`[EmbeddingQueue] Starting processing, ${embeddingQueue.length} items in queue`);

  while (embeddingQueue.length > 0) {
    const item = embeddingQueue.shift();
    if (!item) continue;

    let success = false;
    let lastError: Error | null = null;

    // Try up to MAX_RETRIES times
    for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
      try {
        // 如果有 cosKey，先生成长期 URL，否则使用传入的 URL
        let url = item.imageUrl || '';
        if (item.cosKey) {
          url = await getImageUrl(item.cosKey, { expires: 3600 }); // 1小时有效期
        }
        if (!url) {
          throw new Error('No URL or cosKey provided');
        }
        await generateAndSaveEmbedding(item.imageId, url);
        success = true;
        
        // Log success after retry
        if (attempt > 0) {
          console.log(`[EmbeddingQueue] ✓ Succeeded for ${item.imageId} after ${attempt + 1} attempts`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        
        if (!isLastAttempt) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = 1000 * Math.pow(2, attempt);
          console.log(`[EmbeddingQueue] Retry ${attempt + 1}/${MAX_RETRIES} for ${item.imageId} after ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          console.error(`[EmbeddingQueue] ✗ Failed all ${MAX_RETRIES} attempts for ${item.imageId}:`, lastError.message);
        }
      }
    }

    if (!success && lastError) {
      // Record failure for debugging
      recordFailedEmbedding(item.imageId, lastError.message);
    }

    // Small delay between items to prevent overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  isProcessing = false;
  console.log('[EmbeddingQueue] Queue processed');
}

/**
 * Generate embedding and save to database
 */
async function generateAndSaveEmbedding(imageId: string, imageUrl: string): Promise<void> {
  console.log(`[EmbeddingQueue] Generating embedding for ${imageId}`);

  try {
    // Check if embedding already exists
    const existing = await db.query.imageEmbeddings.findFirst({
      where: (embeddings, { eq }) => eq(embeddings.imageId, imageId),
    });

    if (existing) {
      console.log(`[EmbeddingQueue] Embedding already exists for ${imageId}`);
      return;
    }

    // Generate embedding
    const embedding = await generateImageEmbedding(imageUrl);

    // Save to database
    await db.insert(imageEmbeddings).values({
      id: uuidv4(),
      imageId,
      embedding: serializeEmbedding(embedding),
      createdAt: new Date(),
    });

    console.log(`[EmbeddingQueue] Embedding saved for ${imageId}`);
  } catch (error) {
    console.error(`[EmbeddingQueue] Error generating embedding for ${imageId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding synchronously (for batch processing)
 */
export async function generateEmbeddingSync(imageId: string, imageUrl: string): Promise<void> {
  return generateAndSaveEmbedding(imageId, imageUrl);
}

/**
 * Get queue status
 */
/**
 * Record a failed embedding attempt
 */
function recordFailedEmbedding(imageId: string, error: string): void {
  failedEmbeddings.push({
    imageId,
    error,
    timestamp: new Date(),
  });
  
  // Keep only recent failures
  if (failedEmbeddings.length > MAX_FAILED_RECORDS) {
    failedEmbeddings.shift();
  }
}

/**
 * Get queue status including failed embeddings
 */
export function getQueueStatus(): { 
  pending: number; 
  isProcessing: boolean; 
  failed: number;
  recentFailures: Array<{ imageId: string; error: string; timestamp: Date }>;
} {
  return {
    pending: embeddingQueue.length,
    isProcessing,
    failed: failedEmbeddings.length,
    recentFailures: [...failedEmbeddings].reverse(), // Most recent first
  };
}

/**
 * Clear failed embeddings record
 */
export function clearFailedEmbeddings(): void {
  failedEmbeddings.length = 0;
  console.log('[EmbeddingQueue] Failed embeddings record cleared');
}

/**
 * Reprocess all images without embeddings (for migration)
 */
export async function reprocessAllImages(
  getImageUrlFn: (cosKey: string) => Promise<string>
): Promise<void> {
  const { images } = await import('./schema');
  const { eq, and, sql } = await import('drizzle-orm');

  // Only reprocess approved images without embeddings
  const allImages = await db
    .select({ id: images.id, cosKey: images.cosKey })
    .from(images)
    .leftJoin(imageEmbeddings, eq(images.id, imageEmbeddings.imageId))
    .where(and(
      eq(images.status, 'approved'),
      sql`${imageEmbeddings.id} IS NULL`
    ));

  console.log(`[EmbeddingQueue] Reprocessing ${allImages.length} images without embeddings`);

  for (const img of allImages) {
    try {
      const url = await getImageUrlFn(img.cosKey);
      queueEmbeddingGeneration(img.id, url);
    } catch (error) {
      console.error(`[EmbeddingQueue] Failed to queue ${img.id}:`, error);
    }
  }
}


/**
 * Start periodic auto-check for missing embeddings
 * Runs every hour to find and fix approved images without embeddings
 * @param getImageUrlFn Function to generate image URL from cosKey
 * @param intervalMs Check interval in milliseconds (default: 1 hour)
 * @returns Cleanup function to stop the periodic check
 */
export function startAutoEmbeddingCheck(
  getImageUrlFn: (cosKey: string) => Promise<string>,
  intervalMs = 60 * 60 * 1000 // 1 hour
): () => void {
  console.log(`[EmbeddingQueue] Starting auto-check every ${intervalMs / 1000 / 60} minutes`);
  
  // Run immediately on start
  runAutoCheck(getImageUrlFn);
  
  // Schedule periodic checks
  const intervalId = setInterval(() => {
    runAutoCheck(getImageUrlFn);
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('[EmbeddingQueue] Auto-check stopped');
  };
}

/**
 * Run a single auto-check cycle
 */
async function runAutoCheck(
  getImageUrlFn: (cosKey: string) => Promise<string>
): Promise<void> {
  try {
    const { eq, and, sql } = await import('drizzle-orm');
    
    // Find approved images without embeddings
    const missingImages = await db
      .select({ 
        id: images.id, 
        cosKey: images.cosKey 
      })
      .from(images)
      .leftJoin(imageEmbeddings, eq(images.id, imageEmbeddings.imageId))
      .where(and(
        eq(images.status, 'approved'),
        sql`${imageEmbeddings.id} IS NULL`
      ));
    
    if (missingImages.length === 0) {
      return; // Nothing to do
    }
    
    console.log(`[EmbeddingQueue] Auto-check found ${missingImages.length} images without embeddings`);
    
    for (const img of missingImages) {
      try {
        const url = await getImageUrlFn(img.cosKey);
        queueEmbeddingGeneration(img.id, url);
      } catch (error) {
        console.error(`[EmbeddingQueue] Auto-check failed to queue ${img.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[EmbeddingQueue] Auto-check error:', error);
  }
}