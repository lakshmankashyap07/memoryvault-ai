'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Loader2 } from 'lucide-react';

interface EditFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  file: {
    id: string;
    fileTitle?: string | null;
    fileName: string;
    description?: string | null;
  } | null;
  onFileUpdated: () => void;
}

export function EditFileModal({
  isOpen,
  onClose,
  memoryId,
  file,
  onFileUpdated,
}: EditFileModalProps) {
  const [fileTitle, setFileTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (file) {
      setFileTitle(file.fileTitle || file.fileName || '');
      setDescription(file.description || '');
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${memoryId}/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileTitle: fileTitle.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update file details');
      }

      onFileUpdated();
      onClose();
    } catch (err: any) {
      console.error('Edit file error:', err);
      setError(err.message || 'An error occurred while updating file details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-vault-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-vault-900 text-vault-100 flex items-center justify-between border-b border-vault-800">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base text-white">Edit File Details</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-vault-800 text-vault-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              File Title
            </label>
            <input
              type="text"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              placeholder="e.g. College Graduation Certificate"
              className="w-full px-4 py-2.5 rounded-xl border border-vault-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium text-vault-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-vault-600">
              Description / Note
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this document..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-vault-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium text-vault-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-vault-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-vault-600 hover:text-vault-900 hover:bg-vault-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-300 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
