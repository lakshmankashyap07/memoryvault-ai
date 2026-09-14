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
      return NextResponse.json({ error: 'You do not have permission to add videos.' }, { status: 403 });
    }

    const { fileUrl, thumbnailUrl, title, caption, date, uploaderName } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'Video file URL is required' }, { status: 400 });
    }

    const uploadedBy = currentUser?.name || uploaderName || 'Anonymous Friend';

    const video = await prisma.memoryVideo.create({
      data: {
        memorySpaceId: space.id,
        uploadedBy,
        fileUrl,
        thumbnailUrl: thumbnailUrl || null,
        title: title?.trim() || null,
        caption: caption?.trim() || null,
        date: date || null,
      },
    });

    return NextResponse.json({ video, success: true }, { status: 201 });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
