'use client';

import React, { useState } from 'react';
import { X, Calendar, Milestone, Sparkles, Loader2 } from 'lucide-react';

interface AddTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onEventAdded: () => void;
}

export function AddTimelineModal({ isOpen, onClose, memoryId, onEventAdded }: AddTimelineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date) {
      setError('Title and date are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${memoryId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add timeline event');
      }

      setTitle('');
      setDescription('');
      setDate('');
      onEventAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error adding timeline event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-vault-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Milestone className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Add Timeline Milestone
            </h3>
            <p className="text-xs text-vault-500">
              Mark an important date in your shared journey
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
              placeholder="e.g. First College Trip, Graduation Day, Farewell..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-vault-500" />
              Event Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Description / Details
            </label>
            <textarea
              rows={3}
              placeholder="What happened on this date? Why is it unforgettable?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            ></textarea>
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
                  Adding Milestone...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Add Timeline Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
