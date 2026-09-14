'use client';

import React from 'react';
import { X, Calendar, MapPin, User } from 'lucide-react';

interface PhotoLightboxProps {
  photo: {
    fileUrl: string;
    caption?: string | null;
    date?: string | null;
    location?: string | null;
    uploadedBy: string;
  } | null;
  onClose: () => void;
}

export function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/90 backdrop-blur-md animate-fadeIn">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-vault-900/80 text-vault-200 hover:text-white hover:bg-vault-800 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-vault-900 rounded-3xl overflow-hidden shadow-2xl border border-vault-800 max-h-[90vh]">
        {/* Photo view */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
          <img
            src={photo.fileUrl}
            alt={photo.caption || 'Memory Photo'}
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
        </div>

        {/* Sidebar details */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-vault-900 text-vault-100 overflow-y-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
              <User className="w-3.5 h-3.5" />
              Shared by {photo.uploadedBy}
            </div>

            {photo.caption ? (
              <p className="font-serif text-lg text-vault-100 leading-relaxed">
                &ldquo;{photo.caption}&rdquo;
              </p>
            ) : (
              <p className="text-sm italic text-vault-400">No story added for this photo.</p>
            )}

            <div className="pt-4 border-t border-vault-800 space-y-2 text-xs text-vault-400">
              {photo.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{photo.date}</span>
                </div>
              )}
              {photo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{photo.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-vault-800 hover:bg-vault-700 text-vault-200 text-xs font-semibold transition-colors"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
