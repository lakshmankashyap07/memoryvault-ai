'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Check,
} from 'lucide-react';
import { uploadFileWithProgress, generateVideoThumbnailFromUrl } from '@/lib/upload-helper';

export interface MissingVideoItem {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  uploadedBy: string;
}

interface GenerateThumbnailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  videos: MissingVideoItem[];
  onThumbnailsGenerated: () => void;
}

interface BackfillStatusItem {
  id: string;
  fileUrl: string;
  name: string;
  status: 'idle' | 'processing' | 'success' | 'failed';
  progress: number;
  error?: string;
  generatedUrl?: string;
}

const MAX_CONCURRENT_THUMBNAILS = 2;

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

export function GenerateThumbnailsModal({
  isOpen,
  onClose,
  memoryId,
  videos,
  onThumbnailsGenerated,
}: GenerateThumbnailsModalProps) {
  const [items, setItems] = useState<BackfillStatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState('');
  const [batchError, setBatchError] = useState('');

  // Initialize items from videos missing thumbnails
  useEffect(() => {
    if (isOpen) {
      const missing = videos.filter((v) => !v.thumbnailUrl || v.thumbnailUrl.trim() === '');
      setItems(
        missing.map((v) => ({
          id: v.id,
          fileUrl: v.fileUrl,
          name: v.title || v.caption || `video-${v.id.slice(0, 6)}.mp4`,
          status: 'idle',
          progress: 0,
        }))
      );
      setBatchSuccessMessage('');
      setBatchError('');
    }
  }, [isOpen, videos]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setItems([]);
    setBatchSuccessMessage('');
    setBatchError('');
    onClose();
  };

  const processBatch = async (itemsToProcess: BackfillStatusItem[]) => {
    if (itemsToProcess.length === 0) return;

    setLoading(true);
    setBatchSuccessMessage('');
    setBatchError('');

    let successCount = 0;
    let failCount = 0;

    // Reset status of items to process
    setItems((prev) =>
      prev.map((item) =>
        itemsToProcess.some((p) => p.id === item.id)
          ? { ...item, status: 'idle', progress: 0, error: undefined }
          : item
      )
    );

    const processSingleVideo = async (item: BackfillStatusItem): Promise<boolean> => {
      // Mark processing
      setItems((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, status: 'processing', progress: 10 } : v))
      );

      console.log(`[Thumbnail Backfill] Processing video: ${item.id}`);
      console.log(`[Thumbnail Backfill] Filename: ${item.name}`);
      console.log(`[Thumbnail Backfill] Original video URL: ${item.fileUrl}`);

      try {
        // 1. Generate thumbnail File from video URL (with automatic server proxy fallback)
        const proxyUrl = `/api/memories/${memoryId}/videos/${item.id}`;
        console.log(`[Thumbnail Backfill] Stage 1: Fetching video & extracting frame...`);
        const thumbFile = await generateVideoThumbnailFromUrl(item.fileUrl, item.id, proxyUrl);

        if (!thumbFile) {
          throw new Error('Frame extraction returned empty result');
        }

        console.log(`[Thumbnail Backfill] Stage 2: Frame extracted successfully (${thumbFile.size} bytes). Uploading thumbnail...`);
        setItems((prev) =>
          prev.map((v) => (v.id === item.id ? { ...v, progress: 50 } : v))
        );

        // 2. Upload generated thumbnail file to Vercel Blob
        const newThumbnailUrl = await uploadFileWithProgress(thumbFile, {
          onProgress: (pct) => {
            setItems((prev) =>
              prev.map((v) =>
                v.id === item.id ? { ...v, progress: 50 + Math.round(pct / 2) } : v
              )
            );
          },
        });

        if (!newThumbnailUrl) {
          throw new Error('Storage returned empty thumbnail URL');
        }

        console.log(`[Thumbnail Backfill] Stage 3: Thumbnail uploaded to Blob: ${newThumbnailUrl}. Updating Prisma DB...`);

        // 3. Update MemoryVideo record in Prisma via PATCH endpoint
        const res = await fetch(`/api/memories/${memoryId}/videos/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumbnailUrl: newThumbnailUrl }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Prisma DB update failed (HTTP ${res.status})`);
        }

        console.log(`[Thumbnail Backfill] Stage 4: SUCCESS - Prisma DB record updated for videoId: ${item.id}`);

        // Mark success
        setItems((prev) =>
          prev.map((v) =>
            v.id === item.id
              ? { ...v, status: 'success', progress: 100, generatedUrl: newThumbnailUrl }
              : v
          )
        );
        successCount++;
        return true;
      } catch (err: any) {
        const errMsg = err?.message || 'Thumbnail generation failed';
        console.error(`[Thumbnail Backfill] FAILED for videoId ${item.id}:`, errMsg);
        setItems((prev) =>
          prev.map((v) =>
            v.id === item.id ? { ...v, status: 'failed', progress: 0, error: errMsg } : v
          )
        );
        failCount++;
        return false;
      }
    };

    await runWithConcurrency(itemsToProcess, MAX_CONCURRENT_THUMBNAILS, processSingleVideo);

    setLoading(false);

    if (successCount > 0) {
      onThumbnailsGenerated();
    }

    if (failCount === 0) {
      setBatchSuccessMessage(`✓ ${successCount} thumbnail(s) generated successfully!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setBatchError(
        `${successCount} thumbnail(s) generated successfully, ${failCount} video(s) failed.`
      );
    }
  };

  const handleStartProcess = () => {
    const pending = items.filter((i) => i.status !== 'success');
    processBatch(pending);
  };

  const handleRetryFailed = () => {
    const failed = items.filter((i) => i.status === 'failed');
    if (failed.length > 0) {
      processBatch(failed);
    }
  };

  const completedCount = items.filter((i) => i.status === 'success').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const totalCount = items.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-vault-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 text-vault-100 flex items-center justify-between border-b border-vault-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Generate Video Thumbnails</h3>
              <p className="text-xs text-vault-400">
                Automatically generate thumbnail covers for existing videos
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-grow">
          {batchError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2">
              <span>{batchError}</span>
              {failedCount > 0 && !loading && (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-colors"
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

          {items.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-vault-900">
                All video thumbnails are up to date!
              </p>
              <p className="text-xs text-vault-500">
                Every video in this Memory Space already has a thumbnail cover.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Batch Progress Bar */}
              {loading && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      Generating thumbnails ({completedCount} of {totalCount})...
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

              {/* Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto p-2 border border-vault-200 rounded-2xl bg-vault-50/50">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-vault-200 shadow-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 fill-amber-700 text-amber-700 ml-0.5" />
                        </div>
                        <span className="text-xs font-semibold text-vault-900 truncate">
                          {item.name}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {item.status === 'success' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </span>
                        )}

                        {item.status === 'processing' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-700" /> Generating frame...
                          </span>
                        )}

                        {item.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                            ❌ Failed
                          </span>
                        )}

                        {item.status === 'idle' && (
                          <span className="px-2 py-0.5 rounded-md bg-vault-100 text-vault-600 font-medium text-[11px]">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {item.error && (
                      <p className="text-[10px] text-rose-600 font-medium pl-1">
                        {item.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-vault-50 border-t border-vault-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-vault-600 hover:text-vault-900 hover:bg-vault-200 transition-colors disabled:opacity-50"
          >
            {completedCount > 0 && !loading ? 'Done' : 'Cancel'}
          </button>

          {failedCount > 0 && !loading ? (
            <button
              type="button"
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Retry {failedCount} Failed
            </button>
          ) : (
            items.length > 0 &&
            completedCount < items.length && (
              <button
                type="button"
                onClick={handleStartProcess}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-300 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Processing ({completedCount}/{totalCount})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Start Generating ({items.length})</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
