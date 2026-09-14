import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
  try {
    const memoryId = params.memoryId;
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
    const updated = await prisma.memorySpace.update({
      where: { memoryId },
      data: {
        personName: body.personName?.trim(),
        nickname: body.nickname?.trim(),
        profileImage: body.profileImage,
        relationship: body.relationship?.trim(),
        description: body.description?.trim(),
        birthday: body.birthday,
        firstMeetingDate: body.firstMeetingDate,
        specialDate: body.specialDate,
        phone: body.phone?.trim(),
        email: body.email?.trim(),
        instagram: body.instagram?.trim(),
        linkedin: body.linkedin?.trim(),
        privacy: body.privacy,
      },
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
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    if (space.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.memorySpace.delete({
      where: { memoryId },
    });

    return NextResponse.json({ success: true, message: 'Memory space deleted' });
  } catch (error) {
    console.error('Delete memory space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
