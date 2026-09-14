'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Heart,
  QrCode,
  Share2,
  ExternalLink,
  Camera,
  Video,
  MessageSquare,
  Clock,
  Lock,
  Globe,
  EyeOff,
  Search,
  Sparkles,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { QRCodeModal } from '@/components/QRCodeModal';
import { ShareModal } from '@/components/ShareModal';
import { AISearchBar } from '@/components/AISearchBar';

interface MemorySpaceItem {
  id: string;
  memoryId: string;
  personName: string;
  nickname?: string | null;
  profileImage?: string | null;
  relationship: string;
  description?: string | null;
  privacy: string;
  createdAt: string;
  _count: {
    photos: number;
    videos: number;
    messages: number;
    timelineEvents: number;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<MemorySpaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected space for QR / Share modal
  const [selectedSpace, setSelectedSpace] = useState<MemorySpaceItem | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
          return fetch('/api/memories');
        }
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data?.spaces) {
          setSpaces(data.spaces);
        }
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, [router]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredSpaces = spaces.filter((space) => {
    const query = searchQuery.toLowerCase();
    return (
      space.personName.toLowerCase().includes(query) ||
      space.memoryId.toLowerCase().includes(query) ||
      space.relationship.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-vault-600 font-serif">Opening your MemoryVault...</p>
      </div>
    );
  }

  const defaultSpace = spaces.length > 0 ? spaces[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 rounded-3xl p-8 sm:p-10 text-vault-100 shadow-elevated relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>MemoryVault Dashboard</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {getTimeGreeting()}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-vault-300 text-sm font-sans italic">
            &ldquo;What memories will you preserve today?&rdquo;
          </p>
        </div>

        <Link
          href="/create-memory"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-vault-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-vault-950" />
          <span>+ Create Memory Space</span>
        </Link>
      </div>

      {/* PHASE 2: MEMORY INTELLIGENCE AI SECTION */}
      {defaultSpace && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-vault-200 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-vault-100">
            <div>
              <h2 className="font-serif text-xl font-bold text-vault-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                ✨ Memory Intelligence
              </h2>
              <p className="text-xs text-vault-600">
                Natural language AI search & story generators across your Memory Vault
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/memory/${defaultSpace.memoryId}`}
                className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors"
              >
                ✨ Build Timeline
              </Link>
              <Link
                href={`/memory/${defaultSpace.memoryId}/story/new`}
                className="px-3.5 py-1.5 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                Create Story
              </Link>
            </div>
          </div>

          <AISearchBar memoryId={defaultSpace.memoryId} />
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-vault-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memory spaces by name or ID (e.g. Rahul, MEM-RH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-vault-200 text-xs text-vault-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>

        <div className="text-xs font-semibold text-vault-600 flex items-center gap-2 px-3 py-2 bg-vault-100/70 rounded-xl border border-vault-200 self-end sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{spaces.length} Active Memory Spaces</span>
        </div>
      </div>

      {/* Memory Spaces Grid */}
      {filteredSpaces.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-vault-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-amber-700 fill-amber-700/20" />
          </div>
          <h3 className="font-serif text-xl font-bold text-vault-900">
            No Memory Spaces Found
          </h3>
          <p className="text-xs text-vault-600 max-w-sm mx-auto">
            {searchQuery
              ? `No memory space matched "${searchQuery}". Try clearing your search.`
              : 'You have not created any Memory Spaces yet. Start by preserving someone special today!'}
          </p>
          {!searchQuery && (
            <Link
              href="/create-memory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-vault-900 text-amber-100 font-medium text-xs shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              Create First Memory Space
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => {
            const privacyIcon =
              space.privacy === 'PUBLIC' ? (
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
              ) : space.privacy === 'UNLISTED' ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-vault-600" />
              );

            return (
              <div
                key={space.id}
                className="bg-white rounded-3xl p-6 border border-vault-200/80 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-amber-900 font-serif text-lg">
                        {space.profileImage ? (
                          <img
                            src={space.profileImage}
                            alt={space.personName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          space.personName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-lg text-vault-950 group-hover:text-amber-800 transition-colors line-clamp-1">
                          {space.personName}
                        </h3>
                        <p className="text-xs text-amber-700 font-medium">
                          {space.relationship}
                          {space.nickname ? ` (${space.nickname})` : ''}
                        </p>
                      </div>
                    </div>

                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-vault-50 text-[11px] font-medium text-vault-700 border border-vault-200 shrink-0"
                      title={`Privacy: ${space.privacy}`}
                    >
                      {privacyIcon}
                      <span className="capitalize">{space.privacy.toLowerCase()}</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-vault-50 rounded-xl border border-vault-200/80 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-vault-500 font-semibold">Memory ID</span>
                    <span className="font-mono text-xs font-bold text-vault-900 tracking-wider">
                      {space.memoryId}
                    </span>
                  </div>

                  {space.description && (
                    <p className="text-xs text-vault-600 line-clamp-2 italic font-serif">
                      &ldquo;{space.description}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-vault-600 pt-1 border-t border-vault-100">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-vault-50/60">
                      <Camera className="w-3.5 h-3.5 text-amber-700" />
                      <span>{space._count.photos} Photos</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-vault-50/60">
                      <Video className="w-3.5 h-3.5 text-amber-700" />
                      <span>{space._count.videos} Videos</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-vault-50/60">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                      <span>{space._count.messages} Messages</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-vault-50/60">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{space._count.timelineEvents} Milestones</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-vault-100">
                  <Link
                    href={`/memory/${space.memoryId}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Memory
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedSpace(space);
                      setQrModalOpen(true);
                    }}
                    className="p-2.5 rounded-xl border border-vault-300 hover:bg-vault-100 text-vault-700 transition-colors"
                    title="View QR Code"
                  >
                    <QrCode className="w-4 h-4 text-amber-700" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSpace(space);
                      setShareModalOpen(true);
                    }}
                    className="p-2.5 rounded-xl border border-vault-300 hover:bg-vault-100 text-vault-700 transition-colors"
                    title="Share Space"
                  >
                    <Share2 className="w-4 h-4 text-vault-700" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSpace && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          memoryId={selectedSpace.memoryId}
          personName={selectedSpace.personName}
        />
      )}

      {selectedSpace && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onOpenQR={() => setQrModalOpen(true)}
          memoryId={selectedSpace.memoryId}
          personName={selectedSpace.personName}
        />
      )}
    </div>
  );
}
