import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateImageEmbedding, serializeEmbedding } from '../lib/embedding';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function generateAll() {
  console.log('Fetching approved images without embeddings...');
  
  const approvedImages = await db.query.images.findMany({
    where: eq(images.status, 'approved'),
    columns: { id: true, cosKey: true },
  });
  
  const existing = await db.select({ imageId: imageEmbeddings.imageId }).from(imageEmbeddings);
  const existingIds = new Set(existing.map(e => e.imageId));
  
  const toProcess = approvedImages.filter(img => !existingIds.has(img.id));
  console.log(`Found ${toProcess.length} images to process`);
  
  for (const image of toProcess) {
    const url = `https://tukupic.mepai.me/${image.cosKey}`;
    console.log(`Processing: ${url}`);
    
    try {
      const embedding = await generateImageEmbedding(url);
      await db.insert(imageEmbeddings).values({
        id: uuidv4(),
        imageId: image.id,
        embedding: serializeEmbedding(embedding),
        createdAt: new Date(),
      });
      console.log(`✓ Done: ${image.id}`);
    } catch (err) {
      console.error(`✗ Failed: ${image.id}`, err);
    }
  }
  
  console.log('Complete!');
  process.exit(0);
}

generateAll().catch(console.error);
