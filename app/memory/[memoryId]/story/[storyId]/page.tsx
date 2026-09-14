'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Heart, Sparkles, Share2, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';
import { QRCodeModal } from '@/components/QRCodeModal';

export default function MemoryStoryPage() {
  const params = useParams();
  const memoryId = params.memoryId as string;
  const storyId = params.storyId as string;

  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [personName, setPersonName] = useState('Friend');
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (memoryId) {
      fetch(`/api/memories/${memoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.space) {
            setPersonName(data.space.personName);
          }
        })
        .catch(() => {});

      fetch(`/api/ai/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, length: 'MEDIUM' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.chapters) {
            setChapters(data.chapters);
            setStory(data.story);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [memoryId, storyId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-vault-600 font-serif">Weaving your Memory Story...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vault-50 pb-20">
      {/* Top Bar */}
      <header className="bg-white border-b border-vault-200 py-4 px-4 sm:px-8 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <Link
          href={`/memory/${memoryId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-vault-700 hover:text-vault-950"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Memory Vault
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-vault-900 text-amber-100 font-semibold text-xs shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Story
          </button>
        </div>
      </header>

      {/* Story Document View */}
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto border border-amber-300">
            <BookOpen className="w-6 h-6 text-amber-700" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI Generated Memory Story
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-vault-950 tracking-tight">
            {story?.title || `Our Journey with ${personName}`}
          </h1>

          <p className="font-serif italic text-vault-600 text-base max-w-lg mx-auto">
            &ldquo;Some people leave the place, never the memories.&rdquo;
          </p>
        </div>

        {/* Chapters */}
        <div className="space-y-12">
          {chapters.map((chap, idx) => (
            <section key={idx} className="bg-white rounded-3xl p-8 sm:p-10 border border-vault-200 shadow-soft space-y-4">
              <h2 className="font-serif text-2xl font-bold text-vault-900 border-b border-vault-100 pb-3">
                {chap.chapterTitle}
              </h2>

              <p className="font-serif text-vault-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {chap.content}
              </p>

              {chap.memoryReferences && chap.memoryReferences.length > 0 && (
                <div className="pt-4 border-t border-vault-100 text-xs text-vault-500 flex items-center gap-2">
                  <span className="font-semibold text-amber-800">References:</span>
                  <span>{chap.memoryReferences.join(' • ')}</span>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onOpenQR={() => setQrModalOpen(true)}
        memoryId={memoryId}
        personName={personName}
      />

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memoryId={memoryId}
        personName={personName}
      />
    </div>
  );
}
