import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { getInvitationUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
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
        contributors: {
          include: {
            user: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
        },
        invitations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    if (space.ownerId !== currentUser.id && !space.contributors.some((c) => c.userId === currentUser.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formattedInvitations = space.invitations.map((inv) => ({
      ...inv,
      inviteLink: getInvitationUrl(inv.token),
    }));

    return NextResponse.json({
      contributors: space.contributors,
      invitations: formattedInvitations,
    });
  } catch (error) {
    console.error('Fetch contributors error:', error);
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 500 });
  }
}

export async function POST(
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
      return NextResponse.json({ error: 'Only the space owner can invite contributors' }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = 'CONTRIBUTOR', action, invitationId } = body;

    // RESEND ACTION
    if (action === 'RESEND' || invitationId) {
      const existingInv = await prisma.invitation.findFirst({
        where: {
          memorySpaceId: space.id,
          OR: [{ id: invitationId }, { email: email ? email.toLowerCase().trim() : undefined }],
        },
      });

      if (!existingInv) {
        return NextResponse.json({ error: 'Invitation record not found' }, { status: 404 });
      }

      const newToken = randomUUID();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const updatedInv = await prisma.invitation.update({
        where: { id: existingInv.id },
        data: {
          token: newToken,
          status: 'PENDING',
          expiresAt: newExpiresAt,
          role: role || existingInv.role,
        },
      });

      const inviteLink = getInvitationUrl(newToken);

      return NextResponse.json({
        invitation: updatedInv,
        inviteLink,
        success: true,
        message: `Invitation resent to ${updatedInv.email}.`,
      });
    }

    // CREATE / UPSERT INVITATION
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user is already a contributor/owner
    const existingContributorUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        contributions: {
          where: { memorySpaceId: space.id },
        },
      },
    });

    if (existingContributorUser?.id === space.ownerId) {
      return NextResponse.json({ error: 'User is already the owner of this Memory Space.' }, { status: 400 });
    }

    if (existingContributorUser?.contributions && existingContributorUser.contributions.length > 0) {
      return NextResponse.json({ error: 'User is already a contributor to this Memory Space.' }, { status: 400 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const validRole = ['CONTRIBUTOR', 'VIEWER'].includes(role) ? role : 'CONTRIBUTOR';

    // If an invitation already exists for this space & email, update it with a fresh token and expiration
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        memorySpaceId: space.id,
        email: cleanEmail,
      },
    });

    let invitation;
    if (existingInvitation) {
      invitation = await prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          token,
          role: validRole,
          status: 'PENDING',
          expiresAt,
        },
      });
    } else {
      invitation = await prisma.invitation.create({
        data: {
          memorySpaceId: space.id,
          email: cleanEmail,
          role: validRole,
          token,
          expiresAt,
        },
      });
    }

    const inviteLink = getInvitationUrl(token);

    return NextResponse.json({
      invitation,
      inviteLink,
      success: true,
      message: `Invitation generated for ${cleanEmail}. Link: ${inviteLink}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Invite contributor error:', error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}
