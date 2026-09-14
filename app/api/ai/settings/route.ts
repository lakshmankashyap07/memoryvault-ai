import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

    let settings = await prisma.aISettings.findUnique({
      where: { memorySpaceId: space.id },
    });

    if (!settings) {
      settings = await prisma.aISettings.create({
        data: { memorySpaceId: space.id },
      });
    }

    return NextResponse.json({ settings, success: true });
  } catch (error) {
    console.error('Fetch AI settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { memorySpaceId, memoryId, enableSearch, enableDescriptions, enableTimeline, enableStory, enableAssistant } = await req.json();

    const spaceKey = memorySpaceId || memoryId;
    if (!spaceKey || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized or missing space ID' }, { status: 401 });
    }

    const space = await prisma.memorySpace.findFirst({
      where: { OR: [{ id: spaceKey }, { memoryId: spaceKey }] },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    if (space.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden: Only space owner can modify AI settings' }, { status: 403 });
    }

    const updated = await prisma.aISettings.upsert({
      where: { memorySpaceId: space.id },
      update: {
        enableSearch,
        enableDescriptions,
        enableTimeline,
        enableStory,
        enableAssistant,
      },
      create: {
        memorySpaceId: space.id,
        enableSearch,
        enableDescriptions,
        enableTimeline,
        enableStory,
        enableAssistant,
      },
    });

    return NextResponse.json({ settings: updated, success: true });
  } catch (error) {
    console.error('Update AI settings error:', error);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
