import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { randomUUID } from 'crypto';

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

    const { email, role = 'CONTRIBUTOR' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        memorySpaceId: space.id,
        email: email.toLowerCase().trim(),
        role: ['CONTRIBUTOR', 'VIEWER'].includes(role) ? role : 'CONTRIBUTOR',
        token,
        expiresAt,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

    return NextResponse.json({
      invitation,
      inviteLink,
      success: true,
      message: `Invitation generated for ${email}. Share link: ${inviteLink}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Invite contributor error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
