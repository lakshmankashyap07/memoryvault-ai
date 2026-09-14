import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { aiService } from '@/lib/services/ai-service';

export async function POST(req: Request) {
  try {
    const { memorySpaceId, memoryId, length = 'MEDIUM', selectedMemoryIds } = await req.json();
    const spaceKey = memorySpaceId || memoryId;

    if (!spaceKey) {
      return NextResponse.json({ error: 'Memory Space ID required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    const storyResult = await aiService.generateStory(space.id, length, selectedMemoryIds);

    // Save story to database
    const savedStory = await prisma.memoryStory.create({
      data: {
        memorySpaceId: space.id,
        title: storyResult.title,
        length,
        chapters: JSON.stringify(storyResult.chapters),
      },
    });

    return NextResponse.json({
      story: savedStory,
      chapters: storyResult.chapters,
      success: true,
    });
  } catch (error) {
    console.error('AI Story Error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
