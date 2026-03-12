import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { uploadImage } from '@/lib/cos';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// 检查是否使用演示模式
const isDemoMode = !process.env.TENCENT_COS_SECRET_ID;

// 头像配置
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB 上传限制
const AVATAR_SIZE = 400; // 输出尺寸 400x400
const JPEG_QUALITY = 90; // JPEG 质量

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const auth = await verifyAuthWithUser(request);

    console.log('[Avatar Upload] Auth result:', { userId: auth.userId, hasUser: !!auth.user, userIdFromUser: auth.user?.id });

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.id) {
      console.error('[Avatar Upload] User ID is undefined');
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    console.log('[Avatar Upload] User ID:', auth.user.id);

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('[Avatar Upload] File:', file.name, 'Size:', file.size, 'Type:', file.type);

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 获取文件buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 处理图片：压缩、调整大小、圆形裁剪
    let sharpInstance = sharp(buffer);

    // 获取图片元数据
    const metadata = await sharpInstance.metadata();
    console.log('[Avatar Upload] Original:', metadata.width, 'x', metadata.height);

    // 计算圆形裁剪区域（以中心为正方形）
    const width = metadata.width || AVATAR_SIZE;
    const height = metadata.height || AVATAR_SIZE;
    const size = Math.min(width, height);
    const left = Math.round((width - size) / 2);
    const top = Math.round((height - size) / 2);

    // 处理步骤：
    // 1. 提取中心正方形区域
    // 2. 调整大小为 400x400
    // 3. 创建圆形蒙版
    // 4. 压缩输出
    const processedBuffer = await sharpInstance
      .extract({ left, top, width: size, height: size }) // 提取中心正方形
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: JPEG_QUALITY,
        progressive: true,
        optimizeCoding: true,
      })
      .toBuffer();

    console.log('[Avatar Upload] Processed size:', processedBuffer.length);

    let avatarUrl: string;

    if (isDemoMode) {
      // 演示模式：保存到本地
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, processedBuffer);

      avatarUrl = `/uploads/avatars/${filename}`;
      console.log('[Avatar Upload] Saved locally:', avatarUrl);
    } else {
      // 生产模式：上传到COS
      console.log('[Avatar Upload] auth.user:', auth.user);
      console.log('[Avatar Upload] auth.user.id:', auth.user?.id);
      console.log('[Avatar Upload] auth.userId:', auth.userId);
      const userId = auth.user?.id || auth.userId;
      const filename = `avatar-${uuidv4()}.jpg`;
      console.log('[Avatar Upload] Generated filename:', filename);
      console.log('[Avatar Upload] UserId for upload:', userId);
      const result = await uploadImage(processedBuffer, filename, 'image/jpeg', userId!);
      avatarUrl = result.url;
      console.log('[Avatar Upload] Uploaded to COS:', avatarUrl);
    }

    // 更新用户头像
    const userIdForUpdate = auth.user?.id || auth.userId;
    await db
      .update(users)
      .set({
        avatar: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userIdForUpdate!));

    return NextResponse.json({
      success: true,
      avatarUrl,
    });
  } catch (error) {
    console.error('[Avatar Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
