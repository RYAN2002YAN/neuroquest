"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingBag, Coins, ShoppingCart, Check, Shirt, Home, Gem, FlaskConical } from "lucide-react";
import type { ShopItem, InventoryItem, UserProfile } from "@/lib/types";

const catIcons: Record<string, React.ReactNode> = {
  clothing: <Shirt className="h-5 w-5" />,
  furniture: <Home className="h-5 w-5" />,
  decoration: <Gem className="h-5 w-5" />,
  boost: <FlaskConical className="h-5 w-5" />,
};

const catLabels: Record<string, string> = {
  clothing: "服装", furniture: "家具", decoration: "装饰", boost: "消耗品",
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: shopData }, { data: invData }, { data: profData }] = await Promise.all([
        supabase.from("shop_items").select("*").order("price"),
        supabase.from("inventory").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      if (shopData) setItems(shopData as ShopItem[]);
      if (invData) setInventory(invData as InventoryItem[]);
      if (profData) setProfile(profData as UserProfile);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const ownedItems = new Set(inventory.map(i => i.item_id));
  const equippedItems = new Set(inventory.filter(i => i.equipped).map(i => i.item_id));
  const filtered = tab === "all" ? items : items.filter(i => i.category === tab);

  const handleBuy = async (item: ShopItem) => {
    if (!profile) return;
    if (profile.gold < item.price) { toast.error("金币不足！去完成任务赚金币吧"); return; }
    if (profile.level < item.required_level) { toast.error(`需要等级 ${item.required_level}`); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("inventory").insert({
      user_id: user.id, item_id: item.id,
    });

    if (error) {
      if (error.message.includes("duplicate")) { toast("你已经拥有这个物品了"); return; }
      toast.error("购买失败"); return;
    }

    await supabase.from("profiles").update({ gold: profile.gold - item.price }).eq("id", user.id);
    setProfile({ ...profile, gold: profile.gold - item.price });
    setInventory([...inventory, { id: "", user_id: user.id, item_id: item.id, equipped: false, purchased_at: new Date().toISOString() }]);

    // apply boost effects
    if (item.category === "boost" && item.effect?.type === "restore") {
      const stat = item.effect.stat;
      const amount = item.effect.amount || 0;
      const updates: Record<string, number> = {};
      if (stat === "hp") updates.hp = Math.min(profile.max_hp, profile.hp + amount);
      if (stat === "energy") updates.energy = Math.min(profile.max_energy, profile.energy + amount);
      await supabase.from("profiles").update(updates).eq("id", user.id);
    }

    toast.success(`购买了 ${item.name}！${item.category === "boost" ? "效果已生效" : "已加入背包"}`);
  };

  const handleEquip = async (item: ShopItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // unequip same category
    const sameCat = inventory.filter(i => {
      const it = items.find(s => s.id === i.item_id);
      return it && it.category === item.category && i.equipped && i.item_id !== item.id;
    });
    for (const inv of sameCat) {
      await supabase.from("inventory").update({ equipped: false }).eq("id", inv.id);
    }
    // equip this
    await supabase.from("inventory").update({ equipped: true }).eq("user_id", user.id).eq("item_id", item.id);
    const newInv = inventory.map(i => ({
      ...i, equipped: i.item_id === item.id ? true : sameCat.some(s => s.id === i.id) ? false : i.equipped,
    }));
    setInventory(newInv);

    // apply avatar or stat changes
    if (item.effect?.type === "avatar" && item.effect?.key && item.effect?.value) {
      const key = item.effect.key as string;
      const value = item.effect.value as string;
      const { data: prof } = await supabase.from("profiles").select("avatar").eq("id", user.id).single();
      if (prof) {
        const avatar = prof.avatar as Record<string, string>;
        avatar[key] = value;
        await supabase.from("profiles").update({ avatar }).eq("id", user.id);
        toast.success(`${item.name} 已装备！`);
      }
    }
    if (item.effect?.type === "boost" && item.effect?.stat && item.effect?.amount) {
      await supabase.from("profiles").update({
        [item.effect.stat === "max_hp" ? "max_hp" : "max_energy"]: profile!.max_hp + (item.effect.stat === "max_hp" ? item.effect.amount : 0),
      }).eq("id", user.id);
    }
  };

  if (loading) return <div className="text-center py-16 text-stone-500">加载商店...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-amber-300 font-bold flex items-center gap-2">
            <ShoppingBag className="h-7 w-7" />冒险者商店
          </h1>
          <p className="text-stone-400">用金币购买装备和装饰</p>
        </div>
        <Card className="bg-stone-900/80 border-amber-800/30 px-4 py-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-lg">
            <Coins className="h-5 w-5 text-yellow-400" /> {profile?.gold || 0} 💰
          </div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-800/50 border border-stone-700/30">
          {[{ k: "all", l: "全部" }, { k: "clothing", l: "👕 服装" }, { k: "furniture", l: "🪑 家具" }, { k: "decoration", l: "💎 装饰" }, { k: "boost", l: "🧪 消耗品" }].map(t => (
            <TabsTrigger key={t.k} value={t.k} className="data-[state=active]:bg-amber-600/80 text-xs">{t.l}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const owned = ownedItems.has(item.id);
          const equipped = equippedItems.has(item.id);
          return (
            <Card key={item.id} className={`bg-stone-900/80 border-stone-700/40 transition-all ${equipped ? "border-amber-500/60 ring-1 ring-amber-500/30" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{catIcons[item.category]}</span>
                    <div>
                      <h3 className="font-bold text-stone-100">{item.name}</h3>
                      <p className="text-xs text-stone-500">{catLabels[item.category]}</p>
                    </div>
                  </div>
                  {equipped && <Badge className="bg-amber-600 text-white text-xs">已装备</Badge>}
                  {owned && !equipped && <Badge variant="outline" className="border-emerald-600 text-emerald-400 text-xs"><Check className="h-3 w-3 mr-0.5" />已拥有</Badge>}
                </div>
                <p className="text-xs text-stone-400">{item.description}</p>
                {item.required_level > 1 && <p className="text-xs text-stone-500">需要等级 {item.required_level}</p>}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-yellow-400 text-sm flex items-center gap-1"><Coins className="h-4 w-4" />{item.price}</span>
                  {!owned ? (
                    <Button size="sm" onClick={() => handleBuy(item)}
                      className="bg-amber-600 hover:bg-amber-500 text-white h-8 text-xs"><ShoppingCart className="h-3 w-3 mr-1" />购买</Button>
                  ) : item.category !== "boost" ? (
                    <Button size="sm" variant={equipped ? "outline" : "default"} onClick={() => handleEquip(item)}
                      className={equipped ? "border-amber-600 text-amber-300 h-8 text-xs" : "bg-emerald-600 hover:bg-emerald-500 h-8 text-xs"}>
                      {equipped ? "已装备" : "装备"}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
