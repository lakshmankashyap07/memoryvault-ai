'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles, Check, Loader2 } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
}

export function AISettingsModal({ isOpen, onClose, memoryId }: AISettingsModalProps) {
  const [settings, setSettings] = useState({
    enableSearch: true,
    enableDescriptions: true,
    enableTimeline: true,
    enableStory: true,
    enableAssistant: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && memoryId) {
      setLoading(true);
      fetch(`/api/ai/settings?memoryId=${memoryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings({
              enableSearch: data.settings.enableSearch,
              enableDescriptions: data.settings.enableDescriptions,
              enableTimeline: data.settings.enableTimeline,
              enableStory: data.settings.enableStory,
              enableAssistant: data.settings.enableAssistant,
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, memoryId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, ...settings }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Save AI settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-vault-200 relative text-left space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-vault-400 hover:text-vault-800 hover:bg-vault-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-vault-900">
              AI Features & Privacy Controls
            </h3>
            <p className="text-xs text-vault-500">
              Control AI processing for this Memory Space
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
          &ldquo;AI features use information from this Memory Space to provide memory organization and search. You remain in control of your content.&rdquo;
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-vault-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            Loading settings...
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'enableAssistant', label: 'Enable Memory Assistant ("Ask Your Memories")', desc: 'Allow AI chat over stored space memories.' },
              { key: 'enableSearch', label: 'Enable AI Semantic Search', desc: 'Allow natural language photo and message search.' },
              { key: 'enableDescriptions', label: 'Enable AI Photo & Video Intelligence', desc: 'Generate descriptions and tags on upload.' },
              { key: 'enableTimeline', label: 'Enable AI Timeline Synthesis', desc: 'Build automatic chronological event timelines.' },
              { key: 'enableStory', label: 'Enable AI Story Generation', desc: 'Generate multi-chapter memory stories.' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-2xl border border-vault-200 hover:bg-vault-50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(settings as any)[item.key]}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-vault-300"
                />
                <div>
                  <p className="text-xs font-bold text-vault-900">{item.label}</p>
                  <p className="text-[11px] text-vault-500">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                Saving Controls...
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Settings Saved!
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Save Privacy Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
