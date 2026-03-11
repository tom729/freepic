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
export async function processImage(buffer: Buffer) {
  try {
    const [blurHash, dominantColor, dimensions] = await Promise.all([
      generateBlurHash(buffer),
      extractDominantColor(buffer),
      getImageDimensions(buffer),
    ]);

    return {
      blurHash,
      dominantColor,
      ...dimensions,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    // Return null values but don't fail the upload
    return {
      blurHash: null,
      dominantColor: null,
      width: null,
      height: null,
    };
  }
}
