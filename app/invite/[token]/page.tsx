'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Heart, UserPlus, Sparkles, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export default function InviteAcceptPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [memoryId, setMemoryId] = useState('');

  useEffect(() => {
    if (token) {
      fetch(`/api/invitations/${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setInvitation(data.invitation);
          }
        })
        .catch(() => setError('Error loading invitation details'))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/invite/${token}`);
          return;
        }
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setAccepted(true);
      setMemoryId(data.memoryId);
    } catch (err: any) {
      setError(err.message || 'Error accepting invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium text-vault-600 font-serif">Verifying invitation link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-elevated border border-vault-200 text-center space-y-6">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-vault-900">
              Invalid or Expired Invitation
            </h2>
            <p className="text-xs text-vault-600 leading-relaxed">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-vault-900 text-amber-100 font-medium text-xs shadow-sm"
            >
              Return Home
            </Link>
          </div>
        ) : accepted ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-vault-900">
              Invitation Accepted!
            </h2>
            <p className="text-xs text-vault-600">
              You are now a contributor to <strong>{invitation?.memorySpace?.personName}</strong>&apos;s Memory Vault.
            </p>
            <Link
              href={`/memory/${memoryId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-bold text-sm shadow-md"
            >
              Open Memory Space Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto border border-amber-300">
              <UserPlus className="w-8 h-8 text-amber-700" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                Contributor Invitation
              </span>
              <h2 className="font-serif text-2xl font-bold text-vault-950">
                You&apos;re Invited to Contribute!
              </h2>
              <p className="text-xs text-vault-600">
                You have been invited as a <strong>{invitation?.role}</strong> for{' '}
                <strong>{invitation?.memorySpace?.personName}</strong>&apos;s digital space.
              </p>
            </div>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Accepting Invitation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Accept Invitation
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
