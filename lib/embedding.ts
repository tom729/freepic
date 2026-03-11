import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Qwen3-VL Embedding Service (Alibaba Cloud Bailian)
 * Uses cloud-based qwen3-vl-embedding model for text and image embeddings
 *
 * Model: qwen3-vl-embedding
 * Endpoint: POST https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding
 * Dimensions: 2560 (default), supports 256-2560
 */

// Configuration
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding';
const EMBEDDING_MODEL = 'qwen3-vl-embedding';

interface EmbeddingResponse {
  output: {
    embeddings: Array<{
      embedding: number[];
      index: number;
      type: 'text' | 'image' | 'video';
    }>;
  };
  usage: {
    input_tokens?: number;
    image_tokens?: number;
  };
  request_id: string;
}

/**
 * Generate text embedding using Qwen3-VL
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured in .env.local');
  }

  console.log('[Qwen3-VL] Generating text embedding...');

  const response = await fetch(`${DASHSCOPE_BASE_URL}/multimodal-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: {
        contents: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Qwen3-VL] API error:', error);
    throw new Error(`Qwen3-VL API error: ${response.status} ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  const embedding = data.output.embeddings[0]?.embedding;

  if (!embedding) {
    throw new Error('No text embedding returned from API');
  }

  console.log(`[Qwen3-VL] Text embedding generated: ${embedding.length} dims`);
  return embedding;
}

/**
 * Generate image embedding using Qwen3-VL
 * Supports image URL (public accessible)
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured in .env.local');
  }

  console.log('[Qwen3-VL] Generating image embedding...');
  console.log(`[Qwen3-VL] Image URL: ${imageUrl}`);

  const response = await fetch(`${DASHSCOPE_BASE_URL}/multimodal-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: {
        contents: [{ image: imageUrl }],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Qwen3-VL] API error:', error);
    throw new Error(`Qwen3-VL API error: ${response.status} ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  const embedding = data.output.embeddings[0]?.embedding;

  if (!embedding) {
    throw new Error('No image embedding returned from API');
  }

  console.log(`[Qwen3-VL] Image embedding generated: ${embedding.length} dims`);
  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vectors must have same dimension: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Serialize embedding for storage (JSON string)
 */
export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}

/**
 * Deserialize embedding from storage
 */
export function deserializeEmbedding(serialized: string): number[] {
  return JSON.parse(serialized);
}
