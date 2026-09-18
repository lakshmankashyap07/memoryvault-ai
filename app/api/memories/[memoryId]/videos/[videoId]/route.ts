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

export async function PATCH(
  req: Request,
  { params }: { params: { memoryId: string; videoId: string } }
) {
  try {
    const { memoryId, videoId } = params;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    let canEdit = space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';
    if (currentUser) {
      if (space.ownerId === currentUser.id || space.contributors.some((c) => c.userId === currentUser.id)) {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const video = await prisma.memoryVideo.findUnique({
      where: { id: videoId },
    });

    if (!video || video.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { thumbnailUrl } = body;

    const updatedVideo = await prisma.memoryVideo.update({
      where: { id: videoId },
      data: {
        thumbnailUrl: thumbnailUrl || null,
      },
    });

    return NextResponse.json({ video: updatedVideo, success: true });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { memoryId: string; videoId: string } }
) {
  try {
    const { memoryId, videoId } = params;
    const currentUser = await getCurrentUser();

    const space = await prisma.memorySpace.findUnique({
      where: { memoryId },
      include: { contributors: true },
    });

    if (!space) {
      return NextResponse.json({ error: 'Memory Space not found' }, { status: 404 });
    }

    let canAccess = space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';
    if (currentUser) {
      if (space.ownerId === currentUser.id || space.contributors.some((c) => c.userId === currentUser.id)) {
        canAccess = true;
      }
    }

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const video = await prisma.memoryVideo.findUnique({
      where: { id: videoId },
    });

    if (!video || video.memorySpaceId !== space.id) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Fetch video stream securely using server credentials if necessary
    const headers: Record<string, string> = {};
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      headers['authorization'] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }

    let targetUrl = video.fileUrl;
    if (targetUrl.startsWith('/')) {
      const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      targetUrl = `${host}${targetUrl}`;
    }

    const videoRes = await fetch(targetUrl, { headers });
    if (!videoRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch video stream (HTTP ${videoRes.status})` },
        { status: videoRes.status }
      );
    }

    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    const blobBuffer = await videoRes.arrayBuffer();

    return new Response(blobBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Proxy video error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to proxy video' }, { status: 500 });
  }
}


