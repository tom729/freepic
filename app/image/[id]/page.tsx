import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download, Camera, Calendar, MapPin, Instagram, Twitter, Globe, Eye } from 'lucide-react';
import { db } from '@/lib/db';
import { images, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth';
import { ImageGrid } from '@/components/ImageGrid';
import { DownloadButtons } from '@/components/DownloadButtons';
import { getImageUrl } from '@/lib/cos';
import { ViewCountDisplay } from '@/components/ViewCounter';
import { CommentSection } from '@/components/CommentSection';

// Client components wrapper
import { AddToCollectionButtonWrapper } from '@/components/AddToCollectionButtonWrapper';

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

// Helper function to get image URL with style support
async function getImageUrlWithStyle(
  cosKey: string,
  style: 'thumb' | 'small' | 'regular' | 'full' | 'original' = 'regular'
): Promise<string> {
  // Handle local uploads (demo mode)
  if (cosKey.startsWith('uploads/')) {
    return `/${cosKey}`;
  }

  // Handle hierarchical COS paths (users/{userId}/{year}/{month}/{filename})
  if (cosKey.startsWith('users/')) {
    const baseUrl = await getImageUrl(cosKey, { expires: 86400 }); // 24 hours
    if (style === 'original') {
      return baseUrl;
    }
    // Check if using custom domain (path-based) or COS domain (query-based)
    const isCustomDomain = !baseUrl.includes('myqcloud.com');
    if (isCustomDomain) {
      return `${baseUrl}/${style}`;
    } else {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}imageMogr2/style/${style}`;
    }
  }

  // Fallback for any other paths - try to get signed URL
  try {
    const baseUrl = await getImageUrl(cosKey, { expires: 86400 });
    if (style === 'original') {
      return baseUrl;
    }
    // Check if using custom domain (path-based) or COS domain (query-based)
    const isCustomDomain = !baseUrl.includes('myqcloud.com');
    if (isCustomDomain) {
      return `${baseUrl}/${style}`;
    } else {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}imageMogr2/style/${style}`;
    }
  } catch {
    // Final fallback to placeholder
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4';
  }
}

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

// Generate SEO metadata for image page
export async function generateMetadata({ params }: ImagePageProps): Promise<Metadata> {
  const { id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000';
  
  try {
    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
    });
    
    if (!image || image.status !== 'approved') {
      return { title: '图片未找到' };
    }
    
    const imageUrl = image.cosKey?.startsWith('uploads/')
      ? `${baseUrl}/${image.cosKey}`
      : `https://tukupic.mepai.me/${image.cosKey}/regular`;
    
    return {
      title: `${image.description || '精美图片'} - FreePic`,
      description: image.description || '高质量图片，可免费下载使用',
      openGraph: {
        type: 'article',
        url: `${baseUrl}/image/${id}`,
        title: image.description || '精美图片',
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: image.description || '精美图片',
        images: [imageUrl],
      },
    };
  } catch {
    return { title: '图片详情' };
  }
}

interface ImagePageProps {
  params: {
    id: string;
  };
}

