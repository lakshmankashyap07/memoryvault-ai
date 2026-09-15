import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { memoryId: string; contributorId: string } }
) {
  try {
    const { memoryId, contributorId } = params;
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
      return NextResponse.json({ error: 'Forbidden: Only the space owner can manage contributors.' }, { status: 403 });
    }

    const contributor = await prisma.contributor.findUnique({
      where: { id: contributorId },
    });

    if (!contributor || contributor.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    const body = await req.json();
    const { role } = body;

    if (!['CONTRIBUTOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be CONTRIBUTOR or VIEWER.' }, { status: 400 });
    }

    const updated = await prisma.contributor.update({
      where: { id: contributorId },
      data: { role },
    });

    return NextResponse.json({ contributor: updated, success: true });
  } catch (error) {
    console.error('Update contributor role error:', error);
    return NextResponse.json({ error: 'Failed to update contributor role' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; contributorId: string } }
) {
  try {
    const { memoryId, contributorId } = params;
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
      return NextResponse.json({ error: 'Forbidden: Only the space owner can remove contributors.' }, { status: 403 });
    }

    const contributor = await prisma.contributor.findUnique({
      where: { id: contributorId },
    });

    if (!contributor || contributor.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    // Protect space owner from accidental removal
    if (contributor.userId === space.ownerId) {
      return NextResponse.json({ error: 'Cannot remove the space owner as a contributor.' }, { status: 400 });
    }

    await prisma.contributor.delete({
      where: { id: contributorId },
    });

    return NextResponse.json({ success: true, message: 'Contributor removed successfully' });
  } catch (error) {
    console.error('Remove contributor error:', error);
    return NextResponse.json({ error: 'Failed to remove contributor' }, { status: 500 });
  }
}
