'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sliders,
  Edit3,
  Lock,
  Globe,
  EyeOff,
  Image as ImageIcon,
  Video,
  Clock,
  Users,
  Mail,
  Trash2,
  Check,
  Copy,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Sparkles,
  Shield,
  Plus,
  UserPlus,
} from 'lucide-react';
import { EditTimelineModal } from '@/components/EditTimelineModal';
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
  photos: Array<{
    id: string;
    fileUrl: string;
    caption?: string | null;
    uploadedBy: string;
    createdAt: string;
  }>;
  videos: Array<{
    id: string;
    fileUrl: string;
    thumbnailUrl?: string | null;
    title?: string | null;
    caption?: string | null;
    uploadedBy: string;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    title: string;
    description?: string | null;
    date: string;
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

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  token: string;
  inviteLink: string;
}

interface ManageMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: MemorySpaceData;
  onMemoryUpdated: () => void;
  initialTab?: 'details' | 'privacy' | 'media' | 'timeline' | 'contributors' | 'invitations' | 'delete';
}

export function ManageMemoryModal({
  isOpen,
  onClose,
  space,
  onMemoryUpdated,
  initialTab = 'details',
}: ManageMemoryModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'privacy' | 'media' | 'timeline' | 'contributors' | 'invitations' | 'delete'>(initialTab);

  // Notifications & Loaders
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. EDIT DETAILS STATE
  const [personName, setPersonName] = useState('');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('');
  const [description, setDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [firstMeetingDate, setFirstMeetingDate] = useState('');
  const [specialDate, setSpecialDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // 2. PRIVACY STATE
  const [privacy, setPrivacy] = useState('PRIVATE');

  // 3. INVITATIONS & CONTRIBUTORS STATE
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [fetchingInvitations, setFetchingInvitations] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // 4. TIMELINE EDIT STATE
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<MemorySpaceData['timelineEvents'][0] | null>(null);

  // 5. DELETION CONFIRMATION STATE
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'photo' | 'video' | 'timeline' | 'contributor' | 'invitation' | 'space';
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (space) {
      setPersonName(space.personName || '');
      setNickname(space.nickname || '');
      setRelationship(space.relationship || 'Friend');
      setDescription(space.description || '');
      setBirthday(space.birthday || '');
      setFirstMeetingDate(space.firstMeetingDate || '');
      setSpecialDate(space.specialDate || '');
      setPhone(space.phone || '');
      setEmail(space.email || '');
      setInstagram(space.instagram || '');
      setLinkedin(space.linkedin || '');
      setProfileImage(space.profileImage || '');
      setPrivacy(space.privacy || 'PRIVATE');
      setError('');
      setSuccess('');
    }
  }, [space]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchInvitations();
    }
  }, [isOpen, initialTab]);

  const fetchInvitations = async () => {
    if (!space?.memoryId) return;
    try {
      setFetchingInvitations(true);
      const res = await fetch(`/api/memories/${space.memoryId}/contributors`);
      const data = await res.json();
      if (res.ok && data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setFetchingInvitations(false);
    }
  };

  if (!isOpen || !space) return null;

  // Clear messages on tab change
  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  // 1. SAVE DETAILS HANDLER
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!personName.trim()) {
      setError('Person name is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${space.memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: personName.trim(),
          nickname: nickname.trim() || null,
          relationship: relationship.trim(),
          description: description.trim() || null,
          birthday: birthday || null,
          firstMeetingDate: firstMeetingDate || null,
          specialDate: specialDate || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          instagram: instagram.trim() || null,
          linkedin: linkedin.trim() || null,
          profileImage: profileImage.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update memory details');
      }

      setSuccess('Memory details updated successfully!');
      onMemoryUpdated();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating memory details');
    } finally {
      setLoading(false);
    }
  };

  // 2. SAVE PRIVACY HANDLER
  const handleSavePrivacy = async (newPrivacy: string) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${space.memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: newPrivacy }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update privacy settings');
      }

      setPrivacy(newPrivacy);
      setSuccess(`Privacy changed to ${newPrivacy}!`);
      onMemoryUpdated();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating privacy');
    } finally {
      setLoading(false);
    }
  };

  // 3. CONTRIBUTOR ROLE UPDATE HANDLER
  const handleUpdateContributorRole = async (contributorId: string, newRole: string) => {
    setError('');
    try {
      const res = await fetch(`/api/memories/${space.memoryId}/contributors/${contributorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess('Contributor role updated.');
      onMemoryUpdated();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating contributor role');
    }
  };

  // 4. CONFIRM DELETE ACTION DISPATCHER
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (itemToDelete.type === 'photo') {
        const res = await fetch(`/api/memories/${space.memoryId}/photos/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete photo');
        setSuccess('Photo deleted successfully.');
      } else if (itemToDelete.type === 'video') {
        const res = await fetch(`/api/memories/${space.memoryId}/videos/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete video');
        setSuccess('Video deleted successfully.');
      } else if (itemToDelete.type === 'timeline') {
        const res = await fetch(`/api/memories/${space.memoryId}/timeline/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete timeline event');
        setSuccess('Timeline event deleted successfully.');
      } else if (itemToDelete.type === 'contributor') {
        const res = await fetch(`/api/memories/${space.memoryId}/contributors/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to remove contributor');
        setSuccess('Contributor removed successfully.');
      } else if (itemToDelete.type === 'invitation') {
        const res = await fetch(`/api/memories/${space.memoryId}/invitations/${itemToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to revoke invitation');
        setSuccess('Invitation revoked successfully.');
        fetchInvitations();
      } else if (itemToDelete.type === 'space') {
        const res = await fetch(`/api/memories/${space.memoryId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete memory space');

        onClose();
        router.push('/dashboard?deleted=true');
        return;
      }

      setItemToDelete(null);
      onMemoryUpdated();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error processing deletion');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (link: string, id: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-vault-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl border border-vault-200 flex flex-col overflow-hidden relative">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-vault-900 to-vault-950 text-white flex items-center justify-between border-b border-vault-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">
                Manage {space.personName}&apos;s Space
              </h2>
              <p className="text-[11px] text-vault-300 font-mono">
                Memory ID: {space.memoryId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-vault-400 hover:text-white hover:bg-vault-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MESSAGES BAR */}
        {error && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* MAIN BODY GRID */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* SIDEBAR NAVIGATION TABS */}
          <div className="w-full md:w-64 bg-vault-50 border-r border-vault-200 p-4 space-y-1 shrink-0 overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-vault-400 px-3 pb-2 tracking-wider">
              Management Menu
            </p>

            {[
              { id: 'details', label: 'Edit Memory Details', icon: Edit3 },
              { id: 'privacy', label: 'Privacy & Access', icon: Lock },
              { id: 'media', label: `Manage Media (${space.photos.length + space.videos.length})`, icon: ImageIcon },
              { id: 'timeline', label: `Timeline (${space.timelineEvents.length})`, icon: Clock },
              { id: 'contributors', label: `Contributors (${space.contributors.length})`, icon: Users },
              { id: 'invitations', label: `Invitations (${invitations.length})`, icon: Mail },
              { id: 'delete', label: 'Delete Memory Space', icon: Trash2, isDanger: true },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? tab.isDanger
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-vault-900 text-amber-300 shadow-sm'
                      : tab.isDanger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-vault-700 hover:bg-vault-100 hover:text-vault-950'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? (tab.isDanger ? 'text-white' : 'text-amber-300') : (tab.isDanger ? 'text-rose-600' : 'text-vault-500')}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 1. EDIT DETAILS TAB */}
            {activeTab === 'details' && (
              <form onSubmit={handleSaveDetails} className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">Edit Memory Space Details</h3>
                  <p className="text-xs text-vault-500">Update person name, relationship, bio description and important dates</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase text-vault-700 mb-1">
                      Person / Relationship Name *
                    </label>
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-vault-700 mb-1">
                      Nickname / Term of Endearment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunny, Bro, Chotu"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-vault-700 mb-1">
                      Relationship Category *
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    >
                      {['Friend', 'Best Friend', 'Family', 'Partner', 'Classmate', 'Colleague', 'Mentor', 'Other'].map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase text-vault-700 mb-1">
                      Profile Avatar Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or upload link"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold uppercase text-vault-700 mb-1">
                      Memory Space Description / Quote
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write a brief intro or emotional quote for this memory space..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-serif italic"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-vault-200">
                  <h4 className="font-serif font-bold text-sm text-vault-900 mb-3">Important Dates & Contacts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">Birthday</label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">First Meeting Date</label>
                      <input
                        type="date"
                        value={firstMeetingDate}
                        onChange={(e) => setFirstMeetingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">Special Anniversary</label>
                      <input
                        type="date"
                        value={specialDate}
                        onChange={(e) => setSpecialDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">Instagram Handle</label>
                      <input
                        type="text"
                        placeholder="@username"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-vault-600 mb-1">LinkedIn Profile</label>
                      <input
                        type="text"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-vault-300 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Memory Details'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 2. PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">Privacy & Access Settings</h3>
                  <p className="text-xs text-vault-500">Control who can discover and view this Memory Space</p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'PRIVATE',
                      title: 'Private 🔒',
                      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
                      description: 'Only you (the Owner) and specifically invited Contributors or Viewers can access this Memory Space.',
                      icon: Lock,
                    },
                    {
                      id: 'UNLISTED',
                      title: 'Unlisted 🔗',
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      description: 'Anyone who possesses the unique Memory ID link or QR Code can view memories in this space.',
                      icon: EyeOff,
                    },
                    {
                      id: 'PUBLIC',
                      title: 'Public 🌍',
                      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      description: 'This Memory Space is publicly accessible to anyone visiting MemoryVault.',
                      icon: Globe,
                    },
                  ].map((option) => {
                    const isSelected = privacy === option.id;
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.id}
                        onClick={() => handleSavePrivacy(option.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 shadow-sm'
                            : 'border-vault-200 hover:bg-vault-50'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border ${option.badgeColor} shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-vault-900">{option.title}</h4>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-600 text-vault-950 font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-vault-600 leading-relaxed">{option.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. MEDIA MANAGEMENT TAB */}
            {activeTab === 'media' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">Manage Photos & Videos</h3>
                  <p className="text-xs text-vault-500">Delete photos or videos. Deleting media permanently removes stored files.</p>
                </div>

                {/* PHOTOS LIST */}
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center justify-between">
                    <span>Photos ({space.photos.length})</span>
                  </h4>

                  {space.photos.length === 0 ? (
                    <p className="text-xs text-vault-400 italic p-4 bg-vault-50 rounded-xl text-center">No photos uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {space.photos.map((photo) => (
                        <div key={photo.id} className="p-3 bg-white rounded-2xl border border-vault-200 flex items-center gap-3 shadow-xs">
                          <img src={photo.fileUrl} alt={photo.caption || 'Photo'} className="w-14 h-14 object-cover rounded-xl shrink-0 bg-vault-100" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-vault-900 truncate">{photo.caption || 'Untitled Photo'}</p>
                            <p className="text-[10px] text-vault-500 truncate">By {photo.uploadedBy} • {formatDate(photo.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => setItemToDelete({ type: 'photo', id: photo.id, title: photo.caption || 'Photo' })}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* VIDEOS LIST */}
                <div className="space-y-3 pt-4 border-t border-vault-200">
                  <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center justify-between">
                    <span>Videos ({space.videos.length})</span>
                  </h4>

                  {space.videos.length === 0 ? (
                    <p className="text-xs text-vault-400 italic p-4 bg-vault-50 rounded-xl text-center">No videos uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {space.videos.map((video) => (
                        <div key={video.id} className="p-3 bg-white rounded-2xl border border-vault-200 flex items-center gap-3 shadow-xs">
                          <div className="w-14 h-14 rounded-xl bg-vault-900 flex items-center justify-center text-amber-300 shrink-0 font-bold">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-vault-900 truncate">{video.title || video.caption || 'Video Memory'}</p>
                            <p className="text-[10px] text-vault-500 truncate">By {video.uploadedBy} • {formatDate(video.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => setItemToDelete({ type: 'video', id: video.id, title: video.title || 'Video' })}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                            title="Delete Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">Timeline Events</h3>
                  <p className="text-xs text-vault-500">Edit or delete chronological milestones</p>
                </div>

                {space.timelineEvents.length === 0 ? (
                  <p className="text-xs text-vault-400 italic p-4 bg-vault-50 rounded-xl text-center">No timeline events added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {space.timelineEvents.map((evt) => (
                      <div key={evt.id} className="p-4 bg-white rounded-2xl border border-vault-200 flex items-center justify-between gap-3 shadow-xs">
                        <div className="overflow-hidden">
                          <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px] font-bold mb-1">
                            {evt.date}
                          </div>
                          <h4 className="font-serif font-bold text-sm text-vault-900 truncate">{evt.title}</h4>
                          {evt.description && <p className="text-xs text-vault-600 line-clamp-1 mt-0.5">{evt.description}</p>}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingTimelineEvent(evt)}
                            className="p-2 rounded-xl text-vault-600 hover:bg-vault-100 transition-colors text-xs font-semibold"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4 text-vault-600" />
                          </button>
                          <button
                            onClick={() => setItemToDelete({ type: 'timeline', id: evt.id, title: evt.title })}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. CONTRIBUTORS TAB */}
            {activeTab === 'contributors' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">Manage Contributors</h3>
                  <p className="text-xs text-vault-500">Change permissions or remove active contributors</p>
                </div>

                {space.contributors.length === 0 ? (
                  <p className="text-xs text-vault-400 italic p-4 bg-vault-50 rounded-xl text-center">No active contributors joined yet.</p>
                ) : (
                  <div className="space-y-3">
                    {space.contributors.map((c) => (
                      <div key={c.id} className="p-4 bg-white rounded-2xl border border-vault-200 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-xs text-vault-900 truncate">{c.user.name}</p>
                            <p className="text-[11px] text-vault-500 truncate">{c.user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={c.role}
                            onChange={(e) => handleUpdateContributorRole(c.id, e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-vault-300 text-xs font-semibold text-vault-800 bg-white"
                          >
                            <option value="CONTRIBUTOR">Contributor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>

                          <button
                            onClick={() => setItemToDelete({ type: 'contributor', id: c.id, title: c.user.name })}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove Contributor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. INVITATIONS TAB */}
            {activeTab === 'invitations' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-vault-950">Sent Invitations</h3>
                    <p className="text-xs text-vault-500">Copy links, resend or revoke pending invitations</p>
                  </div>
                  <button
                    onClick={fetchInvitations}
                    className="text-xs text-vault-600 hover:text-vault-900 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${fetchingInvitations ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {invitations.length === 0 ? (
                  <p className="text-xs text-vault-400 italic p-4 bg-vault-50 rounded-xl text-center">No invitations sent yet.</p>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) < new Date();
                      return (
                        <div key={inv.id} className="p-4 bg-white rounded-2xl border border-vault-200 flex items-center justify-between gap-3 shadow-xs">
                          <div className="overflow-hidden">
                            <p className="font-semibold text-xs text-vault-900 truncate">{inv.email}</p>
                            <p className="text-[10px] text-vault-500">
                              Role: <strong className="text-vault-800">{inv.role}</strong> • Status:{' '}
                              <span className={`font-semibold ${inv.status === 'ACCEPTED' ? 'text-emerald-600' : isExpired ? 'text-amber-700' : 'text-sky-600'}`}>
                                {isExpired ? 'Expired' : inv.status}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => copyLink(inv.inviteLink, inv.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-vault-300 text-vault-800 text-xs font-semibold hover:bg-vault-50 flex items-center gap-1"
                            >
                              {copiedToken === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedToken === inv.id ? 'Copied' : 'Copy'}
                            </button>

                            <button
                              onClick={() => setItemToDelete({ type: 'invitation', id: inv.id, title: inv.email })}
                              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Revoke Invitation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 7. DELETE MEMORY SPACE TAB */}
            {activeTab === 'delete' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="font-serif font-bold text-lg text-rose-700">Delete Memory Space</h3>
                  <p className="text-xs text-vault-600">Permanently remove this memory space and all associated memories</p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>WARNING: Destructive Action</span>
                  </div>
                  <p className="text-xs leading-relaxed text-rose-800">
                    Deleting <strong>{space.personName}&apos;s Memory Space</strong> will permanently delete all uploaded photos, videos, messages, timeline events, and AI embeddings. This action <strong>cannot be undone</strong>.
                  </p>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Type <span className="font-mono underline font-extrabold select-all">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      placeholder="Type DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setItemToDelete({ type: 'space', id: space.memoryId, title: space.personName })}
                    disabled={deleteConfirmText.trim() !== 'DELETE'}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Memory Space Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL EDIT TIMELINE SUB-DIALOG */}
        {editingTimelineEvent && (
          <EditTimelineModal
            isOpen={!!editingTimelineEvent}
            onClose={() => setEditingTimelineEvent(null)}
            memoryId={space.memoryId}
            event={editingTimelineEvent}
            onEventUpdated={() => {
              onMemoryUpdated();
              setEditingTimelineEvent(null);
            }}
          />
        )}

        {/* GENERIC CONFIRMATION DIALOG FOR DELETING ITEMS */}
        {itemToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-vault-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-vault-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-vault-950">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-vault-600 mt-1">
                  Are you sure you want to delete <strong>&ldquo;{itemToDelete.title}&rdquo;</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-vault-300 text-vault-800 font-semibold text-xs hover:bg-vault-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
