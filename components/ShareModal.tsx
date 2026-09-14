'use client';

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, MessageCircle, Mail, Twitter } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQR: () => void;
  memoryId: string;
  personName: string;
}

export function ShareModal({ isOpen, onClose, onOpenQR, memoryId, personName }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const memoryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/memory/${memoryId}`
    : `http://localhost:3000/memory/${memoryId}`;

  const shareText = `Explore memories of ${personName} on MemoryVault: "Some people leave the place, never the memories."`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(memoryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${memoryUrl}`)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(`Memory Vault: ${personName}`)}&body=${encodeURIComponent(`${shareText}\n\nAccess link: ${memoryUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(memoryUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-vault-200 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-vault-900">
              Share Memory Space
            </h3>
            <p className="text-xs text-vault-500">
              Invite friends & family to view memories of {personName}
            </p>
          </div>
        </div>

        {/* Link preview card */}
        <div className="p-3.5 bg-vault-50 rounded-2xl border border-vault-200 mb-6 flex items-center justify-between gap-3">
          <div className="overflow-hidden">
            <p className="text-[11px] uppercase tracking-wider text-vault-500 font-semibold">Memory ID</p>
            <p className="font-mono text-sm font-bold text-vault-900">{memoryId}</p>
            <p className="text-xs text-vault-500 truncate mt-0.5">{memoryUrl}</p>
          </div>
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-xs shrink-0 flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 font-medium text-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            WhatsApp
          </a>

          <a
            href={mailUrl}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 text-sky-800 font-medium text-xs transition-colors"
          >
            <Mail className="w-4 h-4 text-sky-600" />
            Email Share
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-vault-200 bg-vault-50 hover:bg-vault-100 text-vault-800 font-medium text-xs transition-colors"
          >
            <Twitter className="w-4 h-4 text-vault-600" />
            Share on X
          </a>

          <button
            onClick={() => {
              onClose();
              onOpenQR();
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-medium text-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            Show QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
