import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  QrCode,
  Lock,
  ArrowRight,
  Shield,
  Users,
  Camera,
  Video,
  Mic,
  MessageCircle,
  Calendar,
  PhoneCall,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background glow accents */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-amber-400/20 to-vault-400/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-12 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs font-semibold shadow-xs">
              <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>&ldquo;Some people leave the place, never the memories.&rdquo;</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-vault-950 leading-[1.15]">
              Keep the memories.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vault-800 via-amber-700 to-vault-600 underline decoration-amber-400/40">
                Keep them forever.
              </span>
            </h1>

            <p className="text-lg text-vault-700 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Create a private digital space for the people and moments you never want to forget. Preserve photos, videos, messages, timeline events, and shared stories in a shareable digital scrapbook.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/create-memory"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-base shadow-xl shadow-vault-900/15 hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Create a Memory Space</span>
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-vault-100 border border-vault-300 text-vault-800 font-semibold text-base shadow-sm transition-all"
              >
                <span>Explore How It Works</span>
                <ArrowRight className="w-4 h-4 text-vault-500" />
              </a>
            </div>

            {/* Trust indicators */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-vault-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>100% Private & Protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>Unique Memory QR Codes</span>
              </div>
            </div>
          </div>

         
         
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vault-950">
            How MemoryVault Works
          </h2>
          <p className="text-base text-vault-600 font-sans">
            Four simple steps to create an everlasting digital vault for someone special.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft relative flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-serif">
                01
              </div>
              <h3 className="font-serif text-xl font-bold text-vault-900">
                Create a Memory Space
              </h3>
              <p className="text-xs text-vault-600 leading-relaxed">
                Set up a dedicated space for a best friend, college group, partner, family member, or colleague.
              </p>
            </div>
            <div className="pt-6 border-t border-vault-100 text-[11px] font-semibold text-amber-700">
              Personalized & Custom
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft relative flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-serif">
                02
              </div>
              <h3 className="font-serif text-xl font-bold text-vault-900">
                Add Photos, Videos & Stories
              </h3>
              <p className="text-xs text-vault-600 leading-relaxed">
                Upload precious photos, acoustic jams, written messages, important dates, and chronological milestones.
              </p>
            </div>
            <div className="pt-6 border-t border-vault-100 text-[11px] font-semibold text-amber-700">
              Rich Scrapbook Formats
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft relative flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-serif">
                03
              </div>
              <h3 className="font-serif text-xl font-bold text-vault-900">
                Invite Friends to Contribute
              </h3>
              <p className="text-xs text-vault-600 leading-relaxed">
                Send invitation links so mutual friends can write memory notes and upload their own photos into the space.
              </p>
            </div>
            <div className="pt-6 border-t border-vault-100 text-[11px] font-semibold text-amber-700">
              Collaborative Memories
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-3xl p-6 border border-vault-200 shadow-soft relative flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg font-serif">
                04
              </div>
              <h3 className="font-serif text-xl font-bold text-vault-900">
                Share via Unique ID or QR
              </h3>
              <p className="text-xs text-vault-600 leading-relaxed">
                Get a permanent, printable QR code and Memory ID (`MEM-RH-2026-8294`) to open the space anytime on phone or desktop.
              </p>
            </div>
            <div className="pt-6 border-t border-vault-100 text-[11px] font-semibold text-amber-700">
              Always Accessible
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN PRESERVE SECTION */}
      <section className="bg-vault-100/70 py-20 border-y border-vault-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-vault-950">
              What You Can Preserve
            </h2>
            <p className="text-base text-vault-600">
              Every detail matters when preserving relationships and unforgettable life chapters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Camera,
                title: '📸 Photos',
                desc: 'Masonry photo galleries with captions, locations, and date tags.',
              },
              {
                icon: Video,
                title: '🎥 Videos',
                desc: 'Lazy-loaded video player cards for music jams, trips, and farewell speeches.',
              },
              {
                icon: Mic,
                title: '🎙️ Voice Memories',
                desc: 'Audio recordings, laughter, and voice notes saved for posterity.',
              },
              {
                icon: MessageCircle,
                title: '💌 Messages',
                desc: 'Heartfelt letters and notes written by close friends and family.',
              },
              {
                icon: Calendar,
                title: '📅 Important Dates',
                desc: 'Birthdays, first meeting anniversaries, and special milestones.',
              },
              {
                icon: PhoneCall,
                title: '📞 Contacts',
                desc: 'Phone numbers, email addresses, and social profiles with privacy rules.',
              },
              {
                icon: BookOpen,
                title: '📝 Stories',
                desc: 'Long-form personal narratives of shared adventures.',
              },
              {
                icon: Clock,
                title: '🕰️ Timeline',
                desc: 'Chronological timeline of events sorted automatically by date.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-vault-200/80 shadow-xs hover:shadow-md transition-all hover:border-amber-400"
              >
                <div className="w-10 h-10 rounded-xl bg-vault-50 text-amber-700 flex items-center justify-center mb-4 border border-vault-200">
                  <item.icon className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-serif font-bold text-lg text-vault-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-vault-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-vault-900 via-vault-950 to-vault-900 rounded-3xl p-8 sm:p-12 text-vault-100 shadow-2xl relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                <Shield className="w-3.5 h-3.5" />
                Privacy & Trust First
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                &ldquo;Your memories belong to you.&rdquo;
              </h2>
              <p className="text-vault-300 text-sm leading-relaxed max-w-xl font-sans">
                MemoryVault is designed as a sanctuary. You decide who can see, contribute to, or manage your digital spaces. Contact details and personal messages are strictly shielded according to your preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
                  <span className="font-bold text-amber-300">Private</span>
                  <p className="text-[11px] text-vault-400">Only invited users can access</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
                  <span className="font-bold text-amber-300">Unlisted</span>
                  <p className="text-[11px] text-vault-400">Anyone with Memory ID / QR link</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
                  <span className="font-bold text-amber-300">Public</span>
                  <p className="text-[11px] text-vault-400">Openly accessible memory page</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm p-6 bg-vault-800/90 rounded-2xl border border-vault-700/80 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-lg text-amber-200">
                  Controlled Sharing
                </h3>
                <p className="text-xs text-vault-300">
                  Invite friends as Contributors to write notes without giving them administrative rights to modify privacy or space settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-6 h-6 text-amber-700 fill-amber-700/30" />
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-vault-950">
          Start preserving your memories today.
        </h2>

        <p className="text-base text-vault-600 max-w-xl mx-auto font-sans">
          Create a space for a friend, a partner, or a special chapter of life. It takes less than 2 minutes to build your first Memory Vault.
        </p>

        <div className="pt-2">
          <Link
            href="/create-memory"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-vault-900 hover:bg-vault-950 text-amber-100 font-semibold text-lg shadow-xl shadow-vault-900/20 hover:scale-[1.03] transition-all"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Create a Memory Space</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
