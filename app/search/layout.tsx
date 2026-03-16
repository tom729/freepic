import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '搜索图片 - 免费高清无版权图片',
  description: '搜索和发现高质量无版权图片，支持关键词搜索和AI语义搜索',
  keywords: ['图片搜索', '无版权图片', '免费图片', 'AI搜索', '语义搜索'],
  openGraph: {
    title: '搜索图片 - FreePic',
    description: '搜索和发现高质量无版权图片',
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
