import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Lock, Sparkles, QrCode } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-vault-950 text-vault-300 pt-16 pb-12 border-t border-vault-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-vault-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-vault-500 flex items-center justify-center shadow-md">
                <Heart className="w-5 h-5 text-amber-100 fill-amber-100/30" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-vault-100">
                MemoryVault
              </span>
            </Link>

            <blockquote className="font-serif italic text-amber-200/90 text-lg leading-relaxed max-w-md">
              &ldquo;Some people leave the place, never the memories.&rdquo;
            </blockquote>

            <p className="text-sm text-vault-400 max-w-md leading-relaxed">
              A private digital space for preserving the people, moments, and memories that matter. Built for friendships, relationships, family, farewells, and lifetime milestones.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-vault-100 uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-amber-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-amber-300 transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/create-memory" className="hover:text-amber-300 transition-colors">
                  Create Memory Space
                </Link>
              </li>
              
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-vault-100 uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <div className="space-y-2 text-xs text-vault-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Private & Password-Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unique Memory ID & Permanent QR</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Granular Contributor Permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Phase 2 AI Ready Architecture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-vault-500">
          <p>© {new Date().getFullYear()} MemoryVault. All rights reserved.</p>
          <div className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-0.5" /> to keep precious moments alive forever.
          </div>
        </div>
      </div>
    </footer>
  );
}
