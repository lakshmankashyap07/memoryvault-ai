'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Upload,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Play,
  Trash2,
} from 'lucide-react';
import { uploadFileWithProgress, generateVideoThumbnail } from '@/lib/upload-helper';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onVideoUploaded: () => void;
}

export interface VideoItem {
  id: string;
  file?: File;
  urlInput?: string;
  previewUrl: string;
  thumbnailFile?: File | null;
  thumbnailPreviewUrl?: string;
  name: string;
  size: number;
  status: 'idle' | 'uploading' | 'success' | 'failed';
  progress: number;
  error?: string;
  uploadedUrl?: string;
  uploadedThumbnailUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
  'video/m4v',
];

const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', '3gp', 'm4v', 'ogv'];

function isVideoFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return true;
  if (file.type && (ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('video/'))) {
    return true;
  }
  return false;
}

// Maximum 2 SIMULTANEOUS video uploads at the same time (videos are larger than photos)
const MAX_CONCURRENT_UPLOADS = 2;

// Controlled concurrency queue executor
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;
      try {
        results[task.index] = await fn(task.item);
      } catch (err) {
        console.error('Worker task error:', err);
      }
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export function UploadVideoModal({
  isOpen,
  onClose,
  memoryId,
  onVideoUploaded,
}: UploadVideoModalProps) {
  const [selectedVideos, setSelectedVideos] = useState<VideoItem[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState<string>('');
  const [batchError, setBatchError] = useState<string>('');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up Object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedVideos.forEach((item) => {
        if (item.file && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
        if (item.thumbnailPreviewUrl && item.thumbnailPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbnailPreviewUrl);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    selectedVideos.forEach((item) => {
      if (item.file && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      if (item.thumbnailPreviewUrl && item.thumbnailPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.thumbnailPreviewUrl);
      }
    });
    setSelectedVideos([]);
    setVideoUrlInput('');
    setThumbnailUrl('');
    setTitle('');
    setCaption('');
    setDate('');
    setUploaderName('');
    setRejectedMessage('');
    setBatchError('');
    setBatchSuccessMessage('');
    onClose();
  };

  const addFilesToSelection = (files: FileList | File[]) => {
    setRejectedMessage('');
    setBatchError('');
    setBatchSuccessMessage('');

    const newValidVideos: VideoItem[] = [];
    const invalidFileNames: string[] = [];

    Array.from(files).forEach((file) => {
      if (isVideoFile(file)) {
        const previewUrl = URL.createObjectURL(file);
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newItem: VideoItem = {
          id,
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          status: 'idle',
          progress: 0,
        };
        newValidVideos.push(newItem);

        // Generate thumbnail preview frame asynchronously
        generateVideoThumbnail(file).then((thumbFile) => {
          if (thumbFile) {
            const thumbUrl = URL.createObjectURL(thumbFile);
            setSelectedVideos((prev) =>
              prev.map((v) =>
                v.id === id
                  ? { ...v, thumbnailFile: thumbFile, thumbnailPreviewUrl: thumbUrl }
                  : v
              )
            );
          }
        });
      } else {
        invalidFileNames.push(file.name);
      }
    });

    if (invalidFileNames.length > 0) {
      setRejectedMessage(
        `${invalidFileNames.length} file(s) rejected: ${invalidFileNames.join(
          ', '
        )} is not a supported video format (MP4, MOV, WEBM, MKV, AVI).`
      );
    }

    if (newValidVideos.length > 0) {
      setSelectedVideos((prev) => [...prev, ...newValidVideos]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSelection(e.target.files);
    }
  };

  const handleAddUrl = () => {
    if (!videoUrlInput.trim()) return;
    const url = videoUrlInput.trim();
    const fileName = url.split('/').pop()?.split('?')[0] || 'Web Video';

    const newItem: VideoItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      urlInput: url,
      previewUrl: url,
      name: fileName,
      size: 0,
      status: 'idle',
      progress: 0,
    };

    setSelectedVideos((prev) => [...prev, newItem]);
    setVideoUrlInput('');
  };

  const removeVideo = (id: string) => {
    if (loading) return;
    setSelectedVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target?.file && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      if (target?.thumbnailPreviewUrl && target.thumbnailPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.thumbnailPreviewUrl);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToSelection(e.dataTransfer.files);
    }
  };

  // Execute batch upload with controlled concurrency (up to 2 simultaneous video uploads)
  const handleUploadBatch = async (itemsToUpload: VideoItem[]) => {
    if (itemsToUpload.length === 0) return;

    setLoading(true);
    setBatchError('');
    setBatchSuccessMessage('');

    let successCount = 0;
    let failCount = 0;

    // Reset status of items to upload
    setSelectedVideos((prev) =>
      prev.map((item) =>
        itemsToUpload.some((u) => u.id === item.id)
          ? { ...item, status: 'idle', progress: 0, error: undefined }
          : item
      )
    );

    // Worker function for uploading a single video item
    const uploadSingleVideo = async (item: VideoItem): Promise<boolean> => {
      // Mark status uploading
      setSelectedVideos((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, status: 'uploading', progress: 5 } : v))
      );

      try {
        let finalVideoUrl = item.urlInput || item.uploadedUrl || '';
        let finalThumbnailUrl = item.uploadedThumbnailUrl || thumbnailUrl.trim() || '';

        // 1. Automatic Video Thumbnail Generation & Upload
        if (item.file && !finalThumbnailUrl) {
          try {
            let thumbFile = item.thumbnailFile || null;
            if (!thumbFile) {
              thumbFile = await generateVideoThumbnail(item.file);
            }
            if (thumbFile) {
              finalThumbnailUrl = await uploadFileWithProgress(thumbFile);
            }
          } catch (thumbErr) {
            console.warn(`Automatic video thumbnail generation skipped for ${item.name}:`, thumbErr);
          }
        }

        // 2. Direct browser-to-Vercel-Blob client upload (for original video file)
        if (item.file && !item.uploadedUrl) {
          finalVideoUrl = await uploadFileWithProgress(item.file, {
            onProgress: (pct) => {
              setSelectedVideos((prev) =>
                prev.map((v) => (v.id === item.id ? { ...v, progress: pct } : v))
              );
            },
          });
        }

        if (!finalVideoUrl) {
          throw new Error('Could not obtain valid video URL for storage.');
        }

        // 3. Save MemoryVideo metadata record in Prisma
        const res = await fetch(`/api/memories/${memoryId}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: finalVideoUrl,
            thumbnailUrl: finalThumbnailUrl || null,
            title: title.trim() || item.name,
            caption: caption.trim() || null,
            date: date || null,
            uploaderName: uploaderName.trim() || null,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save video metadata.');
        }

        // Mark success
        setSelectedVideos((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? {
                  ...v,
                  status: 'success',
                  progress: 100,
                  uploadedUrl: finalVideoUrl,
                  uploadedThumbnailUrl: finalThumbnailUrl,
                }
              : v
          )
        );
        successCount++;
        return true;
      } catch (err: any) {
        console.error(`Error uploading video ${item.name}:`, err);
        const errMsg = err?.message || 'Upload failed';
        setSelectedVideos((prev) =>
          prev.map((v) =>
            v.id === item.id ? { ...v, status: 'failed', progress: 0, error: errMsg } : v
          )
        );
        failCount++;
        return false;
      }
    };

    // Concurrency limit = 2 simultaneous video uploads
    await runWithConcurrency(itemsToUpload, MAX_CONCURRENT_UPLOADS, uploadSingleVideo);

    setLoading(false);

    // Update parent memory space videos if any videos succeeded
    if (successCount > 0) {
      onVideoUploaded();
    }

    if (failCount === 0) {
      setBatchSuccessMessage(`✓ ${successCount} video(s) uploaded successfully!`);
      // Auto-close modal after brief delay when all succeed
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setBatchError(
        `${successCount} video(s) uploaded successfully, ${failCount} video(s) failed.`
      );
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVideos.length === 0) {
      setBatchError('Please select at least one video file to upload.');
      return;
    }
    const pending = selectedVideos.filter((v) => v.status !== 'success');
    handleUploadBatch(pending);
  };

  const handleRetryFailed = () => {
    const failedItems = selectedVideos.filter((v) => v.status === 'failed');
    if (failedItems.length > 0) {
      handleUploadBatch(failedItems);
    }
  };

  const completedCount = selectedVideos.filter((v) => v.status === 'success').length;
  const failedCount = selectedVideos.filter((v) => v.status === 'failed').length;
  const totalCount = selectedVideos.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-vault-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 text-vault-100 flex items-center justify-between border-b border-vault-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Video className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Add Video Memories</h3>
              <p className="text-xs text-vault-400">
                Select and upload multiple videos at once
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-vault-800 text-vault-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Notifications */}
          {rejectedMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{rejectedMessage}</span>
            </div>
          )}

          {batchError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2">
              <span>{batchError}</span>
              {failedCount > 0 && !loading && (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs shrink-0 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Retry Failed ({failedCount})
                </button>
              )}
            </div>
          )}

          {batchSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>{batchSuccessMessage}</span>
            </div>
          )}

          {/* File Picker / Drag & Drop Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700">
                Selected Videos {selectedVideos.length > 0 && `(${selectedVideos.length})`}
              </label>

              {selectedVideos.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  <Plus className="w-3.5 h-3.5" /> Add More Videos
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedVideos.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                    : 'border-vault-200 hover:border-amber-400/80 bg-vault-50/50'
                }`}
              >
                <div className="space-y-3 py-2">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-7 h-7 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-vault-900">
                      Drop video clips here, or <span className="text-amber-800 underline">Browse files</span>
                    </p>
                    <p className="text-[11px] text-vault-500 mt-1">
                      Select multiple videos at once (MP4, MOV, WebM, MKV)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Selected Videos List */
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-vault-200 rounded-2xl bg-vault-50/50">
                {selectedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-3 rounded-xl bg-white border border-vault-200 shadow-xs flex flex-col gap-2 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-10 rounded-lg bg-vault-900 overflow-hidden flex items-center justify-center shrink-0 border border-vault-200 relative">
                          {video.thumbnailPreviewUrl ? (
                            <img
                              src={video.thumbnailPreviewUrl}
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Play className="w-4 h-4 fill-amber-500 text-amber-500 ml-0.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-vault-900 truncate">
                            {video.name}
                          </p>
                          {video.size > 0 && (
                            <p className="text-[10px] text-vault-500 font-mono">
                              {formatBytes(video.size)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        {video.status === 'success' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                          </span>
                        )}

                        {video.status === 'uploading' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-700" /> {video.progress}%
                          </span>
                        )}

                        {video.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                            ❌ Failed
                          </span>
                        )}

                        {video.status === 'idle' && (
                          <span className="px-2 py-0.5 rounded-md bg-vault-100 text-vault-600 font-medium text-[11px]">
                            {loading ? '⏳ Waiting' : 'Pending'}
                          </span>
                        )}

                        {video.status !== 'uploading' && !loading && (
                          <button
                            type="button"
                            onClick={() => removeVideo(video.id)}
                            className="p-1 rounded-lg text-vault-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Individual Upload Progress Bar */}
                    {video.status === 'uploading' && (
                      <div className="w-full bg-vault-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${video.progress}%` }}
                        ></div>
                      </div>
                    )}

                    {video.error && (
                      <p className="text-[10px] text-rose-600 font-medium pl-1">
                        {video.error}
                      </p>
                    )}
                  </div>
                ))}

                {/* Optional Web Video Direct URL paste */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste a video direct MP4 URL..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    disabled={loading}
                    className="flex-grow px-3.5 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={loading || !videoUrlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-vault-800 hover:bg-vault-900 text-amber-300 text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Overall Batch Progress Bar */}
          {loading && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  Uploading {completedCount} of {totalCount} videos...
                </span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Form Metadata Fields */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
              Video Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Acoustic Jam Session (or leave blank to use file names)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
              Thumbnail Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
              Video Description / Memory Note
            </label>
            <textarea
              rows={2}
              placeholder="Describe these video memories..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-sans"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-vault-500" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
                Uploader Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-vault-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-vault-600 hover:text-vault-900 hover:bg-vault-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {failedCount > 0 && !loading ? (
              <button
                type="button"
                onClick={handleRetryFailed}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retry {failedCount} Failed Video(s)
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || selectedVideos.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-300 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>
                      Uploading ({completedCount}/{totalCount})...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      Upload {selectedVideos.length > 0 ? `${selectedVideos.length} Video(s)` : 'Videos'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

