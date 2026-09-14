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
      return NextResponse.json({ error: 'You do not have permission to post messages.' }, { status: 403 });
    }

    const { title, message, authorName, photoUrl } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const author = currentUser?.name || authorName?.trim() || 'A Dear Friend';
    const authorAvatar = currentUser?.profileImage || null;

    const memoryMessage = await prisma.memoryMessage.create({
      data: {
        memorySpaceId: space.id,
        authorId: currentUser?.id || null,
        authorName: author,
        authorAvatar,
        title: title?.trim() || null,
        message: message.trim(),
        photoUrl: photoUrl || null,
      },
    });

    return NextResponse.json({ message: memoryMessage, success: true }, { status: 201 });
  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
