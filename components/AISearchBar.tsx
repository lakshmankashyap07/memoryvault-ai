'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  X,
  Camera,
  Video,
  MessageSquare,
  Clock,
  Filter,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface AISearchBarProps {
  memoryId?: string;
  onSelectResult?: (result: any) => void;
}

const ROTATING_PROMPTS = [
  'Find our farewell photos',
  'Show memories from 2025',
  'Find messages from Karan',
  'What happened on our first trip?',
  'Show funny college memories',
];

export function AISearchBar({ memoryId, onSelectResult }: AISearchBarProps) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIdx((prev) => (prev + 1) % ROTATING_PROMPTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
    if (e) e.preventDefault();
    const q = searchQuery || query;
    if (!q.trim() || !memoryId) return;

    setLoading(true);
    setModalOpen(true);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryId,
          query: q.trim(),
          typeFilter: selectedType || undefined,
          yearFilter: selectedYear || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-amber-700 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search memories (e.g. "${ROTATING_PROMPTS[promptIdx]}")`}
          className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white border-2 border-vault-200 focus:border-amber-500 text-xs text-vault-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none shadow-soft transition-all"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 px-4 py-2 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-amber-300" />}
          <span>AI Search</span>
        </button>
      </form>

      {/* Search Results Modal / Drawer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-vault-200 relative max-h-[85vh] flex flex-col justify-between">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pb-4 border-b border-vault-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-vault-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Search Results for &ldquo;{query}&rdquo;</span>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-vault-500" />
                {['', 'PHOTO', 'VIDEO', 'MESSAGE', 'TIMELINE'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedType(t);
                      handleSearch(undefined, query);
                    }}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
                      selectedType === t
                        ? 'bg-vault-900 text-amber-300 border-vault-900'
                        : 'bg-vault-50 text-vault-700 border-vault-200 hover:bg-vault-100'
                    }`}
                  >
                    {t || 'All Types'}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                  <p className="text-xs font-serif text-vault-600">Performing semantic vector search...</p>
                </div>
              ) : !results || (results.photos.length === 0 && results.videos.length === 0 && results.messages.length === 0 && results.timeline.length === 0) ? (
                <div className="py-12 text-center text-xs text-vault-500">
                  No memories matched your AI search query. Try broadening your query terms!
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Photos */}
                  {results.photos?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-700" />
                        Photos ({results.photos.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {results.photos.map((photo: any) => (
                          <div
                            key={photo.id}
                            onClick={() => {
                              setModalOpen(false);
                              if (onSelectResult) onSelectResult(photo);
                            }}
                            className="bg-vault-50 rounded-2xl overflow-hidden border border-vault-200 group cursor-pointer p-2 space-y-1.5"
                          >
                            <img
                              src={photo.fileUrl}
                              alt={photo.caption || 'Photo'}
                              className="w-full h-28 object-cover rounded-xl"
                            />
                            <p className="text-[11px] font-serif text-vault-800 line-clamp-1">{photo.caption || 'Photo Memory'}</p>
                            <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              {photo.matchReason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {results.videos?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-amber-700" />
                        Videos ({results.videos.length})
                      </h4>
                      <div className="space-y-2">
                        {results.videos.map((vid: any) => (
                          <div key={vid.id} className="p-3 bg-vault-50 rounded-2xl border border-vault-200 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xs text-vault-900">{vid.title || 'Video Memory'}</p>
                              <p className="text-[11px] text-vault-600">{vid.caption}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              {vid.matchReason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {results.messages?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-700" />
                        Messages ({results.messages.length})
                      </h4>
                      <div className="space-y-2">
                        {results.messages.map((msg: any) => (
                          <div key={msg.id} className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-vault-900">{msg.authorName}</span>
                              <span className="text-[10px] text-amber-800 font-semibold">{msg.matchReason}</span>
                            </div>
                            <p className="font-serif italic text-xs text-vault-700">&ldquo;{msg.message}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
