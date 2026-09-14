import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmbeddingService } from '@/lib/services/embedding-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = searchParams.get('memorySpaceId') || searchParams.get('memoryId');
    const targetMemoryId = searchParams.get('targetMemoryId');
    const targetText = searchParams.get('targetText');

    if (!spaceKey || (!targetMemoryId && !targetText)) {
      return NextResponse.json({ error: 'Memory Space ID and target memory identifier required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    let query = targetText || '';
    if (targetMemoryId) {
      const embedding = await prisma.memoryEmbedding.findFirst({
        where: { memorySpaceId: space.id, memoryId: targetMemoryId },
      });
      if (embedding) {
        query = embedding.content;
      }
    }

    if (!query) {
      return NextResponse.json({ related: [] });
    }

    const similar = await EmbeddingService.findSimilarMemories(space.id, query, 5);

    // Filter out the target memory itself
    const filtered = similar.filter((s) => s.memoryId !== targetMemoryId);

    return NextResponse.json({
      related: filtered,
      success: true,
    });
  } catch (error) {
    console.error('Fetch Related Error:', error);
    return NextResponse.json({ error: 'Failed to fetch related memories' }, { status: 500 });
  }
}
