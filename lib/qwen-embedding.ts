/**
 * Qwen-VL Embedding Service (Alibaba Cloud Bailian)
 * Replaces local CLIP with cloud-based Qwen3-VL-embedding
 *
 * Required:
 * - DASHSCOPE_API_KEY in .env.local
 * - Model name: qwen-vl-embedding-v1 (or similar)
 */

// Configuration
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const EMBEDDING_MODEL = 'qwen-vl-embedding-v1'; // Update with correct model name

interface EmbeddingResponse {
  output: {
    embeddings: Array<{
      embedding: number[];
      text_index?: number;
      image_index?: number;
    }>;
  };
  usage: {
    total_tokens: number;
  };
}

/**
 * Generate text embedding using Qwen-VL
 */
export async function generateTextEmbeddingQwen(text: string): Promise<number[]> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: {
        texts: [text],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API error: ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.output.embeddings[0].embedding;
}

/**
 * Generate image embedding using Qwen-VL
 * Supports image URL or base64
 */
export async function generateImageEmbeddingQwen(imageUrl: string): Promise<number[]> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: {
        images: [imageUrl], // Qwen-VL supports image URLs
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qwen API error: ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.output.embeddings[0].embedding;
}

/**
 * Calculate cosine similarity (same as CLIP version)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
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
 * Serialize embedding for storage
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
