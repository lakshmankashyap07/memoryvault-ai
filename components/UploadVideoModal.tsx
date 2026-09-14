'use client';

import React, { useState } from 'react';
import { X, Video, Upload, Calendar, Sparkles, Loader2 } from 'lucide-react';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onVideoUploaded: () => void;
}

export function UploadVideoModal({ isOpen, onClose, memoryId, onVideoUploaded }: UploadVideoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setVideoUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let finalVideoUrl = videoUrlInput;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload video file');
        }
        finalVideoUrl = uploadData.url;
      }

      if (!finalVideoUrl) {
        throw new Error('Please select a video file or provide a video URL');
      }

      const res = await fetch(`/api/memories/${memoryId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: finalVideoUrl,
          thumbnailUrl,
          title,
          caption,
          date,
          uploaderName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add video');
      }

      // Reset form
      setFile(null);
      setVideoUrlInput('');
      setThumbnailUrl('');
      setTitle('');
      setCaption('');
      setDate('');
      setUploaderName('');
      onVideoUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding video');
    } finally {
      setLoading(false);
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
            <Video className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Add Video Memory
            </h3>
            <p className="text-xs text-vault-500">
              Preserve video clips, music jams, or birthday messages
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Video Title
            </label>
            <input
              type="text"
              placeholder="e.g. College Fest Acoustic Jam Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-vault-700">
              Upload Video File or Paste Direct Video Link
            </label>
            <div className="border-2 border-dashed border-vault-300 hover:border-amber-500 rounded-2xl p-4 text-center transition-colors bg-vault-50/50">
              {file ? (
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-vault-200">
                  <span className="text-xs font-medium text-vault-800 truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-rose-600 hover:text-rose-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <Upload className="w-6 h-6 text-vault-400 mx-auto" />
                  <div className="text-xs text-vault-600">
                    <label className="cursor-pointer font-semibold text-amber-800 hover:underline">
                      Choose video file (MP4, MOV, WebM)
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {!file && (
              <input
                type="url"
                placeholder="Or paste video MP4 URL (e.g. https://commondatastorage.googleapis.com/...)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Thumbnail Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Video Description / Memory Note
            </label>
            <textarea
              rows={2}
              placeholder="Describe this video memory..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
          </div>

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
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                Uploader Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Preserving Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Add Video Memory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
