"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { Award, Lock, Gem } from "lucide-react";

const rarityColors: Record<string, string> = { common: "border-stone-500 bg-stone-800/30", rare: "border-blue-600 bg-blue-900/20", epic: "border-purple-500 bg-purple-900/20", legendary: "border-amber-500 bg-amber-900/20" };
const rarityStars: Record<string, string> = { common: "★", rare: "★★", epic: "★★★", legendary: "★★★★★" };

export default function CollectionsPage() {
  const [collectibles, setCollectibles] = useState<any[]>([]);
  const [userCollected, setUserCollected] = useState<Set<string>>(new Set());
  const [sets, setSets] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const { enabled } = useAnimation();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: items }, { data: collected }, { data: setDefs }, { data: prof }] = await Promise.all([
        supabase.from("collectible_defs").select("*").order("category"),
        supabase.from("user_collectibles").select("collectible_id").eq("user_id", user.id),
        supabase.from("collectible_sets").select("*"),
        supabase.from("profiles").select("xp, level, gold").eq("id", user.id).single(),
      ]);
      if (items) setCollectibles(items);
      if (collected) setUserCollected(new Set(collected.map(c => c.collectible_id)));
      if (setDefs) setSets(setDefs);
      if (prof) setProfile(prof);
    })();
  }, [supabase]);

  const categories = [
    { key: "fossil", label: "🦴 化石", color: "text-amber-300" },
    { key: "insect", label: "🐞 昆虫", color: "text-emerald-300" },
    { key: "fish", label: "🐟 鱼类", color: "text-blue-300" },
    { key: "mineral", label: "💎 矿物", color: "text-purple-300" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold flex items-center gap-2"><Award className="h-7 w-7" />博物馆</h1>
        <p className="text-stone-400">完成任务随机掉落收集品 · 集齐套装获得稀有称号</p>
      </div>

      {/* Collection count */}
      <div className="text-stone-300 text-sm">已收集 {userCollected.size} / {collectibles.length}</div>

      {/* Set bonuses */}
      <div className="grid grid-cols-2 gap-3">
        {sets.map(set => {
          const setItems = collectibles.filter(c => c.set_id === set.id);
          const collectedCount = setItems.filter(i => userCollected.has(i.id)).length;
          const complete = collectedCount === setItems.length;
          return (
            <Card key={set.id} className={`bg-stone-900/60 ${complete ? "border-amber-500/60 ring-1 ring-amber-500/20" : "border-stone-700/30"}`}>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{complete ? "🏆" : "🔒"}</span>
                  <div>
                    <p className="text-sm text-stone-200 font-bold">{set.name}</p>
                    <p className="text-xs text-stone-500">{collectedCount}/{setItems.length} · {complete ? `已解锁: ${set.bonus_title}` : "未集齐"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Collectible grid by category */}
      {categories.map(cat => (
        <div key={cat.key} className="space-y-3">
          <h3 className={`text-lg font-bold ${cat.color}`}>{cat.label}</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {collectibles.filter(c => c.category === cat.key).map(item => {
              const owned = userCollected.has(item.id);
              return (
                <motion.div key={item.id} whileHover={enabled && owned ? { scale: 1.1 } : {}}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${owned ? rarityColors[item.rarity] + " opacity-100" : "border-stone-700/20 bg-stone-800/20 opacity-30"}`}>
                  <span className="text-2xl">{owned ? item.emoji : "❓"}</span>
                  <span className="text-[10px] text-stone-400 leading-tight">{item.name}</span>
                  <span className="text-[8px] text-stone-600">{rarityStars[item.rarity]}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
