'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode, Share2, Sparkles } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  personName: string;
}

export function QRCodeModal({ isOpen, onClose, memoryId, personName }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const memoryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/memory/${memoryId}`
    : `http://localhost:3000/memory/${memoryId}`;

  useEffect(() => {
    if (isOpen && memoryId) {
      QRCode.toDataURL(memoryUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3D2314',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, memoryId, memoryUrl]);

  if (!isOpen) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(memoryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMemoryId = async () => {
    await navigator.clipboard.writeText(memoryId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `MemoryVault_${personName.replaceAll(/\s+/g, '_')}_${memoryId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-vault-200 relative overflow-hidden text-center">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3">
          <QrCode className="w-3.5 h-3.5" />
          Permanent Memory QR Code
        </div>

        <h3 className="font-serif text-xl font-bold text-vault-900">
          {personName}
        </h3>
        <p className="text-xs text-vault-500 mt-1">
          Scan to open digital scrapbook & memories
        </p>

        {/* QR Display */}
        <div className="my-6 p-4 bg-vault-50 rounded-2xl border border-vault-200 flex flex-col items-center justify-center shadow-inner relative group">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${memoryId}`}
              className="w-48 h-48 object-contain rounded-xl shadow-md bg-white p-2"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-vault-100 flex items-center justify-center text-vault-400 text-xs">
              Generating QR...
            </div>
          )}

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-vault-900 text-amber-100 font-mono text-xs font-semibold tracking-wider">
            <span>{memoryId}</span>
            <button
              onClick={copyMemoryId}
              className="hover:text-amber-300 transition-colors p-0.5"
              title="Copy Memory ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-medium text-sm shadow-md transition-all"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Download QR Code Image
          </button>

          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-vault-300 hover:bg-vault-100 text-vault-800 font-medium text-sm transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-vault-600" />
                Copy Memory Space Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
