'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Shield,
  Copy,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
  Share2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  token: string;
  inviteLink: string;
}

interface InviteContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  personName: string;
}

export function InviteContributorModal({ isOpen, onClose, memoryId, personName }: InviteContributorModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CONTRIBUTOR' | 'VIEWER'>('CONTRIBUTOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState<{ inviteLink: string; message: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [existingInvitations, setExistingInvitations] = useState<InvitationItem[]>([]);
  const [fetchingInvitations, setFetchingInvitations] = useState(false);

  const fetchInvitations = async () => {
    try {
      setFetchingInvitations(true);
      const res = await fetch(`/api/memories/${memoryId}/contributors`);
      const data = await res.json();
      if (res.ok && data.invitations) {
        setExistingInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setFetchingInvitations(false);
    }
  };

  useEffect(() => {
    if (isOpen && memoryId) {
      fetchInvitations();
    }
  }, [isOpen, memoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteResult(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/memories/${memoryId}/contributors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, action: 'INVITE' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invitation');
      }

      setInviteResult({
        inviteLink: data.inviteLink,
        message: data.message,
        email: email.toLowerCase().trim(),
      });
      setEmail('');
      fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitationId: string, invEmail: string) => {
    setError('');
    try {
      const res = await fetch(`/api/memories/${memoryId}/contributors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESEND', invitationId, email: invEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      setInviteResult({
        inviteLink: data.inviteLink,
        message: `Fresh invitation generated for ${invEmail}.`,
        email: invEmail,
      });
      fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Error resending invitation');
    }
  };

  const copyInviteLink = async (linkToCopy?: string) => {
    const targetLink = linkToCopy || inviteResult?.inviteLink;
    if (!targetLink) return;
    await navigator.clipboard.writeText(targetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-vault-200 relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              Invite Contributors
            </h3>
            <p className="text-xs text-vault-500">
              Allow friends to add photos, videos & notes for {personName}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* ACTIVE INVITATION LINK GENERATED DISPLAY */}
        {inviteResult ? (
          <div className="space-y-4 mb-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Invitation Link Generated!
              </p>
              <p className="text-xs text-amber-800/90">{inviteResult.message}</p>

              <div className="p-3 bg-white rounded-xl border border-amber-300 font-mono text-xs text-vault-900 break-all select-all font-semibold shadow-inner">
                {inviteResult.inviteLink}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => copyInviteLink(inviteResult.inviteLink)}
                className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-xs shadow-md transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-300" />
                    Copy Invitation Link
                  </>
                )}
              </button>

              <button
                onClick={() => setInviteResult(null)}
                className="w-full sm:w-1/2 py-3 rounded-xl border border-vault-300 hover:bg-vault-100 text-vault-800 font-semibold text-xs transition-colors"
              >
                Invite Another Person
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-vault-500" />
                Contributor Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-vault-500" />
                Permission Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CONTRIBUTOR')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'CONTRIBUTOR'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-semibold shadow-sm'
                      : 'border-vault-200 hover:bg-vault-50 text-vault-700'
                  }`}
                >
                  <p className="text-xs">Contributor</p>
                  <p className="text-[10px] text-vault-500 mt-0.5">Can add photos, videos & notes</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('VIEWER')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'VIEWER'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-semibold shadow-sm'
                      : 'border-vault-200 hover:bg-vault-50 text-vault-700'
                  }`}
                >
                  <p className="text-xs">Viewer</p>
                  <p className="text-[10px] text-vault-500 mt-0.5">Can only view memories</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Generating Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  Generate Invitation Link
                </>
              )}
            </button>
          </form>
        )}

        {/* LIST OF SENT INVITATIONS */}
        <div className="pt-4 border-t border-vault-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-sm text-vault-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-vault-500" />
              Sent Invitations ({existingInvitations.length})
            </h4>

            <button
              onClick={fetchInvitations}
              className="text-[11px] text-vault-500 hover:text-vault-800 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${fetchingInvitations ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {existingInvitations.length === 0 ? (
            <p className="text-xs text-vault-400 italic text-center py-3 bg-vault-50 rounded-xl">
              No invitations sent yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {existingInvitations.map((inv) => {
                const isExpired = new Date(inv.expiresAt) < new Date();
                const isPending = inv.status === 'PENDING' && !isExpired;

                return (
                  <div
                    key={inv.id}
                    className="p-3 bg-vault-50 rounded-xl border border-vault-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="overflow-hidden">
                      <p className="font-semibold text-vault-900 truncate">{inv.email}</p>
                      <p className="text-[10px] text-vault-500">
                        Role: {inv.role} • Status:{' '}
                        <span
                          className={`font-semibold ${
                            inv.status === 'ACCEPTED'
                              ? 'text-emerald-600'
                              : inv.status === 'DECLINED'
                              ? 'text-rose-600'
                              : isExpired
                              ? 'text-amber-700'
                              : 'text-sky-600'
                          }`}
                        >
                          {isExpired ? 'Expired' : inv.status}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyInviteLink(inv.inviteLink)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-vault-100 border border-vault-300 text-vault-800 text-[11px] font-medium transition-colors"
                        title="Copy Link"
                      >
                        Copy
                      </button>

                      {(isPending || isExpired) && (
                        <button
                          onClick={() => handleResend(inv.id, inv.email)}
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] transition-colors flex items-center gap-1"
                          title="Resend Invitation with fresh token"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-700" />
                          Resend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
