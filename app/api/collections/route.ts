export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  imageCount: number;
}

const collections: Collection[] = [
  {
    id: 'landscape',
    name: '风景摄影',
    description: '壮丽的山川湖海，记录大自然的鬼斧神工',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    imageCount: 1280,
  },
  {
    id: 'cityscape',
    name: '城市建筑',
    description: '现代都市的天际线与建筑艺术',
    coverImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600',
    imageCount: 856,
  },
  {
    id: 'portrait',
    name: '人像精选',
    description: '捕捉人物最真实动人的瞬间',
    coverImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
    imageCount: 2045,
  },
  {
    id: 'nature',
    name: '自然之美',
    description: '动植物与微距摄影的奇妙世界',
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
    imageCount: 1567,
  },
  {
    id: 'food',
    name: '美食摄影',
    description: '舌尖上的视觉盛宴',
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    imageCount: 634,
  },
  {
    id: 'abstract',
    name: '抽象艺术',
    description: '光影色彩构成的艺术表达',
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600',
    imageCount: 423,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      collections,
    });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}
