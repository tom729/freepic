import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('使用缩略图 URL 生成 embedding...\n');

  // 获取所有 approved 且没有 embedding 的图片
  const approvedImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    columns: { id: true, cosKey: true },
  });

  const existing = await db.select({ imageId: imageEmbeddings.imageId }).from(imageEmbeddings);
  const existingIds = new Set(existing.map((e) => e.imageId));

  const toProcess = approvedImages.filter((img) => !existingIds.has(img.id));

  if (toProcess.length === 0) {
    console.log('所有图片已有 embedding，无需处理');
    process.exit(0);
  }

  console.log(`找到 ${toProcess.length} 张图片需要生成 embedding\n`);

  for (const image of toProcess) {
    // 使用缩略图 URL (尺寸更小，加载更快，且不需要 COS 签名)
    const thumbnailUrl = `https://tukupic.mepai.me/${image.cosKey}/thumb`;
    console.log(`处理: ${image.id}`);
    console.log(`  URL: ${thumbnailUrl}`);

    try {
      const embedding = await generateImageEmbedding(thumbnailUrl);

      await db.insert(imageEmbeddings).values({
        id: uuidv4(),
        imageId: image.id,
        embedding: serializeEmbedding(embedding),
        createdAt: new Date(),
      });

      console.log(`  ✓ 成功生成 embedding (${embedding.length} 维度)\n`);
    } catch (err: any) {
      console.error(`  ✗ 失败: ${err.message}\n`);
    }
  }

  console.log('处理完成！');
  process.exit(0);
}

main().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
