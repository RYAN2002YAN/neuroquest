"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { XpBar } from "@/components/tasks/xp-bar";
import { Sword, Star, Coins } from "lucide-react";

export default function VillagePage() {
  const [profile, setProfile] = useState({ xp: 0, level: 1, gold: 0, streak_days: 0, hp: 100, max_hp: 100, energy: 100, max_energy: 100 });
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("xp, level, gold, streak_days, hp, max_hp, energy, max_energy").eq("id", user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [supabase, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-stone-900 to-emerald-950/40 border border-amber-800/20 p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif text-amber-300 font-bold mb-2">
            <Sword className="h-8 w-8 inline mr-3 text-amber-400" />
            晨风村庄
          </h1>
          <p className="text-stone-400 text-lg">冒险者，今天想击败哪些怪物？</p>
        </div>
        <div className="absolute right-4 top-4 text-6xl opacity-20">⚔️</div>
        <div className="absolute -right-8 -bottom-8 text-9xl opacity-10">🐉</div>
      </div>

      {/* XP Bar */}
      <XpBar xp={profile.xp} level={profile.level} gold={profile.gold} streak={profile.streak_days || 0}
        hp={profile.hp || 100} maxHp={profile.max_hp || 100} energy={profile.energy || 100} maxEnergy={profile.max_energy || 100} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "等级", value: `Lv.${profile.level}`, icon: Star, color: "text-amber-400" },
          { label: "经验值", value: `${profile.xp} XP`, icon: Sword, color: "text-blue-400" },
          { label: "金币", value: `${profile.gold} 💰`, icon: Coins, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-stone-900/80 border border-stone-800/50 rounded-xl p-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
            <div className="text-lg font-bold text-stone-100">{s.value}</div>
            <div className="text-xs text-stone-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task list */}
      <TaskList refreshKey={refreshKey} />

      {/* Quick add FAB */}
      <QuickAdd onTaskCreated={() => { setRefreshKey(k => k + 1); }} />
    </div>
  );
}
