"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sprout, PawPrint, Home, Tent, Lock, Star, Coins, Heart, ShoppingCart, ChevronRight, RotateCw, Gift, TreePine, Move } from "lucide-react";

// ═══════════════════════ SHARED: VILLAGE STORE ═══════════════════════
function VillageStore({ type, onBuy }: { type: "seed" | "animal" | "furniture"; onBuy: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const [{ data: { user } }] = await Promise.all([supabase.auth.getUser()]);
      if (!user) return;
      const table = type === "seed" ? "seed_defs" : type === "animal" ? "animal_defs" : "furniture_defs";
      const [{ data: it }, { data: prof }] = await Promise.all([
        supabase.from(table).select("*").order("price"),
        supabase.from("profiles").select("gold, level").eq("id", user.id).single(),
      ]);
      if (it) setItems(it);
      if (prof) setProfile(prof);
    })();
  }, [supabase, type]);

  const buy = async (item: any) => {
    if (profile.gold < item.price) { toast.error("金币不足！"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ gold: profile.gold - item.price }).eq("id", user.id);
    setProfile((p: any) => ({ ...p, gold: p.gold - item.price }));
    toast.success(`已购买！`);
    onBuy();
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
      {items.map(item => (
        <div key={item.id} className="bg-stone-800/60 rounded-lg p-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{item.emoji}</span>
            <div>
              <p className="text-stone-200">{item.name}</p>
              <p className="text-stone-500">{item.price} 💰</p>
            </div>
          </div>
          <Button size="sm" className="h-6 text-[10px] bg-amber-600 hover:bg-amber-500 px-2" onClick={() => buy(item)}>
            <ShoppingCart className="h-3 w-3 mr-0.5" />买
          </Button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════ 1. FARM ═══════════════════════
function FarmTab({ level, onTaskComplete }: { level: number; onTaskComplete: () => void }) {
  const [plots, setPlots] = useState<any[]>([]);
  const [seeds, setSeeds] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [plantingPlot, setPlantingPlot] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(0);
  const supabase = createClient();
  const maxPlots = 4 + Math.floor((level - 2) / 2) * 4;
  const unlocked = level >= 2;

  useEffect(() => {(async()=>{
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    const [{data:p},{data:s}]=await Promise.all([
      supabase.from("farm_plots").select("*").eq("user_id",user.id).order("plot_index"),
      supabase.from("seed_defs").select("*")
    ]);
    const filled=Array.from({length:maxPlots},(_,i)=>p?.find(pp=>pp.plot_index===i)||{plot_index:i,seed_id:null,growth:0});
    setPlots(filled);
    if(s)setSeeds(s);
  })()},[supabase,maxPlots,refreshing]);

  const plant = async (plotIdx:number, seedId:string) => {
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    await supabase.from("farm_plots").upsert({user_id:user.id,plot_index:plotIdx,seed_id:seedId,growth:0,planted_at:new Date().toISOString()},{onConflict:"user_id,plot_index"});
    setPlantingPlot(null);setShowStore(false);
    toast.success("🌱 已种下！完成任务来浇水吧。");
    setRefreshing(r=>r+1);
  };

  const harvest = async (plot:any) => {
    const seed=seeds.find(s=>s.id===plot.seed_id);if(!seed)return;
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    const [{data:prof}]=await Promise.all([
      supabase.from("profiles").select("gold,xp").eq("id",user.id).single(),
      supabase.from("farm_plots").upsert({user_id:user.id,plot_index:plot.plot_index,seed_id:null,growth:0},{onConflict:"user_id,plot_index"}),
    ]);
    if(prof) await supabase.from("profiles").update({gold:prof.gold+seed.harvest_gold,xp:prof.xp+seed.harvest_xp}).eq("id",user.id);
    toast.success(`${seed.emoji} 收获！+${seed.harvest_xp}XP +${seed.harvest_gold}💰`);
    setRefreshing(r=>r+1);onTaskComplete();
  };

  const growthStageEmoji = ["🟤","🌰","🌿","🪴","🌳","🌟"];

  if(!unlocked) return <LockedHint level={2} feature="农场" desc="等级2解锁——种下第一颗种子" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-emerald-300 font-bold flex items-center gap-2"><Sprout className="h-5 w-5"/>农场</h3>
        <div className="flex items-center gap-2">
          <Badge className="bg-stone-800 text-stone-400">{plots.length}/{maxPlots} 块地</Badge>
          <Button size="sm" variant="outline" className="border-stone-600 text-stone-300 h-7 text-xs" onClick={()=>{setShowStore(!showStore);setPlantingPlot(null);}}>
            <ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭商店":"种子商店"}
          </Button>
        </div>
      </div>

      {showStore && !plantingPlot && <VillageStore type="seed" onBuy={()=>setRefreshing(r=>r+1)} />}

      {plantingPlot!==null && (
        <div className="bg-stone-800/60 rounded-lg p-2 max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between mb-1"><span className="text-xs text-stone-400">选择种子种在第 {plantingPlot+1} 块地</span><Button size="sm" variant="ghost" className="h-5 text-xs text-stone-500" onClick={()=>setPlantingPlot(null)}>取消</Button></div>
          <div className="grid grid-cols-3 gap-1.5">
            {seeds.map(s=>(<button key={s.id} onClick={()=>plant(plantingPlot,s.id)} className="bg-stone-700/50 rounded p-1.5 text-xs text-left flex items-center gap-1.5 hover:bg-stone-600/50"><span className="text-lg">{s.emoji}</span><div><p className="text-stone-200">{s.name}</p><p className="text-stone-500">{s.price}💰 · {s.tasks_per_stage*s.stages}任务成熟</p></div></button>))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {plots.map((plot,i)=>(
          <motion.div key={i} whileHover={{scale:1.03}} className={`rounded-xl border-2 p-3 text-center min-h-[120px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            plot.seed_id?"border-emerald-700/40 bg-emerald-950/20 hover:bg-emerald-950/40":"border-stone-700/30 bg-stone-900/40 hover:bg-stone-800/40 border-dashed"
          }`} onClick={()=>{if(!plot.seed_id){setPlantingPlot(i);setShowStore(true);}}}>
            {plot.seed_id?(()=>{
              const seed=seeds.find(s=>s.id===plot.seed_id);
              if(!seed)return null;
              const stage=Math.floor(plot.growth/seed.tasks_per_stage);
              const mature=stage>=seed.stages;
              const pct=Math.min(100,Math.round((plot.growth%seed.tasks_per_stage)/seed.tasks_per_stage*100));
              return(<>
                <span className="text-3xl">{mature?seed.emoji:growthStageEmoji[Math.min(stage,5)]}</span>
                <p className="text-xs text-stone-300">{seed.name}</p>
                <Progress value={mature?100:pct} className="h-1.5 bg-stone-700 [&>div]:bg-emerald-500" />
                <span className="text-[10px] text-stone-500">阶段{Math.min(stage+1,seed.stages)}/{seed.stages}</span>
                {mature&&<Button size="sm" className="h-6 text-[10px] bg-amber-600 hover:bg-amber-500 px-3" onClick={(e)=>{e.stopPropagation();harvest(plot);}}><Gift className="h-3 w-3 mr-0.5"/>收获</Button>}
              </>);
            })():(<><span className="text-2xl text-stone-600">{i+1}</span><span className="text-xs text-stone-600">空地</span></>)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ 2. RANCH ═══════════════════════
function RanchTab({ level }: { level: number }) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [defs, setDefs] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [refreshing, setRefreshing] = useState(0);
  const supabase = createClient();
  const maxPens = 2 + Math.floor((level-4)/2)*2;
  const unlocked = level>=4;

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:a},{data:d}]=await Promise.all([
      supabase.from("ranch_animals").select("*").eq("user_id",user.id).order("pen_index"),
      supabase.from("animal_defs").select("*")
    ]);
    const filled=Array.from({length:maxPens},(_,i)=>a?.find(aa=>aa.pen_index===i)||{pen_index:i,animal_id:null,growth:0});
    setAnimals(filled);if(d)setDefs(d);
  })()},[supabase,maxPens,refreshing]);

  const adopt = async (penIdx:number, animalId:string) => {
    const def=defs.find(d=>d.id===animalId);if(!def)return;
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    const [{data:prof}]=await Promise.all([
      supabase.from("profiles").select("gold").eq("id",user.id).single(),
    ]);
    if(!prof||prof.gold<def.price){toast.error("金币不足");return;}
    await Promise.all([
      supabase.from("profiles").update({gold:prof.gold-def.price}).eq("id",user.id),
      supabase.from("ranch_animals").upsert({user_id:user.id,pen_index:penIdx,animal_id:animalId,name:def.name,growth:0},{onConflict:"user_id,pen_index"}),
    ]);
    toast.success(`欢迎 ${def.name}！`);
    setShowStore(false);setRefreshing(r=>r+1);
  };

  const collect = async (animal:any) => {
    const def=defs.find(d=>d.id===animal.animal_id);if(!def)return;
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    if(animal.last_harvest_date===today){toast("今天已经收获过了，明天再来吧～");return;}
    const[{data:prof}]=await Promise.all([
      supabase.from("profiles").select("gold,xp").eq("id",user.id).single(),
      supabase.from("ranch_animals").update({last_harvest_date:today}).eq("id",animal.id),
    ]);
    if(prof)await supabase.from("profiles").update({gold:prof.gold+def.byproduct_gold,xp:prof.xp+def.byproduct_xp}).eq("id",user.id);
    toast.success(`${def.byproduct_emoji} 收获了${def.byproduct_name}！+${def.byproduct_xp}XP`);
    setRefreshing(r=>r+1);
  };

  const interact = (animal:any)=>{
    const def=defs.find(d=>d.id===animal.animal_id);
    const msgs=["对你眨了眨眼 👀","跳了起来！","转了个圈～","蹭了蹭你 💕","叫了一声～"];
    toast(def?.emoji+" "+msgs[Math.floor(Math.random()*msgs.length)]);
  };

  if(!unlocked)return <LockedHint level={4} feature="牧场" desc="等级4解锁——领养第一只小动物" />;

  return(<div className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="text-lg text-pink-300 font-bold flex items-center gap-2"><PawPrint className="h-5 w-5"/>牧场</h3>
      <Button size="sm" variant="outline" className="border-stone-600 text-stone-300 h-7 text-xs" onClick={()=>setShowStore(!showStore)}><ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭":"动物商店"}</Button></div>
    {showStore&&<VillageStore type="animal" onBuy={()=>setRefreshing(r=>r+1)} />}
    <div className="grid grid-cols-2 gap-3">
      {animals.map((a,i)=>(<motion.div key={i} whileHover={{scale:1.03}} className={`rounded-xl border-2 p-4 text-center min-h-[140px] flex flex-col items-center justify-center gap-2 transition-colors ${a.animal_id?"border-pink-700/30 bg-pink-950/20":"border-stone-700/30 border-dashed bg-stone-900/40"}`}
        onClick={()=>{if(!a.animal_id)setShowStore(true);else interact(a);}}>
        {a.animal_id?(()=>{const d=defs.find(dd=>dd.id===a.animal_id);if(!d)return null;
          const stage=Math.floor(a.growth/d.tasks_per_stage);const adult=stage>=d.stages;
          return(<>
            <motion.span className="text-4xl cursor-pointer" whileTap={{scale:0.8,rotate:10}}>{adult?d.emoji:d.baby_emoji}</motion.span>
            <p className="text-sm text-stone-200 font-bold">{a.name||d.name}</p>
            {!adult&&<><Progress value={Math.round(stage/d.stages*100)} className="h-1.5 bg-stone-700 [&>div]:bg-pink-500"/><span className="text-[10px] text-stone-500">成长中 {stage}/{d.stages}</span></>}
            {adult&&<Button size="sm" className="h-6 text-[10px] bg-pink-600 hover:bg-pink-500 px-3" onClick={(e)=>{e.stopPropagation();collect(a);}}><Gift className="h-3 w-3 mr-0.5"/>{d.byproduct_emoji} 收获</Button>}
          </>);
        })():(<><span className="text-2xl text-stone-600">🏠</span><span className="text-xs text-stone-600">空窝</span></>)}
      </motion.div>))}
    </div>
  </div>);
}

// ═══════════════════════ 3. CABIN ═══════════════════════
function CabinTab({ level }: { level: number }) {
  const [layout, setLayout] = useState<any[]>([]);
  const [furniture, setFurniture] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [likes, setLikes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(0);
  const [dragging, setDragging] = useState<string|null>(null);
  const supabase = createClient();
  const rooms=level>=10?3:level>=8?2:1;
  const unlocked=level>=6;

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:l},{data:f},{data:lk}]=await Promise.all([
      supabase.from("cabin_layout").select("*").eq("user_id",user.id),
      supabase.from("furniture_defs").select("*"),
      supabase.from("cabin_likes").select("*").eq("cabin_owner_id",user.id).order("created_at",{ascending:false}).limit(10)
    ]);
    if(l)setLayout(l);if(f)setFurniture(f);if(lk)setLikes(lk);
  })()},[supabase,refreshing]);

  const placeFurniture = async (furnId:string) => {
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    await supabase.from("cabin_layout").insert({user_id:user.id,furniture_id:furnId,room:"main",pos_x:Math.random()*200+20,pos_y:Math.random()*200+20});
    setShowStore(false);setRefreshing(r=>r+1);
  };

  const moveFurniture = async (id:string,x:number,y:number)=>{
    await supabase.from("cabin_layout").update({pos_x:x,pos_y:y}).eq("id",id);
    setLayout(prev=>prev.map(l=>l.id===id?{...l,pos_x:x,pos_y:y}:l));
  };

  if(!unlocked)return <LockedHint level={6} feature="小屋" desc="等级6解锁——装饰你的第一个家" />;

  return(<div className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="text-lg text-amber-300 font-bold flex items-center gap-2"><Home className="h-5 w-5"/>我的小屋</h3>
      <div className="flex items-center gap-2">
        <Badge className="bg-stone-800 text-stone-400">{rooms} 个房间</Badge>
        <Badge className="bg-pink-900/40 text-pink-300">{likes.length} ❤️</Badge>
        <Button size="sm" variant="outline" className="border-stone-600 text-stone-300 h-7 text-xs" onClick={()=>setShowStore(!showStore)}><ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭":"家具商店"}</Button>
      </div></div>
    {showStore&&<VillageStore type="furniture" onBuy={()=>setRefreshing(r=>r+1)} />}
    {/* Room */}
    <div className="relative bg-stone-800/40 border-2 border-stone-700/30 rounded-xl h-80 overflow-hidden" style={{background:"linear-gradient(180deg,#6b5a4a 0%,#4a3a2a 30%,#8b7355 100%)"}}>
      <div className="absolute bottom-0 w-full h-[60%]" style={{background:"linear-gradient(180deg,transparent,#5c4030)"}}/>
      {layout.map(l=>{const f=furniture.find(ff=>ff.id===l.furniture_id);if(!f)return null;
        return(<motion.div key={l.id} className="absolute cursor-grab active:cursor-grabbing select-none" style={{left:l.pos_x,top:l.pos_y}}
          drag dragMomentum={false}
          onDragEnd={(_,info)=>{moveFurniture(l.id,l.pos_x+info.offset.x,l.pos_y+info.offset.y);}}
          whileHover={{scale:1.05}} whileTap={{scale:0.95}}>
          <div className="flex flex-col items-center"><span className="text-3xl">{f.emoji}</span><span className="text-[9px] text-stone-300 bg-stone-900/70 px-1 rounded">{f.name}</span></div>
        </motion.div>);
      })}
      {layout.length===0&&<div className="absolute inset-0 flex items-center justify-center text-stone-600 text-sm"><Move className="h-4 w-4 mr-1"/>从商店买家具来装饰吧</div>}
    </div>
    {likes.length>0&&<div className="flex gap-1.5 flex-wrap">{likes.map(lk=>(<Badge key={lk.id} className="bg-pink-900/30 text-pink-300 text-xs">❤️ {lk.message||"好友来访"}</Badge>))}</div>}
  </div>);
}

