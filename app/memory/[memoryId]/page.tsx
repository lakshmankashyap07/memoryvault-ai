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
  FileSpreadsheet,
  FileArchive,
  FileCode,
  ExternalLink,
  Download,
} from 'lucide-react';

import { QRCodeModal } from '@/components/QRCodeModal';
import { ShareModal } from '@/components/ShareModal';
import { UploadPhotoModal } from '@/components/UploadPhotoModal';
import { UploadVideoModal } from '@/components/UploadVideoModal';
import { UploadFileModal } from '@/components/UploadFileModal';
import { EditFileModal } from '@/components/EditFileModal';
import { AddMessageModal } from '@/components/AddMessageModal';
import { AddTimelineModal } from '@/components/AddTimelineModal';
import { InviteContributorModal } from '@/components/InviteContributorModal';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { VideoLightbox } from '@/components/VideoLightbox';
import { AIChatDrawer } from '@/components/AIChatDrawer';
import { AISearchBar } from '@/components/AISearchBar';
import { AIMemoryHighlights } from '@/components/AIMemoryHighlights';
import { AITagManager } from '@/components/AITagManager';
import { RelatedMemories } from '@/components/RelatedMemories';
import { AISettingsModal } from '@/components/AISettingsModal';
import { ManageMemoryModal } from '@/components/ManageMemoryModal';
import { formatDate, downloadMediaFile } from '@/lib/utils';

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
  files: Array<{
    id: string;
    fileName: string;
    fileTitle?: string | null;
    description?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    fileUrl: string;
    uploadedBy: string;
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
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<MemorySpaceData['files'][0] | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
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
  const [selectedVideo, setSelectedVideo] = useState<MemorySpaceData['videos'][0] | null>(null);
  const [downloadingMediaId, setDownloadingMediaId] = useState<string | null>(null);

  const handleDownloadMedia = async (fileUrl: string, defaultFileName: string, mediaId: string) => {
    try {
      setDownloadingMediaId(mediaId);
      await downloadMediaFile(fileUrl, defaultFileName);
    } catch (err) {
      console.error('Failed to download media:', err);
    } finally {
      setDownloadingMediaId(null);
    }
  };

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

  const handleDeleteFile = async (fileId: string) => {
    if (!space) return;
    if (!confirm('Are you sure you want to delete this file memory? This will permanently remove the file from storage and database.')) {
      return;
    }
    try {
      setDeletingFileId(fileId);
      const res = await fetch(`/api/memories/${space.memoryId}/files/${fileId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }
      await fetchSpace();
    } catch (err: any) {
      alert(err.message || 'Error deleting file');
    } finally {
      setDeletingFileId(null);
    }
  };

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
                  <button
                    onClick={() => setFileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vault-800 hover:bg-vault-700 text-amber-300 font-semibold text-xs border border-vault-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    + File
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
              { id: 'files', label: `Files (${space.files?.length || 0})`, icon: FileText },
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {space.photos.slice(0, 6).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-vault-100 cursor-pointer shadow-xs border border-vault-200"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || 'Memory Photo'}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-vault-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end text-white text-xs">
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
                <p className="text-xs text-vault-600">6 photos per row gallery with instant original photo download</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setPhotoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs shadow-sm transition-colors"
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
                {canEdit && (
                  <button
                    onClick={() => setPhotoModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-vault-900 text-amber-100 text-xs font-semibold"
                  >
                    + Add First Photo
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {space.photos.map((photo) => {
                  const isDownloading = downloadingMediaId === photo.id;
                  const fileName = photo.caption || `photo-${photo.id.slice(0, 6)}.jpg`;

                  return (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="group relative bg-white rounded-2xl overflow-hidden border border-vault-200/80 shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-square bg-vault-950 overflow-hidden">
                        <img
                          src={photo.fileUrl}
                          alt={photo.caption || 'Memory Photo'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-vault-950/90 via-vault-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDownloadMedia(photo.fileUrl, fileName, photo.id)}
                              disabled={isDownloading}
                              className="p-1.5 rounded-xl bg-vault-900/80 hover:bg-amber-600 text-amber-300 hover:text-vault-950 transition-colors shadow-sm"
                              title="Download photo"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div>
                            {photo.caption && (
                              <p className="font-serif text-[11px] text-vault-100 line-clamp-1 leading-snug">
                                &ldquo;{photo.caption}&rdquo;
                              </p>
                            )}
                            <p className="text-[9px] text-vault-300 truncate mt-0.5">
                              {photo.uploadedBy}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Footer */}
                      <div className="p-2 bg-white flex items-center justify-between gap-1 text-[10px] text-vault-600 border-t border-vault-100 sm:hidden">
                        <span className="truncate font-medium">{photo.caption || 'Photo'}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadMedia(photo.fileUrl, fileName, photo.id);
                          }}
                          disabled={isDownloading}
                          className="p-1 rounded-lg bg-vault-100 hover:bg-amber-100 text-vault-800 shrink-0"
                          title="Download"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-amber-800" />
                          ) : (
                            <Download className="w-3 h-3 text-vault-700" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Video Gallery</h2>
                <p className="text-xs text-vault-600">6 videos per row gallery with play indicator & download support</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs shadow-sm transition-colors"
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
                {canEdit && (
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-vault-900 text-amber-100 text-xs font-semibold"
                  >
                    + Add First Video
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {space.videos.map((video) => {
                  const isDownloading = downloadingMediaId === video.id;
                  const fileName = video.title || video.caption || `video-${video.id.slice(0, 6)}.mp4`;

                  return (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="group relative bg-white rounded-2xl overflow-hidden border border-vault-200/80 shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                    >
                      <div className="relative aspect-square bg-vault-950 overflow-hidden flex items-center justify-center">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || 'Video Thumbnail'}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-vault-900 via-vault-950 to-vault-900 flex items-center justify-center">
                            <Video className="w-8 h-8 text-amber-500/40" />
                          </div>
                        )}

                        {/* Center Play Indicator */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-vault-900/80 group-hover:bg-amber-500 text-amber-300 group-hover:text-vault-950 flex items-center justify-center shadow-lg transition-all border border-amber-500/40 group-hover:scale-110">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-vault-950/90 via-vault-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleDownloadMedia(video.fileUrl, fileName, video.id)}
                              disabled={isDownloading}
                              className="p-1.5 rounded-xl bg-vault-900/80 hover:bg-amber-600 text-amber-300 hover:text-vault-950 transition-colors shadow-sm"
                              title="Download video"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div>
                            <p className="font-serif font-semibold text-[11px] text-vault-100 line-clamp-1 leading-snug">
                              {video.title || video.caption || 'Video Memory'}
                            </p>
                            <p className="text-[9px] text-vault-300 truncate mt-0.5">
                              {video.uploadedBy}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Footer */}
                      <div className="p-2 bg-white flex items-center justify-between gap-1 text-[10px] text-vault-600 border-t border-vault-100 sm:hidden">
                        <span className="truncate font-medium">{video.title || video.caption || 'Video'}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadMedia(video.fileUrl, fileName, video.id);
                          }}
                          disabled={isDownloading}
                          className="p-1 rounded-lg bg-vault-100 hover:bg-amber-100 text-vault-800 shrink-0"
                          title="Download"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-amber-800" />
                          ) : (
                            <Download className="w-3 h-3 text-vault-700" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
          <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-vault-950">Memory Documents & Attachments</h2>
                <p className="text-xs text-vault-600">Preserved letters, PDFs, certificates, and important files</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setFileModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-300 font-bold text-xs shadow-sm transition-all"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  + Upload File
                </button>
              )}
            </div>

            {(!space.files || space.files.length === 0) ? (
              <div className="bg-white rounded-3xl p-12 border border-vault-200 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-lg text-vault-900">No Preserved Documents Yet</h3>
                  <p className="text-xs text-vault-600 max-w-sm mx-auto">
                    Upload graduation certificates, letters, tickets, spreadsheets, or archives to preserve them in this Memory Space.
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setFileModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-vault-950 font-bold text-xs shadow-md transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Upload First Document
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {space.files.map((item) => {
                  const ext = item.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  const formattedSize = item.fileSize ? (item.fileSize > 1024 * 1024 ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(item.fileSize / 1024)} KB`) : null;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-vault-200 shadow-soft hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 font-bold text-xs">
                          <FileText className="w-6 h-6 text-amber-800" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h4 className="font-serif font-bold text-base text-vault-950 group-hover:text-amber-800 transition-colors truncate">
                            {item.fileTitle || item.fileName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-vault-500 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-vault-100 text-vault-800 font-mono font-semibold">
                              {ext}
                            </span>
                            {formattedSize && (
                              <>
                                <span>•</span>
                                <span>{formattedSize}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDate(item.createdAt)}</span>
                            <span>•</span>
                            <span>Uploaded by {item.uploadedBy}</span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-vault-600 italic bg-vault-50/80 px-3 py-1.5 rounded-xl border border-vault-100 mt-2 max-w-xl">
                              &ldquo;{item.description}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vault-100 hover:bg-vault-200 text-vault-900 text-xs font-semibold transition-colors"
                          title="Open or Preview File"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-vault-600" />
                          <span>Open</span>
                        </a>

                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-vault-950 text-xs font-bold shadow-xs transition-colors"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => setEditingFile(item)}
                              className="p-2 rounded-xl hover:bg-vault-100 text-vault-600 hover:text-vault-900 transition-colors"
                              title="Edit File Title & Description"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteFile(item.id)}
                              disabled={deletingFileId === item.id}
                              className="p-2 rounded-xl hover:bg-rose-50 text-vault-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                              title="Delete File Memory"
                            >
                              {deletingFileId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      <UploadFileModal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        memoryId={space.memoryId}
        onFileUploaded={fetchSpace}
      />

      <EditFileModal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        memoryId={space.memoryId}
        file={editingFile}
        onFileUpdated={fetchSpace}
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

      <VideoLightbox
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
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
