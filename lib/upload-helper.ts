import { upload } from '@vercel/blob/client';

export interface UploadOptions {
  onProgress?: (percentage: number) => void;
}

/**
 * Direct Client-Side Upload Helper for MemoryVault.
 *
 * Desired Flow:
 * Browser
 * → authenticated MemoryVault upload route (/api/upload/blob)
 * → handleUpload()
 * → temporary Vercel Blob client token
 * → browser uploads directly to Vercel Blob
 * → upload completion
 * → Prisma MemoryPhoto/MemoryVideo metadata is saved
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

    // Inspect server response from /api/upload/blob to get exact server-side error reason
    let exactServerError = '';
    try {
      const diagRes = await fetch('/api/upload/blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blob.generate-client-token',
          payload: { pathname: file.name, multipart: false, clientPayload: null },
        }),
      });
      if (!diagRes.ok) {
        const diagData = await diagRes.json().catch(() => ({}));
        if (diagData.error) {
          exactServerError = diagData.error;
        }
      }
    } catch (e) {
      console.error('Failed to query token diagnostic route:', e);
    }

    const isLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // On Vercel production or for large files (> 4MB), strictly enforce Vercel Blob
    if (!isLocalDev || file.size > 4 * 1024 * 1024) {
      if (exactServerError) {
        throw new Error(exactServerError);
      }
      let rawMessage = blobError?.message || 'Vercel Blob client upload failed.';
      if (
        rawMessage.includes('No token found') ||
        rawMessage.includes('BLOB_READ_WRITE_TOKEN') ||
        rawMessage.includes('Failed to retrieve')
      ) {
        rawMessage =
          'Vercel Blob storage is not configured on this environment. Please ensure a Vercel Blob store is linked to your project (which provides BLOB_READ_WRITE_TOKEN).';
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
