import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        memorySpace: {
          select: { memoryId: true, personName: true, profileImage: true },
        },
      },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation link is invalid or expired' }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Fetch invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Please log in to accept this invitation' }, { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation is invalid or expired' }, { status: 400 });
    }

    // Add user as contributor
    await prisma.contributor.upsert({
      where: {
        memorySpaceId_userId: {
          memorySpaceId: invitation.memorySpaceId,
          userId: currentUser.id,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        memorySpaceId: invitation.memorySpaceId,
        userId: currentUser.id,
        role: invitation.role,
      },
    });

    // Mark invitation accepted
    await prisma.invitation.update({
      where: { token },
      data: { status: 'ACCEPTED' },
    });

    const memorySpace = await prisma.memorySpace.findUnique({
      where: { id: invitation.memorySpaceId },
      select: { memoryId: true },
    });

    return NextResponse.json({ success: true, memoryId: memorySpace?.memoryId });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
