/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds (production)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow development origins (for accessing via IP)
  allowedDevOrigins: ['192.168.1.59', 'localhost', '127.0.0.1', '*'],

  // Asset prefix for LAN access (empty for relative paths)
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : undefined,

  // Image optimization configuration
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cos.ap-shanghai.myqcloud.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.myqcloud.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tukupic.mepai.me',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    config.externals.push('onnxruntime-node');
    return config;
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  async headers() {
    return [
      {
        source: '/api/images/:path*',
        headers: [{
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=300',
        }],
      },
      {
        source: '/uploads/:path*',
        headers: [{
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        }],
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
