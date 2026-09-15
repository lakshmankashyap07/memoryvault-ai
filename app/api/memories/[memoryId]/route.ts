import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storageProvider } from '@/lib/storage';

export async function GET(
  _req: Request,
  { params }: { params: { memoryId: string } }
) {
  try {
    const memoryId = params.memoryId;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        videos: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
        timelineEvents: {
          orderBy: { date: 'asc' },
        },
        contributors: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    // Determine user relationship role to this memory space
    let userRole = 'GUEST';
    if (currentUser) {
      if (space.ownerId === currentUser.id) {
        userRole = 'OWNER';
      } else {
        const contributor = space.contributors.find((c) => c.userId === currentUser.id);
        if (contributor) {
          userRole = contributor.role;
        }
      }
    }

    // Privacy check
    if (space.privacy === 'PRIVATE' && userRole === 'GUEST') {
      return NextResponse.json(
        { error: 'This Memory Space is private. Access restricted.' },
        { status: 403 }
      );
    }

    // Sanitize contact info if guest viewing unlisted or public space
    const canSeeContacts = ['OWNER', 'CONTRIBUTOR'].includes(userRole) || space.privacy === 'PUBLIC';

    const sanitizedSpace = {
      ...space,
      phone: canSeeContacts ? space.phone : null,
      email: canSeeContacts ? space.email : null,
      instagram: canSeeContacts ? space.instagram : null,
      linkedin: canSeeContacts ? space.linkedin : null,
      userRole,
    };

    return NextResponse.json({ space: sanitizedSpace });
  } catch (error) {
    console.error('Get memory space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { memoryId: string } }
) {
  return handleUpdate(req, params.memoryId);
}

export async function PATCH(
  req: Request,
  { params }: { params: { memoryId: string } }
) {
  return handleUpdate(req, params.memoryId);
}

async function handleUpdate(req: Request, memoryId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    if (space.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden: Only the owner can update space settings' }, { status: 403 });
    }

    const body = await req.json();

    const updateData: any = {};
    if (body.personName !== undefined) updateData.personName = body.personName.trim();
    if (body.nickname !== undefined) updateData.nickname = body.nickname ? body.nickname.trim() : null;
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage || null;
    if (body.relationship !== undefined) updateData.relationship = body.relationship.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.birthday !== undefined) updateData.birthday = body.birthday || null;
    if (body.firstMeetingDate !== undefined) updateData.firstMeetingDate = body.firstMeetingDate || null;
    if (body.specialDate !== undefined) updateData.specialDate = body.specialDate || null;
    if (body.phone !== undefined) updateData.phone = body.phone ? body.phone.trim() : null;
    if (body.email !== undefined) updateData.email = body.email ? body.email.trim() : null;
    if (body.instagram !== undefined) updateData.instagram = body.instagram ? body.instagram.trim() : null;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin ? body.linkedin.trim() : null;
    if (body.privacy !== undefined && ['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(body.privacy)) {
      updateData.privacy = body.privacy;
    }

    const updated = await prisma.memorySpace.update({
      where: { memoryId },
      data: updateData,
    });

    return NextResponse.json({ space: updated, success: true });
  } catch (error) {
    console.error('Update memory space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string } }
) {
  try {
    const memoryId = params.memoryId;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: {
        photos: true,
        videos: true,
        files: true,
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    if (space.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden: Only the space owner can delete this memory.' }, { status: 403 });
    }

    // Storage file cleanup for photos, videos, & files
    for (const photo of space.photos) {
      if (photo.fileUrl) {
        await storageProvider.deleteFile(photo.fileUrl);
      }
    }
    for (const video of space.videos) {
      if (video.fileUrl) {
        await storageProvider.deleteFile(video.fileUrl);
      }
    }
    for (const fileItem of space.files) {
      if (fileItem.fileUrl) {
        await storageProvider.deleteFile(fileItem.fileUrl);
      }
    }

    // Cascading delete MemorySpace & all dependent DB records
    await prisma.memorySpace.delete({
      where: { memoryId },
    });

    return NextResponse.json({ success: true, message: 'Memory space deleted successfully' });
  } catch (error) {
    console.error('Delete memory space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
