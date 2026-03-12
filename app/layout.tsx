import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';



export const metadata: Metadata = {
  title: {
    default: 'FreePic - 无版权图片库',
    template: '%s | FreePic',
  },
  description: '免费高质量无版权图片分享平台，摄影师和设计师的最佳选择',
  keywords: ['无版权图片', '免费图片', '高清图片', '摄影作品', '免版权图库'],
  authors: [{ name: 'FreePic Team' }],
  creator: 'FreePic',
  publisher: 'FreePic',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: 'FreePic',
    title: 'FreePic - 无版权图片库',
    description: '免费高质量无版权图片分享平台，摄影师和设计师的最佳选择',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'FreePic - 免费高质量图片库',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreePic - 无版权图片库',
    description: '免费高质量无版权图片分享平台',
    images: ['/og-image.jpg'],
    creator: '@freepic',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-gray-50">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
