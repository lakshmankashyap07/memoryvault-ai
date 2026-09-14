import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
          select: {
            id: true,
            memoryId: true,
            personName: true,
            profileImage: true,
            relationship: true,
            owner: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation link not found' }, { status: 404 });
    }

    const now = new Date();
    const isExpired = invitation.expiresAt < now;
    const isPending = invitation.status === 'PENDING' && !isExpired;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        isExpired,
        isPending,
        personName: invitation.memorySpace.personName,
        memorySpaceId: invitation.memorySpace.id,
        memoryId: invitation.memorySpace.memoryId,
        profileImage: invitation.memorySpace.profileImage,
        relationship: invitation.memorySpace.relationship,
        ownerName: invitation.memorySpace.owner.name,
      },
    });
  } catch (error) {
    console.error('Fetch invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fallback accept handler if POST sent directly to /api/invitations/[token]
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Please log in to respond to this invitation' }, { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { memorySpace: { select: { memoryId: true } } },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Email match check (case-insensitive)
    if (currentUser.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitation.email}. Please log in with the invited email account.`,
          invitedEmail: invitation.email,
        },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired or has already been used.' }, { status: 400 });
    }

    // Database transaction to add contributor and set status to ACCEPTED
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
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}
