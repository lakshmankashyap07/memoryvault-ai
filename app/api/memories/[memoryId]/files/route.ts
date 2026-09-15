import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { memoryId: string } }
) {
  try {
    const memoryId = params.memoryId;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    // Permission check: owner, contributor, or public/unlisted space
    let canContribute = space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';
    if (currentUser) {
      if (space.ownerId === currentUser.id || space.contributors.some((c) => c.userId === currentUser.id)) {
        canContribute = true;
      }
    }

    if (!canContribute) {
      return NextResponse.json(
        { error: 'You do not have permission to add files to this memory space.' },
        { status: 403 }
      );
    }

    const { fileUrl, fileName, fileTitle, description, mimeType, fileSize, uploaderName } = await req.json();

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'File URL and file name are required.' }, { status: 400 });
    }

    const uploadedBy = currentUser?.name || uploaderName || 'Anonymous Contributor';

    const memoryFile = await prisma.memoryFile.create({
      data: {
        memorySpaceId: space.id,
        uploadedBy,
        fileUrl,
        fileName: fileName.trim(),
        fileTitle: fileTitle?.trim() || fileName.trim(),
        description: description?.trim() || null,
        mimeType: mimeType || null,
        fileSize: typeof fileSize === 'number' ? fileSize : null,
      },
    });

    return NextResponse.json({ file: memoryFile, success: true }, { status: 201 });
  } catch (error) {
    console.error('File metadata creation error:', error);
    return NextResponse.json({ error: 'Failed to preserve file memory' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { memoryId: string } }
) {
  try {
    const memoryId = params.memoryId;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: {
        contributors: true,
        files: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    // Determine user access
    let userRole = 'GUEST';
    if (currentUser) {
      if (space.ownerId === currentUser.id) {
        userRole = 'OWNER';
      } else {
        const contributor = space.contributors.find((c) => c.userId === currentUser.id);
        if (contributor) userRole = contributor.role;
      }
    }

    if (space.privacy === 'PRIVATE' && userRole === 'GUEST') {
      return NextResponse.json({ error: 'Access denied: Private memory space' }, { status: 403 });
    }

    return NextResponse.json({ files: space.files, userRole });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json({ error: 'Failed to fetch memory files' }, { status: 500 });
  }
}
