import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { aiService } from '@/lib/services/ai-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = searchParams.get('memorySpaceId') || searchParams.get('memoryId');

    if (!spaceKey) {
      return NextResponse.json({ error: 'Memory Space ID is required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    const tags = await prisma.memoryTag.findMany({
      where: { memorySpaceId: space.id },
    });

    const aiSuggested = await aiService.suggestTags(space.id);

    return NextResponse.json({
      savedTags: tags,
      suggestedTags: aiSuggested,
      success: true,
    });
  } catch (error) {
    console.error('Fetch Tags Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { memorySpaceId, memoryId, tag, action = 'ADD' } = await req.json();
    const spaceKey = memorySpaceId || memoryId;

    if (!spaceKey || !tag) {
      return NextResponse.json({ error: 'Memory space ID and tag are required' }, { status: 400 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory space not found' }, { status: 404 });
    }

    if (action === 'DELETE') {
      await prisma.memoryTag.deleteMany({
        where: { memorySpaceId: space.id, tag },
      });
      return NextResponse.json({ success: true, message: 'Tag removed' });
    }

    const newTag = await prisma.memoryTag.upsert({
      where: {
        memorySpaceId_tag_memoryId: {
          memorySpaceId: space.id,
          tag: tag.trim(),
          memoryId: null as any,
        },
      },
      update: {},
      create: {
        memorySpaceId: space.id,
        tag: tag.trim(),
        source: 'USER',
      },
    });

    return NextResponse.json({ tag: newTag, success: true });
  } catch (error) {
    console.error('Update Tag Error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}
