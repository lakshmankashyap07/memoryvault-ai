import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Vercel Blob] BLOB_READ_WRITE_TOKEN is missing in environment variables');
      return NextResponse.json(
        {
          error:
            'Vercel Blob is not configured. Please connect a Vercel Blob store to your project or set BLOB_READ_WRITE_TOKEN in Vercel Environment Variables.',
        },
        { status: 400 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, _clientPayload) => {
        // Authenticate user before issuing client upload token
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          throw new Error('Unauthorized: Please log in to upload files');
        }

        return {
          allowedContentTypes: [
            'image/*',
            'image/jpeg',
            'image/jpg',
            'image/pjpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/heic',
            'image/heif',
            'image/avif',
            'video/*',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/ogg',
            'video/3gpp',
            'video/x-msvideo',
            'video/x-matroska',
            'audio/*',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
            'audio/aac',
            'audio/ogg',
            'application/pdf',
            'application/octet-stream',
          ],
          tokenPayload: JSON.stringify({
            userId: currentUser.id,
            userEmail: currentUser.email,
          }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('[Vercel Blob] Token generation error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate upload token' },
      { status: 400 }
    );
  }
}
