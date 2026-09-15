import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storageProvider } from '@/lib/storage';

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; videoId: string } }
) {
  try {
    const { memoryId, videoId } = params;
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

    const video = await prisma.memoryVideo.findUnique({
      where: { id: videoId },
    });

    if (!video || video.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const isOwner = space.ownerId === currentUser.id;
    const isUploader = video.uploadedBy === currentUser.name;

    if (!isOwner && !isUploader) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this video.' }, { status: 403 });
    }

    if (video.fileUrl) {
      await storageProvider.deleteFile(video.fileUrl);
    }
    if (video.thumbnailUrl) {
      await storageProvider.deleteFile(video.thumbnailUrl);
    }

    await prisma.memoryVideo.delete({
      where: { id: videoId },
    });

    return NextResponse.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