// ═══════════════════════ 4. PLAZA ═══════════════════════
function PlazaTab({ level }: { level: number }) {
  const unlocked=level>=8;
  const [collected,setCollected]=useState(0);
  const [total,setTotal]=useState(0);
  const supabase=createClient();
  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:uc},{data:cd}]=await Promise.all([
      supabase.from("user_collectibles").select("id").eq("user_id",user.id),
      supabase.from("collectible_defs").select("id")
    ]);
    if(uc)setCollected(uc.length);if(cd)setTotal(cd.length);
  })()},[supabase]);

  if(!unlocked)return <LockedHint level={8} feature="广场" desc="等级8解锁——和大家一起庆祝" />;

  const season=getSeason();
  return(<div className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="text-lg text-purple-300 font-bold flex items-center gap-2"><Tent className="h-5 w-5"/>广场</h3><Badge className="bg-purple-900/40 text-purple-300">{season}</Badge></div>
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-stone-900/60 border-purple-800/30"><CardContent className="py-4 text-center"><span className="text-3xl">🏛️</span><p className="text-stone-200 font-bold text-sm mt-1">博物馆</p><p className="text-stone-500 text-xs">{collected}/{total} 件收集品</p></CardContent></Card>
      <Card className="bg-stone-900/60 border-purple-800/30"><CardContent className="py-4 text-center"><span className="text-3xl">{seasonEmoji(season)}</span><p className="text-stone-200 font-bold text-sm mt-1">季节广场</p><p className="text-stone-500 text-xs">{season}活动进行中</p></CardContent></Card>
      <Card className="bg-stone-900/60 border-purple-800/30 col-span-2"><CardContent className="py-4 text-center"><span className="text-4xl">🎪</span><p className="text-stone-200 font-bold text-sm mt-1">即将到来：协作任务</p><p className="text-stone-500 text-xs">和好友一起完成大型协作任务，获得限定装饰</p></CardContent></Card>
    </div>
  </div>);
}

