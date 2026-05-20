"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { User, Star, Coins, Flame, LogOut, Sword, Award } from "lucide-react";
import { xpForLevel } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) return <div className="text-center py-16 text-stone-500">加载中...</div>;
  if (!profile) return <div className="text-center py-16 text-stone-500">未找到角色数据</div>;

  const xpNeeded = xpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-serif text-amber-300 font-bold mb-1">角色信息</h1>

      {/* Profile card */}
      <Card className="bg-stone-900/80 border-amber-800/20">
        <CardContent className="flex items-center gap-6 py-6">
          <Avatar className="h-20 w-20 border-2 border-amber-600/40">
            <AvatarFallback className="bg-amber-900/60 text-amber-300 text-2xl font-bold">
              {profile.username?.slice(0, 2).toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl text-amber-200 font-bold font-serif">{profile.username || "冒险者"}</h2>
            <p className="text-stone-400">等级 {profile.level} · {profile.xp} / {xpNeeded} XP</p>
            <Progress value={xpPct} className="h-2 mt-2 bg-stone-700 [&>div]:bg-amber-500 w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "等级", value: `Lv.${profile.level}`, icon: Star, color: "text-amber-400" },
          { label: "经验值", value: profile.xp, icon: Sword, color: "text-blue-400" },
          { label: "金币", value: profile.gold, icon: Coins, color: "text-yellow-400" },
          { label: "连续天数", value: profile.streak_days, icon: Flame, color: "text-orange-400" },
        ].map(s => (
          <Card key={s.label} className="bg-stone-900/60 border-stone-800/40">
            <CardContent className="py-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-xl font-bold text-stone-100">{s.value}</div>
              <div className="text-xs text-stone-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements placeholder */}
      <Card className="bg-stone-900/60 border-stone-800/40">
        <CardHeader><CardTitle className="text-lg text-stone-200 flex items-center gap-2"><Award className="h-5 w-5 text-amber-400" />成就</CardTitle></CardHeader>
        <CardContent>
          <p className="text-stone-500 text-center py-4">完成更多任务来解锁成就！</p>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleLogout}
        className="w-full border-red-800/30 text-red-400 hover:bg-red-900/20">
        <LogOut className="h-4 w-4 mr-2" />登出
      </Button>
    </div>
  );
}
