import { generateTextEmbedding, cosineSimilarity, deserializeEmbedding } from '../lib/embedding';
import { db } from '../lib/db';
import { imageEmbeddings } from '../lib/schema';

async function main() {
  console.log('对比新图片与不同查询词的相似度...\n');
  
  // Get new image embedding
  const newImageEmbed = await db.query.imageEmbeddings.findFirst({
    where: (e, { eq }) => eq(e.imageId, 'b156e5ad-de88-4dc9-a95b-a7dc5f46c7b9'),
  });
  
  if (!newImageEmbed) {
    console.log('未找到新图片的 embedding');
    process.exit(1);
  }
  
  const imgEmbed = deserializeEmbedding(newImageEmbed.embedding);
  
  const queries = ['人', '海', '山', '肖像', '自然', '天空'];
  
  for (const query of queries) {
    const textEmbed = await generateTextEmbedding(query);
    const similarity = cosineSimilarity(textEmbed, imgEmbed);
    console.log(`  "${query}": ${similarity.toFixed(4)}`);
  }
  
  console.log('\n对比其他图片的"人"相似度:');
  const allEmbeds = await db.select().from(imageEmbeddings);
  
  const personTextEmbed = await generateTextEmbedding('人');
  
  for (const e of allEmbeds) {
    const img = deserializeEmbedding(e.embedding);
    const sim = cosineSimilarity(personTextEmbed, img);
    console.log(`  ${e.imageId.slice(0, 8)}: ${sim.toFixed(4)}`);
  }
  
  process.exit(0);
}

main();
