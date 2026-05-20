"use client";

import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Star, Coins, Flame, Heart, Zap } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useAnimation } from "@/lib/animation-context";
import { xpForLevel } from "@/lib/types";

interface Props { xp: number; level: number; gold: number; streak: number; hp: number; maxHp: number; energy: number; maxEnergy: number; }

export function XpBar({ xp, level, gold, streak, hp, maxHp, energy, maxEnergy }: Props) {
  const needed = xpForLevel(level);
  const xpPct = Math.min(100, Math.round((xp / needed) * 100));
  const hpPct = Math.round((hp / maxHp) * 100);
  const energyPct = Math.round((energy / maxEnergy) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-stone-900/90 border border-amber-800/30 rounded-xl p-4 backdrop-blur space-y-3">
      {/* XP row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-amber-300 font-bold text-lg">Lv.{level}</span>
        <div className="flex items-center gap-4 text-xs text-stone-400">
          <span><Star className="h-3 w-3 inline text-amber-400 mr-1" /><AnimatedNumber value={xp} />/{needed} XP</span>
          <span><Coins className="h-3 w-3 inline text-yellow-500 mr-1" /><AnimatedNumber value={gold} /></span>
          {streak > 0 && <span className="text-orange-400"><Flame className="h-3 w-3 inline mr-1" /><AnimatedNumber value={streak} />天</span>}
        </div>
        <span className="text-xs text-stone-500">{xpPct}%</span>
      </div>
      <Progress value={xpPct} className="h-2.5 bg-stone-700 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-300" />
      {/* HP + Energy */}
      <div className="flex gap-4 text-xs">
        <div className="flex-1 flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-stone-400 w-8 text-right">{hp}/{maxHp}</span>
          <Progress value={hpPct} className="h-1.5 flex-1 bg-stone-700 [&>div]:bg-red-500" />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-stone-400 w-8 text-right">{energy}/{maxEnergy}</span>
          <Progress value={energyPct} className="h-1.5 flex-1 bg-stone-700 [&>div]:bg-blue-500" />
        </div>
      </div>
    </motion.div>
  );
}
