import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  console.log('Generating embeddings using local URLs...');
  
  const allImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    columns: { id: true, cosKey: true },
  });
  
  // Clear old embeddings
  await db.delete(imageEmbeddings);
  
  for (const image of allImages) {
    // Use localhost URL
    const url = `http://localhost:9000/${image.cosKey}`;
    console.log(`\nProcessing: ${url}`);
    
    try {
      const embedding = await generateImageEmbedding(url);
      await db.insert(imageEmbeddings).values({
        id: uuidv4(),
        imageId: image.id,
        embedding: serializeEmbedding(embedding),
        createdAt: new Date(),
      });
      console.log(`✓ Success (${embedding.length} dims)`);
    } catch (err: any) {
      console.error(`✗ Failed: ${err.message}`);
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
}

main().catch(console.error);
