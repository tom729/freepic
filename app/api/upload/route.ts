export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, imageEmbeddings, users } from '@/lib/schema';
import { uploadImage } from '@/lib/cos';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { generateImageEmbedding, cosineSimilarity, deserializeEmbedding } from '@/lib/embedding';
import { eq } from 'drizzle-orm';
import piexif from 'piexifjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { queueEmbeddingGeneration } from '@/lib/embedding-queue';

// 计算文件 MD5 哈希
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}


// Helper to get user from either Bearer token or NextAuth session
async function getUserFromRequest(request: NextRequest) {
  // First try Bearer token
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  if (isAuthenticated && user) {
    return { isAuthenticated: true, user };
  }
  
  // Try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user.email!),
    });
    if (dbUser) {
      return { isAuthenticated: true, user: dbUser };
    }
  }
  
  return { isAuthenticated: false, user: null };
}

// 基于文件哈希的重复检测（快速预检）
async function checkDuplicateByHash(
  userId: string,
  fileHash: string
): Promise<{ isDuplicate: boolean; existingImage?: { id: string; cosKey: string } }> {
  try {
    const existing = await db.query.images.findFirst({
      where: (images, { eq, and }) => and(
        eq(images.userId, userId),
        eq(images.fileHash, fileHash)
      ),
    });

    if (existing) {
      console.log(`[DuplicateCheck] Found exact duplicate by hash: ${existing.id}`);
      return {
        isDuplicate: true,
        existingImage: {
          id: existing.id,
          cosKey: existing.cosKey,
        },
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('[DuplicateCheck] Error checking file hash:', error);
    return { isDuplicate: false };
  }
}
// 检查是否使用演示模式（没有 COS 配置时）
const isDemoMode = !process.env.TENCENT_COS_SECRET_ID;

// 重复检测阈值（相似度 > 0.92 认为是重复图片）
const DUPLICATE_THRESHOLD = 0.92;

/**
 * 检测用户是否上传了重复或高度相似的图片
 * @param userId 用户ID
 * @param file 上传的文件
 * @returns 检测结果 { isDuplicate: boolean, similarImages: Array }
 */
async function checkDuplicateUpload(
  userId: string,
  file: File
): Promise<{
  isDuplicate: boolean;
  similarImages: Array<{ id: string; similarity: number; cosKey: string }>;
}> {
  try {
    // 读取文件并生成 embedding
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    console.log('[DuplicateCheck] Generating embedding for uploaded file...');
    const uploadEmbedding = await generateImageEmbedding(dataUrl);

    // 获取该用户的所有图片及其 embeddings
    const userImages = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        embedding: imageEmbeddings.embedding,
      })
      .from(images)
      .leftJoin(imageEmbeddings, eq(images.id, imageEmbeddings.imageId))
      .where(eq(images.userId, userId));

    // 计算相似度
    const similarImages: Array<{ id: string; similarity: number; cosKey: string }> = [];

    for (const img of userImages) {
      if (!img.embedding) continue;

      try {
        const existingEmbedding = deserializeEmbedding(img.embedding as string);
        const similarity = cosineSimilarity(uploadEmbedding, existingEmbedding);

        if (similarity >= DUPLICATE_THRESHOLD) {
          similarImages.push({
            id: img.id,
            similarity: Math.round(similarity * 100) / 100,
            cosKey: img.cosKey,
          });
        }
      } catch (error) {
        console.error(`[DuplicateCheck] Error comparing with image ${img.id}:`, error);
      }
    }

    // 按相似度排序
    similarImages.sort((a, b) => b.similarity - a.similarity);

    console.log(
      `[DuplicateCheck] Found ${similarImages.length} similar images (threshold: ${DUPLICATE_THRESHOLD})`
    );

    return {
      isDuplicate: similarImages.length > 0,
      similarImages,
    };
  } catch (error) {
    console.error('[DuplicateCheck] Error during duplicate check:', error);
    // 如果检测失败，允许上传（不阻塞）
    return { isDuplicate: false, similarImages: [] };
  }
}

