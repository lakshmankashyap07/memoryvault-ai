'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, Camera, Video, MessageSquare, Clock } from 'lucide-react';

interface RelatedMemoriesProps {
  memoryId: string;
  targetMemoryId?: string;
  targetText?: string;
}

export function RelatedMemories({ memoryId, targetMemoryId, targetText }: RelatedMemoriesProps) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (memoryId && (targetMemoryId || targetText)) {
      setLoading(true);
      const params = new URLSearchParams({ memoryId });
      if (targetMemoryId) params.append('targetMemoryId', targetMemoryId);
      if (targetText) params.append('targetText', targetText);

      fetch(`/api/ai/related?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.related) setRelated(data.related);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [memoryId, targetMemoryId, targetText]);

  if (loading || related.length === 0) return null;

  return (
    <div className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <h4 className="font-serif font-bold text-sm text-vault-900">
          You might also remember...
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {related.map((item) => {
          let Icon = Heart;
          if (item.memoryType === 'PHOTO') Icon = Camera;
          if (item.memoryType === 'VIDEO') Icon = Video;
          if (item.memoryType === 'MESSAGE') Icon = MessageSquare;
          if (item.memoryType === 'TIMELINE') Icon = Clock;

          return (
            <div
              key={item.id}
              className="p-3 bg-white rounded-2xl border border-amber-300/80 shadow-2xs space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <Icon className="w-3.5 h-3.5 text-amber-700" />
                <span className="capitalize">{item.memoryType.toLowerCase()}</span>
              </div>
              <p className="font-serif text-xs text-vault-800 line-clamp-2 italic">
                &ldquo;{item.content}&rdquo;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
