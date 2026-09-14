import { prisma } from '@/lib/db';

export interface SimilarityResult {
  id: string;
  memorySpaceId: string;
  memoryType: string;
  memoryId: string;
  content: string;
  similarity: number;
}

/**
 * Generates a normalized 64-dimensional float vector embedding for any text string.
 * Works deterministically for natural language retrieval and semantic similarity matching.
 */
export function generateTextVector(text: string, dimensions = 64): number[] {
  const normalizedText = text.toLowerCase().replaceAll(/[^a-z0-9\s]/g, '');
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const vector = new Array(dimensions).fill(0);

  if (words.length === 0) return vector;

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class EmbeddingService {
  /**
   * Index or update a memory item's vector embedding in the database.
   */
  static async indexMemoryContent(
    memorySpaceId: string,
    memoryType: string,
    memoryId: string,
    content: string
  ) {
    try {
      const vector = generateTextVector(content);
      const vectorJson = JSON.stringify(vector);

      const existing = await prisma.memoryEmbedding.findFirst({
        where: { memorySpaceId, memoryType, memoryId },
      });

      if (existing) {
        return await prisma.memoryEmbedding.update({
          where: { id: existing.id },
          data: { content, embedding: vectorJson },
        });
      }

      return await prisma.memoryEmbedding.create({
        data: {
          memorySpaceId,
          memoryType,
          memoryId,
          content,
          embedding: vectorJson,
        },
      });
    } catch (error) {
      console.error('Embedding index error:', error);
      return null;
    }
  }

  /**
   * Performs semantic vector search over all indexed memories in a specific Memory Space.
   * NEVER returns memories from another space (enforces strict space isolation).
   */
  static async findSimilarMemories(
    memorySpaceId: string,
    queryText: string,
    topK = 8,
    memoryTypeFilter?: string
  ): Promise<SimilarityResult[]> {
    try {
      const queryVector = generateTextVector(queryText);

      const whereClause: any = { memorySpaceId };
      if (memoryTypeFilter) {
        whereClause.memoryType = memoryTypeFilter;
      }

      const allEmbeddings = await prisma.memoryEmbedding.findMany({
        where: whereClause,
      });

      const scoredResults: SimilarityResult[] = [];

      for (const item of allEmbeddings) {
        try {
          const itemVector: number[] = JSON.parse(item.embedding);
          let similarity = calculateCosineSimilarity(queryVector, itemVector);

          // Add subtle keyword overlap boost for exact match precision
          const lowerQuery = queryText.toLowerCase();
          const lowerContent = item.content.toLowerCase();

          const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
          let wordMatches = 0;
          for (const w of words) {
            if (lowerContent.includes(w)) wordMatches++;
          }

          if (words.length > 0 && wordMatches > 0) {
            similarity = similarity * 0.7 + (wordMatches / words.length) * 0.3;
          }

          scoredResults.push({
            id: item.id,
            memorySpaceId: item.memorySpaceId,
            memoryType: item.memoryType,
            memoryId: item.memoryId,
            content: item.content,
            similarity,
          });
        } catch {
          // Ignore parse errors on individual rows
        }
      }

      // Sort by similarity descending
      scoredResults.sort((a, b) => b.similarity - a.similarity);

      return scoredResults.slice(0, topK);
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }
}
