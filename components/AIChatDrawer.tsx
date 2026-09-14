'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Heart,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Camera,
  Video,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface AISource {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'MESSAGE' | 'TIMELINE' | 'CONTACT';
  title: string;
  date?: string | null;
  snippet?: string;
  url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AISource[];
  confidenceLabel?: string;
  createdAt: Date;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: string;
  personName: string;
}

const SAMPLE_QUESTIONS = [
  'When did we first meet?',
  'Show me our farewell memories',
  'Find memories involving Karan and Rahul',
  'Summarize our friendship',
  'What are the funniest memories?',
];

export function AIChatDrawer({ isOpen, onClose, memoryId, personName }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your Memory Assistant for **${personName}**'s Memory Vault. Ask me anything about your shared photos, videos, notes, or milestones!`,
      createdAt: new Date(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, question: q.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidenceLabel: data.confidenceLabel,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: err.message || 'AI features are temporarily unavailable. Your memory data remains safely saved.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-vault-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-vault-200 relative">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-vault-900 to-vault-950 text-vault-100 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-1.5">
                Ask Your Memories
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-vault-300">
                Grounded strictly in {personName}&apos;s Memory Vault
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

        {/* Question Prompt Suggestions */}
        <div className="px-4 py-2 bg-vault-50 border-b border-vault-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-vault-500 shrink-0">Try asking:</span>
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-vault-200 text-vault-800 text-[11px] font-medium whitespace-nowrap transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Conversation Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-amber-800" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-vault-900 text-amber-100 rounded-tr-none'
                    : 'bg-vault-50 text-vault-900 border border-vault-200 rounded-tl-none'
                }`}
              >
                {msg.confidenceLabel && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-semibold">
                    {msg.confidenceLabel}
                  </span>
                )}

                <div className="whitespace-pre-wrap leading-relaxed font-serif text-xs">
                  {msg.content}
                </div>

                {/* Sources Attribution Links */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-vault-200/80 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-vault-500 tracking-wider">
                      Sources Used ({msg.sources.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src) => {
                        let Icon = Heart;
                        if (src.type === 'PHOTO') Icon = Camera;
                        if (src.type === 'VIDEO') Icon = Video;
                        if (src.type === 'MESSAGE') Icon = MessageSquare;
                        if (src.type === 'TIMELINE') Icon = Clock;

                        return (
                          <span
                            key={src.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-vault-300 text-vault-800 font-medium text-[11px] shadow-2xs"
                          >
                            <Icon className="w-3 h-3 text-amber-700" />
                            <span className="truncate max-w-[140px]">{src.title}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-vault-200 text-vault-800 flex items-center justify-center shrink-0 mt-1 font-bold text-[10px]">
                  <User className="w-4 h-4 text-vault-700" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-vault-500 italic text-xs p-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Searching memory vault...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-vault-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about this memory space..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-grow px-4 py-3 rounded-2xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-vault-50/50"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-3 rounded-2xl bg-vault-900 hover:bg-vault-950 text-amber-100 shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-300" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-vault-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Answers are grounded strictly in this Memory Space. No cross-space data leakage.
          </div>
        </div>
      </div>
    </div>
  );
}
