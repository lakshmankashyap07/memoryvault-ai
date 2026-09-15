import { upload } from '@vercel/blob/client';

export interface UploadOptions {
  onProgress?: (percentage: number) => void;
}

/**
 * Robust client-side file upload helper.
 * 1. Attempts direct upload to Vercel Blob via `@vercel/blob/client` (supports large files, streaming progress).
 * 2. Falls back to local `/api/upload` endpoint if Vercel Blob token is unavailable or in local dev mode.
 * 3. Safely handles HTTP errors without crashing JSON parsers.
 */
export async function uploadFileWithProgress(
  file: File,
  options?: UploadOptions
): Promise<string> {
  const onProgress = options?.onProgress;

  // Try Direct Vercel Blob Upload
  try {
    if (onProgress) onProgress(5);
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
    console.warn('Vercel Blob upload unavailable/failed, falling back to local storage handler:', blobError?.message);
    
    // Fallback: XHR Post to /api/upload with progress tracking
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
          // Parse HTML error page (like HTTP 413 Payload Too Large) safely
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error) errorMsg = parsed.error;
          } catch {
            if (xhr.status === 413) {
              errorMsg = 'File size exceeds server payload limits. Please choose a smaller file or configure Vercel Blob.';
            } else if (xhr.responseText) {
              errorMsg = xhr.responseText.substring(0, 150);
            }
          }
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during file upload. Please check your internet connection.'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
}
