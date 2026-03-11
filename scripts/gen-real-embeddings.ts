import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('Fetching approved images...');
  
  const allImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    columns: { id: true, cosKey: true },
  });
  
  // Delete old mock embeddings
  await db.delete(imageEmbeddings);
  console.log('Cleared old embeddings');
  
  console.log(`Generating embeddings for ${allImages.length} images...`);
  
  for (const image of allImages) {
    const url = `https://tukupic.mepai.me/${image.cosKey}`;
    console.log(`\nProcessing: ${image.id}`);
    
    try {
      const embedding = await generateImageEmbedding(url);
      await db.insert(imageEmbeddings).values({
        id: uuidv4(),
        imageId: image.id,
        embedding: serializeEmbedding(embedding),
        createdAt: new Date(),
      });
      console.log(`✓ Generated embedding (${embedding.length} dims)`);
    } catch (err: any) {
      console.error(`✗ Failed: ${err.message}`);
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
}

main().catch(console.error);
