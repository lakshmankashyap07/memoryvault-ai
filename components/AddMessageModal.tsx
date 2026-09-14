'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Heart, Sparkles, Loader2 } from 'lucide-react';

interface AddMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  onMessageAdded: () => void;
}

export function AddMessageModal({ isOpen, onClose, memoryId, onMessageAdded }: AddMessageModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Please write your memory message');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${memoryId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          authorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post message');
      }

      setTitle('');
      setMessage('');
      setAuthorName('');
      onMessageAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error posting message');
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
            <Heart className="w-5 h-5 text-amber-700 fill-amber-700/20" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Leave a Memory Note
            </h3>
            <p className="text-xs text-vault-500">
              Write a message or story to preserve forever
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
              Title / Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Brothers for life, Hostel maggi nights..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Your Message *
            </label>
            <textarea
              rows={4}
              placeholder="&ldquo;I'll always remember our first year together...&rdquo;"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-serif text-vault-800 leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
              Your Name / Relationship
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Nair (College Friend)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
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
                  Posting Note...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Post Memory Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