export default async function ImagePage({ params }: ImagePageProps) {
  const { id } = params;

  // Get image info from database with full user profile
  const imageData = await db
    .select({
      id: images.id,
      cosKey: images.cosKey,
      status: images.status,
      width: images.width,
      height: images.height,
      fileSize: images.fileSize,
      downloads: images.downloads,

      exifData: images.exifData,
      createdAt: images.createdAt,
      userId: images.userId,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        instagram: users.instagram,
        twitter: users.twitter,
        website: users.website,
      },
    })
    .from(images)
    .leftJoin(users, eq(images.userId, users.id))
    .where(eq(images.id, id))
    .limit(1)
    .then(results => results[0]);

  // 获取当前用户 session
  const session = await getServerSession(authOptions);
  const currentUserEmail = session?.user?.email;

  // 检查是否是管理员
  let isAdmin = false;
  if (currentUserEmail) {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, currentUserEmail),
    });
    isAdmin = currentUser?.isAdmin || false;
  }

  // 允许查看的条件：已批准 OR (是管理员) OR (是图片所有者)
  const canView = imageData && (
    imageData.status === 'approved' ||
    isAdmin ||
    (currentUserEmail && imageData.user?.email === currentUserEmail)
  );

  if (!canView) {
    notFound();
  }

  const image = imageData;
  const mediumUrl = await getImageUrlWithStyle(image.cosKey, 'regular');

  // Generate author display info
  const authorName = image.user?.name || image.user?.email?.split('@')[0] || '摄影师';
  const authorEmail = image.user?.email || 'Unknown';
  const maskedAuthor = authorEmail.includes('@')
    ? authorEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
    : 'Unknown';
  const displayName = authorName || maskedAuthor;

  // Parse EXIF data
  const exifData = (image.exifData || {}) as {
    cameraMake?: string;
    cameraModel?: string;
    dateTaken?: string;
    iso?: string;
    aperture?: string;
    shutterSpeed?: string;
    gps?: string;
  };

  // Get camera model for similar recommendations
  const cameraModel = exifData.cameraModel || '';

  // Generate Schema.org JSON-LD for AI agents
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: mediumUrl,
    name: `Photo by ${displayName}`,
    description: `Photography by ${displayName}${cameraModel ? ` shot with ${cameraModel}` : ''}`,
    width: image.width,
    height: image.height,
    author: {
      '@type': 'Person',
      name: displayName,
      identifier: image.userId,
    },
    datePublished: image.createdAt?.toISOString(),
    encodingFormat: 'image/jpeg',
    representativeOfPage: true,
  };

  // Get similar image recommendations
  let similarImagesApiUrl = `/api/images?excludeId=${id}&limit=6`;
  if (cameraModel) {
    similarImagesApiUrl += `&camera=${encodeURIComponent(cameraModel)}`;
  }

  return (
    <>
      {/* Schema.org JSON-LD for AI agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData),
        }}
      />
      <div className="min-h-screen bg-gray-50 pt-2 sm:pt-4">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
            {/* Main Image */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg sm:rounded-xl bg-white shadow-sm">
                <img
                  src={mediumUrl}
                  alt={`Photo by ${displayName}`}
                  className="h-auto w-full object-contain"
                  style={{ maxHeight: '80vh' }}
                />
              </div>

              {/* Image Actions Bar */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <ViewCountDisplay count={0} />
                  <span className="text-neutral-300">|</span>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                    <Download className="h-4 w-4" />
                    {image.downloads || 0} 下载
                  </span>
                </div>

                <AddToCollectionButtonWrapper imageId={id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Author Info */}
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
                <Link
                  href={`/user/${image.userId}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                    {image.user?.avatar ? (
                      <img
                        src={getAvatarUrl(image.user.avatar)}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      displayName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {displayName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">摄影师</p>
                  </div>
                </Link>

                {/* Social Links - Outside of Link component */}
                {(image.user?.instagram || image.user?.twitter || image.user?.website) && (
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    {image.user?.website && (
                      <a
                        href={
                          image.user.website.startsWith('http')
                            ? image.user.website
                            : `https://${image.user.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        <Globe className="h-3 w-3" />
                        网站
                      </a>
                    )}
                    {image.user?.instagram && (
                      <a
                        href={`https://instagram.com/${image.user.instagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="h-3 w-3" />@{image.user.instagram.replace(/^@/, '')}
                      </a>
                    )}
                    {image.user?.twitter && (
                      <a
                        href={`https://twitter.com/${image.user.twitter.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                      >
                        <Twitter className="h-3 w-3" />@{image.user.twitter.replace(/^@/, '')}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* EXIF Info */}
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
                <h3 className="mb-3 sm:mb-4 font-semibold text-gray-900 text-sm sm:text-base">
                  图片信息
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {(exifData.cameraMake || exifData.cameraModel) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-sm">
                        {exifData.cameraMake} {exifData.cameraModel}
                      </span>
                    </div>
                  )}
                  {exifData.dateTaken && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-sm">{exifData.dateTaken}</span>
                    </div>
                  )}
                  {exifData.gps && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-sm">{exifData.gps}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                    <span className="text-xs sm:text-sm text-gray-400">尺寸</span>
                    <span className="text-xs sm:text-sm">
                      {image.width} × {image.height} px
                    </span>
                  </div>
                  {exifData.iso && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <span className="text-xs sm:text-sm text-gray-400">ISO</span>
                      <span className="text-xs sm:text-sm">{exifData.iso}</span>
                    </div>
                  )}
                  {exifData.aperture && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <span className="text-xs sm:text-sm text-gray-400">光圈</span>
                      <span className="text-xs sm:text-sm">{exifData.aperture}</span>
                    </div>
                  )}
                  {exifData.shutterSpeed && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <span className="text-xs sm:text-sm text-gray-400">快门</span>
                      <span className="text-xs sm:text-sm">{exifData.shutterSpeed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Buttons */}
              <DownloadButtons
                imageId={id}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
              />
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-12 sm:mt-16 max-w-4xl">
            <CommentSection imageId={id} />
          </div>

          {/* More from this photographer */}
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">该摄影师的其他作品</h2>
              <Link
                href={`/user/${image.userId}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                查看全部 →
              </Link>
            </div>
            <ImageGrid
              apiUrl={`/api/images?userId=${image.userId}&excludeId=${id}&limit=6`}
              showLoadMore={false}
            />
          </div>

          {/* Similar Images */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">相似图片</h2>
            <ImageGrid apiUrl={similarImagesApiUrl} showLoadMore={false} />
          </div>
        </div>
      </div>
    </>
  );
}
