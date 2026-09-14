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

    // Permission check: owner, contributor, or public space allow adding photos
    let canContribute = space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';
    if (currentUser) {
      if (space.ownerId === currentUser.id || space.contributors.some((c) => c.userId === currentUser.id)) {
        canContribute = true;
      }
    }

    if (!canContribute) {
      return NextResponse.json({ error: 'You do not have permission to add photos to this space.' }, { status: 403 });
    }

    const { fileUrl, caption, date, location, uploaderName } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
    }

    const uploadedBy = currentUser?.name || uploaderName || 'Anonymous Friend';

    const photo = await prisma.memoryPhoto.create({
      data: {
        memorySpaceId: space.id,
        uploadedBy,
        fileUrl,
        caption: caption?.trim() || null,
        date: date || null,
        location: location?.trim() || null,
      },
    });

    return NextResponse.json({ photo, success: true }, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
