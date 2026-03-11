import { generateImageEmbedding, generateTextEmbedding, cosineSimilarity } from '../lib/embedding';

const imageId = 'b156e5ad-de88-4dc9-a95b-a7dc5f46c7b9';
const cosKey = 'users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/c5464f25-b83c-4f36-9a86-fd378011aa48.jpeg';

const thumbUrl = `https://tukupic.mepai.me/${cosKey}/thumb`;
const originalUrl = `https://tukupic.mepai.me/${cosKey}`;

async function compare() {
  console.log('对比缩略图 vs 原图的 embedding 差异...\n');
  
  console.log('1. 生成缩略图 embedding...');
  const thumbEmbed = await generateImageEmbedding(thumbUrl);
  
  console.log('2. 生成原图 embedding...');
  const origEmbed = await generateImageEmbedding(originalUrl);
  
  console.log('\n3. 对比不同查询词的相似度:\n');
  
  const queries = ['人', '海', '山', '肖像', '自然'];
  
  console.log('查询词      | 缩略图相似度 | 原图相似度 | 差异');
  console.log('──────────┼───────────┼─────────┼──────');
  
  for (const query of queries) {
    const textEmbed = await generateTextEmbedding(query);
    const thumbSim = cosineSimilarity(textEmbed, thumbEmbed);
    const origSim = cosineSimilarity(textEmbed, origEmbed);
    const diff = origSim - thumbSim;
    
    console.log(`${query.padEnd(8)} | ${thumbSim.toFixed(4)}      | ${origSim.toFixed(4)}    | ${diff > 0 ? '+' : ''}${diff.toFixed(4)}`);
  }
  
  console.log('\n4. 缩略图 vs 原图的相似度:', cosineSimilarity(thumbEmbed, origEmbed).toFixed(4));
  
  process.exit(0);
}

compare();
