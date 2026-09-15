import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storageProvider } from '@/lib/storage';

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; photoId: string } }
) {
  try {
    const { memoryId, photoId } = params;
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

    const photo = await prisma.memoryPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Permission: Only space owner or the user who uploaded the photo can delete it
    const isOwner = space.ownerId === currentUser.id;
    const isUploader = photo.uploadedBy === currentUser.name;

    if (!isOwner && !isUploader) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this photo.' }, { status: 403 });
    }

    // Clean up local storage file if applicable
    if (photo.fileUrl) {
      await storageProvider.deleteFile(photo.fileUrl);
    }

    await prisma.memoryPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
