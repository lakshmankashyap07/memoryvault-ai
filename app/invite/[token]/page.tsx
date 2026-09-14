'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  UserPlus,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  User,
  Shield,
  Clock,
  ArrowRight,
  LogOut,
  XCircle,
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  token: string;
  email: string;
  role: 'CONTRIBUTOR' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  expiresAt: string;
  isExpired: boolean;
  isPending: boolean;
  personName: string;
  memorySpaceId: string;
  memoryId: string;
  profileImage?: string | null;
  relationship: string;
  ownerName: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [targetMemoryId, setTargetMemoryId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch current logged-in user if available
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
        }

        // 2. Fetch invitation details
        const invRes = await fetch(`/api/invitations/${token}`);
        const invData = await invRes.json();

        if (!invRes.ok || invData.error) {
          setError(invData.error || 'Invitation not found');
        } else {
          setInvitation(invData.invitation);
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Error loading invitation details');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setAccepted(true);
      setTargetMemoryId(data.memoryId);

      // Redirect to Memory Space after brief pause
      setTimeout(() => {
        router.push(`/memory/${data.memoryId}?accepted=true`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error accepting invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decline invitation');
      }

      setDeclined(true);
    } catch (err: any) {
      setError(err.message || 'Error declining invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    const invitedEmail = invitation?.email || '';
    router.push(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitedEmail)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-vault-600 font-serif">Verifying memory invitation...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-elevated border border-vault-200 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-vault-900">
            Invitation Error
          </h2>
          <p className="text-xs text-vault-600 leading-relaxed">
            {error || 'This invitation link is invalid or could not be found.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-vault-900 text-amber-100 font-semibold text-xs shadow-md"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEmailMatch =
    currentUser && currentUser.email.toLowerCase().trim() === invitation.email.toLowerCase().trim();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full shadow-2xl border border-vault-200 text-center space-y-6 relative overflow-hidden">
        {/* Top ambient decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-vault-800 via-amber-600 to-vault-600"></div>

        {accepted ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-vault-950">
              Invitation Accepted!
            </h2>
            <p className="text-xs text-vault-600">
              You are now a <strong>{invitation.role}</strong> for <strong>{invitation.personName}&apos;s Memory Space</strong>.
            </p>
            <div className="pt-2">
              <Link
                href={`/memory/${targetMemoryId || invitation.memoryId}?accepted=true`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-bold text-sm shadow-md"
              >
                <span>Open Memory Space Now</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </div>
        ) : declined ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-vault-100 text-vault-600 flex items-center justify-center mx-auto border border-vault-300">
              <XCircle className="w-8 h-8 text-vault-600" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-vault-950">
              Invitation Declined
            </h2>
            <p className="text-xs text-vault-600">
              You have declined the invitation to join {invitation.personName}&apos;s Memory Space.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-vault-900 text-amber-100 font-semibold text-xs"
              >
                Return to Home Page
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Invitation Tag */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span>&ldquo;Someone wants you to be part of a memory.&rdquo;</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-vault-950">
                You&apos;re Invited
              </h1>
              <p className="text-xs text-vault-600">
                You are invited to contribute to a digital memory vault
              </p>
            </div>

            {/* Memory Space Details Card */}
            <div className="p-5 rounded-2xl bg-vault-50 border border-vault-200 text-left space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-200 border-2 border-amber-400 overflow-hidden flex items-center justify-center font-bold font-serif text-amber-900 text-xl shrink-0">
                  {invitation.profileImage ? (
                    <img src={invitation.profileImage} alt={invitation.personName} className="w-full h-full object-cover" />
                  ) : (
                    invitation.personName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-vault-950">
                    {invitation.personName}&apos;s Memory Space
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">
                    {invitation.relationship}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-vault-200/80">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-vault-500 block">Invited By</span>
                  <span className="font-semibold text-vault-900">{invitation.ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-vault-500 block">Role Assigned</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    <Shield className="w-3 h-3 text-amber-600" />
                    {invitation.role}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-vault-200/80 flex items-center justify-between text-[11px] text-vault-600">
                <span>Sent to: <strong className="text-vault-900 font-mono">{invitation.email}</strong></span>
              </div>
            </div>

            {/* EXPIRATION OR ALREADY PROCESSED CHECK */}
            {invitation.isExpired || invitation.status !== 'PENDING' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <p className="font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  {invitation.isExpired
                    ? 'This invitation has expired.'
                    : `This invitation has already been ${invitation.status.toLowerCase()}.`}
                </p>
                <p className="text-[11px] text-amber-800">
                  Ask {invitation.ownerName} to send a new invitation link.
                </p>
              </div>
            ) : !currentUser ? (
              /* UNAUTHENTICATED USER STATE */
              <div className="space-y-4 p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <p className="text-xs text-amber-950 font-medium">
                  Please log in or create an account using the invited email address (<strong>{invitation.email}</strong>) to continue.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitation.email)}`}
                    className="w-full sm:w-1/2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-xs shadow-sm text-center"
                  >
                    Log In
                  </Link>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invitation.email)}`}
                    className="w-full sm:w-1/2 py-3 rounded-xl border border-vault-300 hover:bg-vault-100 text-vault-900 font-semibold text-xs text-center"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : !isEmailMatch ? (
              /* LOGGED IN USER BUT EMAIL MISMATCH */
              <div className="space-y-4 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <p className="font-semibold text-rose-800 flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Email Mismatch
                </p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  This invitation was sent to <strong>{invitation.email}</strong>. You are currently logged in as <strong>{currentUser.email}</strong>.
                </p>
                <button
                  onClick={handleSwitchAccount}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log In with Invited Account ({invitation.email})
                </button>
              </div>
            ) : (
              /* MATCHING LOGGED-IN USER READY TO ACCEPT/DECLINE */
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-vault-900 to-vault-950 hover:from-vault-950 hover:to-black text-amber-100 font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      Processing Acceptance...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Accept Invitation
                    </>
                  )}
                </button>

                <button
                  onClick={handleDecline}
                  disabled={actionLoading}
                  className="w-full py-2.5 text-xs text-vault-600 hover:text-rose-600 font-semibold transition-colors"
                >
                  Decline Invitation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
