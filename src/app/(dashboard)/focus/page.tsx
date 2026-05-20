"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { Play, Pause, RotateCcw, Trees, Timer, TrendingUp } from "lucide-react";

const TREE_EMOJIS = ["🌱","🌿","🪴","🌳","🌲","🏞️"];

export default function FocusPage() {
  const [duration, setDuration] = useState(25); // default 25 min
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [treeCount, setTreeCount] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalTrees, setTotalTrees] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const [showForest, setShowForest] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { enabled } = useAnimation();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("focus_sessions").select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(10);
      if (data) {
        setSessions(data);
        setTotalTrees(data.reduce((s: number, t: any) => s + t.tree_count, 0));
      }
    })();
  }, [supabase]);

  const start = () => {
    setRunning(true);
    setInterrupted(false);
    setRemaining(duration * 60);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          finishSession(false);
          return 0;
        }
        // Every 5 minutes, grow a tree
        if (prev % 300 === 0) setTreeCount(t => Math.min(t + 1, TREE_EMOJIS.length - 1));
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setInterrupted(true);
  };

  const finishSession = useCallback(async (wasInterrupted: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    const trees = Math.max(0, Math.floor((duration * 60 - remaining) / 300));
    setTreeCount(trees);
    setShowForest(true);
    setTimeout(() => setShowForest(false), 4000);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("focus_sessions").insert({
      user_id: user.id, duration_minutes: duration, tree_count: trees,
      completed: !wasInterrupted, interrupted: wasInterrupted,
      started_at: new Date(Date.now() - duration * 60000).toISOString(),
      ended_at: new Date().toISOString(),
    });

    if (!wasInterrupted) {
      toast.success(`🌳 专注完成！森林多了 ${trees} 棵树`);
      // Award XP for focus
      const { data: prof } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
      if (prof) await supabase.from("profiles").update({ xp: prof.xp + trees * 20 }).eq("id", user.id);
    } else {
      toast("森林有点枯萎，但没关系。下次再来。");
    }

    const { data } = await supabase.from("focus_sessions").select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(10);
    if (data) {
      setSessions(data);
      setTotalTrees(data.reduce((s: number, t: any) => s + t.tree_count, 0));
    }
  }, [duration, remaining, supabase]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = Math.round(((duration * 60 - remaining) / (duration * 60)) * 100);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-emerald-300 font-bold flex items-center gap-2"><Trees className="h-7 w-7" />森林专注</h1>
        <p className="text-stone-400">专注时，星球上长出森林。分心会让树枯萎一点。</p>
      </div>

      {/* Forest visualization */}
      <Card className={`bg-stone-900/80 border-emerald-800/30 overflow-hidden ${showForest ? "ring-2 ring-emerald-500/30" : ""}`}>
        <CardContent className="py-10 text-center space-y-4">
          <AnimatePresence mode="wait">
            {showForest ? (
              <motion.div key="forest" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-6xl flex justify-center gap-2 flex-wrap">
                {Array.from({ length: treeCount + 1 }).map((_, i) => (
                  <motion.span key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}>
                    {TREE_EMOJIS[Math.min(i, TREE_EMOJIS.length - 1)]}
                  </motion.span>
                ))}
              </motion.div>
            ) : (
              <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="text-7xl font-mono text-emerald-300 font-bold tracking-widest">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
                <p className="text-stone-500 text-sm mt-2 flex items-center justify-center gap-1">
                  <Trees className="h-4 w-4 text-emerald-400" />当前: {TREE_EMOJIS[treeCount]} {treeCount} 棵树
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {running && !showForest && (
            <div className="w-full bg-stone-700 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
          )}

          <div className="flex items-center justify-center gap-3">
            {!running ? (
              <Button onClick={start} className="bg-emerald-600 hover:bg-emerald-500 h-12 px-8 text-lg"><Play className="h-5 w-5 mr-2" />开始专注</Button>
            ) : (
              <Button onClick={pause} variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/20 h-12 px-8 text-lg"><Pause className="h-5 w-5 mr-2" />暂停</Button>
            )}
            {!running && remaining < duration * 60 && (
              <Button onClick={() => { setRemaining(duration * 60); setTreeCount(0); }} variant="ghost" className="text-stone-400"><RotateCcw className="h-4 w-4" /></Button>
            )}
          </div>

          {/* Duration selector */}
          <div className="flex justify-center gap-2">
            {[15, 25, 45, 60].map(d => (
              <Badge key={d} onClick={() => { if (!running) { setDuration(d); setRemaining(d * 60); setTreeCount(0); } }}
                className={`cursor-pointer ${duration === d ? "bg-emerald-600 text-white" : "border-stone-600 text-stone-400"}`}>{d}min</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="bg-stone-900/60 border-stone-800/40">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-stone-400 text-sm mb-3"><TrendingUp className="h-4 w-4 text-emerald-400" />累计种树 {totalTrees} 棵</div>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs text-stone-500">
                <span>{new Date(s.started_at).toLocaleDateString("zh-CN")} · {s.duration_minutes}min</span>
                <span className="flex items-center gap-1">
                  <Trees className="h-3 w-3" />{s.tree_count} 棵树
                  {s.interrupted && <Badge className="bg-red-900/40 text-red-300 text-[10px]">中断</Badge>}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
