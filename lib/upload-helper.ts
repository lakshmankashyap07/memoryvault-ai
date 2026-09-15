import { upload } from '@vercel/blob/client';

export interface UploadOptions {
  onProgress?: (percentage: number) => void;
}

/**
 * Direct Client-Side Upload Helper for MemoryVault.
 *
 * Direct Flow:
 * 1. Client calls `upload()` from `@vercel/blob/client`.
 * 2. `/api/upload/blob` authenticates the user session & issues a client token.
 * 3. Browser streams the file payload directly to Vercel Blob CDN.
 * 4. Returns the public Blob URL for metadata storage in Prisma.
 */
export async function uploadFileWithProgress(
  file: File,
  options?: UploadOptions
): Promise<string> {
  const onProgress = options?.onProgress;

  try {
    if (onProgress) onProgress(5);

    // Direct Browser-to-Vercel-Blob Upload
    const newBlob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/blob',
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          onProgress(Math.min(99, Math.round(progressEvent.percentage)));
        }
      },
    });

    if (onProgress) onProgress(100);
    return newBlob.url;
  } catch (blobError: any) {
    console.warn('Vercel Blob direct upload attempt error:', blobError?.message || blobError);

    const isLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Do NOT fall back to server payload upload on Vercel or for large files (> 4MB)
    // because serverless functions reject payloads > 4.5MB with HTTP 413.
    if (!isLocalDev || file.size > 4 * 1024 * 1024) {
      let rawMessage = blobError?.message || 'Vercel Blob upload failed.';
      if (rawMessage.includes('No token found') || rawMessage.includes('BLOB_READ_WRITE_TOKEN')) {
        rawMessage =
          'Vercel Blob storage is not configured. Please set the BLOB_READ_WRITE_TOKEN environment variable in your Vercel Project Settings.';
      }
      throw new Error(rawMessage);
    }

    // Local development fallback for small files (< 4MB) when running locally without Vercel Blob
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              resolve(data.url);
            } else {
              reject(new Error(data.error || 'Server did not return a valid file URL'));
            }
          } catch {
            reject(new Error(`Server returned unexpected response: ${xhr.responseText.substring(0, 100)}`));
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error) errorMsg = parsed.error;
          } catch {
            if (xhr.status === 413) {
              errorMsg = 'File size exceeds server payload limits (4.5MB). Vercel Blob configuration is required for production uploads.';
            } else if (xhr.responseText) {
              errorMsg = xhr.responseText.substring(0, 150);
            }
          }
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during file upload. Please check your connection.'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
}
