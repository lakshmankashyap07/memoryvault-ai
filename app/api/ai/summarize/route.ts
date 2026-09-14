import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { aiService } from '@/lib/services/ai-service';

export async function POST(req: Request) {
  try {
    const { memorySpaceId, memoryId } = await req.json();
    const spaceKey = memorySpaceId || memoryId;

    if (!spaceKey) {
      return NextResponse.json({ error: 'Memory space ID required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory space not found' }, { status: 404 });
    }

    const summary = await aiService.summarizeSpace(space.id);

    return NextResponse.json({
      summary,
      success: true,
    });
  } catch (error) {
    console.error('AI Summarize Error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
