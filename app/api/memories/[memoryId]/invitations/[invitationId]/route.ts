import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; invitationId: string } }
) {
  try {
    const { memoryId, invitationId } = params;
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
      return NextResponse.json({ error: 'Forbidden: Only the space owner can revoke invitations.' }, { status: 403 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