// 格式: uploads/users/{userId}/{year}/{month}/{filename}
async function demoUpload(buffer: Buffer, userId: string, filename: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'users',
    userId,
    String(year),
    month
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedName = filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .substring(0, 50)
    .replace(/\.[^/.]+$/, '');
  const key = `uploads/users/${userId}/${year}/${month}/${sanitizedName}.${ext}`;
  const filePath = path.join(process.cwd(), 'public', key);

  fs.writeFileSync(filePath, buffer);

  return {
    key,
    url: `/${key}`,
    etag: `${userId}-${Date.now()}`,
  };
}

// 辅助函数：将bytes转换为字符串
function bytesToString(bytes: unknown): string {
  if (typeof bytes === 'string') return bytes;
  if (Array.isArray(bytes)) {
    return bytes.map((b) => String.fromCharCode(b as number)).join('');
  }
  return String(bytes);
}

// 辅助函数：提取EXIF数据
function extractExifData(
  buffer: Buffer,
  mimeType: string = 'image/jpeg'
): {
  camera?: string;
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
  iso?: string;
  aperture?: string;
  shutterSpeed?: string;
  gps?: {
    latitude: number;
    longitude: number;
    latitudeRef: string;
    longitudeRef: string;
    formatted: string;
  };
  locationName?: string;
  width?: number;
  height?: number;
} {
  try {
    // Convert buffer to base64 string for piexif
    // piexif.load() requires data URL format, not pure base64
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Validate that we have actual image data
    if (!base64Image || base64Image.length < 100) {
      console.warn('[EXIF] Buffer too small, no EXIF data');
      return {};
    }

    const exifObj = piexif.load(dataUrl);
    const exif = exifObj['0th'] || {};
    const exifData = exifObj['Exif'] || {};
    const gpsData = exifObj['GPS'] || {};

    const result: {
      camera?: string;
      cameraMake?: string;
      cameraModel?: string;
      dateTaken?: string;
      iso?: string;
      aperture?: string;
      shutterSpeed?: string;
      gps?: {
        latitude: number;
        longitude: number;
        latitudeRef: string;
        longitudeRef: string;
        formatted: string;
      };
      locationName?: string;
      width?: number;
      height?: number;
    } = {};

    // Log EXIF data for debugging
    console.log('[EXIF] Make:', exif[piexif.ImageIFD.Make], 'Model:', exif[piexif.ImageIFD.Model]);

    // 相机信息
    if (exif[piexif.ImageIFD.Make]) {
      result.cameraMake = bytesToString(exif[piexif.ImageIFD.Make]).trim();
    }
    if (exif[piexif.ImageIFD.Model]) {
      result.cameraModel = bytesToString(exif[piexif.ImageIFD.Model]).trim();
    }
    if (result.cameraMake && result.cameraModel) {
      result.camera = `${result.cameraMake} ${result.cameraModel}`.trim();
    }

    // 图片尺寸
    if (exif[piexif.ImageIFD.ImageWidth]) {
      result.width = exif[piexif.ImageIFD.ImageWidth];
    }
    if (exif[piexif.ImageIFD.ImageLength]) {
      result.height = exif[piexif.ImageIFD.ImageLength];
    }

    // 拍摄时间
    if (exifData[piexif.ExifIFD.DateTimeOriginal]) {
      result.dateTaken = bytesToString(exifData[piexif.ExifIFD.DateTimeOriginal]);
    }

    // ISO
    if (exifData[piexif.ExifIFD.ISOSpeedRatings]) {
      result.iso = String(exifData[piexif.ExifIFD.ISOSpeedRatings]);
    }

    // 光圈
    if (exifData[piexif.ExifIFD.FNumber]) {
      const fNumber = exifData[piexif.ExifIFD.FNumber];
      if (Array.isArray(fNumber) && fNumber.length === 2) {
        result.aperture = `f/${(fNumber[0] / fNumber[1]).toFixed(1)}`;
      }
    }

    // 快门速度
    if (exifData[piexif.ExifIFD.ExposureTime]) {
      const expTime = exifData[piexif.ExifIFD.ExposureTime];
      if (Array.isArray(expTime) && expTime.length === 2) {
        const seconds = expTime[0] / expTime[1];
        if (seconds < 1) {
          result.shutterSpeed = `1/${Math.round(1 / seconds)}s`;
        } else {
          result.shutterSpeed = `${seconds.toFixed(1)}s`;
        }
      }
    }

    // GPS信息
    if (gpsData[piexif.GPSIFD.GPSLatitude] && gpsData[piexif.GPSIFD.GPSLongitude]) {
      const lat = gpsData[piexif.GPSIFD.GPSLatitude];
      const latRef = gpsData[piexif.GPSIFD.GPSLatitudeRef];
      const lon = gpsData[piexif.GPSIFD.GPSLongitude];
      const lonRef = gpsData[piexif.GPSIFD.GPSLongitudeRef];

      if (Array.isArray(lat) && Array.isArray(lon)) {
        const latDeg = lat[0][0] / lat[0][1];
        const latMin = lat[1][0] / lat[1][1];
        const latSec = lat[2][0] / lat[2][1];
        const lonDeg = lon[0][0] / lon[0][1];
        const lonMin = lon[1][0] / lon[1][1];
        const lonSec = lon[2][0] / lon[2][1];

        const latitude = latDeg + latMin / 60 + latSec / 3600;
        const longitude = lonDeg + lonMin / 60 + lonSec / 3600;

        result.gps = {
          latitude: latRef === 'S' ? -latitude : latitude,
          longitude: lonRef === 'W' ? -longitude : longitude,
          latitudeRef: bytesToString(latRef || 'N'),
          longitudeRef: bytesToString(lonRef || 'E'),
          formatted: `${Math.abs(latitude).toFixed(4)}°${latRef === 'S' ? 'S' : 'N'}, ${Math.abs(longitude).toFixed(4)}°${lonRef === 'W' ? 'W' : 'E'}`,
        };
      }
    }

    return result;
  } catch (error) {
    console.warn('[EXIF] Failed to extract EXIF data:', error);
    return {};
  }
}

