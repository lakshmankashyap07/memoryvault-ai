'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Heart,
  QrCode,
  Share2,
  PlusCircle,
  UserPlus,
  Camera,
  Video,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Phone,
  Mail,
  Instagram,
  Linkedin,
  MapPin,
  FileText,
  Lock,
  Globe,
  EyeOff,
  Sparkles,
  Loader2,
  Play,
  ShieldAlert,
  Bot,
  Settings,
  BookOpen,
  Milestone,
  Sliders,
  MoreVertical,
  Edit3,
  Trash2,
} from 'lucide-react';

import { QRCodeModal } from '@/components/QRCodeModal';
import { ShareModal } from '@/components/ShareModal';
import { UploadPhotoModal } from '@/components/UploadPhotoModal';
import { UploadVideoModal } from '@/components/UploadVideoModal';
import { AddMessageModal } from '@/components/AddMessageModal';
import { AddTimelineModal } from '@/components/AddTimelineModal';
import { InviteContributorModal } from '@/components/InviteContributorModal';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { AIChatDrawer } from '@/components/AIChatDrawer';
import { AISearchBar } from '@/components/AISearchBar';
import { AIMemoryHighlights } from '@/components/AIMemoryHighlights';
import { AITagManager } from '@/components/AITagManager';
import { RelatedMemories } from '@/components/RelatedMemories';
import { AISettingsModal } from '@/components/AISettingsModal';
import { ManageMemoryModal } from '@/components/ManageMemoryModal';
import { formatDate } from '@/lib/utils';

interface MemorySpaceData {
  id: string;
  memoryId: string;
  ownerId: string;
  personName: string;
  nickname?: string | null;
  profileImage?: string | null;
  relationship: string;
  description?: string | null;
  birthday?: string | null;
  firstMeetingDate?: string | null;
  specialDate?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  privacy: string;
  createdAt: string;
  userRole: string; // OWNER, CONTRIBUTOR, VIEWER, GUEST
  owner: {
    name: string;
    email: string;
  };
  photos: Array<{
    id: string;
    fileUrl: string;
    caption?: string | null;
    date?: string | null;
    location?: string | null;
    uploadedBy: string;
    createdAt: string;
  }>;
  videos: Array<{
    id: string;
    fileUrl: string;
    thumbnailUrl?: string | null;
    title?: string | null;
    caption?: string | null;
    date?: string | null;
    uploadedBy: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    authorName: string;
    authorAvatar?: string | null;
    title?: string | null;
    message: string;
    photoUrl?: string | null;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    title: string;
    description?: string | null;
    date: string;
    mediaUrl?: string | null;
  }>;
  contributors: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string | null;
    };
  }>;
}

