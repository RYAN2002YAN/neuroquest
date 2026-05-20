"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserPlus, Search, Clock, Check, X } from "lucide-react";

export default function GuildPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("id, status, friend_id, user_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    if (data) setFriends(data);
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleAddFriend = async () => {
    if (!searchEmail.trim()) return;
    setLoading(true);

    // find user by email (simplified - in production use a proper search)
    const { data: users } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${searchEmail.trim()}%`)
      .limit(1);

    if (!users?.length) {
      toast.error("未找到该冒险者");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (users[0].id === user.id) { toast.error("不能添加自己"); setLoading(false); return; }

    const { error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: users[0].id,
      status: "pending",
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "已发送过申请" : "添加失败");
    } else {
      toast.success(`已向 ${users[0].username} 发送好友申请`);
      setSearchEmail("");
      fetchFriends();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold mb-1 flex items-center gap-2">
          <Users className="h-7 w-7" /> 冒险者公会
        </h1>
        <p className="text-stone-400">和好友一起战斗，互相监督</p>
      </div>

      {/* Add friend */}
      <Card className="bg-stone-900/80 border-stone-700/30">
        <CardHeader><CardTitle className="text-lg text-stone-200 flex items-center gap-2"><UserPlus className="h-5 w-5 text-amber-400" />添加好友</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="输入冒险者名称搜索..."
              className="bg-stone-800/50 border-stone-700/40 text-stone-100"
              value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddFriend()} />
            <Button onClick={handleAddFriend} disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-stone-900">
              <Search className="h-4 w-4 mr-1" />搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Friends list */}
      <div className="space-y-3">
        <h2 className="text-lg text-stone-300 font-bold">好友列表</h2>
        {friends.length === 0 ? (
          <p className="text-stone-500 text-center py-8">还没有好友。搜索冒险者名称来添加第一个战友！</p>
        ) : (
          friends.map(f => (
            <Card key={f.id} className="bg-stone-900/60 border-stone-700/30">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-900/60 flex items-center justify-center text-amber-300 font-bold">
                    {(f.friend_id || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-stone-200 font-bold">冒险者 #{f.friend_id?.slice(0, 8)}</p>
                    <Badge variant={f.status === "accepted" ? "default" : "outline"}
                      className={f.status === "accepted" ? "bg-emerald-600" : "border-amber-600 text-amber-400"}>
                      {f.status === "accepted" ? <Check className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {f.status === "accepted" ? "已组队" : "等待回应"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
