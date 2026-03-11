export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, downloads } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthWithUser } from '@/lib/server-auth';

// Mock image URLs mapping (using Unsplash)
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

// 下载图片（返回重定向URL）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const size = (searchParams.get('size') || 'original') as
      | 'thumb'
      | 'small'
      | 'regular'
      | 'large'
      | 'full'
      | 'original';

    // 验证用户身份并获取用户信息
    const { isAuthenticated, user } = await verifyAuthWithUser(request);

    if (!isAuthenticated) {
      return NextResponse.json({ error: '请先登录后再下载图片' }, { status: 401 });
    }

    // 检查账号是否已激活
    if (!user?.isActive) {
      return NextResponse.json(
        { error: '账号未激活，请先查收激活邮件并完成激活' },
        { status: 403 }
      );
    }

    const userId = user.id;

    // 从数据库查找图片
    const image = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        status: images.status,
        downloads: images.downloads,
      })
      .from(images)
      .where(eq(images.id, id))
      .get();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.status !== 'approved') {
      return NextResponse.json({ error: 'Image not available' }, { status: 403 });
    }

    // 生成下载 URL
    let sizedUrl: string;

    if (image.cosKey.startsWith('uploads/')) {
      // 本地上传的图片
      sizedUrl = `/${image.cosKey}`;
    } else if (image.cosKey.startsWith('users/')) {
      // COS 自定义域名图片
      const baseUrl = `https://tukupic.mepai.me/${image.cosKey}`;
      if (size === 'original') {
        sizedUrl = baseUrl;
      } else {
        // 使用 COS 配置的样式
        // regular -> regular, large -> full, small/thumb -> thumb
        const style = size === 'regular' ? 'regular' : size === 'large' ? 'full' : 'thumb';
        sizedUrl = `${baseUrl}/${style}`;
      }
      console.log('[Download] COS URL:', sizedUrl, '| size:', size, '| cosKey:', image.cosKey);

    } else {
      // Mock 图片（Unsplash）
      const width =
        size === 'thumb'
          ? 200
          : size === 'small'
            ? 400
            : size === 'regular'
              ? 1080
              : size === 'full'
                ? 1920
                : 3840;
      const baseUrl =
        mockImageUrls[image.cosKey] ||
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
      sizedUrl = `${baseUrl}?w=${width}`;
    }

    // 记录下载到数据库（异步，不阻塞响应）
    try {
      await db.insert(downloads).values({
        id: uuidv4(),
        imageId: id,
        userId,
        size,
        createdAt: new Date(),
      });

      // 增加下载计数
      await db
        .update(images)
        .set({ downloads: (image.downloads || 0) + 1 })
        .where(eq(images.id, id));

      console.log(`[DB] Download recorded: image ${id}, size: ${size}`);
    } catch (err) {
      console.error('Failed to record download:', err);
    }

    // 获取文件名
    const filename = image.cosKey.split('/').pop() || 'image.jpg';
    
    // 获取图片数据并返回带下载头的响应
    try {
      const imageResponse = await fetch(sizedUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // 返回带 Content-Disposition 头的响应，触发浏览器下载
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (fetchError) {
      console.error('Failed to fetch image for download:', fetchError);
      // 如果获取失败，返回重定向作为备选
      return NextResponse.redirect(sizedUrl);
    }
    return NextResponse.redirect(sizedUrl);
  } catch (error) {
    console.error('Failed to download image:', error);
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
  }
}