export default function MemoryProfilePage() {
  const params = useParams();
  const memoryId = params.memoryId as string;

  const [space, setSpace] = useState<MemorySpaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'videos' | 'messages' | 'timeline' | 'contacts' | 'files'>('overview');

  // Modals & Drawers state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);

  // Manage Memory State
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageInitialTab, setManageInitialTab] = useState<'details' | 'privacy' | 'media' | 'timeline' | 'contributors' | 'invitations' | 'delete'>('details');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<MemorySpaceData['photos'][0] | null>(null);

  const fetchSpace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/memories/${memoryId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load Memory Space');
      }
      setSpace(data.space);
    } catch (err: any) {
      setError(err.message || 'Error loading memory space');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memoryId) {
      fetchSpace();
    }
  }, [memoryId]);

  const handleBuildTimelineAI = async () => {
    if (!space) return;
    try {
      const res = await fetch('/api/ai/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: space.memoryId }),
      });
      const data = await res.json();
      if (res.ok && data.timeline) {
        setActiveTab('timeline');
      }
    } catch (err) {
      console.error('AI Timeline synthesis error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-vault-600 font-serif">Unlocking Memory Vault...</p>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-vault-900">
          Memory Space Restricted
        </h2>
        <p className="text-xs text-vault-600 leading-relaxed">
          {error || 'This memory space could not be found or you do not have permission to view it.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-vault-900 text-amber-100 font-medium text-xs shadow-sm"
        >
          Return to Home Page
        </Link>
      </div>
    );
  }

  const canEdit = ['OWNER', 'CONTRIBUTOR'].includes(space.userRole) || space.privacy === 'PUBLIC' || space.privacy === 'UNLISTED';

  const openManagementTab = (tab: typeof manageInitialTab) => {
    setManageInitialTab(tab);
    setManageModalOpen(true);
    setDropdownOpen(false);
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* DIGITAL SCRAPBOOK HERO HEADER */}
      <section className="relative bg-gradient-to-b from-vault-900 via-vault-950 to-vault-900 text-vault-100 pt-12 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl border-b border-vault-800">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Info Tag & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-vault-800/80 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                <QrCode className="w-3.5 h-3.5" />
                {space.memoryId}
              </span>

              {/* PRIVACY STATUS BADGE */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                space.privacy === 'PUBLIC'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : space.privacy === 'UNLISTED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {space.privacy === 'PUBLIC' ? <Globe className="w-3 h-3" /> : space.privacy === 'UNLISTED' ? <EyeOff className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{space.privacy === 'PUBLIC' ? 'Public' : space.privacy === 'UNLISTED' ? 'Unlisted' : 'Private'}</span>
              </span>

              <span className="text-vault-400 font-medium hidden sm:inline">
                Curated by {space.owner.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* ✨ ASK YOUR MEMORIES BUTTON */}
              <button
                onClick={() => setAiChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-vault-950 font-bold shadow-md hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-vault-950 animate-pulse" />
                ✨ Ask Your Memories
              </button>

              <button
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-vault-800 hover:bg-vault-700 text-vault-200 font-medium transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-vault-300" />
                Share
              </button>

              <button
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium border border-amber-500/30 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </button>

              {space.userRole === 'OWNER' && (
                <>
                  {/* MANAGE MEMORY BUTTON FOR OWNER */}
                  <button
                    onClick={() => openManagementTab('details')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-vault-950 font-bold shadow-md hover:scale-[1.02] transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-vault-950" />
                    Manage Memory
                  </button>

                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-vault-800 hover:bg-vault-700 text-amber-300 font-semibold border border-vault-700 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite
                  </button>

                  {/* OWNER DROPDOWN MENU */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="p-2 rounded-full bg-vault-800 hover:bg-vault-700 text-vault-300 transition-colors"
                      title="Manage Space Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-vault-200 py-2 z-50 text-vault-900 text-xs font-semibold animate-fadeIn">
                        <button
                          onClick={() => openManagementTab('details')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          Edit Details
                        </button>
                        <button
                          onClick={() => openManagementTab('privacy')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          Privacy Settings
                        </button>
                        <button
                          onClick={() => openManagementTab('media')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-700" />
                          Manage Media
                        </button>
                        <button
                          onClick={() => openManagementTab('timeline')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          Manage Timeline
                        </button>
                        <button
                          onClick={() => openManagementTab('contributors')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                          Manage Contributors
                        </button>
                        <button
                          onClick={() => openManagementTab('invitations')}
                          className="w-full text-left px-4 py-2 hover:bg-vault-50 flex items-center gap-2"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-700" />
                          Sent Invitations
                        </button>
                        <div className="my-1 border-t border-vault-100"></div>
                        <button
                          onClick={() => openManagementTab('delete')}
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Delete Memory
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setAiSettingsOpen(true)}
                    className="p-2 rounded-full bg-vault-800 hover:bg-vault-700 text-vault-300 transition-colors"
                    title="AI Settings & Privacy Controls"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Card Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-200 border-4 border-amber-400/80 shadow-2xl overflow-hidden flex items-center justify-center font-serif font-bold text-3xl text-amber-950">
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
            </div>

            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {space.personName}
                </h1>
                {space.nickname && (
                  <span className="text-sm font-serif italic text-amber-300/90">
                    &ldquo;{space.nickname}&rdquo;
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-2 text-xs text-amber-200/90 font-medium">
                <span className="px-2.5 py-0.5 rounded-md bg-vault-800 border border-vault-700">
                  {space.relationship}
                </span>
                <span>•</span>
                <span>Created {formatDate(space.createdAt)}</span>
              </div>

              {space.description && (
                <p className="font-serif italic text-vault-300 text-sm max-w-2xl leading-relaxed pt-1">
                  &ldquo;{space.description}&rdquo;
                </p>
              )}
            </div>

            {/* Quick Action Trigger Buttons */}
            {canEdit && (
              <div className="shrink-0 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-vault-950 font-bold text-xs shadow-md transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    + Photo
                  </button>
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vault-800 hover:bg-vault-700 text-amber-300 font-semibold text-xs border border-vault-700 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    + Video
                  </button>
                  <button
                    onClick={() => setMessageModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vault-800 hover:bg-vault-700 text-amber-300 font-semibold text-xs border border-vault-700 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    + Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <nav className="sticky top-16 z-30 bg-white border-b border-vault-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4 overflow-x-auto py-2.5 no-scrollbar">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'photos', label: `Photos (${space.photos.length})`, icon: Camera },
              { id: 'videos', label: `Videos (${space.videos.length})`, icon: Video },
              { id: 'messages', label: `Messages (${space.messages.length})`, icon: MessageSquare },
              { id: 'timeline', label: `Timeline (${space.timelineEvents.length})`, icon: Clock },
              { id: 'contacts', label: 'Contacts', icon: Phone },
              { id: 'files', label: 'Files', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-vault-900 text-amber-300 shadow-sm'
                      : 'text-vault-600 hover:text-vault-900 hover:bg-vault-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-vault-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick AI Action Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={handleBuildTimelineAI}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors"
            >
              <Milestone className="w-3.5 h-3.5 text-amber-700" />
              ✨ Build Timeline
            </button>
            <Link
              href={`/memory/${space.memoryId}/story/new`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              ✨ Create Story
            </Link>
          </div>
        </div>
      </nav>

      {/* TAB CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* PHASE 2 AI NATURAL LANGUAGE SEARCH & HIGHLIGHTS */}
        <div className="space-y-6">
          <AISearchBar memoryId={space.memoryId} />

          <AIMemoryHighlights
            stats={{
              firstMemoryDate: space.firstMeetingDate ? formatDate(space.firstMeetingDate) : '2019',
              totalMemories: space.photos.length + space.videos.length + space.messages.length,
              totalMilestones: space.timelineEvents.length,
              totalContributors: space.contributors.length,
            }}
          />

          <AITagManager memoryId={space.memoryId} />
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Important dates card */}
              <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft space-y-4">
                <h3 className="font-serif font-bold text-lg text-vault-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-700" />
                  Important Dates
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-vault-50 border border-vault-100 flex items-center justify-between">
                    <span className="text-vault-600">Birthday</span>
                    <span className="font-semibold text-vault-900">{formatDate(space.birthday)}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-vault-50 border border-vault-100 flex items-center justify-between">
                    <span className="text-vault-600">First Meeting Date</span>
                    <span className="font-semibold text-vault-900">{formatDate(space.firstMeetingDate)}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-vault-50 border border-vault-100 flex items-center justify-between">
                    <span className="text-vault-600">Special Anniversary</span>
                    <span className="font-semibold text-vault-900">{formatDate(space.specialDate)}</span>
                  </div>
                </div>
              </div>

              {/* Latest Memory Message */}
              <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-vault-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-700" />
                    Latest Shared Memory Note
                  </h3>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="text-xs text-amber-800 hover:underline font-semibold"
                  >
                    View All ({space.messages.length}) →
                  </button>
                </div>

                {space.messages.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-vault-900">{space.messages[0].authorName}</span>
                      <span className="text-[10px] text-vault-500">{formatDate(space.messages[0].createdAt)}</span>
                    </div>
                    {space.messages[0].title && (
                      <h4 className="font-serif font-bold text-sm text-vault-900">{space.messages[0].title}</h4>
                    )}
                    <p className="font-serif italic text-xs text-vault-700 leading-relaxed">
                      &ldquo;{space.messages[0].message}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-vault-500 bg-vault-50 rounded-2xl">
                    No messages left yet. Be the first to leave a memory note!
                  </div>
                )}
              </div>
            </div>

            {/* Photo Highlights Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-vault-950 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-700" />
                  Featured Photos
                </h3>
                <button
                  onClick={() => setActiveTab('photos')}
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  See Gallery ({space.photos.length}) →
                </button>
              </div>

              {space.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {space.photos.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-vault-100 cursor-pointer shadow-xs border border-vault-200"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || 'Memory Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-vault-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white text-xs">
                        <p className="font-serif line-clamp-1">{photo.caption || 'View Photo'}</p>
                        <p className="text-[10px] text-vault-300">{photo.uploadedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-vault-200 space-y-3">
                  <p className="text-xs text-vault-500">No photos uploaded yet.</p>
                  {canEdit && (
                    <button
                      onClick={() => setPhotoModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-vault-900 text-amber-100 text-xs font-semibold"
                    >
                      + Add First Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Highlights */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-vault-950 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700" />
                  Chronological Highlights
                </h3>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  View Full Timeline →
                </button>
              </div>

              {space.timelineEvents.length > 0 ? (
                <div className="space-y-3">
                  {space.timelineEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl p-4 border border-vault-200 flex items-start gap-4 shadow-xs"
                    >
                      <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold font-mono text-xs border border-amber-300 shrink-0">
                        {event.date}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-vault-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-vault-600 mt-1 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-vault-200 text-xs text-vault-500">
                  No timeline milestones added yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Photo Gallery</h2>
                <p className="text-xs text-vault-600">Click any photo to view story, metadata & related memories</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 text-amber-100 font-semibold text-xs shadow-sm"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  + Add Photo
                </button>
              )}
            </div>

            {space.photos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-vault-200 space-y-3">
                <Camera className="w-8 h-8 text-vault-400 mx-auto" />
                <p className="text-xs text-vault-600">No photos in this space yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {space.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="bg-white rounded-2xl overflow-hidden border border-vault-200/80 shadow-soft hover:shadow-elevated transition-all group cursor-pointer"
                  >
                    <div className="relative aspect-4/3 bg-vault-100 overflow-hidden">
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || 'Memory Photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      {photo.caption && (
                        <p className="font-serif text-xs text-vault-800 line-clamp-2 leading-relaxed">
                          &ldquo;{photo.caption}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-vault-500 pt-1 border-t border-vault-100">
                        <span>{photo.uploadedBy}</span>
                        <span>{photo.date || formatDate(photo.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Video Memories</h2>
                <p className="text-xs text-vault-600">Lazy-loaded video clips & audio moments</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 text-amber-100 font-semibold text-xs shadow-sm"
                >
                  <Video className="w-4 h-4 text-amber-300" />
                  + Add Video
                </button>
              )}
            </div>

            {space.videos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-vault-200 space-y-3">
                <Video className="w-8 h-8 text-vault-400 mx-auto" />
                <p className="text-xs text-vault-600">No videos uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {space.videos.map((video) => (
                  <div key={video.id} className="bg-white rounded-3xl overflow-hidden border border-vault-200 shadow-soft space-y-3 p-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                      <video
                        controls
                        preload="none"
                        poster={video.thumbnailUrl || undefined}
                        className="w-full h-full object-contain"
                      >
                        <source src={video.fileUrl} type="video/mp4" />
                        Your browser does not support video play.
                      </video>
                    </div>

                    <div className="space-y-1">
                      {video.title && (
                        <h4 className="font-serif font-bold text-base text-vault-900">{video.title}</h4>
                      )}
                      {video.caption && (
                        <p className="text-xs text-vault-600 leading-relaxed font-serif italic">&ldquo;{video.caption}&rdquo;</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-vault-500 pt-2 border-t border-vault-100">
                        <span>Shared by {video.uploadedBy}</span>
                        <span>{video.date || formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Memory Notes & Messages</h2>
                <p className="text-xs text-vault-600">Heartfelt messages written by close friends</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setMessageModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 text-amber-100 font-semibold text-xs shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-amber-300" />
                  + Write Message
                </button>
              )}
            </div>

            {space.messages.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-vault-200 space-y-3">
                <MessageSquare className="w-8 h-8 text-vault-400 mx-auto" />
                <p className="text-xs text-vault-600">No memory messages posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {space.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs overflow-hidden border border-amber-300">
                          {msg.authorAvatar ? (
                            <img src={msg.authorAvatar} alt={msg.authorName} className="w-full h-full object-cover" />
                          ) : (
                            msg.authorName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-vault-900">{msg.authorName}</h4>
                          <p className="text-[10px] text-vault-400">{formatDate(msg.createdAt)}</p>
                        </div>
                      </div>

                      {msg.title && (
                        <h5 className="font-serif font-bold text-base text-vault-900">{msg.title}</h5>
                      )}

                      <p className="font-serif italic text-sm text-vault-700 leading-relaxed bg-vault-50/80 p-4 rounded-2xl border border-vault-100">
                        &ldquo;{msg.message}&rdquo;
                      </p>

                      <RelatedMemories memoryId={space.memoryId} targetText={msg.message} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Journey Timeline</h2>
                <p className="text-xs text-vault-600">Chronological history of shared milestones</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setTimelineModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 text-amber-100 font-semibold text-xs shadow-sm"
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  + Add Event
                </button>
              )}
            </div>

            {space.timelineEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-vault-200 space-y-3">
                <Clock className="w-8 h-8 text-vault-400 mx-auto" />
                <p className="text-xs text-vault-600">No timeline events added yet.</p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-300 space-y-8 py-4">
                {space.timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-xs group-hover:scale-125 transition-transform"></div>

                    <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft space-y-2">
                      <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-bold border border-amber-300">
                        {evt.date}
                      </div>

                      <h3 className="font-serif font-bold text-lg text-vault-950 pt-1">
                        {evt.title}
                      </h3>

                      {evt.description && (
                        <p className="text-xs text-vault-700 leading-relaxed font-sans">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl font-bold text-vault-950">Protected Contact Info</h2>
              <p className="text-xs text-vault-600">
                Contact information is visible according to memory space privacy settings
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-vault-200 shadow-elevated space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-vault-50 border border-vault-200 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-vault-500">Phone</p>
                    <p className="text-xs font-semibold text-vault-900">
                      {space.phone || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-vault-50 border border-vault-200 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-vault-500">Email</p>
                    <p className="text-xs font-semibold text-vault-900 truncate">
                      {space.email || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-vault-50 border border-vault-200 flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-vault-500">Instagram</p>
                    <p className="text-xs font-semibold text-vault-900">
                      {space.instagram || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-vault-50 border border-vault-200 flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-vault-500">LinkedIn</p>
                    <p className="text-xs font-semibold text-vault-900 truncate">
                      {space.linkedin || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="font-serif text-2xl font-bold text-vault-950">Memory Documents & Attachments</h2>
              <p className="text-xs text-vault-600">Preserved letters, PDFs, and diploma copies</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-vault-200 text-center space-y-3 shadow-xs">
              <FileText className="w-8 h-8 text-vault-400 mx-auto" />
              <p className="text-xs text-vault-600">No additional file attachments uploaded yet.</p>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING ASK YOUR MEMORIES AI ACTION BUTTON */}
      <button
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-vault-900 via-vault-950 to-vault-900 text-amber-100 font-bold text-sm shadow-2xl border border-amber-500/40 hover:scale-105 transition-all group"
      >
        <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span>✨ Ask Your Memories</span>
      </button>

      {/* ALL MODALS & DRAWERS */}
      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        memoryId={space.memoryId}
        personName={space.personName}
      />

      <AISettingsModal
        isOpen={aiSettingsOpen}
        onClose={() => setAiSettingsOpen(false)}
        memoryId={space.memoryId}
      />

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        memoryId={space.memoryId}
        personName={space.personName}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onOpenQR={() => setQrModalOpen(true)}
        memoryId={space.memoryId}
        personName={space.personName}
      />

      <UploadPhotoModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        memoryId={space.memoryId}
        onPhotoUploaded={fetchSpace}
      />

      <UploadVideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        memoryId={space.memoryId}
        onVideoUploaded={fetchSpace}
      />

      <AddMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        memoryId={space.memoryId}
        onMessageAdded={fetchSpace}
      />

      <AddTimelineModal
        isOpen={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        memoryId={space.memoryId}
        onEventAdded={fetchSpace}
      />

      <InviteContributorModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        memoryId={space.memoryId}
        personName={space.personName}
      />

      <PhotoLightbox
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />

      <ManageMemoryModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        space={space}
        onMemoryUpdated={fetchSpace}
        initialTab={manageInitialTab}
      />
    </div>
  );
}
