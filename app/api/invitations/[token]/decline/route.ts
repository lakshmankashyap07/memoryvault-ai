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
      return NextResponse.json({ error: 'Please log in to decline this invitation' }, { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Email match check (case-insensitive)
    if (currentUser.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to another email address (${invitation.email}). Please log in with the invited account.`,
        },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invitation has already been processed or expired.' },
        { status: 400 }
      );
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined.',
    });
  } catch (error) {
    console.error('Decline invitation API error:', error);
    return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
  }
}
