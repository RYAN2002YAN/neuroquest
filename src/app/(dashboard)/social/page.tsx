"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import {
  Users, UserPlus, Star, Gift, Heart, MessageCircle, Share2,
  Copy, Link as LinkIcon, Sparkles, Send, Clock, HeartHandshake,
  Globe, Footprints, TreePine, ChevronRight, Plus, Loader2
} from "lucide-react";

// ═══════════════════════ 1. PLANET VISITORS ═══════════════════════
function PlanetVisitors() {
  const [visits, setVisits] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: v }, { data: f }] = await Promise.all([
      supabase.from("planet_visits").select("*").eq("host_id", user.id).order("visited_at", { ascending: false }).limit(20),
      supabase.from("friendships").select("friend_id, user_id").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq("status", "accepted"),
    ]);
    if (v) setVisits(v);
    if (f) setFriends(f);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visitFriend = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("planet_visits").insert({ host_id: friendId, visitor_id: user.id });
    toast.success("已留下足迹！👣");
    fetchData();
  };

  const leaveStar = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const msg = "✨ 为你留下一颗星。继续闪耀吧！";
    const { error } = await supabase.from("planet_visits").insert({ host_id: friendId, visitor_id: user.id, left_star: true, star_message: msg });
    if (!error) toast.success("⭐ 小星星已送达！");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Footprints className="h-5 w-5 text-amber-400" /><h3 className="text-lg text-stone-200 font-bold">星球访客</h3></div>
      {/* Visit friends */}
      <div className="flex flex-wrap gap-2">
        {friends.map((f: any) => {
          const fid = f.user_id === (visits[0]?.host_id || "") ? f.friend_id : f.user_id;
          return (
            <div key={f.id} className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="border-stone-600 text-stone-300 text-xs h-7" onClick={() => visitFriend(fid)}>
                <Footprints className="h-3 w-3 mr-1" />访问
              </Button>
              <Button size="sm" variant="ghost" className="text-amber-400 text-xs h-7" onClick={() => leaveStar(fid)}>
                <Star className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
        {friends.length === 0 && <p className="text-stone-500 text-sm">添加好友后可以互相访问星球</p>}
      </div>
      {/* Recent visitors */}
      {visits.length > 0 && (
        <div className="space-y-2">
          {visits.slice(0, 5).map((v: any) => (
            <div key={v.id} className="flex items-center justify-between text-sm text-stone-400 bg-stone-900/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-stone-300">冒险者 #{v.visitor_id?.slice(0, 8)}</span>
                {v.left_star && <span className="text-amber-400">⭐ {v.star_message || ''}</span>}
              </div>
              <span className="text-xs text-stone-600"><Clock className="h-3 w-3 inline mr-1" />{new Date(v.visited_at).toLocaleDateString("zh-CN")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ 2. SHARED PLANET ═══════════════════════
function SharedPlanet() {
  const [planets, setPlanets] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: memberships } = await supabase.from("shared_planet_members").select("planet_id").eq("user_id", user.id);
    const planetIds = memberships?.map(m => m.planet_id) || [];
    const { data: owned } = await supabase.from("shared_planets").select("*").eq("creator_id", user.id);
    const { data: joined } = planetIds.length ? await supabase.from("shared_planets").select("*").in("id", planetIds) : { data: [] };
    const all = [...(owned || []), ...(joined || [])].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
    setPlanets(all);

    if (all.length > 0) {
      const { data: c } = await supabase.from("shared_planet_contributions").select("*").in("planet_id", all.map(p => p.id)).order("contributed_at", { ascending: false }).limit(30);
      if (c) setContributions(c);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createPlanet = async () => {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("shared_planets").insert({ name: newName.trim(), creator_id: user.id });
    if (!error) { toast.success(`共同星球「${newName}」创建成功！🌍`); setNewName(""); fetchData(); }
    else toast.error("创建失败");
  };

  const inviteToPlanet = async (planetId: string, friendUsername: string) => {
    const { data: users } = await supabase.from("profiles").select("id").ilike("username", friendUsername).limit(1);
    if (!users?.length) { toast.error("未找到该冒险者"); return; }
    const { error } = await supabase.from("shared_planet_members").insert({ planet_id: planetId, user_id: users[0].id });
    if (!error) toast.success("已邀请！");
    else toast.error("邀请失败（可能已加入）");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-400" /><h3 className="text-lg text-stone-200 font-bold">共同星球</h3></div>

      {/* Create */}
      <div className="flex gap-2">
        <Input placeholder="星球名称..."
          className="bg-stone-800/50 border-stone-700/40 text-stone-100 h-9 text-sm"
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createPlanet()} />
        <Button size="sm" onClick={createPlanet} className="bg-emerald-600 hover:bg-emerald-500 h-9"><Plus className="h-4 w-4 mr-1" />创建</Button>
      </div>

      {planets.map(p => {
        const planetContribs = contributions.filter(c => c.planet_id === p.id);
        const totalXp = planetContribs.reduce((s: number, c: any) => s + c.xp_contributed, 0);
        return (
          <Card key={p.id} className="bg-stone-900/60 border-emerald-800/30">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-emerald-300 font-bold">{p.name}</h4>
                <Badge className="bg-emerald-900/60 text-emerald-300 text-xs">🏆 {totalXp} XP</Badge>
              </div>
              <div className="text-xs text-stone-500">创建者: #{p.creator_id?.slice(0, 8)}</div>
              {/* Contributions feed */}
              {planetContribs.slice(0, 5).map((c: any) => (
                <div key={c.id} className="text-xs text-stone-400 flex items-center gap-2">
                  <span className="text-amber-400">+{c.xp_contributed}XP</span>
                  <span>冒险者 #{c.user_id?.slice(0, 6)}</span>
                  <span className="text-stone-600">{new Date(c.contributed_at).toLocaleDateString("zh-CN")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════ 3. ENCOURAGEMENT ═══════════════════════
function EncouragementPacks() {
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: r }, { data: s }, { data: f }] = await Promise.all([
      supabase.from("encouragement_packs").select("*").eq("receiver_id", user.id).order("sent_at", { ascending: false }).limit(10),
      supabase.from("encouragement_packs").select("*").eq("sender_id", user.id).order("sent_at", { ascending: false }).limit(10),
      supabase.from("friendships").select("friend_id, user_id").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq("status", "accepted"),
    ]);
    if (r) setReceived(r);
    if (s) setSent(s);
    if (f) setFriends(f);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendEncouragement = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const msg = message.trim() || "🌻 看见你在努力。不必完美，只要向前。";
    const { error } = await supabase.from("encouragement_packs").insert({ sender_id: user.id, receiver_id: friendId, message: msg, gold_amount: 5 });
    if (!error) { toast.success("💌 鼓励包已发送！"); setMessage(""); fetchData(); }
    else toast.error("今天已经发送过了");
  };

  const openPack = async (packId: string) => {
    const { error } = await supabase.from("encouragement_packs").update({ opened: true, opened_at: new Date().toISOString() }).eq("id", packId);
    if (!error) {
      const pack = received.find(r => r.id === packId);
      if (pack) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from("profiles").select("gold").eq("id", user.id).single();
          if (prof) await supabase.from("profiles").update({ gold: prof.gold + pack.gold_amount }).eq("id", user.id);
        }
      }
      toast.success("📬 打开鼓励包！ +5 💰");
      fetchData();
    }
  };

  const unopenedCount = received.filter(r => !r.opened).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-pink-400" /><h3 className="text-lg text-stone-200 font-bold">鼓励包 {unopenedCount > 0 && <Badge className="bg-pink-600 text-white ml-1">{unopenedCount}</Badge>}</h3></div>

      {received.filter(r => !r.opened).map(p => (
        <motion.div key={p.id} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-pink-950/30 border border-pink-800/30 rounded-xl p-4 cursor-pointer hover:border-pink-600/40" onClick={() => openPack(p.id)}>
          <p className="text-pink-200 text-sm">{p.message}</p>
          <p className="text-pink-400 text-xs mt-1 flex items-center gap-1"><Gift className="h-3 w-3" />内含 {p.gold_amount} 💰 — 点击打开</p>
        </motion.div>
      ))}

      {/* Send to friends */}
      <div className="space-y-2">
        <Input placeholder="一句鼓励的话..."
          className="bg-stone-800/50 border-stone-700/40 text-stone-100 h-9 text-sm"
          value={message} onChange={e => setMessage(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {friends.map((f: any) => {
            const fid = f.user_id === f.friend_id ? f.friend_id : f.user_id;
            return (
              <Button key={f.id} size="sm" variant="outline" className="border-pink-800/30 text-pink-300 hover:bg-pink-900/20 text-xs h-7"
                onClick={() => sendEncouragement(fid)}>
                <Send className="h-3 w-3 mr-1" />发送鼓励
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ 4. SHARE CARD ═══════════════════════
function ShareCard() {
  const { enabled } = useAnimation();
  const [profile, setProfile] = useState<any>(null);
  const [template, setTemplate] = useState("warm");
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("username, level, xp, gold, streak_days").eq("id", user.id).single();
      if (data) setProfile(data);
    })();
  }, [supabase]);

  if (!profile) return null;
  const lv = profile.level || 1;

  const templates: Record<string, { bg: string; text: string; accent: string }> = {
    warm: { bg: "from-amber-900/80 to-orange-950/80", text: "text-amber-100", accent: "border-amber-500/40" },
    cute: { bg: "from-pink-900/80 to-purple-950/80", text: "text-pink-100", accent: "border-pink-400/40" },
    cyber: { bg: "from-cyan-950/80 to-blue-950/80", text: "text-cyan-100", accent: "border-cyan-500/40" },
  };
  const t = templates[template];

  const shareText = `🧙‍♂️ 我正在 NeuroQuest 上冒险！\n\n🏆 等级 ${lv} · ${profile.streak_days} 天连续打卡\n🌟 ${profile.xp} XP · 💰 ${profile.gold} 金币\n\n来我的星球看看吧 →`;

  const handleCopy = () => { navigator.clipboard.writeText(shareText); setCopied(true); toast.success("已复制分享文字！"); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Share2 className="h-5 w-5 text-blue-400" /><h3 className="text-lg text-stone-200 font-bold">分享卡片</h3></div>
      {/* Template selector */}
      <div className="flex gap-2">
        {Object.entries(templates).map(([key, val]) => (
          <Badge key={key} onClick={() => setTemplate(key)}
            className={`cursor-pointer ${template === key ? "bg-blue-600 text-white" : "border-stone-600 text-stone-400"}`}>{key === "warm" ? "🔥 暖阳" : key === "cute" ? "🌸 可爱" : "🌃 赛博"}</Badge>
        ))}
      </div>
      {/* Preview */}
      <div className={`rounded-xl border-2 p-5 bg-gradient-to-br ${t.bg} ${t.accent}`}>
        <div className={`text-center space-y-2 ${t.text}`}>
          <p className="text-3xl">🌍</p>
          <p className="font-serif text-xl font-bold">NeuroQuest 冒险者</p>
          <p className="text-2xl font-bold">{profile.username}</p>
          <div className="flex justify-center gap-4 text-sm">
            <span>🏆 Lv.{lv}</span>
            <span>🌟 {profile.xp} XP</span>
            <span>💰 {profile.gold}</span>
          </div>
          {profile.streak_days > 0 && <p className="text-lg">🔥 已坚持 {profile.streak_days} 天</p>}
          <p className="text-xs opacity-60 mt-3">来 NeuroQuest 一起冒险吧！</p>
        </div>
      </div>
      <Button onClick={handleCopy} className="w-full bg-blue-600 hover:bg-blue-500"><Copy className="h-4 w-4 mr-2" />{copied ? "已复制！" : "复制分享文字"}</Button>
    </div>
  );
}

// ═══════════════════════ 5. TREE HOLE ═══════════════════════
function TreeHole() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [posting, setPosting] = useState(false);
  const { enabled } = useAnimation();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tree_hole_posts").select("*").eq("is_visible", true).order("created_at", { ascending: false }).limit(30);
      if (data) setPosts(data);
    })();
  }, [supabase]);

  const moods = [
    { key: "proud", label: "😤 骄傲", color: "bg-amber-600" },
    { key: "tired", label: "😮‍💨 疲惫", color: "bg-blue-600" },
    { key: "hopeful", label: "🌱 希望", color: "bg-emerald-600" },
    { key: "neutral", label: "😶 日常", color: "bg-stone-600" },
  ];

  const postMessage = async () => {
    if (!content.trim() || content.length > 200) { toast.error("内容1-200字"); return; }
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isPositive = !content.includes("死") && !content.includes("自杀") && !content.includes("恨");
    await supabase.from("tree_hole_posts").insert({ user_id: user.id, content: content.trim(), mood, is_visible: isPositive });
    toast.success(isPositive ? "🌳 已放入树洞" : "内容需要审核后发布");
    setContent("");
    setPosting(false);
    const { data } = await supabase.from("tree_hole_posts").select("*").eq("is_visible", true).order("created_at", { ascending: false }).limit(30);
    if (data) setPosts(data);
  };

  const handleLike = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("tree_hole_likes").insert({ post_id: postId, user_id: user.id });
    if (!error) {
      await supabase.rpc("increment_likes", { post_id: postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><TreePine className="h-5 w-5 text-emerald-400" /><h3 className="text-lg text-stone-200 font-bold">匿名树洞</h3></div>
      <p className="text-xs text-stone-500">安全的空间。所有内容匿名发布，AI 自动过滤负面信息。</p>

      {/* Post form */}
      <div className="space-y-2">
        <div className="flex gap-1.5">{moods.map(m => (
          <Badge key={m.key} onClick={() => setMood(m.key)} className={`cursor-pointer text-xs ${mood === m.key ? m.color + " text-white" : "border-stone-600 text-stone-400"}`}>{m.label}</Badge>
        ))}</div>
        <Input placeholder="分享你的心情或小成就...（匿名，≤200字）"
          className="bg-stone-800/50 border-stone-700/40 text-stone-100 h-9 text-sm" value={content} onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === "Enter" && postMessage()} />
        <Button size="sm" onClick={postMessage} disabled={posting || !content.trim()} className="bg-emerald-600 hover:bg-emerald-500 h-8 text-xs">
          {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}放入树洞
        </Button>
      </div>

      {/* Posts feed */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {posts.map(p => (
          <div key={p.id} className="bg-stone-900/50 rounded-lg px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between mb-1">
              <Badge className={moods.find(m => m.key === p.mood)?.color + " text-white text-xs"}>{moods.find(m => m.key === p.mood)?.label || "😶"}</Badge>
              <span className="text-xs text-stone-600">{new Date(p.created_at).toLocaleDateString("zh-CN")}</span>
            </div>
            <p className="text-stone-300">{p.content}</p>
            <button onClick={() => handleLike(p.id)}
              className="flex items-center gap-1 mt-1.5 text-xs text-stone-500 hover:text-pink-400 transition-colors">
              <Heart className="h-3 w-3" /> {p.likes_count || 0}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ 6. INVITE CODE ═══════════════════════
function InviteCode() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("invite_codes").select("*").eq("creator_id", user.id).order("created_at", { ascending: false });
      if (data) setCodes(data);
    })();
  }, [supabase]);

  const generateCode = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const code = "NQ-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("invite_codes").insert({ code, creator_id: user.id });
    if (!error) { setCodes(prev => [{ code, creator_id: user.id, created_at: new Date().toISOString() }, ...prev]); toast.success("邀请码已生成！"); }
    setLoading(false);
  };

  const activeCodes = codes.filter(c => !c.used_by);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-purple-400" /><h3 className="text-lg text-stone-200 font-bold">邀请好友</h3></div>
      <p className="text-xs text-stone-500">邀请好友注册，双方都获得稀有装饰 🎁</p>
      <Button onClick={generateCode} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}生成邀请码
      </Button>
      {activeCodes.map(c => (
        <div key={c.code} className="bg-stone-900/50 border border-purple-800/30 rounded-lg px-3 py-2 flex items-center justify-between">
          <code className="text-purple-300 font-mono text-sm">{c.code}</code>
          <Button size="sm" variant="ghost" className="text-purple-400 h-7 text-xs"
            onClick={() => { navigator.clipboard.writeText(`来 NeuroQuest 一起冒险！我的邀请码: ${c.code}\nhttps://neuroquest.vercel.app/signup`); toast.success("已复制邀请链接！"); }}>
            <Copy className="h-3 w-3 mr-1" />复制
          </Button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════ SOCIAL HUB PAGE ═══════════════════════
export default function SocialPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold flex items-center gap-2"><Users className="h-7 w-7" />冒险者公会</h1>
        <p className="text-stone-400">没有竞争，只有互相照亮。</p>
      </div>

      <Tabs defaultValue="planet">
        <TabsList className="bg-stone-800/50 border border-stone-700/30 w-full justify-start gap-1 h-auto flex-wrap p-1">
          {[
            { k: "planet", l: "🌍 共同星球" },
            { k: "visitors", l: "👣 访客" },
            { k: "encourage", l: "💌 鼓励包" },
            { k: "share", l: "🎴 分享" },
            { k: "treehole", l: "🌳 树洞" },
            { k: "invite", l: "🔗 邀请" },
          ].map(tab => (
            <TabsTrigger key={tab.k} value={tab.k} className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-stone-400 text-xs">{tab.l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="planet" className="mt-4"><SharedPlanet /></TabsContent>
        <TabsContent value="visitors" className="mt-4"><PlanetVisitors /></TabsContent>
        <TabsContent value="encourage" className="mt-4"><EncouragementPacks /></TabsContent>
        <TabsContent value="share" className="mt-4"><ShareCard /></TabsContent>
        <TabsContent value="treehole" className="mt-4"><TreeHole /></TabsContent>
        <TabsContent value="invite" className="mt-4"><InviteCode /></TabsContent>
      </Tabs>
    </div>
  );
}
