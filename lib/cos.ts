/* eslint-disable @typescript-eslint/no-unused-vars */
import COS from 'cos-nodejs-sdk-v5';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image size variants following Unsplash's naming convention
 */
export type ImageSize = 'thumb' | 'small' | 'regular' | 'full' | 'original';

/**
 * Image variant info
 */
export interface ImageVariant {
  url: string;
  width: number;
  height?: number;
}

/**
 * Image processing options for COS CI (Cloud Infinite)
 */
export interface ImageProcessingOptions {
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Output format: webp, jpg, png, avif */
  format?: 'webp' | 'jpg' | 'png' | 'avif';
  /** Quality 0-100 (default: 85) */
  quality?: number;
  /** Progressive JPEG/WebP (default: true) */
  progressive?: boolean;
  /** Fit mode: crop, clip, max, scale */
  fit?: 'crop' | 'clip' | 'max' | 'scale';
  /** Gravity for cropping: center, north, east, south, west, faces */
  gravity?: 'center' | 'north' | 'east' | 'south' | 'west' | 'faces';
}

/**
 * Result of a successful image upload
 */
export interface UploadResult {
  key: string;
  url: string;
  etag: string;
}

/**
 * Options for generating signed URLs
 */
export interface SignedUrlOptions {
  /** URL expiration time in seconds (default: 3600 = 1 hour) */
  expires?: number;
  /** Image size variant (legacy, prefer processingOptions) */
  size?: ImageSize;
  /** Image processing options for COS CI */
  processingOptions?: ImageProcessingOptions;
}

/**
 * COS configuration from environment variables
 */
interface CosConfig {
  secretId: string;
  secretKey: string;
  region: string;
  bucket: string;
  domain?: string; // Custom domain, e.g., tukupic.mepai.me
}

/**
 * Custom error class for COS operations
 */
export class CosError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CosError';
  }
}

/**
 * Check if we're in build/SSG phase
 */
function isBuildPhase(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.TENCENT_COS_SECRET_ID;
}

/**
 * Get COS configuration from environment variables
 * @throws {CosError} If required environment variables are missing (only at runtime)
 */
function getCosConfig(): CosConfig {
  const secretId = process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_COS_SECRET_KEY;
  const region = process.env.TENCENT_COS_REGION;
  const bucket = process.env.TENCENT_COS_BUCKET;

  // During build phase, return mock config to allow SSG
  if (isBuildPhase()) {
    return {
      secretId: 'build-phase-mock-secret-id',
      secretKey: 'build-phase-mock-secret-key',
      region: 'ap-beijing',
      bucket: 'build-phase-mock-bucket',
      domain: undefined,
    };
  }

  if (!secretId) {
    throw new CosError('Missing TENCENT_COS_SECRET_ID environment variable', 'MISSING_SECRET_ID');
  }
  if (!secretKey) {
    throw new CosError('Missing TENCENT_COS_SECRET_KEY environment variable', 'MISSING_SECRET_KEY');
  }
  if (!region) {
    throw new CosError('Missing TENCENT_COS_REGION environment variable', 'MISSING_REGION');
  }
  if (!bucket) {
    throw new CosError('Missing TENCENT_COS_BUCKET environment variable', 'MISSING_BUCKET');
  }

  const domain = process.env.TENCENT_COS_DOMAIN;

  return { secretId, secretKey, region, bucket, domain };
}

/**
 * Create and configure COS client instance
 * @returns Configured COS client
 */
function createCosClient(): COS {
  const config = getCosConfig();
  return new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });
}

/**
 * Image size widths following Unsplash's sizing convention
 * Thumb: 200px, Small: 400px, Regular: 1080px, Full: 2048px
 */
const SIZE_WIDTHS: Record<ImageSize, number> = {
  thumb: 200,
  small: 400,
  regular: 1080,
  full: 2048,
  original: 0, // Use original size
};

/**
 * Generate COS Data Civilization (数据万象) thumbnail URL suffix
 * @param size - Image size variant
 * @returns URL suffix string
 */
function generateThumbnailUrl(size: ImageSize): string {
  if (size === 'original') {
    return '';
  }

  const width = SIZE_WIDTHS[size] || 800;
  // COS imageMogr2 format: ?imageMogr2/thumbnail/!<width>x
  return `?imageMogr2/thumbnail/!${width}x`;
}

