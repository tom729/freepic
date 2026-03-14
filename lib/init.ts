/**
 * Server Initialization Module
 * Runs once when the server starts
 */

import { startAutoEmbeddingCheck, getQueueStatus } from './embedding-queue';
import { getImageUrl } from './cos';

let isInitialized = false;
let cleanupAutoCheck: (() => void) | null = null;

/**
 * Initialize server-side background tasks
 * Safe to call multiple times - will only run once
 */
export function initializeServer(): void {
  if (isInitialized) {
    return;
  }

  console.log('[ServerInit] Initializing server background tasks...');

  // Start auto-embedding check every hour
  try {
    cleanupAutoCheck = startAutoEmbeddingCheck(
      async (cosKey: string) => {
        // 使用小图，因为原图有访问保护
        if (cosKey.startsWith('users/')) {
          // 自定义域名：添加 /small 后缀
          return `https://tukupic.mepai.me/${cosKey}/small`;
        }
        return await getImageUrl(cosKey, { expires: 3600, size: 'small' });
      },
      60 * 60 * 1000 // 1 hour
    );
    console.log('[ServerInit] Auto-embedding check started (every 1 hour)');
  } catch (error) {
    console.error('[ServerInit] Failed to start auto-embedding check:', error);
  }

  isInitialized = true;
  console.log('[ServerInit] Server initialization complete');
}

/**
 * Get the status of background tasks
 */
export function getBackgroundTaskStatus(): {
  isInitialized: boolean;
  embeddingQueue: ReturnType<typeof getQueueStatus>;
} {
  return {
    isInitialized,
    embeddingQueue: getQueueStatus(),
  };
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanupServer(): void {
  if (cleanupAutoCheck) {
    cleanupAutoCheck();
    cleanupAutoCheck = null;
  }
  isInitialized = false;
  console.log('[ServerInit] Server cleanup complete');
}
