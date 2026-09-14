import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
      include: {
        memorySpace: {
          select: { memoryId: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Email match check (case-insensitive)
    if (currentUser.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to another email address (${invitation.email}). Please log in with the invited account.`,
          invitedEmail: invitation.email,
        },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired or has already been processed.' },
        { status: 400 }
      );
    }

    // Atomic transaction creating contributor and marking invitation ACCEPTED
    await prisma.$transaction([
      prisma.contributor.upsert({
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
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      memoryId: invitation.memorySpace.memoryId,
    });
  } catch (error) {
    console.error('Accept invitation API error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