/**
 * Generate COS CI (Cloud Infinite) image processing URL
 * Follows Unsplash-style image delivery with real-time transformations
 *
 * @param baseUrl - Base signed URL or key
 * @param options - Processing options
 * @returns URL with processing parameters
 *
 * @example
 * generateProcessingUrl('https://bucket.cos.region.myqcloud.com/photo.jpg', {
 *   width: 1080,
 *   format: 'webp',
 *   quality: 85,
 *   fit: 'max'
 * })
 * // Returns: https://.../photo.jpg?imageMogr2/thumbnail/!1080x/format/webp/quality/85
 */
export function generateProcessingUrl(baseUrl: string, options: ImageProcessingOptions): string {
  const params: string[] = [];

  // Size/Resize - using !<width>x to limit max dimension while keeping aspect ratio
  if (options.width && options.height) {
    // Exact dimensions with crop
    params.push(`thumbnail/!${options.width}x${options.height}r`);
  } else if (options.width) {
    // Max width, auto height
    params.push(`thumbnail/!${options.width}x`);
  } else if (options.height) {
    // Max height, auto width
    params.push(`thumbnail/x${options.height}`);
  }

  // Format conversion
  if (options.format) {
    params.push(`format/${options.format}`);
  }

  // Quality (1-100)
  if (options.quality !== undefined) {
    params.push(`quality/${options.quality}`);
  }

  // Progressive JPEG
  if (options.progressive !== false) {
    params.push('interlace/1');
  }

  // Fit mode (crop strategy)
  if (options.fit) {
    const fitMap: Record<string, string> = {
      crop: 'cut',
      clip: 'clip',
      max: 'max',
      scale: 'scale',
    };
    if (fitMap[options.fit]) {
      params.push(`scrop/${fitMap[options.fit]}`);
    }
  }

  // Gravity (crop anchor point)
  if (options.gravity) {
    const gravityMap: Record<string, string> = {
      center: 'center',
      north: 'north',
      east: 'east',
      south: 'south',
      west: 'west',
      faces: 'faces', // Face detection
    };
    if (gravityMap[options.gravity]) {
      params.push(`gravity/${gravityMap[options.gravity]}`);
    }
  }

  if (params.length === 0) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}imageMogr2/${params.join('/')}`;
}

/**
 * Generate all image variants (Unsplash-style)
 * Creates URLs for all standard sizes
 *
 * @param key - COS object key
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @returns Object with variant URLs
 */
export async function generateImageVariants(
  key: string,
  originalWidth: number,
  originalHeight: number
): Promise<Record<ImageSize, ImageVariant>> {
  const baseUrl = await getImageUrl(key, { expires: 86400 * 7 }); // 7 days
  const config = getCosConfig();

  // If using custom domain, append style to path: /key/thumb
  // If using COS domain, use query params
  const isCustomDomain = !!config.domain;

  const variants: Record<ImageSize, ImageVariant> = {
    original: {
      url: baseUrl,
      width: originalWidth,
      height: originalHeight,
    },
    full: {
      url: isCustomDomain ? `${baseUrl}/full` : `${baseUrl}&imageMogr2/style/full`,
      width: Math.min(2048, originalWidth),
      height: Math.round(originalHeight * (Math.min(2048, originalWidth) / originalWidth)),
    },
    regular: {
      url: isCustomDomain ? `${baseUrl}/regular` : `${baseUrl}&imageMogr2/style/regular`,
      width: Math.min(1080, originalWidth),
      height: Math.round(originalHeight * (Math.min(1080, originalWidth) / originalWidth)),
    },
    small: {
      url: isCustomDomain ? `${baseUrl}/small` : `${baseUrl}&imageMogr2/style/small`,
      width: Math.min(400, originalWidth),
      height: Math.round(originalHeight * (Math.min(400, originalWidth) / originalWidth)),
    },
    thumb: {
      url: isCustomDomain ? `${baseUrl}/thumb` : `${baseUrl}&imageMogr2/style/thumb`,
      width: Math.min(200, originalWidth),
      height: Math.round(originalHeight * (Math.min(200, originalWidth) / originalWidth)),
    },
  };

  return variants;
}
/**
 * Upload an image buffer to COS

/**
 * Upload an image buffer to COS
 *
 * @param buffer - Image buffer to upload
 * @param filename - Original filename (used for extension)
 * @param contentType - MIME type of the image
 * @returns Upload result with key, URL, and etag
 * @throws {CosError} If upload fails
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<UploadResult> {
  const client = createCosClient();
  const config = getCosConfig();

  // Generate unique key with organized path structure
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueId = uuidv4();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const key = `users/${userId}/${year}/${month}/${uniqueId}.${ext}`;

  try {
    const result = await client.putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Add metadata for organization
      Headers: {
        'x-cos-meta-original-name': filename,
        'x-cos-meta-upload-date': date.toISOString(),
      },
    });

    // Get the URL for the uploaded image
    const url = await getImageUrl(key);

    return {
      key,
      url,
      etag: result.ETag || '',
    };
  } catch (error) {
    const err = error as Error;
    throw new CosError(`Failed to upload image: ${err.message}`, 'UPLOAD_FAILED', err);
  }
}

/**
 * Generate a signed URL for accessing an image
 * @param key - COS object key
 * @param options - Options for URL generation (expires, size)
 * @returns Signed URL string
 * @throws {CosError} If URL generation fails
 */
export async function getImageUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
  const client = createCosClient();
  const config = getCosConfig();
  const { expires = 3600, size = 'original', processingOptions } = options;

  try {
    let url: string;
    let separator: string;

    // If custom domain is configured, use it directly (no signature needed)
    if (config.domain) {
      url = `https://${config.domain}/${key}`;
      // Custom domain URL has no query params, use ?
      separator = '?';
    } else {
      // Use COS default domain to generate signed URL
      url = client.getObjectUrl({
        Bucket: config.bucket,
        Region: config.region,
        Key: key,
        Expires: expires,
        Sign: true,
      });
      // COS signed URL already contains ? query params, use & to append
      separator = '&';
    }

    // Apply processing options if provided (new way)
    if (processingOptions) {
      return generateProcessingUrl(url, processingOptions);
    }

    // Use COS Data Civilization (数据万象) styles
    // For custom domain: use path-based styles (/thumb, /small, etc.)
    // For COS domain: use query params with style parameter
    if (size === 'original') {
      return url;
    }
    
    if (config.domain) {
      // Custom domain: use path-based styles (e.g., /thumb, /small)
      const stylePathMap: Record<ImageSize, string> = {
        original: '',
        thumb: '/thumb',
        small: '/small',
        regular: '/regular',
        full: '/full',
      };
      const stylePath = stylePathMap[size];
      if (stylePath) {
        return `${url}${stylePath}`;
      }
      return url;
    } else {
      // COS domain: use query params with pre-defined styles
      const styleMap: Record<ImageSize, string> = {
        original: '',
        thumb: `${separator}imageMogr2/style/thumb`,
        small: `${separator}imageMogr2/style/small`,
        regular: `${separator}imageMogr2/style/regular`,
        full: `${separator}imageMogr2/style/full`,
      };
      const styleSuffix = styleMap[size];
      if (styleSuffix) {
        return `${url}${styleSuffix}`;
      }
    }

    return url;
  } catch (error) {
    const err = error as Error;
    throw new CosError(
      `Failed to generate signed URL: ${err.message}`,
      'URL_GENERATION_FAILED',
      err
    );
  }
}

