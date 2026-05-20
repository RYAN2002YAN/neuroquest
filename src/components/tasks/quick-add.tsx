"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Zap, Sword, Scroll, Sun, AlertTriangle } from "lucide-react";
import { TASK_TYPE_CONFIG, DIFFICULTY_CONFIG, type TaskType, type TaskDifficulty } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface Props { onTaskCreated: () => void; }

const typeIcons: Record<TaskType, React.ReactNode> = {
  main_quest: <Sword className="h-4 w-4" />,
  side_quest: <Scroll className="h-4 w-4" />,
  daily: <Sun className="h-4 w-4" />,
  urgent: <AlertTriangle className="h-4 w-4" />,
};

export function QuickAdd({ onTaskCreated }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("side_quest");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("normal");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const diff = DIFFICULTY_CONFIG[difficulty];
  const typeInfo = TASK_TYPE_CONFIG[type];

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("请先登录"); setLoading(false); return; }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: title.trim(),
      type,
      difficulty,
      xp_reward: diff.xp,
      gold_reward: diff.gold,
    });

    if (error) { toast.error("创建失败"); console.error(error); }
    else {
      toast.success("任务已发布！", { description: `${title} — ${diff.label} ${typeInfo.label}任务` });
      setTitle("");
      setOpen(false);
      onTaskCreated();
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
          <TooltipTrigger>
            <DialogTrigger>
              <Button size="lg"
                className="h-16 w-16 rounded-full bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30 fixed bottom-8 right-8 z-50">
                <Plus className="h-8 w-8 text-stone-900" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left"><p>快速创建任务 (快捷键 N)</p></TooltipContent>
        </Tooltip>

      <DialogContent className="bg-gradient-to-b from-stone-900 to-stone-800 border-2 border-amber-800/40 text-stone-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-300 font-serif flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" /> 发布新任务
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input ref={inputRef} placeholder="任务名称，例如：写完作业..."
            className="h-14 text-lg bg-stone-700/50 border-amber-800/30 text-amber-100 placeholder:text-stone-500"
            value={title} onChange={e => setTitle(e.target.value)} onKeyDown={handleKeyDown} />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-stone-400 mb-1 block">类型</label>
              <div className="flex gap-1 flex-wrap">
                {(Object.entries(TASK_TYPE_CONFIG) as [TaskType, typeof TASK_TYPE_CONFIG[keyof typeof TASK_TYPE_CONFIG]][]).map(([key, info]) => (
                  <Badge key={key} variant={type === key ? "default" : "outline"}
                    className={`cursor-pointer ${type === key ? "" : "border-stone-600 text-stone-400 hover:text-stone-200"}`}
                    style={type === key ? { background: info.color, color: "#1a1a1a" } : {}}
                    onClick={() => setType(key)}>
                    {typeIcons[key]} <span className="ml-1">{info.label}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-stone-400 mb-1 block">难度 (奖励: {diff.xp}XP / {diff.gold}💰)</label>
            <div className="flex gap-1 flex-wrap">
              {(Object.entries(DIFFICULTY_CONFIG) as [TaskDifficulty, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, info]) => (
                <Badge key={key} variant={difficulty === key ? "default" : "outline"}
                  className={`cursor-pointer ${difficulty === key ? "" : "border-stone-600 text-stone-400 hover:text-stone-200"}`}
                  style={difficulty === key ? { background: info.color, color: "#fff" } : {}}
                  onClick={() => setDifficulty(key)}>
                  {info.label}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading || !title.trim()}
            className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-lg">
            创建任务 (+{diff.xp}XP)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Also export the Select component needed — shadcn select
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
