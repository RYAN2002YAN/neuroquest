"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AvatarEditor } from "@/components/avatar/avatar-editor";
import { BadgeGrid } from "@/components/achievements/badge-grid";
import { toast } from "sonner";
import { LogOut, Star, Coins, Flame, Heart, Zap, Brain, Sword, Users, Shield, Sparkles } from "lucide-react";
import { xpForLevel } from "@/lib/types";
import type { UserProfile, Skill, UserSkill, AchievementDef, Achievement } from "@/lib/types";

const skillIcons: Record<string, React.ReactNode> = {
  Brain: <Brain className="h-4 w-4" />, Sunrise: <Sparkles className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />, Shield: <Shield className="h-4 w-4" />,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [achievementDefs, setAchievementDefs] = useState<AchievementDef[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const [{ data: prof }, { data: skillDefs }, { data: uSkills }, { data: aDefs }, { data: achs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("skills").select("*").order("category"),
        supabase.from("user_skills").select("*").eq("user_id", user.id),
        supabase.from("achievement_defs").select("*").order("category"),
        supabase.from("achievements").select("*").eq("user_id", user.id),
      ]);
      if (prof) setProfile(prof as UserProfile);
      if (skillDefs) setSkills(skillDefs as Skill[]);
      if (uSkills) setUserSkills(uSkills as UserSkill[]);
      if (aDefs) setAchievementDefs(aDefs as AchievementDef[]);
      if (achs) setAchievements(achs as Achievement[]);
      setLoading(false);
    };
    fetchAll();
  }, [supabase, router]);

  const handleAvatarUpdate = (a: any) => { if (profile) setProfile({ ...profile, avatar: a }); };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); };

  if (loading) return <div className="text-center py-16 text-stone-500">加载角色数据...</div>;
  if (!profile) return <div className="text-center py-16 text-stone-500">未找到角色</div>;

  const xpNeeded = xpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif text-amber-300 font-bold">冒险者档案</h1>

      {/* Hero card */}
      <Card className="bg-stone-900/80 border-amber-800/20">
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
          <div className="w-20 h-20 rounded-full border-2 border-amber-600/40 flex items-center justify-center text-4xl shrink-0"
            style={{ background: `radial-gradient(circle, ${profile.avatar?.outfitColor || "#4488cc"}30, transparent)` }}>
            🧙‍♂️
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl text-amber-200 font-bold font-serif">{profile.username}</h2>
            <p className="text-stone-400">Lv.{profile.level} · {profile.xp}/{xpNeeded} XP</p>
            <Progress value={xpPct} className="h-2 mt-2 bg-stone-700 [&>div]:bg-amber-500 max-w-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "等级", v: `Lv.${profile.level}`, i: Star, c: "text-amber-400" },
          { l: "生命", v: `${profile.hp}/${profile.max_hp}`, i: Heart, c: "text-red-400" },
          { l: "精力", v: `${profile.energy}/${profile.max_energy}`, i: Zap, c: "text-blue-400" },
          { l: "金币", v: profile.gold, i: Coins, c: "text-yellow-400" },
        ].map(s => (
          <Card key={s.l} className="bg-stone-900/60 border-stone-800/40"><CardContent className="py-4 text-center">
            <s.i className={`h-5 w-5 mx-auto mb-1 ${s.c}`} />
            <div className="text-xl font-bold text-stone-100">{s.v}</div>
            <div className="text-xs text-stone-500">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Avatar Editor */}
      <Card className="bg-stone-900/60 border-stone-800/40">
        <CardHeader><CardTitle className="text-lg text-stone-200">🎨 虚拟形象</CardTitle></CardHeader>
        <CardContent><AvatarEditor avatar={profile.avatar} onUpdate={handleAvatarUpdate} /></CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-stone-900/60 border-stone-800/40">
        <CardHeader><CardTitle className="text-lg text-stone-200 flex items-center gap-2"><Sword className="h-5 w-5 text-amber-400" />技能树</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {skills.map(skill => {
            const us = userSkills.find(u => u.skill_id === skill.id);
            const lv = us?.level || 0;
            const pct = lv === 0 ? 0 : Math.round((lv / skill.max_level) * 100);
            return (
              <div key={skill.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${lv > 0 ? "bg-amber-900/40 text-amber-400" : "bg-stone-800 text-stone-600"}`}>
                  {skillIcons[skill.icon] || <Star className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><span className="text-sm text-stone-200 font-bold">{skill.name}</span><span className="text-xs text-stone-500">{lv}/{skill.max_level}</span></div>
                  <Progress value={pct} className="h-1.5 mt-1 bg-stone-700 [&>div]:bg-emerald-500" />
                  <p className="text-xs text-stone-500 truncate mt-0.5">{skill.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-stone-900/60 border-stone-800/40">
        <CardHeader><CardTitle className="text-lg text-stone-200 flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-400" />成就徽章 ({achievements.length}/{achievementDefs.length})</CardTitle></CardHeader>
        <CardContent><BadgeGrid allDefs={achievementDefs} unlocked={achievements} /></CardContent>
      </Card>

      {/* Mood Tracker (local only) */}
      <MoodTracker />

      <Button variant="outline" onClick={handleLogout} className="w-full border-red-800/30 text-red-400 hover:bg-red-900/20"><LogOut className="h-4 w-4 mr-2" />登出</Button>
    </div>
  );
}

// ─────────── Mood Tracker (LocalStorage ONLY — never uploaded) ───────────
function MoodTracker() {
  const [mood, setMood] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; mood: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("nq-mood-history");
    if (stored) setHistory(JSON.parse(stored));
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = JSON.parse(stored || "[]").find((h: any) => h.date === today);
    if (todayEntry) setMood(todayEntry.mood);
  }, []);

  const handleMood = (m: string) => {
    const today = new Date().toISOString().split("T")[0];
    const newHistory = [...history.filter(h => h.date !== today), { date: today, mood: m }];
    setHistory(newHistory);
    setMood(m);
    localStorage.setItem("nq-mood-history", JSON.stringify(newHistory));
  };

  const moods = [
    { key: "great", emoji: "😄", label: "很好" },
    { key: "good", emoji: "🙂", label: "不错" },
    { key: "ok", emoji: "😐", label: "一般" },
    { key: "low", emoji: "😔", label: "低落" },
    { key: "bad", emoji: "😢", label: "很差" },
  ];

  // Simple insight: if mood is low, suggest easy tasks
  const lastWeek = history.slice(-7);
  const avgMoodScore = lastWeek.reduce((s, h) => {
    const scores: Record<string, number> = { great: 5, good: 4, ok: 3, low: 2, bad: 1 };
    return s + (scores[h.mood] || 3);
  }, 0) / Math.max(lastWeek.length, 1);

  return (
    <Card className="bg-stone-900/60 border-stone-800/40">
      <CardHeader><CardTitle className="text-lg text-stone-200">🧠 情绪追踪 <span className="text-xs text-stone-500 font-normal ml-1">(仅本地存储)</span></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-stone-500">今天感觉如何？所有数据都存储在浏览器本地，绝对不会上传。</p>
        <div className="flex gap-2 justify-center">
          {moods.map(m => (
            <button key={m.key} onClick={() => handleMood(m.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-sm ${mood === m.key ? "bg-amber-900/40 ring-1 ring-amber-500/50 scale-110" : "bg-stone-800/50 hover:bg-stone-700/50"}`}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs text-stone-400">{m.label}</span>
            </button>
          ))}
        </div>
        {avgMoodScore < 3 && mood && (
          <div className="bg-amber-950/30 border border-amber-800/20 rounded-lg p-3 text-sm text-amber-200">
            💡 检测到你最近情绪有些低落。试试完成一个「简单」难度的小任务——不需要追求完美，只要开始就是胜利。
          </div>
        )}
        {history.length > 0 && (
          <div className="flex items-end gap-0.5 h-10 mt-2">
            {history.slice(-14).map((h, i) => {
              const scores: Record<string, number> = { great: 5, good: 4, ok: 3, low: 2, bad: 1 };
              const h_pct = ((scores[h.mood] || 3) / 5) * 100;
              return (
                <div key={i} className="flex-1 rounded-t"
                  style={{ height: `${h_pct}%`, background: `hsl(${h_pct * 0.6}, 60%, 50%)`, opacity: 0.5 + (h_pct / 200) }} />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
