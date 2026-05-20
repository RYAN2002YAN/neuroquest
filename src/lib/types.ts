export type TaskType = "main_quest" | "side_quest" | "daily" | "urgent";
export type TaskDifficulty = "easy" | "normal" | "hard" | "hell";
export type TaskStatus = "active" | "completed";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: TaskType;
  difficulty: TaskDifficulty;
  parent_id?: string | null;
  xp_reward: number;
  gold_reward: number;
  status: TaskStatus;
  completed_at?: string | null;
  created_at: string;
  deadline?: string | null;
  subtasks?: Task[];
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  xp: number;
  level: number;
  gold: number;
  streak_days: number;
  last_active_date?: string;
}

export const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; xp: number; gold: number; color: string }> = {
  easy:   { label: "简单", xp: 50,  gold: 10,  color: "#4ade80" },
  normal: { label: "普通", xp: 100, gold: 25,  color: "#60a5fa" },
  hard:   { label: "困难", xp: 200, gold: 50,  color: "#f97316" },
  hell:   { label: "地狱", xp: 500, gold: 100, color: "#ef4444" },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string; color: string }> = {
  main_quest: { label: "主线", icon: "Sword",    color: "#fbbf24" },
  side_quest: { label: "支线", icon: "Scroll",   color: "#60a5fa" },
  daily:      { label: "每日", icon: "Sun",      color: "#34d399" },
  urgent:     { label: "紧急", icon: "AlertTriangle", color: "#ef4444" },
};

export function xpForLevel(level: number): number {
  return level * 200;
}
