"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";
import { Star } from "lucide-react";

export interface AreaProgress {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  taskCount: number;
  level: number;
  maxLevel: number;
  buildings: string[];
  pendingCount?: number;  // uncompleted tasks in this area
}

interface Props {
  areas: AreaProgress[];
  totalTasks: number;
  onSelectArea: (areaId: string) => void;
  selectedArea: string | null;
}

const landmarkEmojis: Record<string, string[]> = {
  residential: ["🏠","🏡","🏘️","🏰","🌆"],
  farm: ["🌱","🌿","🌻","🌾","🍎"],
  mine: ["🪨","⛏️","💎","🏔️","👑"],
  forest: ["🌿","🌳","🌲","🍄","🦉"],
  ocean: ["🐚","🐠","🐬","🐋","🏝️"],
};

function getBuildingEmoji(areaId: string, level: number): string {
  const arr = landmarkEmojis[areaId] || ["⭐"];
  return arr[Math.min(level - 1, arr.length - 1)];
}

function isNighttime(): boolean {
  const h = new Date().getHours();
  return h < 6 || h >= 19;
}

// Ripple particle
interface Ripple { id: number; x: number; y: number; }

export function PlanetView({ areas, totalTasks, onSelectArea, selectedArea }: Props) {
  const { enabled } = useAnimation();
  const [pulseArea, setPulseArea] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [rippleId, setRippleId] = useState(0);
  const night = isNighttime();

  // Inject twinkle keyframes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "nq-twinkle";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes twinkle{0%,100%{opacity:.3}50%{opacity:.9}}@keyframes planet-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes sway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}`;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  const handlePlanetClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = rippleId;
    setRipples(prev => [...prev.slice(-4), { id, x, y }]);
    setRippleId(id + 1);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1000);
  }, [enabled, rippleId]);

  const totalPending = areas.reduce((s, a) => s + (a.pendingCount || 0), 0);

  return (
    <motion.div
      className="relative w-full max-w-[500px] mx-auto aspect-square"
      animate={enabled ? { y: [0, -2, 0] } : {}}
      transition={enabled ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      {/* Starfield */}
      <div className="absolute inset-0 rounded-full overflow-hidden"
        style={{ background: night
          ? "radial-gradient(circle at 30% 30%, #0d0d2b, #050515)"
          : "radial-gradient(circle at 30% 30%, #1a1a4e, #0a0a22)" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: `${1+Math.random()*2}px`, height: `${1+Math.random()*2}px`,
              left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
              opacity: night ? 0.4 + Math.random()*0.6 : 0.3 + Math.random()*0.4,
              animation: `twinkle ${2+Math.random()*3}s ease-in-out infinite`,
              animationDelay: `${Math.random()*3}s` }} />
        ))}
      </div>

      {/* Planet body */}
      <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-stone-700/50 shadow-[0_0_60px_rgba(100,140,200,0.15)]"
        onClick={handlePlanetClick}>

        {areas.map((area, i) => {
          const startAngle = areas.slice(0, i).reduce((sum, a) => sum + a.taskCount, 0) / Math.max(totalTasks, 1) * 360;
          const sweepAngle = Math.max(area.taskCount / Math.max(totalTasks, 1) * 360, 18);
          const midAngle = startAngle + sweepAngle / 2;
          const rad = midAngle * Math.PI / 180;
          const buildingDist = 28;
          const starDist = 18;

          return (
            <motion.div
              key={area.id}
              className={`absolute inset-0 cursor-pointer transition-colors ${selectedArea === area.id ? "z-10" : "z-0"}`}
              style={{ background: `conic-gradient(from ${startAngle}deg, ${area.color} 0deg, ${area.color} ${sweepAngle}deg, transparent ${sweepAngle}deg)`,
                opacity: night ? (selectedArea && selectedArea !== area.id ? 0.3 : 0.7) : selectedArea && selectedArea !== area.id ? 0.4 : 0.85 }}
              onClick={(e) => { e.stopPropagation(); onSelectArea(area.id); setPulseArea(area.id); setTimeout(() => setPulseArea(null), 600); }}
              whileHover={enabled ? { opacity: 1, scale: 1.02 } : {}}
              animate={enabled && pulseArea === area.id ? { scale: [1, 1.05, 1] } : {}}
            >
              {/* Building with sway */}
              <motion.div className="absolute text-2xl pointer-events-none"
                style={{ left: `${50 + Math.cos(rad) * buildingDist}%`, top: `${50 + Math.sin(rad) * buildingDist}%`, transform: "translate(-50%,-50%)" }}
                animate={enabled ? { rotate: [-1, 1, -1] } : {}}
                transition={enabled ? { duration: 2 + i, repeat: Infinity, ease: "easeInOut" } : {}}>
                {getBuildingEmoji(area.id, area.level)}
              </motion.div>

              {/* Stars */}
              <div className="absolute pointer-events-none"
                style={{ left: `${50 + Math.cos(rad) * starDist}%`, top: `${50 + Math.sin(rad) * starDist}%`, transform: "translate(-50%,-50%)" }}>
                {Array.from({ length: area.level }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-[8px]">★</span>
                ))}
              </div>

              {/* Exclamation mark for pending tasks */}
              {area.pendingCount && area.pendingCount > 0 && (
                <motion.div className="absolute text-lg pointer-events-none"
                  style={{ left: `${50 + Math.cos(rad) * (buildingDist + 8)}%`, top: `${50 + Math.sin(rad) * (buildingDist + 8)}%`, transform: "translate(-50%,-50%)" }}
                  animate={enabled ? { y: [-2, 2, -2], scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}>
                  <span className="relative">
                    ❗
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                      {area.pendingCount}
                    </span>
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Center hub */}
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-stone-900/90 border-2 border-amber-500/40 flex items-center justify-center text-3xl z-20 shadow-lg"
          animate={enabled ? { rotate: 360 } : {}}
          transition={enabled ? { duration: 120, repeat: Infinity, ease: "linear" } : {}}>
          🌍
        </motion.div>

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map(r => (
            <motion.div key={r.id} className="absolute w-2 h-2 rounded-full border-2 border-amber-300/60 pointer-events-none z-30"
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
              initial={{ width: 4, height: 4, opacity: 0.8, x: "-50%", y: "-50%" }}
              animate={{ width: 80, height: 80, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        {/* Total pending badge */}
        {totalPending > 0 && (
          <motion.div className="absolute top-3 right-3 z-30 bg-red-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg pointer-events-none"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            {totalPending}
          </motion.div>
        )}
      </div>

      {/* Orbit rings */}
      <div className="absolute inset-[-4px] rounded-full border border-stone-600/20 pointer-events-none" />
      <div className="absolute inset-[-8px] rounded-full border border-stone-600/10 pointer-events-none" />

      {/* Day/Night indicator */}
      <div className="absolute -top-2 -right-2 text-sm z-30 pointer-events-none">
        {night ? "🌙" : "☀️"}
      </div>
    </motion.div>
  );
}