function getSeason():string{const m=new Date().getMonth()+1;if(m>=3&&m<=5)return"🌸 春季";if(m>=6&&m<=8)return"☀️ 夏季";if(m>=9&&m<=11)return"🍂 秋季";return"❄️ 冬季";}
function seasonEmoji(s:string):string{if(s.includes("春"))return"🌸";if(s.includes("夏"))return"☀️";if(s.includes("秋"))return"🍂";return"❄️";}

// ═══════════════════════ LOCKED HINT ═══════════════════════
function LockedHint({level,feature,desc}:{level:number;feature:string;desc:string}){
  return(<div className="flex flex-col items-center justify-center py-16 text-stone-600 space-y-3">
    <Lock className="h-10 w-10 opacity-30"/><p className="text-lg font-bold">{feature}</p><p className="text-sm">{desc}</p><Badge className="bg-stone-800">Lv.{level} 解锁</Badge>
  </div>);
}

// ═══════════════════════ MAIN VILLAGE PAGE ═══════════════════════
export default function VillageLifePage(){
  const [profile,setProfile]=useState<any>({level:1});
  const [tab,setTab]=useState("farm");
  const supabase=createClient();

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const{data}=await supabase.from("profiles").select("level").eq("id",user.id).single();
    if(data)setProfile(data);
  })()},[supabase]);

  const tabs=[
    {k:"farm",l:"🏡 农场",req:2},
    {k:"ranch",l:"🐄 牧场",req:4},
    {k:"cabin",l:"🏠 小屋",req:6},
    {k:"plaza",l:"🎪 广场",req:8},
  ];

  return(<div className="space-y-6 max-w-4xl mx-auto">
    <div><h1 className="text-3xl font-serif text-amber-300 font-bold">🏘️ 我的村庄</h1><p className="text-stone-400">每完成一个任务，村庄就多一分生机</p></div>
    <div className="flex items-center gap-3 text-sm text-stone-400 bg-stone-900/60 rounded-xl px-4 py-2">
      <span>当前等级：<span className="text-amber-300 font-bold">Lv.{profile.level}</span></span>
      <span className="text-stone-600">|</span>
      <span>已解锁：{tabs.filter(t=>profile.level>=t.req).length}/4 个区域</span>
    </div>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="bg-stone-800/50 border border-stone-700/30 w-full justify-start">
        {tabs.map(t=>(<TabsTrigger key={t.k} value={t.k} disabled={profile.level<t.req}
          className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-stone-400 disabled:opacity-30 text-sm">{t.l}{profile.level<t.req&&<Lock className="h-3 w-3 ml-1"/>}</TabsTrigger>))}
      </TabsList>
      <TabsContent value="farm" className="mt-4"><FarmTab level={profile.level} onTaskComplete={()=>{}} /></TabsContent>
      <TabsContent value="ranch" className="mt-4"><RanchTab level={profile.level} /></TabsContent>
      <TabsContent value="cabin" className="mt-4"><CabinTab level={profile.level} /></TabsContent>
      <TabsContent value="plaza" className="mt-4"><PlazaTab level={profile.level} /></TabsContent>
    </Tabs>
  </div>);
}
