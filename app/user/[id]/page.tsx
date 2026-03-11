import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ImageCard, ImageItem } from '@/components/ImageCard';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Camera, MapPin, Instagram, Twitter, Globe, ImageIcon, Download, Calendar } from 'lucide-react';
import { Metadata } from 'next';
// Helper function to add style suffix to avatar URL
function getAvatarUrl(url: string | null): string {
  if (!url) return '';
  // Skip if it's a local upload
  if (url.startsWith('/uploads/')) return url;
  // For COS images, add /thumb suffix
  if (url.includes('tukupic.mepai.me')) {
    return `${url}/thumb`;
  }
  return url;
}


interface UserPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const user = await db
    .select({
      name: users.name,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.id, params.id))
    .get();
    
  if (!user) return { title: '用户未找到' };
  
  const name = user.name || '摄影师';
  
  return {
    title: `${name} 的主页 | FreePic`,
    description: user.bio || `${name} 的个人主页`,
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = params;

  // 获取用户信息
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      bio: users.bio,
      location: users.location,
      website: users.website,
      instagram: users.instagram,
      twitter: users.twitter,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    notFound();
  }

  const displayName = user.name || user.email?.split('@')[0] || '摄影师';
  const maskedEmail = user?.email?.includes('@')
    ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    : 'Unknown';

  // 获取该用户的公开图片
  const userImages = await db
    .select({
      id: images.id,
      cosKey: images.cosKey,
      width: images.width,
      height: images.height,
      likes: images.likes,
      downloads: images.downloads,
      exifData: images.exifData,
      createdAt: images.createdAt,
    })
    .from(images)
    .where(and(eq(images.userId, id), eq(images.status, 'approved')))
    .orderBy(desc(images.createdAt));

  // 计算总下载量
  const totalDownloads = userImages.reduce((sum, img) => sum + (img.downloads || 0), 0);

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

  const getImageUrls = (cosKey: string) => {
    if (cosKey.startsWith('uploads/')) {
      return {
        url: `/${cosKey}`,
        thumbnailUrl: `/${cosKey}`,
      };
    }
    if (cosKey.startsWith('users/')) {
      // 使用COS的图片
      const baseUrl = `https://tukupic.mepai.me/${cosKey}`;
      return {
        url: baseUrl,
        thumbnailUrl: `${baseUrl}/thumb`,
      };
    }
    const baseUrl =
      mockImageUrls[cosKey] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
    return {
      url: `${baseUrl}?w=1920`,
      thumbnailUrl: `${baseUrl}?w=400`,
    };
  };

  const formattedImages: ImageItem[] = userImages.map((img) => {
    const exif = (img.exifData || {}) as {
      cameraModel?: string;
      cameraMake?: string;
    };
    const camera = exif.cameraModel
      ? `${exif.cameraMake || ''} ${exif.cameraModel}`.trim()
      : undefined;

    return {
      id: img.id,
      ...getImageUrls(img.cosKey),
      width: img.width || 1920,
      height: img.height || 1280,
      author: displayName,
      userId: user.id,
      camera,
      likes: img.likes || 0,
    };
  });

  // 格式化社交链接
  const getSocialLink = (platform: 'instagram' | 'twitter', handle: string | null) => {
    if (!handle) return null;
    const cleanHandle = handle.replace(/^@/, '');
    if (platform === 'instagram') return `https://instagram.com/${cleanHandle}`;
    if (platform === 'twitter') return `https://twitter.com/${cleanHandle}`;
    return null;
  };

  // 格式化加入时间
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
      })
    : '未知';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                {user.avatar ? (
                  <img src={getAvatarUrl(user.avatar)} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
              
              {user.bio && (
                <p className="text-gray-700 mb-4 max-w-2xl">{user.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                {user.location && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                  >
                    <Globe className="h-4 w-4" />
                    网站
                  </a>
                )}
                {user.instagram && (
                  <a
                    href={getSocialLink('instagram', user.instagram) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pink-600 hover:text-pink-700"
                  >
                    <Instagram className="h-4 w-4" />
                    @{user.instagram}
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={getSocialLink('twitter', user.twitter) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  >
                    <Twitter className="h-4 w-4" />
                    @{user.twitter}
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-gray-900">{formattedImages.length}</div>
                    <div className="text-xs text-gray-500">照片</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-gray-900">{totalDownloads}</div>
                    <div className="text-xs text-gray-500">下载</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{joinDate}</div>
                    <div className="text-xs text-gray-500">加入</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Images */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-lg font-semibold text-gray-900">作品</h2>
          </div>

          <div className="p-3 sm:p-6">
            {formattedImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {formattedImages.map((image) => (
                  <Link key={image.id} href={`/image/${image.id}`}>
                    <ImageCard image={image} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">该用户还没有上传公开图片</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
