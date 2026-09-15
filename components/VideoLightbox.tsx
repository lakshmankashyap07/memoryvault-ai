'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, User, Download, Loader2, Video as VideoIcon } from 'lucide-react';
import { downloadMediaFile } from '@/lib/utils';

export interface VideoItemData {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  caption?: string | null;
  uploadedBy: string;
  date?: string | null;
  location?: string | null;
}

interface VideoLightboxProps {
  video: VideoItemData | null;
  onClose: () => void;
}

export function VideoLightbox({ video, onClose }: VideoLightboxProps) {
  const [downloading, setDownloading] = useState(false);

  if (!video) return null;

  const handleDownload = async () => {
    setDownloading(true);
    const fileName = video.title || video.caption || `video-${video.id.slice(0, 6)}.mp4`;
    await downloadMediaFile(video.fileUrl, fileName);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-vault-950/90 backdrop-blur-md animate-fadeIn">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-vault-900/80 text-vault-200 hover:text-white hover:bg-vault-800 transition-colors z-10"
        title="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-vault-900 rounded-3xl overflow-hidden shadow-2xl border border-vault-800 max-h-[90vh]">
        {/* Video Player Area */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[280px] md:min-h-[480px] relative">
          <video
            controls
            autoPlay
            poster={video.thumbnailUrl || undefined}
            className="max-h-[80vh] w-full h-full object-contain"
          >
            <source src={video.fileUrl} type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>

        {/* Sidebar Details */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-vault-900 text-vault-100 overflow-y-auto shrink-0">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
              <User className="w-3.5 h-3.5" />
              Shared by {video.uploadedBy}
            </div>

            {video.title && (
              <h3 className="font-serif text-xl font-bold text-vault-100 leading-tight">
                {video.title}
              </h3>
            )}

            {video.caption ? (
              <p className="font-serif text-sm text-vault-300 leading-relaxed italic">
                &ldquo;{video.caption}&rdquo;
              </p>
            ) : (
              !video.title && <p className="text-xs italic text-vault-400">No title or story added.</p>
            )}

            <div className="pt-4 border-t border-vault-800 space-y-2 text-xs text-vault-400">
              {video.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{video.date}</span>
                </div>
              )}
              {video.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{video.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-vault-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-vault-950" />
                  <span>Downloading Original Video...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-vault-950" />
                  <span>Download Original Video</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-vault-800 hover:bg-vault-700 text-vault-300 text-xs font-semibold transition-colors"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
