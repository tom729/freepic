// Test the full semantic search flow like the API does
import { generateTextEmbedding, cosineSimilarity, deserializeEmbedding } from '../lib/embedding';
import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { eq, and, sql } from 'drizzle-orm';

async function getImageUrls(cosKey: string) {
  const baseUrl = `https://tukupic.mepai.me/${cosKey}`;
  return {
    url: baseUrl,
    thumbnailUrl: `${baseUrl}/thumb`,
    smallUrl: `${baseUrl}/small`,
    regularUrl: `${baseUrl}/regular`,
    fullUrl: `${baseUrl}/full`,
    originalUrl: baseUrl,
  };
}

async function test() {
  try {
    const query = '海边';
    console.log('1. Generating text embedding...');
    const queryEmbedding = await generateTextEmbedding(query);
    
    console.log('2. Fetching image embeddings...');
    const embeddingsData = await db.select().from(imageEmbeddings);
    console.log(`   Found ${embeddingsData.length} embeddings`);
    
    console.log('3. Calculating similarities...');
    const scoredImages = embeddingsData.map((item) => {
      const imageEmbedding = deserializeEmbedding(item.embedding);
      const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);
      return { imageId: item.imageId, similarity };
    });
    
    const topResults = scoredImages.sort((a, b) => b.similarity - a.similarity);
    console.log('   Top similarities:', topResults.map(r => `${r.imageId.slice(0, 8)}: ${r.similarity.toFixed(4)}`));
    
    console.log('4. Fetching image details...');
    const imageIds = topResults.map((r) => r.imageId);
    const imagesList = await db
      .select({
        id: images.id,
        cosKey: images.cosKey,
        width: images.width,
        height: images.height,
        likes: images.likes,
        downloads: images.downloads,
        createdAt: images.createdAt,
        exifData: images.exifData,
        blurHash: images.blurHash,
        dominantColor: images.dominantColor,
        userId: images.userId,
      })
      .from(images)
      .where(and(
        eq(images.status, 'approved'),
        sql`${images.id} IN (${sql.join(imageIds.map((id) => sql`${id}`))})`
      ));
    
    console.log(`   Found ${imagesList.length} images`);
    
    console.log('5. Formatting results...');
    const formattedImages = await Promise.all(
      imagesList.map(async (img) => {
        const similarity = topResults.find((r) => r.imageId === img.id)?.similarity || 0;
        const urls = await getImageUrls(img.cosKey);
        return {
          id: img.id,
          ...urls,
          similarity: Math.round(similarity * 100) / 100,
        };
      })
    );
    
    console.log('\n✓ Success! Results:', formattedImages.length);
    console.log(JSON.stringify(formattedImages, null, 2));
  } catch (err: any) {
    console.error('\n✗ Error:', err.message);
    console.error(err.stack);
  }
  process.exit(0);
}

test();
