export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images } from '@/lib/schema';
import { eq, desc, like, or, sql } from 'drizzle-orm';

/**
 * ANP 协议兼容的站点能力清单
 *
 * 外部 Agent 可以通过此端点发现站点支持的功能
 */
export async function GET(request: NextRequest) {
  try {
    // 统计信息
    const stats = await db
      .select({
        totalImages: sql<number>`count(*)`,
      })
      .from(images)
      .where(eq(images.status, 'approved'));

    const capabilities = {
      protocol: 'ANP/1.0',
      name: 'FreePic API',
      version: '1.0.0',
      description: '免费图片分享平台的 API 服务',
      endpoints: {
        capabilities: {
          path: '/api/anp/capabilities',
          method: 'GET',
          description: '获取站点能力清单',
        },
        images: {
          path: '/api/anp/images',
          method: 'GET',
          description: '获取图片列表',
          params: {
            page: '页码 (默认1)',
            limit: '每页数量 (默认20, 最大100)',
            sort: '排序方式: new, popular, random',
          },
        },
        search: {
          path: '/api/anp/search',
          method: 'GET',
          description: '语义搜索图片',
          params: {
            q: '搜索关键词',
            limit: '返回数量 (默认10)',
          },
        },
        upload: {
          path: '/api/anp/upload',
          method: 'POST',
          description: '上传图片 (需要认证)',
          params: {
            file: '图片文件',
            description: '图片描述',
            tags: '标签 (逗号分隔)',
          },
        },
      },
      limits: {
        default_daily: 100,
        upload_cost: 5,
        search_cost: 1,
        browse_cost: 1,
      },
      auth: {
        type: 'api_key',
        header: 'x-api-key',
        prefix: 'fp_',
      },
      stats: {
        total_images: stats[0]?.totalImages || 0,
      },
    };

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error('Failed to get capabilities:', error);
    return NextResponse.json({ error: 'Failed to get capabilities' }, { status: 500 });
  }
}
