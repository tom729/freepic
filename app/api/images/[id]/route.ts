export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images } from '@/lib/schema';
import { getImageUrl, deleteImage } from '@/lib/cos';
import { eq } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// 获取单张图片详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // 生成各尺寸的URL
    const thumbUrl = await getImageUrl(image.cosKey, { size: 'thumb', expires: 3600 });
    const smallUrl = await getImageUrl(image.cosKey, { size: 'small', expires: 3600 });
    const regularUrl = await getImageUrl(image.cosKey, { size: 'regular', expires: 3600 });
    const fullUrl = await getImageUrl(image.cosKey, { size: 'full', expires: 3600 });
    const originalUrl = await getImageUrl(image.cosKey, { size: 'original', expires: 3600 });

    // 从邮箱生成作者名
    const authorEmail = (image.user && 'email' in image.user ? image.user.email : null) || 'Unknown';
    const maskedAuthor = authorEmail.includes('@')
      ? authorEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
      : 'Unknown';
    // 解析EXIF数据

    const exifData = (image.exifData || {}) as {
      camera?: string;
      cameraMake?: string;
      cameraModel?: string;
      dateTaken?: string;
      iso?: string;
      aperture?: string;
      shutterSpeed?: string;
      gps?: string;
    };

    return NextResponse.json({
      id: image.id,
      cosKey: image.cosKey,
      urls: {
        thumb: thumbUrl,
        small: smallUrl,
        regular: regularUrl,
        full: fullUrl,
        original: originalUrl,
      },

      width: image.width || 1920,
      height: image.height || 1080,
      fileSize: image.fileSize,
      author: maskedAuthor,
      authorId: image.userId,
      camera: exifData.camera || null,
      cameraMake: exifData.cameraMake || null,
      cameraModel: exifData.cameraModel || null,
      dateTaken: exifData.dateTaken || null,
      iso: exifData.iso || null,
      aperture: exifData.aperture || null,
      shutterSpeed: exifData.shutterSpeed || null,
      gps: exifData.gps || null,
      likes: image.likes || 0,
      downloads: image.downloads || 0,
      status: image.status,
      createdAt: image.createdAt,
    });
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}


// 删除图片
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 验证用户身份
    const { userId } = await verifyAuthWithUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取图片信息
    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // 验证所有权
    if (image.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden - not the image owner' }, { status: 403 });
    }

    // 从 COS 删除图片
    await deleteImage(image.cosKey);

    // 从数据库删除
    await db.delete(images).where(eq(images.id, id));

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Failed to delete image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
