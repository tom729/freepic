/* eslint-disable @typescript-eslint/no-require-imports */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// 腾讯云内容安全 SDK 类型定义
interface TencentCmsClient {
  ImageModeration(request: unknown): Promise<unknown>;
}

let CmsClient: new (config: { credential: { secretId: string; secretKey: string }; region: string; profile: unknown }) => TencentCmsClient;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tencentcloud = require('tencentcloud-sdk-nodejs');
  CmsClient = tencentcloud.cms.v20190321.Client;
} catch {
  console.warn('腾讯云 CMS SDK 未安装');
}

// 创建内容安全客户端
function createCmsClient() {
  if (!CmsClient) {
    throw new Error('腾讯云 CMS SDK 未安装');
  }

  const secretId = process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_COS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error('缺少腾讯云密钥配置');
  }

  return new CmsClient({
    credential: {
      secretId,
      secretKey,
    },
    region: 'ap-beijing',
    profile: {
      signMethod: 'HmacSHA256',
      httpProfile: {
        reqMethod: 'POST',
        reqTimeout: 30,
      },
    },
  });
}

// 审核结果类型
interface ModerationResult {
  suggestion: 'pass' | 'review' | 'block';
  label: string;
  confidence: number;
  details: Array<{
    label: string;
    confidence: number;
  }>;
}

// 图片内容审核
export async function POST(request: NextRequest) {
  try {
    const { imageId, imageUrl } = await request.json();

    if (!imageId || !imageUrl) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 查找图片
    const image = await db.query.images.findFirst({
      where: eq(images.id, imageId),
    });

    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 });
    }

    // 开发模式：自动通过
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] 自动审核通过: ${imageId}`);
      await db.update(images).set({ status: 'approved' }).where(eq(images.id, imageId));

      return NextResponse.json({
        success: true,
        result: {
          suggestion: 'pass',
          label: '正常',
          confidence: 99,
          details: [],
        },
      });
    }

    // 生产模式：调用腾讯云内容安全
    const cmsClient = createCmsClient();

    const params = {
      FileUrl: imageUrl,
      FileMd5: '',
      FileContent: '',
      BizType: process.env.TENCENT_CMS_BIZ_TYPE || '',
    };

    const response = await cmsClient.ImageModeration(params);

    // 解析审核结果
    const result = parseModerationResult(response);

    // 根据审核结果更新图片状态
    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

    switch (result.suggestion) {
      case 'pass':
        newStatus = 'approved';
        break;
      case 'block':
        newStatus = 'rejected';
        break;
      case 'review':
      default:
        newStatus = 'pending';
        break;
    }

    // 更新图片状态和审核结果
    const existingExifData = (image.exifData as Record<string, any>) || {};
    await db
      .update(images)
      .set({
        status: newStatus,
        exifData: {
          ...existingExifData,
          moderationResult: result,
        },
      })
      .where(eq(images.id, imageId));

    return NextResponse.json({
      success: true,
      result,
      status: newStatus,
    });
  } catch (error) {
    console.error('内容审核失败:', error);
    return NextResponse.json({ error: '审核失败，请稍后重试' }, { status: 500 });
  }
}

// 解析腾讯云审核结果
function parseModerationResult(response: any): ModerationResult {
  const defaultResult: ModerationResult = {
    suggestion: 'review',
    label: '未知',
    confidence: 0,
    details: [],
  };

  if (!response) {
    return defaultResult;
  }

  const suggestion = response.Suggestion || 'review';
  const label = response.Label || '未知';
  const confidence = response.Confidence || 0;

  const details: Array<{ label: string; confidence: number }> = [];

  if (response.HitFlag && Array.isArray(response.HitFlag)) {
    response.HitFlag.forEach((item: any) => {
      if (item.Label && item.Score) {
        details.push({
          label: item.Label,
          confidence: item.Score,
        });
      }
    });
  }

  return {
    suggestion: suggestion as 'pass' | 'review' | 'block',
    label,
    confidence,
    details,
  };
}

// 查询审核状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: '缺少图片ID' }, { status: 400 });
    }

    const image = await db.query.images.findFirst({
      where: eq(images.id, imageId),
      columns: {
        id: true,
        status: true,
        exifData: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 });
    }

    const moderationResult = (image.exifData as any)?.moderationResult;

    return NextResponse.json({
      imageId: image.id,
      status: image.status,
      result: moderationResult || null,
    });
  } catch (error) {
    console.error('查询审核状态失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
