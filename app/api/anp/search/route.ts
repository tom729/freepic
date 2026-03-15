export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, imageEmbeddings, users } from '@/lib/schema';
import { eq, desc, like, sql } from 'drizzle-orm';
import { generateTextEmbedding, cosineSimilarity } from '@/lib/embedding';
import { getImageUrl } from '@/lib/cos';

/**
 * ANP 语义搜索接口
 * 支持关键词搜索和语义搜索
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 });
    }

    // 1. 先做关键词匹配
    const keywordResults = await db
      .select({
        id: images.id,
        description: images.description,
        width: images.width,
        height: images.height,
        blurHash: images.blurHash,
        dominantColor: images.dominantColor,
        likes: images.likes,
        downloads: images.downloads,
        createdAt: images.createdAt,
        userId: images.userId,
        cosKey: images.cosKey,
        // 标记匹配类型
        matchType: sql<string>`'keyword'`.as('match_type'),
      })
      .from(images)
      .where(
        sql`${images.status} = 'approved' AND (${images.description} ILIKE ${'%' + query + '%'})`
      )
      .limit(limit) as any;

    // 2. 如果有嵌入模型，做语义搜索
    interface BaseImageResult {
      id: string;
      description: string | null;
      width: number | null;
      height: number | null;
      blurHash: string | null;
      dominantColor: string | null;
      likes: number | null;
      downloads: number | null;
      createdAt: Date | null;
      userId: string | null;
      cosKey: string;
      matchType?: string;
      similarity?: number;
    }
    type SemanticResult = BaseImageResult & { similarity: number };
    let semanticResults: SemanticResult[] = [];
    try {
      const queryEmbedding = await generateTextEmbedding(query);

      // 获取有嵌入的图片
      const imagesWithEmbedding = await db
        .select({
          id: imageEmbeddings.id,
          imageId: imageEmbeddings.imageId,
          embedding: imageEmbeddings.embedding,
        })
        .from(imageEmbeddings)
        .limit(500);

      // 计算相似度
      const scored = imagesWithEmbedding
        .map((img) => ({
          imageId: img.imageId,
          similarity: cosineSimilarity(queryEmbedding, img.embedding as number[]),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      if (scored.length > 0) {
        const imageIds = scored.map((s) => s.imageId);
        const imageIdToScore = new Map(scored.map((s) => [s.imageId, s.similarity]));

        const queryResults = await db
          .select({
            id: images.id,
            description: images.description,
            width: images.width,
            height: images.height,
            blurHash: images.blurHash,
            dominantColor: images.dominantColor,
            likes: images.likes,
            downloads: images.downloads,
            createdAt: images.createdAt,
            userId: images.userId,
            cosKey: images.cosKey,
          })
          .from(images)
          .where(sql`${images.id} IN ${imageIds} AND ${images.status} = 'approved'`);
        
        // 添加相似度分数
        semanticResults = queryResults.map(img => ({
          ...img,
          similarity: imageIdToScore.get(img.id) || 0
        }));
      }
    } catch (embedError) {
      console.warn('Semantic search failed, using keyword results only:', embedError);
    }

    // 3. 合并结果，去重，优先显示语义相似度高的
    const allResults: Array<{
      id: string;
      description: string | null;
      width: number | null;
      height: number | null;
      blurHash: string | null;
      dominantColor: string | null;
      likes: number | null;
      downloads: number | null;
      createdAt: Date | null;
      userId: string | null;
      cosKey: string;
      matchType?: string;
      similarity?: number;
    }> = [...keywordResults];
    semanticResults.forEach((img) => {
      if (!allResults.find((r) => r.id === img.id)) {
        allResults.push({ ...img, matchType: 'semantic' });
      }
    });

    const userIds = Array.from(new Set(allResults.map((img) => img.userId)));
    const userMap = new Map();
    if (userIds.length > 0) {
      const userList = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        })
        .from(users)
        .where(sql`${users.id} IN ${userIds}`);

      userList.forEach((user) => {
        userMap.set(user.id, user);
      });
    }

    // 5. 构建响应
    const result = allResults.slice(0, limit).map((img) => {
      const user = userMap.get(img.userId);
      return {
        id: img.id,
        description: img.description,
        width: img.width,
        height: img.height,
        blurHash: img.blurHash,
        dominantColor: img.dominantColor,
        likes: img.likes,
        downloads: img.downloads,
        createdAt: img.createdAt,
        matchType: img.matchType || 'semantic',
        similarity: (img as any).similarity || null,
        urls: {
          small: getImageUrl(img.cosKey + '/small'),
          regular: getImageUrl(img.cosKey + '/regular'),
          full: getImageUrl(img.cosKey),
        },
        author: user
          ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            }
          : null,
      };
    });

    return NextResponse.json({
      query,
      results: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
