/**
 * Server Initialization Module
 * Runs once when the server starts
 */

import { startAutoEmbeddingCheck, getQueueStatus } from './embedding-queue';

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
        // Use the COS URL generation
        return cosKey.startsWith('users/') ? `https://tukupic.mepai.me/${cosKey}` : `/${cosKey}`;
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
