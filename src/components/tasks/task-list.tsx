"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskCard } from "./task-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Scroll, Sun, AlertTriangle, Inbox } from "lucide-react";
import type { Task } from "@/lib/types";

interface Props { refreshKey?: number; }

export function TaskList({ refreshKey }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  const filtered = tab === "all" ? tasks
    : tab === "urgent" ? tasks.filter(t => t.type === "urgent")
    : tab === "main" ? tasks.filter(t => t.type === "main_quest")
    : tab === "daily" ? tasks.filter(t => t.type === "daily")
    : tasks.filter(t => t.type === "side_quest");

  const counts = {
    all: tasks.length,
    urgent: tasks.filter(t => t.type === "urgent").length,
    main: tasks.filter(t => t.type === "main_quest").length,
    daily: tasks.filter(t => t.type === "daily").length,
    side: tasks.filter(t => t.type === "side_quest").length,
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-800/50 border border-stone-700/30 w-full justify-start gap-1 h-auto flex-wrap p-1">
          {[
            { key: "all",    label: "全部", icon: null, count: counts.all },
            { key: "urgent", label: "紧急", icon: <AlertTriangle className="h-3 w-3" />, count: counts.urgent },
            { key: "main",   label: "主线", icon: <Sword className="h-3 w-3" />, count: counts.main },
            { key: "daily",  label: "每日", icon: <Sun className="h-3 w-3" />, count: counts.daily },
            { key: "side",   label: "支线", icon: <Scroll className="h-3 w-3" />, count: counts.side },
          ].map(item => (
            <TabsTrigger key={item.key} value={item.key}
              className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-stone-400 text-sm gap-1">
              {item.icon}{item.label} <span className="text-xs opacity-60">({item.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full bg-stone-800/50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-stone-500">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">暂无任务</p>
          <p className="text-sm">点击右下角的 + 按钮创建你的第一个任务</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onComplete={fetchTasks} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
