"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sword, Scroll, Sun, AlertTriangle, Check, Loader2, Coins, Star } from "lucide-react";
import { AnimatedNumber, Pressable } from "@/components/ui/animated-number";
import { TASK_TYPE_CONFIG, DIFFICULTY_CONFIG, type Task, type TaskType, type TaskDifficulty } from "@/lib/types";

const typeIcons: Record<TaskType, React.ReactNode> = {
  main_quest: <Sword className="h-4 w-4" />,
  side_quest: <Scroll className="h-4 w-4" />,
  daily: <Sun className="h-4 w-4" />,
  urgent: <AlertTriangle className="h-4 w-4" />,
};

const monsterEmoji: Record<TaskDifficulty, string> = {
  easy: "🟢",
  normal: "🔵",
  hard: "🟠",
  hell: "👹",
};

function isOverdue(task: Task): boolean {
  if (task.deadline && task.status === "active") {
    return new Date(task.deadline) < new Date();
  }
  return false;
}

interface Props { task: Task; onComplete: () => void; }

export function TaskCard({ task, onComplete }: Props) {
  const [completing, setCompleting] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const supabase = createClient();
  const typeInfo = TASK_TYPE_CONFIG[task.type as TaskType];
  const diffInfo = DIFFICULTY_CONFIG[task.difficulty as TaskDifficulty];
  const overdue = isOverdue(task);

  const handleComplete = async () => {
    setCompleting(true);
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", task.id);

    if (error) { toast.error("完成失败"); setCompleting(false); return; }

    // update profile xp + gold
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("xp, level, gold").eq("id", user.id).single();
      if (profile) {
        let newXp = profile.xp + task.xp_reward;
        const xpForCurrentLevel = profile.level * 200;
        let newLevel = profile.level;
        if (newXp >= xpForCurrentLevel) { newXp -= xpForCurrentLevel; newLevel++; }
        await supabase.from("profiles").update({
          xp: newXp,
          level: newLevel,
          gold: profile.gold + task.gold_reward,
          last_active_date: new Date().toISOString().split("T")[0],
        }).eq("id", user.id);
        if (newLevel > profile.level) {
          toast.success(`🎉 升级了！等级 ${newLevel}`, { description: "你的力量增强了！" });
        }
      }
    }

    setShowReward(true);
    setTimeout(() => { setShowReward(false); onComplete(); }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <Card className={`p-4 border-2 transition-all ${
        overdue
          ? "border-red-700/40 bg-gradient-to-r from-red-950/10 to-stone-900/60 opacity-75"
          : task.type === "urgent"
          ? "border-red-800/50 bg-gradient-to-r from-red-950/30 to-stone-900/80"
          : task.type === "main_quest"
          ? "border-amber-800/40 bg-gradient-to-r from-amber-950/20 to-stone-900/80"
          : "border-stone-700/30 bg-stone-900/80"
      }`}>
        <div className="flex items-start gap-3">
          {/* Monster icon */}
          <div className="text-3xl mt-1 shrink-0">
            {showReward ? "💥" : monsterEmoji[task.difficulty as TaskDifficulty]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-stone-100 text-lg truncate">{task.title}</span>
              {overdue && <Badge className="shrink-0 text-xs bg-red-700/60 text-red-200">⚠ 已过期</Badge>}
              <Badge style={{ background: diffInfo.color, color: "#fff" }} className="shrink-0 text-xs">
                {diffInfo.label}
              </Badge>
              <Badge variant="outline" className="shrink-0 text-xs border-stone-600 text-stone-400">
                {typeIcons[task.type as TaskType]}
                <span className="ml-1">{typeInfo.label}</span>
              </Badge>
            </div>

            {task.description && (
              <p className="text-stone-400 text-sm mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {task.xp_reward} XP</span>
              <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-yellow-500" /> {task.gold_reward} 💰</span>
              {task.deadline && <span className="text-red-400">⏰ {new Date(task.deadline).toLocaleDateString("zh-CN")}</span>}
            </div>
          </div>

          <Pressable>
            <Button onClick={handleComplete} disabled={completing}
              size="sm"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white h-10 w-10 rounded-full p-0">
              {completing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            </Button>
          </Pressable>
        </div>

        {/* Reward animation */}
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-3 text-sm font-bold bg-emerald-900/50 rounded-lg p-2"
          >
            <span className="text-amber-400">+<AnimatedNumber value={task.xp_reward} /> XP</span>
            <span className="text-yellow-400">+<AnimatedNumber value={task.gold_reward} /> 💰</span>
            <span className="text-emerald-400">任务完成！</span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
