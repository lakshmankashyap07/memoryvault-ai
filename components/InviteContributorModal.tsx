'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, Copy, Check, Sparkles, Loader2 } from 'lucide-react';

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
  const [inviteResult, setInviteResult] = useState<{ inviteLink: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invitation');
      }

      setInviteResult({
        inviteLink: data.inviteLink,
        message: data.message,
      });
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteResult?.inviteLink) return;
    await navigator.clipboard.writeText(inviteResult.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-vault-200 relative">
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

        {inviteResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <p className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Invitation Link Generated!
              </p>
              <p className="text-xs text-amber-800/80 mb-3">{inviteResult.message}</p>

              <div className="p-2.5 bg-white rounded-xl border border-amber-300 font-mono text-xs text-vault-800 truncate select-all">
                {inviteResult.inviteLink}
              </div>
            </div>

            <button
              onClick={copyInviteLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-sm shadow-md transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Invitation Link Copied!
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
              className="w-full text-center text-xs text-vault-600 hover:text-vault-900 py-1"
            >
              Invite another person
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-vault-500" />
                Contributor Email
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

            <div className="pt-3">
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
