import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { memoryId: string; eventId: string } }
) {
  return handleUpdate(req, params.memoryId, params.eventId);
}

export async function PUT(
  req: Request,
  { params }: { params: { memoryId: string; eventId: string } }
) {
  return handleUpdate(req, params.memoryId, params.eventId);
}

async function handleUpdate(req: Request, memoryId: string, eventId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    const isOwner = space.ownerId === currentUser.id;
    const isContributor = space.contributors.some((c) => c.userId === currentUser.id);

    if (!isOwner && !isContributor) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to edit timeline events.' }, { status: 403 });
    }

    const event = await prisma.timelineEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    const { title, description, date, mediaUrl, mediaType } = await req.json();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (date !== undefined) updateData.date = date.trim();
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;
    if (mediaType !== undefined) updateData.mediaType = mediaType || null;

    const updatedEvent = await prisma.timelineEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json({ event: updatedEvent, success: true });
  } catch (error) {
    console.error('Update timeline event error:', error);
    return NextResponse.json({ error: 'Failed to update timeline event' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; eventId: string } }
) {
  try {
    const { memoryId, eventId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    const isOwner = space.ownerId === currentUser.id;
    const isContributor = space.contributors.some((c) => c.userId === currentUser.id);

    if (!isOwner && !isContributor) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete timeline events.' }, { status: 403 });
    }

    const event = await prisma.timelineEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    await prisma.timelineEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true, message: 'Timeline event deleted successfully' });
  } catch (error) {
    console.error('Delete timeline event error:', error);
    return NextResponse.json({ error: 'Failed to delete timeline event' }, { status: 500 });
  }
}
