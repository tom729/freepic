import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { imageEmbeddings, images } from '../lib/schema';
import { generateTextEmbedding, deserializeEmbedding, cosineSimilarity } from '../lib/embedding';
import { eq } from 'drizzle-orm';

async function test() {
  console.log('测试 Qwen3-VL 中文语义搜索...\n');

  // Test queries
  const queries = ['人', '海', '海边', '人物', '大海', '天空'];

  // Get all embeddings
  const embeddings = await db.query.imageEmbeddings.findMany({
    with: {
      image: {
        columns: { id: true, cosKey: true },
      },
    },
  });

  console.log(`数据库中有 ${embeddings.length} 个 embedding\n`);

  for (const query of queries) {
    console.log(`\n=== 查询: "${query}" ===`);

    try {
      const queryEmbedding = await generateTextEmbedding(query);

      const results = embeddings.map((e) => {
        const imageEmbedding = deserializeEmbedding(e.embedding);
        const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);
        return {
          id: e.image.id.slice(0, 8),
          cosKey: e.image.cosKey.split('/').pop()?.slice(0, 20),
          similarity,
        };
      });

      results.sort((a, b) => b.similarity - a.similarity);

      console.log('Top 5 结果:');
      results.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.id} ${r.cosKey}... 相似度: ${r.similarity.toFixed(4)}`);
      });
    } catch (err: any) {
      console.error(`查询失败: ${err.message}`);
    }
  }

  process.exit(0);
}

test();
