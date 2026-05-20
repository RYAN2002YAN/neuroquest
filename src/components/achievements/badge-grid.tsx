"use client";

import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Lock, Star, Sword, Flame, Users, ShoppingBag, TrendingUp } from "lucide-react";
import type { AchievementDef, Achievement } from "@/lib/types";

const iconMap: Record<string, React.ReactNode> = {
  Award: <Award className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Sword: <Sword className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  ShoppingBag: <ShoppingBag className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
};

interface Props { allDefs: AchievementDef[]; unlocked: Achievement[]; }

export function BadgeGrid({ allDefs, unlocked }: Props) {
  const unlockedIds = new Set(unlocked.map(a => a.achievement_id));

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
      {allDefs.map((def, i) => {
        const earned = unlockedIds.has(def.id);
        return (
          <motion.div key={def.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
            <Tooltip>
              <TooltipTrigger>
                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-default transition-all ${
                  earned ? "bg-amber-900/30 border border-amber-600/30" : "bg-stone-800/30 border border-stone-700/20 opacity-40"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    earned ? "bg-amber-500/20 text-amber-400" : "bg-stone-700/50 text-stone-600"
                  }`}>
                    {earned ? (iconMap[def.icon] || <Award className="h-5 w-5" />) : <Lock className="h-4 w-4" />}
                  </div>
                  <span className="text-xs text-stone-300 text-center leading-tight">{def.title}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-bold">{def.title}</p>
                  <p className="text-stone-400">{def.description}</p>
                  {earned && <p className="text-amber-400 text-xs mt-1">✨ 已解锁 +{def.xp_reward}XP</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        );
      })}
    </div>
  );
}
