'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Sparkles, Check } from 'lucide-react';

interface AITagManagerProps {
  memoryId: string;
}

export function AITagManager({ memoryId }: AITagManagerProps) {
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/ai/tags?memoryId=${memoryId}`);
      const data = await res.json();
      if (res.ok) {
        setSavedTags(data.savedTags.map((t: any) => t.tag));
        setSuggestedTags(data.suggestedTags || []);
      }
    } catch (err) {
      console.error('Fetch tags error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memoryId) fetchTags();
  }, [memoryId]);

  const handleAddTag = async (tagToAdd: string) => {
    if (!tagToAdd.trim()) return;
    try {
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, tag: tagToAdd.trim(), action: 'ADD' }),
      });
      if (res.ok) {
        setSavedTags((prev) => Array.from(new Set([...prev, tagToAdd.trim()])));
        setSuggestedTags((prev) => prev.filter((t) => t !== tagToAdd.trim()));
        setNewTagInput('');
      }
    } catch (err) {
      console.error('Add tag error:', err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, tag: tagToRemove, action: 'DELETE' }),
      });
      if (res.ok) {
        setSavedTags((prev) => prev.filter((t) => t !== tagToRemove));
      }
    } catch (err) {
      console.error('Remove tag error:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-700" />
          Memory Space Tags
        </h4>
        <span className="text-[10px] text-vault-400">Organized by AI & You</span>
      </div>

      {/* Saved Tags list */}
      <div className="flex flex-wrap items-center gap-2">
        {savedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vault-100 text-vault-900 text-xs font-semibold border border-vault-200 group"
          >
            <span>#{tag}</span>
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-vault-400 hover:text-rose-600 transition-colors"
              title="Remove tag"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTag(newTagInput);
          }}
          className="inline-flex items-center gap-1"
        >
          <input
            type="text"
            placeholder="+ Custom Tag"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            className="px-2.5 py-1 rounded-full border border-dashed border-vault-300 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none w-28"
          />
        </form>
      </div>

      {/* AI Suggested Tags */}
      {suggestedTags.length > 0 && (
        <div className="pt-3 border-t border-vault-100 space-y-2">
          <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            AI Suggested Tags (Click to add):
          </p>

          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium transition-colors"
              >
                <Plus className="w-3 h-3 text-amber-700" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