// 上传图片
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份并获取用户信息（包括激活状态）
    const { isAuthenticated, user } = await getUserFromRequest(request);

    if (!isAuthenticated) {
      return NextResponse.json({ error: '请先登录后再上传图片' }, { status: 401 });
    }

    // 检查账号是否已激活
    if (!user?.isActive) {
      return NextResponse.json(
        { error: '账号未激活，请先查收激活邮件并完成激活' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    // 使用认证的用户ID
    const userId = user.id;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // 验证文件大小（50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // 读取文件buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Security: Validate magic bytes to ensure file content matches extension
    const MAGIC_BYTES: Record<string, { bytes: number[], mime: string }> = {
      jpeg: { bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg' },
      png: { bytes: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png' },
      gif: { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif' },
      webp: { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' }, // RIFF followed by WEBP
    };

    let isValidImage = false;
    for (const [format, info] of Object.entries(MAGIC_BYTES)) {
      const header = buffer.slice(0, info.bytes.length);
      const matches = info.bytes.every((byte, i) => header[i] === byte);
      if (matches) {
        // For WebP, need to check further
        if (format === 'webp') {
          const webpHeader = buffer.slice(8, 12).toString('ascii');
          if (webpHeader === 'WEBP') {
            isValidImage = true;
            break;
          }
        } else {
          isValidImage = true;
          break;
        }
      }
    }

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image file. File content does not match image format.' },
        { status: 400 }
      );
    }
    // 计算文件 MD5 哈希（用于快速重复检测）
    const fileHash = calculateFileHash(buffer);
    console.log(`[Upload] File hash: ${fileHash}`);

    // 跳过重复检测以加快上传速度
    // const hashCheck = await checkDuplicateByHash(userId, fileHash);
    // if (hashCheck.isDuplicate) {
    //   return NextResponse.json(
    //     {
    //       error: '文件已存在',
    //       details: '您已经上传过完全相同的文件',
    //       existingImage: hashCheck.existingImage,
    //     },
    //     { status: 409 } // Conflict
    //   );
    // }

    // 生成图片ID
    const imageId = uuidv4();

    // 先保存到数据库，状态为 pending，EXIF数据留空，等待后台处理
    await db
      .insert(images)
      .values({
        id: imageId,
        userId,
        cosKey: '', // 将在后台处理完成后更新
        exifData: {}, // 空对象，等待后台处理填充
        width: null,
        height: null,
        fileSize: file.size,
        fileHash, // MD5 hash for duplicate detection
        blurHash: null, // 将在后台处理完成后更新
        dominantColor: null, // 将在后台处理完成后更新
        description: description || null,
        location: null, // 将在后台处理完成后更新
        status: 'pending', // 初始状态为 pending
        createdAt: new Date(),
      });
    // 立即返回成功响应
    const response = NextResponse.json({
      success: true,
      image: {
        id: imageId,
        status: 'pending',
        message: '图片已接收，正在后台处理中',
      },
    });

    // 触发后台处理（不等待完成）
    processImageAsync(imageId, buffer, file.name, file.type, userId).catch((err) => {
      console.error('[Upload] Background processing failed:', err);
    });

    return response;
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

// 异步触发内容审核
async function triggerModeration(imageId: string, imageUrl: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000'}/api/moderation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, imageUrl }),
      }
    );

    if (!response.ok) {
      throw new Error(`Moderation API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('内容审核结果:', result);
  } catch (error) {
    console.error('内容审核触发失败:', error);
  }
}

// 后台异步处理图片：提取EXIF、验证、生成BlurHash、上传到COS、触发审核
async function processImageAsync(
  imageId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string,
  userId: string
) {
  try {
    console.log(`[Upload] Starting background processing for image ${imageId}`);

    // 1. 提取EXIF数据
    const exifData = extractExifData(buffer, mimeType);
    console.log(`[Upload] Extracted EXIF for image ${imageId}:`, {
      camera: exifData.camera,
      dateTaken: exifData.dateTaken,
    });

    // 2. 验证EXIF数据
    const skipExifCheck = process.env.NODE_ENV === 'development';
    if (!skipExifCheck && !exifData.camera && !exifData.dateTaken) {
      console.warn(`[Upload] Image ${imageId} rejected: missing EXIF data`);
      await db
        .update(images)
        .set({
          status: 'rejected',
        })
        .where(eq(images.id, imageId));
      return;
    }

    // 3. 生成 BlurHash 和 Dominant Color（跳过以避免OOM）
    // 可以后续按需生成
    const blurHash = null;
    const dominantColor = null;
    console.log(`[Upload] Skipped blurHash generation to avoid OOM for image ${imageId}`);

    // 4. 上传文件到 COS（演示模式或 COS）
    let uploadResult;
    if (isDemoMode) {
      console.log('[DEMO MODE] Uploading to local storage...');
      uploadResult = await demoUpload(buffer, userId, filename);
    } else {
      uploadResult = await uploadImage(buffer, filename, mimeType, userId);
    }
    console.log(`[Upload] File uploaded to ${uploadResult.key}`);

    // 5. 更新数据库记录
    await db
      .update(images)
      .set({
        cosKey: uploadResult.key,
        exifData: {
          camera: exifData.camera,
          cameraMake: exifData.cameraMake,
          cameraModel: exifData.cameraModel,
          dateTaken: exifData.dateTaken,
          iso: exifData.iso,
          aperture: exifData.aperture,
          shutterSpeed: exifData.shutterSpeed,
          gps: exifData.gps,
        },
        width: exifData.width,
        height: exifData.height,
        blurHash,
        dominantColor,
        location: exifData.gps?.formatted || null,
        status: 'approved',
      })
      .where(eq(images.id, imageId));
    console.log(`[Upload] Database updated for image ${imageId}`);

    // 6. 触发内容审核
    triggerModeration(imageId, uploadResult.url).catch((err) => {
      console.error('[Upload] Moderation trigger failed:', err);
    });

    // 7. 生成语义搜索 embedding（不等待结果）
    try {
      // 传递 cosKey，让 embedding 队列生成自己的长期 URL
      queueEmbeddingGeneration(imageId, uploadResult.key);
      console.log(`[Upload] Queued embedding generation for image ${imageId}`);
    } catch (err) {
      console.error('[Upload] Failed to queue embedding:', err);
    }

    console.log(`[Upload] Background processing completed for image ${imageId}`);
  } catch (error) {
    console.error(`[Upload] Background processing failed for image ${imageId}:`, error);
    // 更新数据库状态为失败
    await db
      .update(images)
      .set({
        status: 'rejected',
      })
      .where(eq(images.id, imageId))
      .catch((err) => {
        console.error('[Upload] Failed to update error status:', err);
      });
  }
}
