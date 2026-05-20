"use client";

import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Star, Coins, Flame } from "lucide-react";
import { xpForLevel } from "@/lib/types";

interface Props { xp: number; level: number; gold: number; streak: number; }

export function XpBar({ xp, level, gold, streak }: Props) {
  const needed = xpForLevel(level);
  const pct = Math.min(100, Math.round((xp / needed) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-stone-900/90 border border-amber-800/30 rounded-xl p-3 backdrop-blur"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-amber-300 font-bold text-lg">Lv.{level}</span>
          <span className="text-stone-400">
            <Star className="h-3 w-3 inline text-amber-400 mr-1" />
            {xp} / {needed} XP
          </span>
          <span className="text-stone-400">
            <Coins className="h-3 w-3 inline text-yellow-500 mr-1" />
            {gold}
          </span>
          {streak > 0 && (
            <span className="text-orange-400">
              <Flame className="h-3 w-3 inline mr-1" />
              {streak} 天
            </span>
          )}
        </div>
        <span className="text-xs text-stone-500">{pct}%</span>
      </div>
      <Progress value={pct} className="h-3 bg-stone-700 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-300" />
    </motion.div>
  );
}
