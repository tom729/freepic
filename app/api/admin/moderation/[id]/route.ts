export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const { isAuthenticated, user } = await verifyAuthWithUser(request);
  
  if (!isAuthenticated) {
    return { isAdmin: false, error: '请先登录', status: 401 };
  }
  
  if (!user?.isAdmin) {
    return { isAdmin: false, error: '无管理员权限', status: 403 };
  }
  
  return { isAdmin: true, user };
}

// 手动审核图片
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const { id } = params;
    const body = await request.json();
    const { action, reason } = body;
    // 验证参数
    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    // 检查图片是否存在
    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // 更新状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db
      .update(images)
      .set({
        status: newStatus,
        exifData: {
          ...(image.exifData as Record<string, unknown>),
          moderationReason: reason || null,
          moderatedAt: new Date().toISOString(),
        },
      })
      .where(eq(images.id, id));

    // 如果审核通过，生成语义搜索 embedding
    if (action === 'approve') {
      try {
        const { queueEmbeddingGeneration } = await import('@/lib/embedding-queue');
        const imageUrl = image.cosKey.startsWith('users/')
          ? `https://tukupic.mepai.me/${image.cosKey}`
          : `/${image.cosKey}`;
        queueEmbeddingGeneration(id, imageUrl);
        console.log(`[Moderation] Queued embedding generation for approved image ${id}`);
      } catch (err) {
        console.error(`[Moderation] Failed to queue embedding for ${id}:`, err);
        // 不阻塞审核流程，embedding 失败可以后续重试
      }
    }

    return NextResponse.json({
      success: true,
      imageId: id,
      status: newStatus,
      action,
    });
  } catch (error) {
    console.error('Moderation failed:', error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }

}
// 删除图片
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // 检查图片是否存在
    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // 删除关联的 embedding
    const { imageEmbeddings } = await import('@/lib/schema');
    await db.delete(imageEmbeddings).where(eq(imageEmbeddings.imageId, id));

    // 删除图片记录
    await db.delete(images).where(eq(images.id, id));

    console.log(`[Moderation] Deleted image ${id}`);

    return NextResponse.json({
      success: true,
      imageId: id,
      action: 'delete',
    });
  } catch (error) {
    console.error('Delete failed:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
