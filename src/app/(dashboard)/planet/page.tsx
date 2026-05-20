"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlanetView } from "@/components/planet/planet-view";
import type { AreaProgress } from "@/components/planet/planet-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { QuickAdd } from "@/components/tasks/quick-add";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XpBar } from "@/components/tasks/xp-bar";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Trees, Mountain, Waves, Pickaxe, Star } from "lucide-react";

const AREA_DEFS = [
  { id: "residential", name: "住宅区", icon: <Home className="h-4 w-4" />, color: "#e8b86d", taskTypes: ["daily"], landEmoji: "🏘️" },
  { id: "farm", name: "农场", icon: <Trees className="h-4 w-4" />, color: "#7ec850", taskTypes: ["side_quest"], landEmoji: "🌾" },
  { id: "mine", name: "矿山", icon: <Mountain className="h-4 w-4" />, color: "#b0a090", taskTypes: ["main_quest"], landEmoji: "⛰️" },
  { id: "forest", name: "森林", icon: <Pickaxe className="h-4 w-4" />, color: "#4a8c3f", taskTypes: ["main_quest"], landEmoji: "🌲" },
  { id: "ocean", name: "海洋", icon: <Waves className="h-4 w-4" />, color: "#4a90c4", taskTypes: ["side_quest"], landEmoji: "🌊" },
];

function computeLevel(count: number): number {
  if (count >= 50) return 5;
  if (count >= 25) return 4;
  if (count >= 10) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

const levelBuildings = ["荒地", "小屋", "庭院", "庄园", "宫殿", "奇迹"];

export default function PlanetPage() {
  const [areas, setAreas] = useState<AreaProgress[]>([]);
  const [totalTasks, setTotalTasks] = useState(1);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [profile, setProfile] = useState({ xp: 0, level: 1, gold: 0, streak_days: 0, hp: 100, maxHp: 100, energy: 100, maxEnergy: 100 });
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: tasks }, { data: prof }] = await Promise.all([
      supabase.from("tasks").select("type, status").eq("user_id", user.id),
      supabase.from("profiles").select("xp, level, gold, streak_days, hp, max_hp, energy, max_energy").eq("id", user.id).single(),
    ]);

    if (prof) setProfile({ xp: prof.xp, level: prof.level, gold: prof.gold, streak_days: prof.streak_days, hp: prof.hp, maxHp: prof.max_hp, energy: prof.energy, maxEnergy: prof.max_energy });

    if (tasks) {
      const completedByType: Record<string, number> = {};
      const pendingByType: Record<string, number> = {};
      tasks.forEach(t => {
        if (t.status === "completed") completedByType[t.type] = (completedByType[t.type] || 0) + 1;
        else pendingByType[t.type] = (pendingByType[t.type] || 0) + 1;
      });

      const areaProgress: AreaProgress[] = AREA_DEFS.map(def => {
        const count = def.taskTypes.reduce((sum, tt) => sum + (completedByType[tt] || 0), 0);
        const pending = def.taskTypes.reduce((sum, tt) => sum + (pendingByType[tt] || 0), 0);
        const level = computeLevel(count);
        return {
          id: def.id, name: def.name, icon: def.icon, color: def.color,
          taskCount: Math.max(count || 1, 1),
          level, maxLevel: 5, buildings: [levelBuildings[level]],
          pendingCount: pending,
        };
      });

      setAreas(areaProgress);
      setTotalTasks(Math.max(areaProgress.reduce((s, a) => s + a.taskCount, 0), 5));
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const selectedDef = AREA_DEFS.find(d => d.id === selectedArea);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold mb-1">🌍 你的星球</h1>
        <p className="text-stone-400">每完成一个任务，星球就繁荣一分</p>
      </div>

      <XpBar xp={profile.xp} level={profile.level} gold={profile.gold} streak={profile.streak_days}
        hp={profile.hp} maxHp={profile.maxHp} energy={profile.energy} maxEnergy={profile.maxEnergy} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planet */}
        <div className="flex items-center justify-center">
          <PlanetView areas={areas} totalTasks={totalTasks}
            onSelectArea={setSelectedArea} selectedArea={selectedArea} />
        </div>

        {/* Area info panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedArea && selectedDef ? (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Card className="bg-stone-900/80 border-amber-800/30">
                  <CardContent className="py-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{selectedDef.landEmoji}</span>
                      <div>
                        <h3 className="text-xl text-amber-200 font-bold">{selectedDef.name}</h3>
                        <p className="text-sm text-stone-400">
                          {selectedDef.taskTypes.map(t =>
                            t === "main_quest" ? "主线" : t === "side_quest" ? "支线" : "每日"
                          ).join("、")}任务驱动
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600 text-white text-sm">Lv.{selectedArea ? areas.find(a => a.id === selectedArea)?.level || 1 : 1}</Badge>
                      <span className="text-stone-500 text-sm">
                        {selectedArea ? levelBuildings[areas.find(a => a.id === selectedArea)?.level || 1] : "荒地"}
                      </span>
                    </div>

                    {/* Mini progress to next level */}
                    <div className="text-xs text-stone-500">
                      {selectedArea && (() => {
                        const area = areas.find(a => a.id === selectedArea);
                        if (!area) return null;
                        const nextThreshold = area.level === 0 ? 1 : area.level === 1 ? 3 : area.level === 2 ? 10 : area.level === 3 ? 25 : 50;
                        const current = area.taskCount;
                        const pct = Math.min(100, Math.round((current / nextThreshold) * 100));
                        return <span>进度 {current}/{nextThreshold} ({pct}%) — 升级解锁「{levelBuildings[(area.level || 0) + 1]}」</span>;
                      })()}
                    </div>

                    <div className="flex gap-2">
                      {["all", ...(selectedDef?.taskTypes || [])].map(t => (
                        <Badge key={t} variant={taskFilter === t ? "default" : "outline"}
                          className={`cursor-pointer ${taskFilter === t ? "bg-amber-600" : "border-stone-600 text-stone-400"}`}
                          onClick={() => setTaskFilter(t)}>
                          {t === "all" ? "全部" : t === "main_quest" ? "主线" : t === "side_quest" ? "支线" : "每日"}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-stone-500 text-center space-y-3 py-8">
                <Star className="h-12 w-12 opacity-20" />
                <p>点击星球上的区域<br />查看详情和任务</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task list for selected area */}
          {selectedArea && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <TaskList refreshKey={refreshKey} />
            </motion.div>
          )}
        </div>
      </div>

      <QuickAdd onTaskCreated={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}
