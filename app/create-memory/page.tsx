'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  User,
  Calendar,
  Phone,
  Mail,
  Instagram,
  Linkedin,
  Lock,
  Globe,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  Share2,
  ExternalLink,
  Upload,
  Loader2,
} from 'lucide-react';
import { uploadFileWithProgress } from '@/lib/upload-helper';
import { QRCodeModal } from '@/components/QRCodeModal';

const RELATIONSHIP_OPTIONS = [
  'Friend',
  'Best Friend',
  'Family',
  'Partner',
  'Classmate',
  'Colleague',
  'Mentor',
  'Other',
];

export default function CreateMemoryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [personName, setPersonName] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [description, setDescription] = useState('');
  const [relationship, setRelationship] = useState('Best Friend');

  // Step 2 state
  const [birthday, setBirthday] = useState('');
  const [firstMeetingDate, setFirstMeetingDate] = useState('');
  const [specialDate, setSpecialDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Step 3 state
  const [privacy, setPrivacy] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');

  // Step 4 state (Success output)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSpace, setCreatedSpace] = useState<{
    id: string;
    memoryId: string;
    personName: string;
  } | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleNext = () => {
    if (step === 1 && !personName.trim()) {
      setError('Please enter the person’s name');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleCreateSpace = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName,
          nickname,
          profileImage,
          relationship,
          description,
          birthday,
          firstMeetingDate,
          specialDate,
          phone,
          email,
          instagram,
          linkedin,
          privacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Memory Space');
      }

      setCreatedSpace(data.space);
      setStep(4); // Move to Success screen
    } catch (err: any) {
      setError(err.message || 'An error occurred during creation');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await uploadFileWithProgress(file);
        setProfileImage(url);
      } catch (err: any) {
        console.error('Profile photo upload error:', err);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Step Progress Header */}
      <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-serif font-bold text-lg">
              0{step}
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-vault-900">
                {step === 1 && 'Step 1 — About the Person'}
                {step === 2 && 'Step 2 — Important Information'}
                {step === 3 && 'Step 3 — Privacy & Security'}
                {step === 4 && 'Memory Space Created!'}
              </h2>
              <p className="text-xs text-vault-500">
                {step === 1 && 'Basic details, nickname, relationship, and profile avatar'}
                {step === 2 && 'Key dates, phone, email, and social profiles (optional)'}
                {step === 3 && 'Choose who can view or contribute memories'}
                {step === 4 && 'Your permanent Memory ID and QR Code are ready'}
              </p>
            </div>
          </div>

          {step < 4 && (
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              Step {step} of 3
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="w-full bg-vault-100 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-vault-800 to-amber-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* STEP 1: ABOUT THE PERSON */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-8 border border-vault-200 shadow-elevated space-y-6 animate-fadeIn">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                Person&apos;s Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Verma"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahuliya"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                  Relationship *
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                Profile Photo Avatar
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-serif text-xl border border-amber-300">
                    {personName ? personName.substring(0, 2).toUpperCase() : 'MV'}
                  </div>
                )}
                <div className="flex-1 space-y-2 w-full">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-100 hover:bg-vault-200 text-vault-800 text-xs font-medium border border-vault-300">
                      <Upload className="w-3.5 h-3.5 text-vault-600" />
                      Upload Photo File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1">
                Short Description / Tagline
              </label>
              <textarea
                rows={3}
                placeholder="A collection of unbreakable moments, late-night chai, hostel laughter, and college dreams we will always carry with us..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-serif"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-sm shadow-md transition-all"
            >
              <span>Next: Important Info</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: IMPORTANT INFORMATION */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-8 border border-vault-200 shadow-elevated space-y-6 animate-fadeIn">
          <div className="space-y-4">
            <p className="text-xs text-vault-500 italic">
              All fields in Step 2 are optional. Fill in what you wish to preserve.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-vault-500" />
                  Birthday
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-vault-500" />
                  First Meeting Date
                </label>
                <input
                  type="date"
                  value={firstMeetingDate}
                  onChange={(e) => setFirstMeetingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-vault-500" />
                  Special Date / Graduation
                </label>
                <input
                  type="date"
                  value={specialDate}
                  onChange={(e) => setSpecialDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-vault-500" />
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-vault-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-vault-500" />
                  Instagram Handle
                </label>
                <input
                  type="text"
                  placeholder="@rahul.v"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-vault-500" />
                  LinkedIn Profile Link
                </label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/rahul-verma"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-vault-300 text-vault-700 font-semibold text-sm hover:bg-vault-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-sm shadow-md transition-all"
            >
              <span>Next: Privacy Settings</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PRIVACY */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-8 border border-vault-200 shadow-elevated space-y-6 animate-fadeIn">
          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase text-vault-700">
              Select Memory Space Privacy Setting
            </label>

            <div className="space-y-3">
              {/* Private option */}
              <button
                type="button"
                onClick={() => setPrivacy('PRIVATE')}
                className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                  privacy === 'PRIVATE'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                    : 'border-vault-200 hover:bg-vault-50'
                }`}
              >
                <div className="p-3 rounded-xl bg-white text-vault-800 border border-vault-200">
                  <Lock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-vault-900 text-base">
                    Private (Recommended)
                  </h4>
                  <p className="text-xs text-vault-600 mt-0.5">
                    Only you and invited contributors can access this Memory Space. Contact info is fully protected.
                  </p>
                </div>
              </button>

              {/* Unlisted option */}
              <button
                type="button"
                onClick={() => setPrivacy('UNLISTED')}
                className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                  privacy === 'UNLISTED'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                    : 'border-vault-200 hover:bg-vault-50'
                }`}
              >
                <div className="p-3 rounded-xl bg-white text-vault-800 border border-vault-200">
                  <EyeOff className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-vault-900 text-base">
                    Unlisted
                  </h4>
                  <p className="text-xs text-vault-600 mt-0.5">
                    Anyone with the Memory ID link or QR code can view the memory space, but it won&apos;t be listed publicly.
                  </p>
                </div>
              </button>

              {/* Public option */}
              <button
                type="button"
                onClick={() => setPrivacy('PUBLIC')}
                className={`w-full p-5 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                  privacy === 'PUBLIC'
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                    : 'border-vault-200 hover:bg-vault-50'
                }`}
              >
                <div className="p-3 rounded-xl bg-white text-vault-800 border border-vault-200">
                  <Globe className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-vault-900 text-base">
                    Public
                  </h4>
                  <p className="text-xs text-vault-600 mt-0.5">
                    The memory page can be viewed publicly by anyone. Perfect for open college or farewell archives.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-vault-300 text-vault-700 font-semibold text-sm hover:bg-vault-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleCreateSpace}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-vault-900 to-vault-950 hover:from-vault-950 hover:to-black text-amber-100 font-bold text-sm shadow-lg shadow-vault-950/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Generating Memory Space...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Create Memory Space</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SCREEN */}
      {step === 4 && createdSpace && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-vault-200 shadow-elevated text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-3xl font-bold text-vault-950">
              Your Memory Space is ready ❤️
            </h2>
            <p className="text-sm text-vault-600">
              Permanent memory space created for <strong>{createdSpace.personName}</strong>
            </p>
          </div>

          {/* Memory ID Tag Display */}
          <div className="p-4 bg-vault-50 rounded-2xl border border-vault-200 max-w-md mx-auto space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-vault-500 font-semibold">
              Unique Memory ID
            </p>
            <p className="font-mono text-xl font-bold text-vault-950 tracking-wider">
              {createdSpace.memoryId}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href={`/memory/${createdSpace.memoryId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-bold text-sm shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-amber-300" />
              Open Memory Space
            </Link>

            <button
              onClick={() => setQrModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-vault-300 hover:bg-vault-100 text-vault-800 font-semibold text-sm shadow-xs"
            >
              <QrCode className="w-4 h-4 text-amber-700" />
              View & Download QR Code
            </button>
          </div>

          <QRCodeModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            memoryId={createdSpace.memoryId}
            personName={createdSpace.personName}
          />
        </div>
      )}
    </div>
  );
}
