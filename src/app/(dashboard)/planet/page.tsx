"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { XpBar } from "@/components/tasks/xp-bar";
import { QuickAdd } from "@/components/tasks/quick-add";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Lock, Home, Sprout, PawPrint, Tent, Gem, Star, Coins, Gift, ShoppingCart, Heart, Move, ArrowUp, ChevronRight, MapPin } from "lucide-react";

// ═══════════════════ AREA DEFINITIONS ═══════════════════
const AREAS = [
  { id:"cabin",  name:"我的小屋", emoji:"🏠", color:"#f0c060", req:6, pos:{x:15,y:18}, icon:Home },
  { id:"farm",   name:"农场",     emoji:"🌾", color:"#7ec850", req:2, pos:{x:78,y:18}, icon:Sprout },
  { id:"museum", name:"博物馆",   emoji:"🏛️", color:"#c9a050", req:1, pos:{x:48,y:48}, icon:Gem },
  { id:"ranch",  name:"牧场",     emoji:"🐄", color:"#e8a0c0", req:4, pos:{x:15,y:75}, icon:PawPrint },
  { id:"plaza",  name:"广场",     emoji:"🎪", color:"#b088d0", req:8, pos:{x:78,y:75}, icon:Tent },
];

// ═══════════════════ 2D MAP COMPONENT ═══════════════════
function WorldMap({ level, onEnterArea, selectedArea, playerTarget, setPlayerTarget, characterPos }: {
  level:number; onEnterArea:(id:string)=>void; selectedArea:string|null;
  playerTarget:{x:number,y:number}|null; setPlayerTarget:(t:{x:number,y:number}|null)=>void;
  characterPos:{x:number,y:number};
}) {
  const { enabled } = useAnimation();

  const handleMapClick = (e:React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlayerTarget({x:Math.max(5,Math.min(95,x)), y:Math.max(5,Math.min(95,y))});
  };

  const nearArea = AREAS.find(a => {
    const dx = characterPos.x - a.pos.x;
    const dy = characterPos.y - a.pos.y;
    return Math.sqrt(dx*dx + dy*dy) < 12;
  });

  return (
    <div className="relative w-full aspect-[4/3] max-h-[420px] rounded-2xl overflow-hidden border-2 border-stone-700/50 cursor-crosshair select-none"
      onClick={handleMapClick}
      style={{ background: "linear-gradient(180deg, #4a7c3f 0%, #5a8c4f 30%, #6b9c5f 60%, #7aac6f 100%)" }}>
      {/* Paths between areas */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        {[[AREAS[0],AREAS[2]],[AREAS[1],AREAS[2]],[AREAS[3],AREAS[2]],[AREAS[4],AREAS[2]],
          [AREAS[0],AREAS[3]],[AREAS[1],AREAS[4]]].map(([a,b],i)=>(
          <line key={i} x1={`${a.pos.x}%`} y1={`${a.pos.y}%`} x2={`${b.pos.x}%`} y2={`${b.pos.y}%`}
            stroke="#d4b896" strokeWidth="4" strokeLinecap="round" strokeDasharray="8,8"/>
        ))}</svg>

      {/* Area buildings */}
      {AREAS.map(area => {
        const unlocked = level >= area.req;
        return (
          <motion.button key={area.id}
            className="absolute flex flex-col items-center gap-1 cursor-pointer"
            style={{ left:`${area.pos.x}%`, top:`${area.pos.y}%`, transform:"translate(-50%,-50%)" }}
            whileHover={enabled ? {scale:1.12} : {}}
            whileTap={enabled ? {scale:0.9} : {}}
            onClick={(e)=>{e.stopPropagation();if(unlocked)onEnterArea(area.id);}}>
            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all ${
              unlocked
                ? selectedArea===area.id
                  ? "ring-3 ring-amber-400 scale-110"
                  : "bg-stone-800/80 hover:bg-stone-700/80"
                : "bg-stone-800/40 opacity-50"
            }`} style={{border:`2px solid ${area.color}60`}}>
              {unlocked ? area.emoji : <Lock className="h-5 w-5 text-stone-500"/>}
              {unlocked && selectedArea===area.id && (
                <motion.div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                  initial={{scale:0}} animate={{scale:1}}><ChevronRight className="h-3 w-3 text-white"/></motion.div>
              )}
            </div>
            <span className={`text-xs font-bold ${unlocked?"text-stone-200":"text-stone-600"}`}>{area.name}</span>
            {!unlocked && <Badge className="text-[10px] bg-stone-800 text-stone-500 px-1.5 py-0">Lv.{area.req}</Badge>}
          </motion.button>
        );
      })}

      {/* Player character */}
      <motion.div className="absolute z-20 pointer-events-none" style={{left:`${characterPos.x}%`,top:`${characterPos.y}%`,transform:"translate(-50%,-50%)"}}
        animate={enabled ? {y:[0,-2,0]} : {}} transition={{duration:2,repeat:Infinity}}>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-blue-500/80 border-2 border-white/40 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">🧙‍♂️</div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-black/30 blur-sm"/>
        </div>
      </motion.div>

      {/* Player target indicator */}
      {playerTarget && (
        <motion.div className="absolute z-10 pointer-events-none" style={{left:`${playerTarget.x}%`,top:`${playerTarget.y}%`,transform:"translate(-50%,-50%)"}}
          initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{opacity:0}}>
          <div className="w-4 h-4 rounded-full border-2 border-amber-400/60 animate-ping"/>
        </motion.div>
      )}

      {/* Near building hint */}
      {nearArea && level >= nearArea.req && !selectedArea && (
        <motion.div className="absolute z-30 pointer-events-none" style={{left:`${characterPos.x}%`,top:`${characterPos.y-12}%`,transform:"translate(-50%,-50%)"}}
          initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <Badge className="bg-amber-900/80 text-amber-200 text-xs">{nearArea.emoji} {nearArea.name}</Badge>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════ AREA PANELS ═══════════════════

function FarmPanel({ level }: { level: number }) {
  const [plots, setPlots] = useState<any[]>([]);
  const [seeds, setSeeds] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [plantingPlot, setPlantingPlot] = useState<number|null>(null);
  const [refreshing, setRefreshing] = useState(0);
  const maxPlots = 4 + Math.floor((level-2)/2)*4;
  const supabase = createClient();

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:p},{data:s}]=await Promise.all([
      supabase.from("farm_plots").select("*").eq("user_id",user.id).order("plot_index"),
      supabase.from("seed_defs").select("*")
    ]);
    setPlots(Array.from({length:maxPlots},(_,i)=>p?.find(pp=>pp.plot_index===i)||{plot_index:i,seed_id:null,growth:0}));
    if(s)setSeeds(s);
  })()},[supabase,maxPlots,refreshing]);

  const plant = async(i:number,sid:string)=>{
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    await supabase.from("farm_plots").upsert({user_id:user.id,plot_index:i,seed_id:sid,growth:0},{onConflict:"user_id,plot_index"});
    setPlantingPlot(null);setRefreshing(r=>r+1);toast.success("🌱 已种下！");
  };

  const harvest=async(p:any)=>{
    const s=seeds.find(ss=>ss.id===p.seed_id);if(!s)return;
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:prof}]=await Promise.all([
      supabase.from("profiles").select("gold,xp").eq("id",user.id).single(),
      supabase.from("farm_plots").upsert({user_id:user.id,plot_index:p.plot_index,seed_id:null,growth:0},{onConflict:"user_id,plot_index"}),
    ]);
    if(prof)await supabase.from("profiles").update({gold:prof.gold+s.harvest_gold,xp:prof.xp+s.harvest_xp}).eq("id",user.id);
    toast.success(`${s.emoji} 收获！+${s.harvest_xp}XP`);setRefreshing(r=>r+1);
  };

  const stages=["🟤","🌰","🌿","🪴","🌳","🌟"];
  return(<div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-emerald-300 font-bold">🌾 农场</h3><Button size="sm" variant="outline" className="border-stone-600 h-7 text-xs" onClick={()=>{setShowStore(!showStore);setPlantingPlot(null);}}><ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭":"种子商店"}</Button></div>
    {showStore&&!plantingPlot&&<div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto">{seeds.map(s=>(<button key={s.id} onClick={()=>{setShowStore(true);}}className="bg-stone-800/60 rounded p-1.5 text-xs text-left flex items-center gap-1.5"><span className="text-lg">{s.emoji}</span><div><p className="text-stone-200">{s.name}</p><p className="text-stone-500">{s.price}💰</p></div></button>))}</div>}
    {plantingPlot!==null&&<div className="bg-stone-800/60 rounded-lg p-2"><div className="flex justify-between mb-1"><span className="text-xs text-stone-400">种在第{plantingPlot+1}块地</span><Button size="sm" variant="ghost" className="h-5 text-xs" onClick={()=>setPlantingPlot(null)}>取消</Button></div><div className="grid grid-cols-3 gap-1.5">{seeds.map(s=>(<button key={s.id} onClick={()=>plant(plantingPlot,s.id)} className="bg-stone-700/50 rounded p-1.5 text-xs flex items-center gap-1.5"><span className="text-lg">{s.emoji}</span><span className="text-stone-200">{s.name}</span></button>))}</div></div>}
    <div className="grid grid-cols-4 gap-2">{plots.map((p,i)=>(<div key={i} className={`rounded-xl border-2 p-2 text-center min-h-[90px] flex flex-col items-center justify-center gap-1 cursor-pointer ${p.seed_id?"border-emerald-700/40 bg-emerald-950/20":"border-stone-700/30 border-dashed bg-stone-900/40"}`} onClick={()=>{if(!p.seed_id)setPlantingPlot(i);}}>
      {p.seed_id?(()=>{const s=seeds.find(ss=>ss.id===p.seed_id);if(!s)return null;const st=Math.floor(p.growth/s.tasks_per_stage);const done=st>=s.stages;return(<><span className="text-2xl">{done?s.emoji:stages[Math.min(st,5)]}</span><Progress value={done?100:Math.round((p.growth%s.tasks_per_stage)/s.tasks_per_stage*100)} className="h-1 bg-stone-700 [&>div]:bg-emerald-500"/><span className="text-[10px] text-stone-500">{Math.min(st+1,s.stages)}/{s.stages}</span>{done&&<Button size="sm" className="h-5 text-[10px] bg-amber-600 px-2" onClick={e=>{e.stopPropagation();harvest(p);}}>收获</Button>}</>);})():(<><span className="text-lg text-stone-600">{i+1}</span></>)}
    </div>))}</div>
  </div>);
}

function RanchPanel({ level }: { level: number }) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [defs, setDefs] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [refreshing, setRefreshing] = useState(0);
  const maxPens = 2 + Math.floor((level-4)/2)*2;
  const supabase = createClient();

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:a},{data:d}]=await Promise.all([
      supabase.from("ranch_animals").select("*").eq("user_id",user.id).order("pen_index"),
      supabase.from("animal_defs").select("*")
    ]);
    setAnimals(Array.from({length:Math.max(maxPens,2)},(_,i)=>a?.find(aa=>aa.pen_index===i)||{pen_index:i,animal_id:null,growth:0}));
    if(d)setDefs(d);
  })()},[supabase,maxPens,refreshing]);

  const adopt=async(i:number,aid:string)=>{
    const d=defs.find(dd=>dd.id===aid);if(!d)return;
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:prof}]=await Promise.all([supabase.from("profiles").select("gold").eq("id",user.id).single()]);
    if(!prof||prof.gold<d.price){toast.error("金币不足");return;}
    await Promise.all([
      supabase.from("profiles").update({gold:prof.gold-d.price}).eq("id",user.id),
      supabase.from("ranch_animals").upsert({user_id:user.id,pen_index:i,animal_id:aid,growth:0},{onConflict:"user_id,pen_index"}),
    ]);
    toast.success(`欢迎 ${d.name}！`);setShowStore(false);setRefreshing(r=>r+1);
  };

  const collect=async(a:any)=>{
    const d=defs.find(dd=>dd.id===a.animal_id);if(!d)return;
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    if(a.last_harvest_date===today){toast("今天已收获");return;}
    const[{data:prof}]=await Promise.all([
      supabase.from("profiles").select("gold,xp").eq("id",user.id).single(),
      supabase.from("ranch_animals").update({last_harvest_date:today}).eq("id",a.id),
    ]);
    if(prof)await supabase.from("profiles").update({gold:prof.gold+d.byproduct_gold,xp:prof.xp+d.byproduct_xp}).eq("id",user.id);
    toast.success(`${d.byproduct_emoji} +${d.byproduct_xp}XP`);setRefreshing(r=>r+1);
  };

  const interact=(a:any)=>{const d=defs.find(dd=>dd.id===a.animal_id);toast(d?.emoji+" "+["眨了眨眼👀","跳起来！","转圈～","蹭了蹭💕"][Math.floor(Math.random()*4)]);};

  return(<div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-pink-300 font-bold">🐄 牧场</h3><Button size="sm" variant="outline" className="border-stone-600 h-7 text-xs" onClick={()=>setShowStore(!showStore)}><ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭":"动物商店"}</Button></div>
    {showStore&&<div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">{defs.map(d=>(<button key={d.id} onClick={()=>{const empty=animals.findIndex(a=>!a.animal_id);if(empty>=0)adopt(empty,d.id);else toast("没有空窝了");}} className="bg-stone-800/60 rounded p-1.5 text-xs text-left flex items-center gap-1.5"><span className="text-lg">{d.emoji}</span><div><p className="text-stone-200">{d.name}</p><p className="text-stone-500">{d.price}💰</p></div></button>))}</div>}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{animals.map((a,i)=>(<div key={i} className={`rounded-xl border-2 p-3 text-center min-h-[100px] flex flex-col items-center justify-center gap-1 ${a.animal_id?"border-pink-700/30 bg-pink-950/20":"border-stone-700/30 border-dashed bg-stone-900/40"}`} onClick={()=>{if(!a.animal_id)setShowStore(true);else interact(a);}}>
      {a.animal_id?(()=>{const d=defs.find(dd=>dd.id===a.animal_id);if(!d)return null;const st=Math.floor(a.growth/d.tasks_per_stage);const adult=st>=d.stages;return(<>
        <span className="text-3xl">{adult?d.emoji:d.baby_emoji}</span><span className="text-xs text-stone-300">{a.name||d.name}</span>
        {!adult&&<Progress value={Math.round(st/d.stages*100)} className="h-1 bg-stone-700 [&>div]:bg-pink-500"/>}
        {adult&&<Button size="sm" className="h-5 text-[10px] bg-pink-600 px-2" onClick={e=>{e.stopPropagation();collect(a);}}>收获</Button>}
      </>);})():(<span className="text-lg text-stone-600">🏠</span>)}
    </div>))}</div>
  </div>);
}

function CabinPanel({ level }: { level: number }) {
  const [layout, setLayout] = useState<any[]>([]);
  const [furniture, setFurniture] = useState<any[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [likes, setLikes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(0);
  const supabase = createClient();

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:l},{data:f},{data:lk}]=await Promise.all([
      supabase.from("cabin_layout").select("*").eq("user_id",user.id),
      supabase.from("furniture_defs").select("*"),
      supabase.from("cabin_likes").select("*").eq("cabin_owner_id",user.id).limit(10)
    ]);
    if(l)setLayout(l);if(f)setFurniture(f);if(lk)setLikes(lk);
  })()},[supabase,refreshing]);

  const buyFurniture=async(fid:string)=>{
    const f=furniture.find(ff=>ff.id===fid);if(!f)return;
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:prof}]=await Promise.all([supabase.from("profiles").select("gold").eq("id",user.id).single()]);
    if(!prof||prof.gold<f.price){toast.error("金币不足");return;}
    await Promise.all([
      supabase.from("profiles").update({gold:prof.gold-f.price}).eq("id",user.id),
      supabase.from("cabin_layout").insert({user_id:user.id,furniture_id:fid,room:"main",pos_x:20+Math.random()*200,pos_y:20+Math.random()*200}),
    ]);
    setShowStore(false);setRefreshing(r=>r+1);toast.success("已购买！");
  };

  return(<div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-amber-300 font-bold">🏠 我的小屋</h3><div className="flex gap-2"><Badge className="bg-stone-800 text-stone-400">{likes.length} ❤️</Badge><Button size="sm" variant="outline" className="border-stone-600 h-7 text-xs" onClick={()=>setShowStore(!showStore)}><ShoppingCart className="h-3 w-3 mr-1"/>{showStore?"关闭":"家具商店"}</Button></div></div>
    {showStore&&<div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">{furniture.map(f=>(<button key={f.id} onClick={()=>buyFurniture(f.id)} className="bg-stone-800/60 rounded p-1.5 text-xs text-left flex items-center gap-1.5"><span className="text-lg">{f.emoji}</span><div><p className="text-stone-200">{f.name}</p><p className="text-stone-500">{f.price}💰</p></div></button>))}</div>}
    <div className="relative bg-stone-800/40 border-2 border-stone-700/30 rounded-xl h-60 overflow-hidden" style={{background:"linear-gradient(180deg,#6b5a4a,#4a3a2a 30%,#8b7355)"}}>
      <div className="absolute bottom-0 w-full h-[50%]" style={{background:"linear-gradient(0deg,#5c4030,transparent)"}}/>
      {layout.map(l=>{const f=furniture.find(ff=>ff.id===l.furniture_id);if(!f)return null;return(<motion.div key={l.id} className="absolute cursor-grab active:cursor-grabbing" style={{left:l.pos_x,top:l.pos_y}} drag dragMomentum={false} onDragEnd={(_,info)=>{supabase.from("cabin_layout").update({pos_x:l.pos_x+info.offset.x,pos_y:l.pos_y+info.offset.y}).eq("id",l.id);setLayout(prev=>prev.map(ll=>ll.id===l.id?{...ll,pos_x:ll.pos_x+info.offset.x,pos_y:ll.pos_y+info.offset.y}:ll));}} whileHover={{scale:1.05}}><div className="flex flex-col items-center"><span className="text-2xl">{f.emoji}</span><span className="text-[9px] text-stone-300 bg-stone-900/70 px-1 rounded">{f.name}</span></div></motion.div>);})}
      {layout.length===0&&<div className="absolute inset-0 flex items-center justify-center text-stone-600 text-sm"><Move className="h-4 w-4 mr-1"/>买家具装饰吧</div>}
    </div>
  </div>);
}

function MuseumPanel() {
  const [collected, setCollected] = useState<any[]>([]);
  const [defs, setDefs] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const supabase = createClient();
  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const[{data:c},{data:d},{data:s}]=await Promise.all([
      supabase.from("user_collectibles").select("collectible_id").eq("user_id",user.id),
      supabase.from("collectible_defs").select("*"),
      supabase.from("collectible_sets").select("*"),
    ]);
    if(c)setCollected(c);if(d)setDefs(d);if(s)setSets(s);
  })()},[supabase]);
  const owned=new Set(collected.map(c=>c.collectible_id));
  const cats=[{k:"fossil",l:"🦴 化石"},{k:"insect",l:"🐞 昆虫"},{k:"fish",l:"🐟 鱼类"},{k:"mineral",l:"💎 矿物"}];
  return(<div className="space-y-3">
    <h3 className="text-amber-300 font-bold">🏛️ 博物馆 · 已收集 {collected.length}/{defs.length}</h3>
    {sets.map(s=>{const items=defs.filter(d=>d.set_id===s.id);const cnt=items.filter(i=>owned.has(i.id)).length;const done=cnt===items.length;return(<div key={s.id} className={`rounded-lg px-3 py-2 text-sm flex items-center justify-between ${done?"bg-amber-900/30 border border-amber-600/30":"bg-stone-800/40"}`}><span className="flex items-center gap-2">{done?"🏆":"🔒"}<span className="text-stone-200">{s.name}</span></span><span className="text-stone-500 text-xs">{cnt}/{items.length} · {done?s.bonus_title:"未集齐"}</span></div>);})}
    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">{defs.map(d=>{const has=owned.has(d.id);return(<div key={d.id} className={`rounded-lg p-1.5 text-center text-xs ${has?"bg-stone-800/60":"bg-stone-800/20 opacity-30"}`}><span className="text-xl block">{has?d.emoji:"❓"}</span><span className="text-stone-400">{d.name}</span></div>);})}</div>
  </div>);
}

function PlazaPanel({ level }: { level: number }) {
  const m=new Date().getMonth()+1;
  const season=m>=3&&m<=5?"🌸春":m>=6&&m<=8?"☀️夏":m>=9&&m<=11?"🍂秋":"❄️冬";
  return(<div className="space-y-3">
    <h3 className="text-purple-300 font-bold">🎪 广场 · {season}季</h3>
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-stone-900/60 border-purple-800/30"><CardContent className="py-4 text-center"><span className="text-3xl">🎪</span><p className="text-stone-200 font-bold text-sm mt-1">季节活动</p><p className="text-stone-500 text-xs">{season}季进行中</p></CardContent></Card>
      <Card className="bg-stone-900/60 border-purple-800/30"><CardContent className="py-4 text-center"><span className="text-3xl">🤝</span><p className="text-stone-200 font-bold text-sm mt-1">协作任务</p><p className="text-stone-500 text-xs">和好友一起完成</p></CardContent></Card>
    </div>
  </div>);
}

// ═══════════════════ MAIN PLANET PAGE ═══════════════════
export default function PlanetPage() {
  const [profile, setProfile] = useState({ xp:0,level:1,gold:0,streak_days:0,hp:100,max_hp:100,energy:100,max_energy:100 });
  const [selectedArea, setSelectedArea] = useState<string|null>(null);
  const [playerTarget, setPlayerTarget] = useState<{x:number,y:number}|null>(null);
  const [characterPos, setCharacterPos] = useState({x:48,y:48});
  const [animFrame, setAnimFrame] = useState(0);
  const supabase = createClient();

  useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const{data}=await supabase.from("profiles").select("xp,level,gold,streak_days,hp,max_hp,energy,max_energy").eq("id",user.id).single();
    if(data)setProfile({xp:data.xp,level:data.level,gold:data.gold,streak_days:data.streak_days,hp:data.hp,max_hp:data.max_hp,energy:data.energy,max_energy:data.max_energy});
  })()},[supabase]);

  // Character movement animation
  useEffect(()=>{
    if(!playerTarget)return;
    const dx=playerTarget.x-characterPos.x;
    const dy=playerTarget.y-characterPos.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<0.5){setPlayerTarget(null);return;}
    const speed=0.8;
    const frame=setInterval(()=>{
      setCharacterPos(prev=>{
        const ndx=playerTarget.x-prev.x;const ndy=playerTarget.y-prev.y;
        const nd=Math.sqrt(ndx*ndx+ndy*ndy);
        if(nd<0.8){setPlayerTarget(null);return prev;}
        return {x:prev.x+(ndx/nd)*Math.min(speed,nd),y:prev.y+(ndy/nd)*Math.min(speed,nd)};
      });
    },16);
    return ()=>clearInterval(frame);
  },[playerTarget,characterPos]);

  const handleEnterArea = (id:string) => {
    setSelectedArea(prev=>prev===id?null:id);
    const area=AREAS.find(a=>a.id===id);
    if(area)setPlayerTarget({x:area.pos.x,y:area.pos.y+8});
  };

  const area = AREAS.find(a=>a.id===selectedArea);
  const unlocked = area ? profile.level >= area.req : false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold">✨ 我的星球</h1>
        <p className="text-stone-400">点击地面移动角色 · 点击建筑进入区域</p>
      </div>

      <XpBar xp={profile.xp} level={profile.level} gold={profile.gold} streak={profile.streak_days}
        hp={profile.hp} maxHp={profile.max_hp} energy={profile.energy} maxEnergy={profile.max_energy} />

      {/* World Map */}
      <WorldMap level={profile.level} onEnterArea={handleEnterArea}
        selectedArea={selectedArea} playerTarget={playerTarget}
        setPlayerTarget={setPlayerTarget} characterPos={characterPos} />

      {/* Area Content Panel */}
      <AnimatePresence mode="wait">
        {selectedArea && area && (
          <motion.div key={selectedArea} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
            <Card className={`border-2 ${unlocked?"border-stone-700/40":"border-stone-700/20"} bg-stone-900/80`}>
              <CardContent className="py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold flex items-center gap-2"><span>{area.emoji}</span><span className="text-stone-100">{area.name}</span>{!unlocked&&<Lock className="h-5 w-5 text-stone-600"/>}</h2>
                  {!unlocked&&<Badge className="bg-stone-800 text-stone-500">Lv.{area.req} 解锁</Badge>}
                  <Button variant="ghost" size="sm" className="text-stone-500" onClick={()=>setSelectedArea(null)}>✕ 关闭</Button>
                </div>
                {!unlocked ? (
                  <div className="text-center py-8 text-stone-600"><Lock className="h-8 w-8 mx-auto mb-2 opacity-30"/><p>达到等级 {area.req} 解锁{area.name}</p></div>
                ) : (
                  <>
                    {selectedArea==="farm"&&<FarmPanel level={profile.level}/>}
                    {selectedArea==="ranch"&&<RanchPanel level={profile.level}/>}
                    {selectedArea==="cabin"&&<CabinPanel level={profile.level}/>}
                    {selectedArea==="museum"&&<MuseumPanel/>}
                    {selectedArea==="plaza"&&<PlazaPanel level={profile.level}/>}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state hint */}
      {!selectedArea && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center text-stone-600 py-4">
          <MapPin className="h-5 w-5 mx-auto mb-1 opacity-30"/>点击地图上的建筑进入区域
        </motion.div>
      )}

      <QuickAdd onTaskCreated={()=>{}} />
    </div>
  );
}
