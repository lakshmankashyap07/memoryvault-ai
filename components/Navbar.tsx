'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Heart, PlusCircle, LogOut, User, LayoutDashboard, Shield, Menu, X, Bell } from 'lucide-react';
import { InvitationsModal } from '@/components/InvitationsModal';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [invitationsModalOpen, setInvitationsModalOpen] = useState(false);

  const fetchInvitationsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/user/invitations');
      const data = await res.json();
      if (res.ok && data.invitations) {
        setInvitationsCount(data.invitations.length);
      }
    } catch {
      // Ignore background fetch error
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetchInvitationsCount();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pathname, fetchInvitationsCount]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-vault-50/90 backdrop-blur-md border-b border-vault-200/60 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-vault-700 via-amber-700 to-vault-500 flex items-center justify-center shadow-md shadow-vault-700/20 group-hover:scale-105 transition-transform duration-200">
            <Heart className="w-5.5 h-5.5 text-amber-100 fill-amber-100/30" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-tight text-vault-900 flex items-center gap-1.5">
              MemoryVault
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-vault-600 font-semibold -mt-1">
              Preserve Forever
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-vault-900 font-semibold' : 'text-vault-600 hover:text-vault-900'
            }`}
          >
            Home
          </Link>
          
          {user && (
            <Link
              href="/dashboard"
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname === '/dashboard' ? 'text-vault-900 font-semibold' : 'text-vault-600 hover:text-vault-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-vault-600" />
              Dashboard
            </Link>
          )}

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-vault-200">
                  {/* Notification Bell Button */}
                  <button
                    onClick={() => setInvitationsModalOpen(true)}
                    className="relative p-2 rounded-full text-vault-700 hover:bg-vault-100 hover:text-vault-900 transition-colors"
                    title="Invitations"
                  >
                    <Bell className="w-5 h-5" />
                    {invitationsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm animate-pulse">
                        {invitationsCount}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/create-memory"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-vault-800 to-vault-700 hover:from-vault-900 hover:to-vault-800 text-amber-100 text-sm font-medium shadow-md shadow-vault-900/10 hover:shadow-lg transition-all"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-300" />
                    <span>Create Memory</span>
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-vault-100 border border-transparent hover:border-vault-200 transition-all">
                      <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-300 overflow-hidden">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-vault-900 max-w-[120px] truncate">
                        {user.name}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-elevated border border-vault-200/80 py-2 hidden group-hover:block transition-all z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-vault-100">
                        <p className="text-xs font-semibold text-vault-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-vault-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setInvitationsModalOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-vault-700 hover:bg-vault-50 hover:text-vault-900 text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-vault-600" />
                          Invitations
                        </span>
                        {invitationsCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[9px]">
                            {invitationsCount}
                          </span>
                        )}
                      </button>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-vault-700 hover:bg-vault-50 hover:text-vault-900"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        My Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-4 border-l border-vault-200">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-vault-700 hover:text-vault-900 px-3 py-1.5 rounded-lg hover:bg-vault-100 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 text-sm font-medium shadow-md shadow-vault-900/10 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Get Started
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={() => setInvitationsModalOpen(true)}
              className="relative p-2 rounded-lg text-vault-700 hover:bg-vault-100 transition-colors"
              title="Invitations"
            >
              <Bell className="w-5 h-5" />
              {invitationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                  {invitationsCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-vault-700 hover:bg-vault-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-vault-200 px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-vault-800 border-b border-vault-100"
          >
            Home
          </Link>
          {user ? (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setInvitationsModalOpen(true);
                }}
                className="w-full flex items-center justify-between py-2 text-base font-medium text-vault-800 border-b border-vault-100 text-left"
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-vault-600" />
                  Invitations
                </span>
                {invitationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-xs">
                    {invitationsCount} pending
                  </span>
                )}
              </button>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-vault-800 border-b border-vault-100"
              >
                Dashboard
              </Link>
              <Link
                href="/create-memory"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-vault-900 text-amber-100 font-medium text-sm my-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                Create Memory Space
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-sm font-medium text-rose-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.name})
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl border border-vault-300 text-vault-800 font-medium text-sm"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl bg-vault-900 text-amber-100 font-medium text-sm shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Invitations Modal */}
      <InvitationsModal
        isOpen={invitationsModalOpen}
        onClose={() => setInvitationsModalOpen(false)}
        onInvitationProcessed={fetchInvitationsCount}
      />
    </header>
  );
}
