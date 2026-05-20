"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sprout, Gift, Coins, Star, Plus } from "lucide-react";

export default function FarmPage() {
  const [cropDefs, setCropDefs] = useState<any[]>([]);
  const [userCrops, setUserCrops] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [refreshing, setRefreshing] = useState(0);
  const { enabled } = useAnimation();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: defs }, { data: crops }, { data: prof }] = await Promise.all([
        supabase.from("crop_defs").select("*"),
        supabase.from("user_crops").select("*").eq("user_id", user.id).eq("harvested", false),
        supabase.from("profiles").select("gold, xp, level").eq("id", user.id).single(),
      ]);
      if (defs) setCropDefs(defs);
      if (crops) setUserCrops(crops);
      if (prof) setProfile(prof);
    })();
  }, [supabase, refreshing]);

  const plantCrop = async (cropId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_crops").insert({ user_id: user.id, crop_id: cropId });
    if (!error) { toast.success("🌱 种子已种下！完成任意任务让它生长。"); setRefreshing(r => r + 1); }
  };

  const harvestCrop = async (cropId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: { user: u } } = { data: { user } };
    const def = cropDefs.find(d => d.id === cropId);
    if (!def) return;

    await Promise.all([
      supabase.from("user_crops").update({ harvested: true, growth: 0 }).eq("id", cropId).eq("user_id", user.id),
      supabase.from("profiles").update({
        gold: (profile.gold || 0) + def.harvest_gold,
        xp: (profile.xp || 0) + def.harvest_xp,
      }).eq("id", user.id),
    ]);

    setProfile((p: any) => ({ ...p, gold: (p.gold || 0) + def.harvest_gold, xp: (p.xp || 0) + def.harvest_xp }));
    toast.success(`${def.emoji} ${def.name} 已收获！+${def.harvest_xp}XP +${def.harvest_gold}💰`);
    setRefreshing(r => r + 1);
  };

  const growthEmojis = ["🟤", "🌰", "🌿", "🌳", "🌟"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-emerald-300 font-bold flex items-center gap-2"><Sprout className="h-7 w-7" />星球农场</h1>
        <p className="text-stone-400">每完成一个任务，你的作物就生长一点</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cropDefs.map(def => {
          const planted = userCrops.filter(c => c.crop_id === def.id);
          return (
            <motion.div key={def.id} whileHover={enabled ? { scale: 1.02 } : {}}>
              <Card className="bg-stone-900/80 border-emerald-800/30 h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{def.emoji}</span>
                    <Badge className="bg-emerald-900/60 text-emerald-300">{def.season === "all" ? "四季" : def.season}</Badge>
                  </div>
                  <h3 className="text-stone-100 font-bold">{def.name}</h3>
                  <p className="text-xs text-stone-500">每 {def.tasks_per_stage} 个任务生长一级 · {def.growth_stages} 级成熟</p>

                  {planted.map((c: any) => {
                    const stage = Math.floor(c.growth / def.tasks_per_stage);
                    const pct = Math.min(100, Math.round((c.growth % def.tasks_per_stage) / def.tasks_per_stage * 100));
                    const mature = stage >= def.growth_stages;
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-300">{growthEmojis[Math.min(stage, 4)]} 阶段 {Math.min(stage + 1, def.growth_stages)}/{def.growth_stages}</span>
                          <span className="text-xs text-stone-500">{c.growth}/{def.tasks_per_stage * def.growth_stages}</span>
                        </div>
                        <Progress value={mature ? 100 : pct} className="h-2 bg-stone-700 [&>div]:bg-emerald-500" />
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <Coins className="h-3 w-3 text-yellow-400" />+{def.harvest_gold} <Star className="h-3 w-3 text-amber-400" />+{def.harvest_xp}XP
                        </div>
                        {mature && (
                          <Button size="sm" onClick={() => harvestCrop(c.id)} className="w-full bg-amber-600 hover:bg-amber-500 h-8 text-xs">
                            <Gift className="h-3 w-3 mr-1" />收获！
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {planted.length === 0 && (
                    <Button size="sm" onClick={() => plantCrop(def.id)} variant="outline"
                      className="w-full border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/20 h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" />种植
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
