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

/**
 * Automatically generates a video thumbnail image File from a browser video File.
 * Seeks to ~1.0 second (or midpoint for short videos) and captures a JPEG blob frame via HTMLCanvasElement.
 * Returns null if thumbnail generation is unsupported or fails, allowing upload to proceed gracefully.
 */
export function generateVideoThumbnail(file: File, timeoutMs: number = 30000): Promise<File | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !file || !file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    let completed = false;
    let videoUrl = '';

    const cleanup = (url?: string, video?: HTMLVideoElement) => {
      if (completed) return;
      completed = true;
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      if (video) {
        video.onloadedmetadata = null;
        video.onseeked = null;
        video.onerror = null;
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch {
          // ignore
        }
      }
    };

    // Safety timeout of 30 seconds
    const timer = setTimeout(() => {
      if (!completed) {
        const msg = `Frame extraction timed out after ${timeoutMs / 1000}s for video: ${file.name}`;
        console.warn(`[Thumbnail Backfill] ${msg}`);
        cleanup(videoUrl, video);
        reject(new Error(msg));
      }
    }, timeoutMs);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    try {
      videoUrl = URL.createObjectURL(file);
    } catch (e: any) {
      clearTimeout(timer);
      const msg = `Failed to create Blob URL: ${e?.message || e}`;
      console.warn(`[Thumbnail Backfill] ${msg}`);
      reject(new Error(msg));
      return;
    }

    video.onerror = (e) => {
      clearTimeout(timer);
      const msg = `HTMLVideoElement failed to load video ${file.name}`;
      console.warn(`[Thumbnail Backfill] ${msg}:`, e);
      cleanup(videoUrl, video);
      reject(new Error(msg));
    };

    video.onloadedmetadata = () => {
      try {
        const duration = video.duration || 0;
        const seekTime = Math.min(1.0, duration > 0.2 ? duration / 2 : 0);
        video.currentTime = seekTime;
      } catch (seekErr: any) {
        clearTimeout(timer);
        const msg = `Error seeking video timestamp: ${seekErr?.message || seekErr}`;
        console.warn(`[Thumbnail Backfill] ${msg}`);
        cleanup(videoUrl, video);
        reject(new Error(msg));
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(timer);
          cleanup(videoUrl, video);
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            clearTimeout(timer);
            cleanup(videoUrl, video);
            if (blob) {
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const thumbFileName = `${baseName}-thumb.jpg`;
              const thumbFile = new File([blob], thumbFileName, { type: 'image/jpeg' });
              resolve(thumbFile);
            } else {
              reject(new Error('Canvas toBlob returned empty image'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (drawErr: any) {
        clearTimeout(timer);
        const msg = `Canvas draw error (CORS or tainted frame): ${drawErr?.message || drawErr}`;
        console.warn(`[Thumbnail Backfill] ${msg}`);
        cleanup(videoUrl, video);
        reject(new Error(msg));
      }
    };

    video.src = videoUrl;
  });
}

/**
 * Generates a video thumbnail image File from a remote video URL.
 * Fetches the video stream as a local Blob to avoid any CORS/Tainted Canvas issues,
 * then generates a thumbnail File via HTMLCanvasElement frame capture.
 * If direct fetch fails, automatically retries via server proxy URL.
 */
export async function generateVideoThumbnailFromUrl(
  videoUrl: string,
  identifier: string,
  proxyUrl?: string
): Promise<File> {
  console.log(`[Thumbnail Backfill] Starting thumbnail process for videoId: ${identifier}`);
  console.log(`[Thumbnail Backfill] Target videoUrl: ${videoUrl}`);

  let res: Response | null = null;
  let fetchErrorMsg = '';

  // 1. Direct fetch attempt
  try {
    res = await fetch(videoUrl);
    if (!res.ok) {
      fetchErrorMsg = `Direct fetch failed (HTTP ${res.status} ${res.statusText})`;
    }
  } catch (err: any) {
    fetchErrorMsg = `Direct fetch network error: ${err?.message || err}`;
  }

  // 2. Server proxy fallback if direct fetch fails
  if ((!res || !res.ok) && proxyUrl) {
    console.log(`[Thumbnail Backfill] Direct fetch unreadable (${fetchErrorMsg}). Fallback to server proxy: ${proxyUrl}`);
    try {
      res = await fetch(proxyUrl);
      if (!res.ok) {
        throw new Error(`Proxy fetch failed (HTTP ${res.status} ${res.statusText})`);
      }
    } catch (proxyErr: any) {
      throw new Error(`Video fetch failed via direct & proxy route. Direct: ${fetchErrorMsg}. Proxy: ${proxyErr?.message || proxyErr}`);
    }
  }

  if (!res || !res.ok) {
    throw new Error(fetchErrorMsg || 'Failed to fetch video stream');
  }

  const contentType = res.headers.get('content-type') || '';
  console.log(`[Thumbnail Backfill] Video stream fetched successfully. Content-Type: ${contentType}`);

  const blob = await res.blob();
  console.log(`[Thumbnail Backfill] Downloaded video stream: ${blob.size} bytes (${blob.type})`);

  if (blob.size === 0) {
    throw new Error('Fetched video stream is empty (0 bytes)');
  }

  const tempFile = new File([blob], `video-${identifier}.mp4`, {
    type: blob.type || 'video/mp4',
  });

  const thumbFile = await generateVideoThumbnail(tempFile, 30000);
  if (!thumbFile) {
    throw new Error('Frame extraction returned null');
  }

  console.log(`[Thumbnail Backfill] SUCCESS: Generated ${thumbFile.size} byte thumbnail for videoId: ${identifier}`);
  return thumbFile;
}



