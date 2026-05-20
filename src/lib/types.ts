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
  hp: number;
  max_hp: number;
  energy: number;
  max_energy: number;
  streak_days: number;
  last_active_date?: string;
  avatar: AvatarConfig;
}

export interface AvatarConfig {
  gender: "male" | "female";
  hair: string;
  hairColor: string;
  outfit: string;
  outfitColor: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: "focus" | "habit" | "social" | "stamina";
  max_level: number;
  icon: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  level: number;
  xp: number;
  skill?: Skill;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: "clothing" | "furniture" | "decoration" | "boost";
  price: number;
  required_level: number;
  image_url?: string;
  effect: Record<string, any>;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  equipped: boolean;
  purchased_at: string;
  item?: ShopItem;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  required_count: number;
  xp_reward: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  def?: AchievementDef;
}

export const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; xp: number; gold: number; color: string; emoji: string }> = {
  easy:   { label: "简单", xp: 50,  gold: 10,  color: "#4ade80", emoji: "🟢" },
  normal: { label: "普通", xp: 100, gold: 25,  color: "#60a5fa", emoji: "🔵" },
  hard:   { label: "困难", xp: 200, gold: 50,  color: "#f97316", emoji: "🟠" },
  hell:   { label: "地狱", xp: 500, gold: 100, color: "#ef4444", emoji: "👹" },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string; color: string }> = {
  main_quest: { label: "主线", icon: "Sword",    color: "#fbbf24" },
  side_quest: { label: "支线", icon: "Scroll",   color: "#60a5fa" },
  daily:      { label: "每日", icon: "Sun",      color: "#34d399" },
  urgent:     { label: "紧急", icon: "AlertTriangle", color: "#ef4444" },
};

export function xpForLevel(level: number): number { return level * 200; }

export const AVATAR_HAIR_OPTIONS = ["short", "long", "mohawk", "braid", "bald"];
export const AVATAR_HAIR_COLORS = ["#4a3728", "#1a1a1a", "#d4a030", "#c44a30", "#e8e0d0", "#8844cc"];
export const AVATAR_OUTFIT_OPTIONS = ["basic", "adventurer", "mage", "knight"];
export const AVATAR_OUTFIT_COLORS = ["#4488cc", "#4ade80", "#3b5998", "#c44a30", "#f0c060", "#888888"];
