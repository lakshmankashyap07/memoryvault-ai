'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Calendar, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { uploadFileWithProgress } from '@/lib/upload-helper';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onPhotoUploaded: () => void;
}

export function UploadPhotoModal({ isOpen, onClose, memoryId, onPhotoUploaded }: UploadPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setImageUrlInput('');
    }
  };

  const handleUrlInput = (val: string) => {
    setImageUrlInput(val);
    if (val) {
      setFile(null);
      setPreviewUrl(val);
    } else {
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadProgress(null);

    try {
      let finalFileUrl = imageUrlInput;

      if (file) {
        finalFileUrl = await uploadFileWithProgress(file, {
          onProgress: (percent) => setUploadProgress(percent),
        });
      }

      if (!finalFileUrl) {
        throw new Error('Please select an image file or paste an image URL');
      }

      const res = await fetch(`/api/memories/${memoryId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: finalFileUrl,
          caption,
          date,
          location,
          uploaderName,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        const textMsg = await res.text();
        throw new Error(textMsg || 'Failed to save photo record to database.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add photo');
      }

      // Reset form
      setFile(null);
      setImageUrlInput('');
      setPreviewUrl('');
      setCaption('');
      setDate('');
      setLocation('');
      setUploaderName('');
      setUploadProgress(null);
      onPhotoUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding photo');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-vault-200 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Add Photo Memory
            </h3>
            <p className="text-xs text-vault-500">
              Preserve a moment with image & story details
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File selector or URL input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-vault-700">
              Upload Image or Paste Link
            </label>
            <div className="border-2 border-dashed border-vault-300 hover:border-amber-500 rounded-2xl p-4 text-center transition-colors bg-vault-50/50">
              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setImageUrlInput('');
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-vault-950/80 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  <Upload className="w-8 h-8 text-vault-400 mx-auto" />
                  <div className="text-xs text-vault-600">
                    <label className="cursor-pointer font-semibold text-amber-800 hover:underline">
                      Click to choose image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="block text-[11px] text-vault-400 mt-1">PNG, JPG, WEBP, GIF up to 50MB</span>
                  </div>
                </div>
              )}
            </div>

            {!previewUrl && (
              <div className="pt-2">
                <input
                  type="url"
                  placeholder="Or paste image URL (e.g. https://images.unsplash.com/...)"
                  value={imageUrlInput}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Memory Caption / Story
            </label>
            <textarea
              rows={3}
              placeholder="What makes this photo special? Write the story behind this moment..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-vault-500" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-vault-500" />
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Campus Canteen"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contributor Name */}
          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Your Name (Contributor)
            </label>
            <input
              type="text"
              placeholder="e.g. Aditya Sharma"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {uploadProgress !== null && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-vault-700">
                <span>Uploading directly to storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-vault-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  {uploadProgress !== null ? `Uploading ${uploadProgress}%...` : 'Preserving Photo...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Add Photo Memory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
