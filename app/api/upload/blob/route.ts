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
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate user before issuing client upload token
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          throw new Error('Unauthorized: Please log in to upload files');
        }

        console.log('[Vercel Blob] Issuing upload token for file:', {
          pathname,
          clientPayload,
          user: currentUser.email,
        });

        return {
          allowedContentTypes: [
            // Images
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

            // Videos
            'video/*',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/ogg',
            'video/3gpp',
            'video/x-msvideo',
            'video/x-matroska',

            // Audio
            'audio/*',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
            'audio/aac',
            'audio/ogg',

            // Documents (PDF, Word)
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
            'application/vnd.ms-word.document.macroEnabled.12',

            // Spreadsheets (Excel, CSV)
            'text/csv',
            'text/x-csv',
            'text/comma-separated-values',
            'application/csv',
            'application/excel',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
            'application/vnd.ms-excel.sheet.macroEnabled.12',

            // Presentations (PowerPoint)
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
            'application/vnd.openxmlformats-officedocument.presentationml.template',

            // Plain Text & Markdown
            'text/plain',
            'text/html',
            'text/markdown',
            'text/xml',
            'text/rtf',
            'text/*',

            // Archives (ZIP, RAR, 7Z, TAR, GZ)
            'application/zip',
            'application/x-zip-compressed',
            'application/x-zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip',

            // Data & Application Category Wildcard
            'application/json',
            'application/rtf',
            'application/xml',
            'application/octet-stream',
            'application/*',
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


