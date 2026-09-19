'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Mail,
  Check,
  Loader2,
  Sparkles,
  Heart,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
} from 'lucide-react';

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  memorySpace: {
    id: string;
    memoryId: string;
    personName: string;
    relationship: string;
    profileImage?: string | null;
    owner: {
      id: string;
      name: string;
      email: string;
      profileImage?: string | null;
    };
  };
}

interface InvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationProcessed?: () => void;
}

export function InvitationsModal({ isOpen, onClose, onInvitationProcessed }: InvitationsModalProps) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingToken, setProcessingToken] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string; acceptedMemoryId?: string } | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/invitations');
      const data = await res.json();
      if (res.ok && data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Error fetching user invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActionMessage(null);
      fetchInvitations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = async (invitation: UserInvitation) => {
    setProcessingToken(invitation.token);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/invitations/${invitation.token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setActionMessage({
        type: 'success',
        text: `You have accepted the invitation to join ${invitation.memorySpace.personName}'s Memory Space!`,
        acceptedMemoryId: invitation.memorySpace.memoryId,
      });

      // Remove accepted invitation from local state
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      if (onInvitationProcessed) {
        onInvitationProcessed();
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to accept invitation',
      });
    } finally {
      setProcessingToken(null);
    }
  };

  const handleDecline = async (invitation: UserInvitation) => {
    setProcessingToken(invitation.token);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/invitations/${invitation.token}/decline`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to decline invitation');
      }

      setActionMessage({
        type: 'success',
        text: `Invitation to ${invitation.memorySpace.personName}'s Memory Space rejected.`,
      });

      // Remove declined invitation from local state
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      if (onInvitationProcessed) {
        onInvitationProcessed();
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to decline invitation',
      });
    } finally {
      setProcessingToken(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-vault-200 relative overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-950">
              Pending Invitations
            </h3>
            <p className="text-xs text-vault-500">
              Invitations to collaborate on Memory Vaults
            </p>
          </div>
        </div>

        {/* Action Status Feedback Message */}
        {actionMessage && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex flex-col gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>

            {actionMessage.acceptedMemoryId && (
              <Link
                href={`/memory/${actionMessage.acceptedMemoryId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs self-start transition-colors shadow-xs mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Memory Space</span>
              </Link>
            )}
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
            <p className="text-xs font-medium text-vault-500">Checking for invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-vault-50 rounded-2xl border border-vault-200/70 p-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 text-amber-700 fill-amber-700/20" />
            </div>
            <p className="text-sm font-semibold text-vault-900 font-serif">No Pending Invitations</p>
            <p className="text-xs text-vault-500 max-w-xs mx-auto">
              You don&apos;t have any pending invitations right now. When someone invites you to their Memory Space, it will appear here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((inv) => {
              const isProcessing = processingToken === inv.token;

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl p-4 border border-vault-200 shadow-soft hover:shadow-md transition-all space-y-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-amber-900 font-serif text-base">
                      {inv.memorySpace.profileImage ? (
                        <img
                          src={inv.memorySpace.profileImage}
                          alt={inv.memorySpace.personName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        inv.memorySpace.personName.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-vault-600 font-medium">
                        <span className="font-semibold text-vault-950">
                          {inv.memorySpace.owner.name || inv.memorySpace.owner.email}
                        </span>{' '}
                        invited you to join
                      </p>

                      <h4 className="font-serif font-bold text-base text-vault-950 truncate mt-0.5">
                        {inv.memorySpace.personName}
                      </h4>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          <Shield className="w-3 h-3 text-amber-700" />
                          Role: {inv.role}
                        </span>
                        <span className="text-[11px] text-vault-400 font-medium">
                          {inv.memorySpace.relationship}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accept / Reject Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-vault-100">
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDecline(inv)}
                      disabled={isProcessing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-vault-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-vault-700 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <>
                          <X className="w-4 h-4 text-rose-500" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
