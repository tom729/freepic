import { encode } from 'blurhash';
import sharp from 'sharp';

/**
 * Generate BlurHash from image buffer
 * Creates a compact string representation of a blurred image (~20-30 chars)
 * Used for progressive loading (show blur while loading full image)
 *
 * @param buffer - Image buffer
 * @returns BlurHash string or null if failed
 */
export async function generateBlurHash(buffer: Buffer): Promise<string | null> {
  try {
    // Resize to 32x32 for BlurHash generation (good balance of speed and quality)
    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    // Encode to BlurHash
    // xComponents=4, yComponents=3 gives good quality for the size
    const blurHash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4, // xComponents
      3 // yComponents
    );

    return blurHash;
  } catch (error) {
    console.error('Failed to generate BlurHash:', error);
    return null;
  }
}

/**
 * Extract dominant color from image
 * Used for initial placeholder before BlurHash loads
 *
 * @param buffer - Image buffer
 * @returns Hex color string (e.g., '#60544D') or null
 */
export async function extractDominantColor(buffer: Buffer): Promise<string | null> {
  try {
    // Resize to 1x1 to get average color
    const resizedBuffer = await sharp(buffer).resize(1, 1, { fit: 'cover' }).raw().toBuffer();

    // data is [r, g, b] or [r, g, b, a]
    const r = resizedBuffer[0];
    const g = resizedBuffer[1];
    const b = resizedBuffer[2];

    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  } catch (error) {
    console.error('Failed to extract dominant color:', error);
    return null;
  }
}

/**
 * Get image dimensions
 *
 * @param buffer - Image buffer
 * @returns Object with width and height
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return null;
    }
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    return null;
  }
}

/**
 * Process image for upload
 * Extracts metadata without modifying the original image
 *
 * @param buffer - Image buffer
 * @returns Processing result with metadata
 */

// 大文件阈值（超过此大小跳过内存密集型处理）
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

/**
 * 优化版图片处理 - 减少内存占用
 * 对于大文件跳过blurHash生成，避免OOM
 */
export async function processImage(buffer: Buffer) {
  try {
    // 大文件跳过 blurHash 和 dominant color（太耗内存）
    if (buffer.length > LARGE_FILE_THRESHOLD) {
      console.log(`[ImageProcessing] Large file (${(buffer.length / 1024 / 1024).toFixed(1)}MB), skipping blurHash`);
      const metadata = await sharp(buffer).metadata();
      return {
        blurHash: null,
        dominantColor: null,
        width: metadata.width || null,
        height: metadata.height || null,
      };
    }

    // 小文件：顺序处理而非并行，减少内存峰值
    // 1. 先获取尺寸
    const metadata = await sharp(buffer).metadata();

    // 2. 提取主色调 - 调整到1x1
    const dominantBuffer = await sharp(buffer)
      .resize(1, 1, { fit: 'cover' })
      .raw()
      .toBuffer();
    const r = dominantBuffer[0];
    const g = dominantBuffer[1];
    const b = dominantBuffer[2];
    const dominantColor = `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;

    // 3. 生成blurHash - 调整到32x32
    const blurHashData = await sharp(buffer)
      .resize(32, 32, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const blurHash = encode(
      new Uint8ClampedArray(blurHashData.data),
      blurHashData.info.width,
      blurHashData.info.height,
      4,
      3
    );

    return {
      blurHash,
      dominantColor,
      width: metadata.width || null,
      height: metadata.height || null,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    return {
      blurHash: null,
      dominantColor: null,
      width: null,
      height: null,
    };
  }
}
