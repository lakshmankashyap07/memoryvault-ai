import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { aiService } from '@/lib/services/ai-service';
import { EmbeddingService } from '@/lib/services/embedding-service';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { memorySpaceId, memoryId, memoryType, mediaUrl, caption, location, title } = await req.json();

    if (!memorySpaceId || !memoryId || !memoryType) {
      return NextResponse.json({ error: 'MemorySpace ID, memory ID, and memory type required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findUnique({
      where: { id: memorySpaceId },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory space not found' }, { status: 404 });
    }

    let analysisResult: any = {};

    if (memoryType === 'PHOTO') {
      analysisResult = await aiService.analyzePhoto(mediaUrl, caption, location);
    } else if (memoryType === 'VIDEO') {
      analysisResult = await aiService.analyzeVideo(title, caption);
    }

    // Store AI analysis record
    await prisma.aIAnalysis.create({
      data: {
        memorySpaceId: space.id,
        memoryId,
        type: `${memoryType}_ANALYSIS`,
        result: JSON.stringify(analysisResult),
      },
    });

    // Auto-suggest AI tags
    if (analysisResult.tags && Array.isArray(analysisResult.tags)) {
      for (const tag of analysisResult.tags) {
        try {
          await prisma.memoryTag.create({
            data: {
              memorySpaceId: space.id,
              memoryId,
              tag,
              source: 'AI',
            },
          });
        } catch {
          // Ignore duplicate tag errors
        }
      }
    }

    // Index embedding for vector search
    const contentToIndex = `${title || ''} ${caption || ''} ${location || ''} ${analysisResult.description || analysisResult.summary || ''}`;
    await EmbeddingService.indexMemoryContent(space.id, memoryType, memoryId, contentToIndex);

    return NextResponse.json({ analysis: analysisResult, success: true });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze memory' }, { status: 500 });
  }
}
