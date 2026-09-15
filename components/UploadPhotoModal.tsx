'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Calendar,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { uploadFileWithProgress } from '@/lib/upload-helper';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onPhotoUploaded: () => void;
}

export interface PhotoItem {
  id: string;
  file?: File;
  urlInput?: string;
  previewUrl: string;
  name: string;
  size: number;
  status: 'idle' | 'uploading' | 'success' | 'failed';
  progress: number;
  error?: string;
  uploadedUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/avif',
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'avif'];

function isImageFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ALLOWED_EXTENSIONS.includes(ext)) return true;
  if (file.type && (ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/'))) {
    return true;
  }
  return false;
}

// Maximum 4 SIMULTANEOUS uploads at the same time
const MAX_CONCURRENT_UPLOADS = 4;

// Controlled concurrency queue executor
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  // Shallow copy task queue with original indices
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

export function UploadPhotoModal({
  isOpen,
  onClose,
  memoryId,
  onPhotoUploaded,
}: UploadPhotoModalProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoItem[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState<string>('');
  const [batchError, setBatchError] = useState<string>('');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up Object URLs when modal unmounts
  useEffect(() => {
    return () => {
      selectedPhotos.forEach((item) => {
        if (item.file && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    // Revoke object URLs
    selectedPhotos.forEach((item) => {
      if (item.file && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedPhotos([]);
    setImageUrlInput('');
    setCaption('');
    setDate('');
    setLocation('');
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

    const newValidPhotos: PhotoItem[] = [];
    const invalidFileNames: string[] = [];

    Array.from(files).forEach((file) => {
      if (isImageFile(file)) {
        const previewUrl = URL.createObjectURL(file);
        newValidPhotos.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          status: 'idle',
          progress: 0,
        });
      } else {
        invalidFileNames.push(file.name);
      }
    });

    if (invalidFileNames.length > 0) {
      setRejectedMessage(
        `${invalidFileNames.length} file(s) rejected: ${invalidFileNames.join(
          ', '
        )} is not a supported image format (JPG, PNG, WEBP, GIF, HEIC).`
      );
    }

    if (newValidPhotos.length > 0) {
      setSelectedPhotos((prev) => [...prev, ...newValidPhotos]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSelection(e.target.files);
    }
  };

  const handleAddUrl = () => {
    if (!imageUrlInput.trim()) return;
    const url = imageUrlInput.trim();
    const fileName = url.split('/').pop()?.split('?')[0] || 'Web Image';

    const newItem: PhotoItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      urlInput: url,
      previewUrl: url,
      name: fileName,
      size: 0,
      status: 'idle',
      progress: 0,
    };

    setSelectedPhotos((prev) => [...prev, newItem]);
    setImageUrlInput('');
  };

  const removePhoto = (id: string) => {
    if (loading) return;
    setSelectedPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.file && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
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

  // Execute batch upload with controlled concurrency (up to 4 simultaneous uploads)
  const handleUploadBatch = async (itemsToUpload: PhotoItem[]) => {
    if (itemsToUpload.length === 0) return;

    setLoading(true);
    setBatchError('');
    setBatchSuccessMessage('');

    let successCount = 0;
    let failCount = 0;

    // Reset status of items to upload
    setSelectedPhotos((prev) =>
      prev.map((item) =>
        itemsToUpload.some((u) => u.id === item.id)
          ? { ...item, status: 'idle', progress: 0, error: undefined }
          : item
      )
    );

    // Worker function for uploading a single photo item
    const uploadSinglePhoto = async (item: PhotoItem): Promise<boolean> => {
      // Mark uploading
      setSelectedPhotos((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading', progress: 5 } : p))
      );

      try {
        let finalFileUrl = item.urlInput || item.uploadedUrl || '';

        // 1. Direct browser-to-Vercel-Blob client upload (if local File)
        if (item.file && !item.uploadedUrl) {
          finalFileUrl = await uploadFileWithProgress(item.file, {
            onProgress: (pct) => {
              setSelectedPhotos((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, progress: pct } : p))
              );
            },
          });
        }

        if (!finalFileUrl) {
          throw new Error('Could not obtain valid file URL for storage.');
        }

        // 2. Save MemoryPhoto metadata record in Prisma
        const res = await fetch(`/api/memories/${memoryId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: finalFileUrl,
            caption: caption.trim() || null,
            date: date || null,
            location: location.trim() || null,
            uploaderName: uploaderName.trim() || null,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to save photo metadata.');
        }

        // Mark success
        setSelectedPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: 'success', progress: 100, uploadedUrl: finalFileUrl }
              : p
          )
        );
        successCount++;
        return true;
      } catch (err: any) {
        console.error(`Error uploading photo ${item.name}:`, err);
        const errMsg = err?.message || 'Upload failed';
        setSelectedPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'failed', progress: 0, error: errMsg } : p
          )
        );
        failCount++;
        return false;
      }
    };

    // Concurrency limit = 4 simultaneous uploads
    await runWithConcurrency(itemsToUpload, MAX_CONCURRENT_UPLOADS, uploadSinglePhoto);

    setLoading(false);

    // Update parent photos tab view if any photos succeeded
    if (successCount > 0) {
      onPhotoUploaded();
    }

    if (failCount === 0) {
      setBatchSuccessMessage(`✓ ${successCount} photo(s) uploaded successfully!`);
      // Auto-close modal after brief delay when all succeed
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      setBatchError(
        `${successCount} photo(s) uploaded successfully, ${failCount} photo(s) failed.`
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPhotos.length === 0) {
      setBatchError('Please select at least one photo to upload.');
      return;
    }
    const pending = selectedPhotos.filter((p) => p.status !== 'success');
    handleUploadBatch(pending);
  };

  const handleRetryFailed = () => {
    const failedItems = selectedPhotos.filter((p) => p.status === 'failed');
    if (failedItems.length > 0) {
      handleUploadBatch(failedItems);
    }
  };

  const pendingCount = selectedPhotos.filter((p) => p.status !== 'success').length;
  const completedCount = selectedPhotos.filter((p) => p.status === 'success').length;
  const failedCount = selectedPhotos.filter((p) => p.status === 'failed').length;
  const totalCount = selectedPhotos.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-vault-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 text-vault-100 flex items-center justify-between border-b border-vault-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Add Photo Memories</h3>
              <p className="text-xs text-vault-400">
                Select and upload any number of photos in one batch
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
                Selected Photos {selectedPhotos.length > 0 && `(${selectedPhotos.length})`}
              </label>

              {selectedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  <Plus className="w-3.5 h-3.5" /> Add More Photos
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/heic,image/avif"
              multiple
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedPhotos.length === 0 ? (
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
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-vault-900">
                      Drop photos here, or <span className="text-amber-800 underline">Browse files</span>
                    </p>
                    <p className="text-[11px] text-vault-500 mt-1">
                      Select multiple photos (PNG, JPG, WEBP, GIF, HEIC)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Photo Preview Grid */
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 sm:max-h-80 overflow-y-auto p-2.5 border border-vault-200 rounded-2xl bg-vault-50/50">
                  {selectedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-xl overflow-hidden bg-vault-900 aspect-square border border-vault-200 shadow-xs flex flex-col justify-between"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Remove Button */}
                      {photo.status !== 'uploading' && !loading && (
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-vault-950/80 hover:bg-rose-600 text-white transition-colors z-10"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Status Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-vault-950/90 via-vault-950/60 to-transparent text-[10px] text-white font-medium flex items-center justify-between">
                        <span className="truncate pr-1 text-[10px] font-mono text-vault-200">
                          {photo.name}
                        </span>

                        {photo.status === 'success' && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold flex items-center gap-0.5">
                            ✓ Done
                          </span>
                        )}

                        {photo.status === 'uploading' && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500 text-vault-950 font-bold flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> {photo.progress}%
                          </span>
                        )}

                        {photo.status === 'failed' && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-bold">
                            ❌ Failed
                          </span>
                        )}

                        {photo.status === 'idle' && (
                          loading ? (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-vault-700/90 text-vault-200 font-medium text-[9px]">
                              ⏳ Waiting
                            </span>
                          ) : (
                            photo.size > 0 && (
                              <span className="shrink-0 text-[9px] text-vault-300 font-mono">
                                {formatBytes(photo.size)}
                              </span>
                            )
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Web Image URL paste input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste an image web link..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    disabled={loading}
                    className="flex-grow px-3.5 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={loading || !imageUrlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-vault-800 hover:bg-vault-900 text-amber-300 text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batch Progress Bar UI */}
          {loading && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  Uploading {completedCount} of {totalCount} photos...
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

          {/* Caption / Story Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
              Memory Caption / Story
            </label>
            <textarea
              rows={3}
              placeholder="What makes these photos special? Write the story behind this moment (applies to all selected photos)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-sans"
            ></textarea>
          </div>

          {/* Date & Location Fields */}
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-vault-500" />
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Campus Canteen, Manali Trip"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contributor Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-700 mb-1">
              Your Name (Contributor)
            </label>
            <input
              type="text"
              placeholder="e.g. Aditya Sharma"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
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
                Retry {failedCount} Failed Photo(s)
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || selectedPhotos.length === 0}
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
                      Upload {selectedPhotos.length > 0 ? `${selectedPhotos.length} Photo(s)` : 'Photos'}
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

