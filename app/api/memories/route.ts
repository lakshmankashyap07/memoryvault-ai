import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateMemoryId } from '@/lib/memory-id';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spaces = await prisma.memorySpace.findMany({
      where: {
        OR: [
          { ownerId: currentUser.id },
          { contributors: { some: { userId: currentUser.id } } },
        ],
      },
      include: {
        _count: {
          select: {
            photos: true,
            videos: true,
            messages: true,
            timelineEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error('Fetch memory spaces error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      personName,
      nickname,
      profileImage,
      relationship,
      description,
      birthday,
      firstMeetingDate,
      specialDate,
      phone,
      email,
      instagram,
      linkedin,
      privacy = 'PRIVATE',
    } = body;

    if (!personName || !relationship) {
      return NextResponse.json({ error: 'Person name and relationship are required' }, { status: 400 });
    }

    const memoryId = await generateMemoryId(personName);

    const space = await prisma.memorySpace.create({
      data: {
        memoryId,
        ownerId: currentUser.id,
        personName: personName.trim(),
        nickname: nickname?.trim() || null,
        profileImage: profileImage || null,
        relationship: relationship.trim(),
        description: description?.trim() || null,
        birthday: birthday || null,
        firstMeetingDate: firstMeetingDate || null,
        specialDate: specialDate || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        instagram: instagram?.trim() || null,
        linkedin: linkedin?.trim() || null,
        privacy: ['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(privacy) ? privacy : 'PRIVATE',
        contributors: {
          create: {
            userId: currentUser.id,
            role: 'OWNER',
          },
        },
      },
    });

    return NextResponse.json({ space, success: true }, { status: 201 });
  } catch (error) {
    console.error('Create memory space error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
