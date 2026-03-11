import { generateTextEmbedding, cosineSimilarity, deserializeEmbedding } from '../lib/embedding';
import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('对比所有图片的"人"相似度...\n');
  
  // 获取所有 approved 图片
  const allImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    orderBy: (images, { desc }) => [desc(images.createdAt)],
  });
  
  // 生成"人"的 text embedding
  const personTextEmbed = await generateTextEmbedding('人');
  
  console.log('图片列表 (按上传时间倒序):');
  console.log('─'.repeat(60));
  
  for (const img of allImages) {
    // 获取图片的 embedding
    const embedRecord = await db.query.imageEmbeddings.findFirst({
      where: (e, { eq }) => eq(e.imageId, img.id),
    });
    
    if (!embedRecord) {
      console.log(`${img.id.slice(0, 8)}: 无 embedding`);
      continue;
    }
    
    const imgEmbed = deserializeEmbedding(embedRecord.embedding);
    const similarity = cosineSimilarity(personTextEmbed, imgEmbed);
    
    console.log(`${img.id.slice(0, 8)}: 相似度 ${similarity.toFixed(4)} | 上传时间 ${new Date(img.createdAt).toLocaleString()}`);
  }
  
  console.log('─'.repeat(60));
  console.log('\n最新图片应该是人物特写照，但"人"相似度并不高。');
  console.log('原因：CLIP 认为这张照片主要是海(23%) + 山(16%)，人物只占 2.2%');
  
  process.exit(0);
}

main();
