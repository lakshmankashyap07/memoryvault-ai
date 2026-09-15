'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Edit2, Loader2 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface EditTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  event: TimelineEvent | null;
  onEventUpdated: () => void;
}

export function EditTimelineModal({
  isOpen,
  onClose,
  memoryId,
  event,
  onEventUpdated,
}: EditTimelineModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(event.date || '');
      setDescription(event.description || '');
      setError('');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date.trim()) {
      setError('Title and date are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${memoryId}/timeline/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date: date.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update timeline event');
      }

      onEventUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating timeline event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-vault-200 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Edit2 className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Edit Timeline Event
            </h3>
            <p className="text-xs text-vault-500">
              Update milestone title, date, or details
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
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Graduation Day, First Trip Together"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Event Date / Year *
            </label>
            <input
              type="text"
              placeholder="e.g. 2019-09-01, September 2021, Summer 2023"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe what made this milestone special..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-vault-300 text-vault-700 hover:bg-vault-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
