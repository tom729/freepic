import { db } from '../lib/db';
import { imageEmbeddings } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const imageId = 'b156e5ad-de88-4dc9-a95b-a7dc5f46c7b9';
  const cosKey = 'users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/c5464f25-b83c-4f36-9a86-fd378011aa48.jpeg';
  
  const thumbnailUrl = `https://tukupic.mepai.me/${cosKey}/thumb`;
  console.log(`生成 embedding: ${thumbnailUrl}`);
  
  try {
    const embedding = await generateImageEmbedding(thumbnailUrl);
    await db.insert(imageEmbeddings).values({
      id: uuidv4(),
      imageId,
      embedding: serializeEmbedding(embedding),
      createdAt: new Date(),
    });
    console.log(`✓ 成功 (${embedding.length} 维度)`);
  } catch (err: any) {
    console.error(`✗ 失败: ${err.message}`);
  }
  
  process.exit(0);
}

main();
