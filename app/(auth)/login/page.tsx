'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail) {
      setForgotSubmitted(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-elevated border border-vault-200 space-y-6 relative overflow-hidden">
        {/* Top ambient accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-vault-800 via-amber-600 to-vault-600"></div>

        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-vault-900 text-amber-300 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 fill-amber-300/30" />
            </div>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-vault-950">
            Welcome Back
          </h1>
          <p className="text-xs text-vault-600 font-sans">
            Log in to manage your digital memory spaces
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-vault-700 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-vault-500" />
              Email Address
            </label>
            <input
              type="email"
              placeholder="demo@memoryvault.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase text-vault-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-vault-500" />
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-vault-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                Logging in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

      
        <div className="pt-4 border-t border-vault-100 text-center text-xs text-vault-600">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-amber-800 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-vault-200 text-left space-y-4">
            <h3 className="font-serif font-bold text-lg text-vault-900">
              Reset Password
            </h3>
            {forgotSubmitted ? (
              <div className="space-y-3">
                <p className="text-xs text-vault-600">
                  Password reset instructions have been sent to <strong>{forgotEmail}</strong> if an account exists.
                </p>
                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSubmitted(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-vault-900 text-amber-100 text-xs font-semibold"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-vault-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-vault-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-vault-300 text-vault-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-vault-900 text-amber-100 text-xs font-semibold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
