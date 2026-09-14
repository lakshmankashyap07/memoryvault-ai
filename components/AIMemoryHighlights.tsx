'use client';

import React from 'react';
import { Sparkles, Calendar, Users, Heart, Award, Flame, Clock } from 'lucide-react';

interface HighlightsProps {
  stats: {
    firstMemoryDate?: string | null;
    totalMemories: number;
    totalMilestones: number;
    totalContributors: number;
    mostActiveYear?: string;
    relationshipPeriod?: string;
  };
}

export function AIMemoryHighlights({ stats }: HighlightsProps) {
  return (
    <div className="bg-gradient-to-br from-vault-900 via-vault-950 to-vault-900 rounded-3xl p-6 sm:p-8 text-vault-100 shadow-elevated space-y-6 border border-vault-800 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">
            ✨ Memory Highlights
          </h3>
        </div>

        <span className="text-[11px] text-amber-300 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          Calculated from database
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Memories */}
        <div className="p-4 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Heart className="w-3.5 h-3.5" />
            <span>Total Memories</span>
          </div>
          <p className="font-serif font-bold text-2xl text-white">{stats.totalMemories}</p>
          <p className="text-[10px] text-vault-400">Photos, videos & notes</p>
        </div>

        {/* First Memory */}
        <div className="p-4 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>First Memory</span>
          </div>
          <p className="font-serif font-bold text-base text-white truncate">
            {stats.firstMemoryDate || '2019'}
          </p>
          <p className="text-[10px] text-vault-400">Journey start date</p>
        </div>

        {/* Top Contributors */}
        <div className="p-4 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Contributors</span>
          </div>
          <p className="font-serif font-bold text-2xl text-white">{stats.totalContributors}</p>
          <p className="text-[10px] text-vault-400">Friends sharing moments</p>
        </div>

        {/* Major Events */}
        <div className="p-4 rounded-2xl bg-vault-800/80 border border-vault-700 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Milestones</span>
          </div>
          <p className="font-serif font-bold text-2xl text-white">{stats.totalMilestones}</p>
          <p className="text-[10px] text-vault-400">Chronological history</p>
        </div>
      </div>
    </div>
  );
}
