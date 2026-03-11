// Quick embedding generator - run this once to download and cache CLIP model
import { pipeline } from '@xenova/transformers';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('./database/sqlite.db');

async function main() {
  console.log('Loading CLIP model (first time may take 2-3 minutes)...');
  const startTime = Date.now();
  
  const extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
    quantized: true,
    dtype: 'q8',
  });
  
  console.log(`Model loaded in ${(Date.now() - startTime) / 1000}s`);
  
  // Get approved images
  const images = db.prepare("SELECT id, cos_key FROM images WHERE status = 'approved'").all();
  const existing = db.prepare('SELECT image_id FROM image_embeddings').all();
  const existingIds = new Set(existing.map((e: any) => e.image_id));
  
  const toProcess = images.filter((img: any) => !existingIds.has(img.id));
  console.log(`Processing ${toProcess.length} images...`);
  
  for (const img of toProcess) {
    const url = `https://tukupic.mepai.me/${img.cos_key}`;
    try {
      console.log(`Processing ${img.id}...`);
      const result = await extractor(url);
      const embedding = Array.from(result[0].data);
      
      db.prepare('INSERT INTO image_embeddings (id, image_id, embedding, created_at) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), img.id, JSON.stringify(embedding), Date.now());
      
      console.log(`✓ ${img.id}`);
    } catch (err: any) {
      console.error(`✗ ${img.id}: ${err.message}`);
    }
  }
  
  console.log('Done!');
  db.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
