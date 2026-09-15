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
          
        </form>
      </div>

      
    </div>
  );
}
