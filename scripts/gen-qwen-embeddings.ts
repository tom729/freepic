// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });


import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('使用 Qwen3-VL 生成图片 embedding...\n');

  const approvedImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    columns: { id: true, cosKey: true },
  });

  console.log(`找到 ${approvedImages.length} 张图片\n`);

  for (const image of approvedImages) {
    const thumbnailUrl = `https://tukupic.mepai.me/${image.cosKey}/thumb`;
    console.log(`处理: ${image.id.slice(0, 8)}`);
    console.log(`  URL: ${thumbnailUrl}`);

    try {
      const embedding = await generateImageEmbedding(thumbnailUrl);
      await db.insert(imageEmbeddings).values({
        id: uuidv4(),
        imageId: image.id,
        embedding: serializeEmbedding(embedding),
        createdAt: new Date(),
      });
      console.log(`  ✓ 成功 (${embedding.length} 维度)\n`);
    } catch (err: any) {
      console.error(`  ✗ 失败: ${err.message}\n`);
    }
  }

  console.log('处理完成！');
  process.exit(0);
}

main().catch(console.error);
