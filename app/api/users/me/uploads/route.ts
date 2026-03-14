import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { getImageUrl } from '@/lib/cos';
import { verifyAuthWithUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份 - 支持 Bearer token 和 NextAuth session
    let userId: string | undefined;
    
    // 先尝试 Bearer token
    const { isAuthenticated, userId: tokenUserId } = await verifyAuthWithUser(request);
    if (isAuthenticated && tokenUserId) {
      userId = tokenUserId;
    }
    
    // 如果没有 token，尝试 NextAuth session
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, session.user.email!),
        });
        if (dbUser) {
          userId = dbUser.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 获取用户信息
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });



    // 获取用户显示名称
    const authorName = user?.name || user?.email?.split('@')[0] || '我';

    // 查询用户上传的图片
    const userImages = await db.query.images.findMany({
      where: eq(images.userId, userId),
      orderBy: desc(images.createdAt),
    });
    // Mock image URLs mapping
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

    const getImageUrls = async (cosKey: string) => {
      // 1. Check if it's a mock image (Unsplash)
      if (mockImageUrls[cosKey]) {
        const baseUrl = mockImageUrls[cosKey];
        return {
          url: `${baseUrl}?w=1920`,
          thumbnailUrl: `${baseUrl}?w=400`,
          smallUrl: `${baseUrl}?w=400`,
          regularUrl: `${baseUrl}?w=1080`,
        };
      }

      // 2. Check if it's a local upload
      if (cosKey.startsWith('uploads/')) {
        const baseUrl = `/${cosKey}`;
        return {
          url: baseUrl,
          thumbnailUrl: baseUrl,
          smallUrl: baseUrl,
          regularUrl: baseUrl,
        };
      }

      // 3. Otherwise, it's a COS image - generate URL with thumbnail support
      try {
        // Generate base URL
        const baseUrl = await getImageUrl(cosKey, { expires: 86400 });
        
        const isCustomDomain = !baseUrl.includes('myqcloud.com');
        
        if (isCustomDomain) {
          // Custom domain: use path-based styles
          return {
            url: baseUrl,
            thumbnailUrl: `${baseUrl}/thumb`,
            smallUrl: `${baseUrl}/small`,
            regularUrl: `${baseUrl}/regular`,
          };
        } else {
          // COS domain: use query-based styles
          const separator = baseUrl.includes('?') ? '&' : '?';
          return {
            url: baseUrl,
            thumbnailUrl: `${baseUrl}${separator}imageMogr2/style/thumb`,
            smallUrl: `${baseUrl}${separator}imageMogr2/style/small`,
            regularUrl: `${baseUrl}${separator}imageMogr2/style/regular`,
          };
        }
      } catch (error) {
        console.error('Failed to generate COS URL for', cosKey, error);
        const fallbackUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
        return {
          url: `${fallbackUrl}?w=1920`,
          thumbnailUrl: `${fallbackUrl}?w=400`,
          smallUrl: `${fallbackUrl}?w=400`,
          regularUrl: `${fallbackUrl}?w=1080`,
        };
      }
    };


    // 格式化返回数据
    const formattedImages = await Promise.all(
      userImages.map(async (img) => {
        const exif = (img.exifData || {}) as {
          cameraModel?: string;
          cameraMake?: string;
        };
        const camera = exif.cameraModel
          ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
          : undefined;

        const imageUrls = await getImageUrls(img.cosKey);

        return {
          id: img.id,
          ...imageUrls,
          width: img.width || 1920,
          height: img.height || 1280,
          author: authorName,
          userId: userId,
          camera,
          likes: img.likes || 0,
          downloads: img.downloads || 0,
          status: img.status,
          createdAt: img.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      images: formattedImages,
    });
  } catch (error) {
    console.error('Failed to fetch user uploads:', error);
    return NextResponse.json(
      { error: '获取上传列表失败', details: String(error) },
      { status: 500 }
    );
  }
}
