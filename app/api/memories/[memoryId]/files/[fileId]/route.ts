import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { storageProvider } from '@/lib/storage';

export async function PATCH(
  req: Request,
  { params }: { params: { memoryId: string; fileId: string } }
) {
  try {
    const { memoryId, fileId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileRecord = await prisma.memoryFile.findUnique({
      where: { id: fileId },
      include: {
        memorySpace: {
          include: { contributors: true },
        },
      },
    });

    if (!fileRecord || fileRecord.memorySpace.memoryId !== memoryId) {
      return NextResponse.json({ error: 'File memory not found' }, { status: 404 });
    }

    const space = fileRecord.memorySpace;
    const isOwner = space.ownerId === currentUser.id;
    const isContributor = space.contributors.some((c) => c.userId === currentUser.id);

    if (!isOwner && !isContributor) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit file' }, { status: 403 });
    }

    const { fileTitle, description } = await req.json();

    const updated = await prisma.memoryFile.update({
      where: { id: fileId },
      data: {
        fileTitle: fileTitle !== undefined ? fileTitle.trim() : fileRecord.fileTitle,
        description: description !== undefined ? (description ? description.trim() : null) : fileRecord.description,
      },
    });

    return NextResponse.json({ file: updated, success: true });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json({ error: 'Failed to update file details' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { memoryId: string; fileId: string } }
) {
  try {
    const { memoryId, fileId } = params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileRecord = await prisma.memoryFile.findUnique({
      where: { id: fileId },
      include: {
        memorySpace: {
          include: { contributors: true },
        },
      },
    });

    if (!fileRecord || fileRecord.memorySpace.memoryId !== memoryId) {
      return NextResponse.json({ error: 'File memory not found' }, { status: 404 });
    }

    const space = fileRecord.memorySpace;
    const isOwner = space.ownerId === currentUser.id;
    const isContributor = space.contributors.some((c) => c.userId === currentUser.id);

    if (!isOwner && !isContributor) {
      return NextResponse.json({ error: 'Forbidden: Only space owners/contributors can delete files' }, { status: 403 });
    }

    // 1. Delete physical object from Vercel Blob / local storage
    if (fileRecord.fileUrl) {
      await storageProvider.deleteFile(fileRecord.fileUrl);
    }

    // 2. Delete Prisma metadata record
    await prisma.memoryFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
