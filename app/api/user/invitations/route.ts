import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = currentUser.email.toLowerCase().trim();

    const invitations = await prisma.invitation.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        memorySpace: {
          select: {
            id: true,
            memoryId: true,
            personName: true,
            relationship: true,
            profileImage: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Fetch user invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}
