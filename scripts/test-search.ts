import { generateTextEmbedding, cosineSimilarity, deserializeEmbedding } from '../lib/embedding';
import { db } from '../lib/db';
import { imageEmbeddings } from '../lib/schema';

async function test() {
  try {
    console.log('1. Generating text embedding...');
    const textEmbed = await generateTextEmbedding('海边');
    console.log('✓ Text embedding generated, length:', textEmbed.length);
    
    console.log('\n2. Fetching image embeddings...');
    const imageEmbeds = await db.select().from(imageEmbeddings);
    console.log('✓ Found', imageEmbeds.length, 'image embeddings');
    
    console.log('\n3. Calculating similarities...');
    for (const img of imageEmbeds) {
      const imgEmbed = deserializeEmbedding(img.embedding);
      const similarity = cosineSimilarity(textEmbed, imgEmbed);
      console.log(`  Image ${img.imageId}: similarity = ${similarity.toFixed(4)}`);
    }
    
    console.log('\n✓ All tests passed!');
  } catch (err) {
    console.error('\n✗ Test failed:', err);
  }
  process.exit(0);
}

test();