/**
 * Delete an image from COS by its key
 * @param key - COS object key to delete
 * @throws {CosError} If deletion fails
 */
export async function deleteImage(key: string): Promise<void> {
  const client = createCosClient();
  const config = getCosConfig();

  try {
    await client.deleteObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
    });
  } catch (error) {
    const err = error as Error;
    throw new CosError(`Failed to delete image: ${err.message}`, 'DELETE_FAILED', err);
  }
}

/**
 * Batch delete multiple images from COS
 * @param keys - Array of COS object keys to delete
 * @returns Object with deleted keys and any errors
 */
export async function deleteImagesBatch(
  keys: string[]
): Promise<{ deleted: string[]; errors: Array<{ key: string; error: CosError }> }> {
  const client = createCosClient();
  const config = getCosConfig();
  const deleted: string[] = [];
  const errors: Array<{ key: string; error: CosError }> = [];

  // Process in batches of 1000 (COS limit)
  const batchSize = 1000;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);

    try {
      const result = await client.deleteMultipleObject({
        Bucket: config.bucket,
        Region: config.region,
        Objects: batch.map((key) => ({ Key: key })),
      });

      // Track deleted and failed
      if (result.Deleted) {
        result.Deleted.forEach((item) => {
          if (item.Key) deleted.push(item.Key);
        });
      }

      if (result.Error) {
        result.Error.forEach((item) => {
          if (item.Key) {
            errors.push({
              key: item.Key,
              error: new CosError(
                item.Message || 'Unknown error',
                item.Code || 'BATCH_DELETE_ERROR'
              ),
            });
          }
        });
      }
    } catch (error) {
      const err = error as Error;
      // If batch fails entirely, mark all as failed
      batch.forEach((key) => {
        errors.push({
          key,
          error: new CosError(`Batch delete failed: ${err.message}`, 'BATCH_DELETE_FAILED', err),
        });
      });
    }
  }

  return { deleted, errors };
}
