import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { memoryId: string } }
) {
  try {
    const memoryId = params.memoryId;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    let canContribute = space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';
    if (currentUser) {
      if (space.ownerId === currentUser.id || space.contributors.some((c) => c.userId === currentUser.id)) {
        canContribute = true;
      }
    }

    if (!canContribute) {
      return NextResponse.json({ error: 'You do not have permission to add timeline events.' }, { status: 403 });
    }

    const { title, description, date, mediaUrl, mediaType } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        memorySpaceId: space.id,
        title: title.trim(),
        description: description?.trim() || null,
        date: date.trim(),
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      },
    });

    return NextResponse.json({ event, success: true }, { status: 201 });
  } catch (error) {
    console.error('Timeline creation error:', error);
    return NextResponse.json({ error: 'Failed to create timeline event' }, { status: 500 });
  }
}
