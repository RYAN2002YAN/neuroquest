"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sword, Scroll, Sun, AlertTriangle, Star, Home, Trees, Mountain, Waves, Pickaxe, Sparkles } from "lucide-react";

export interface AreaProgress {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  taskCount: number;
  level: number;
  maxLevel: number;
  buildings: string[];
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

export function PlanetView({ areas, totalTasks, onSelectArea, selectedArea }: Props) {
  const [pulseArea, setPulseArea] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "twinkle-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = twinkleCSS;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto aspect-square">
      {/* Starfield background */}
      <div className="absolute inset-0 rounded-full overflow-hidden"
        style={{ background: "radial-gradient(circle at 30% 30%, #1a1a3e, #0a0a1a)" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
        ))}
      </div>

      {/* Planet sectors */}
      <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-stone-700/50 shadow-[0_0_60px_rgba(100,140,200,0.15)]">
        {areas.map((area, i) => {
          const startAngle = areas.slice(0, i).reduce((sum, a) => sum + a.taskCount, 0) / Math.max(totalTasks, 1) * 360;
          const sweepAngle = area.taskCount / Math.max(totalTasks, 1) * 360 || 20;
          // Ensure minimum visible slice
          const actualSweep = Math.max(sweepAngle, 15);
          return (
            <motion.div
              key={area.id}
              className={`absolute inset-0 cursor-pointer transition-all ${selectedArea === area.id ? "z-10 brightness-125" : "z-0"}`}
              style={{
                background: `conic-gradient(from ${startAngle}deg, ${area.color} 0deg, ${area.color} ${actualSweep}deg, transparent ${actualSweep}deg)`,
                opacity: selectedArea && selectedArea !== area.id ? 0.4 : 0.85,
              }}
              onClick={() => {
                onSelectArea(area.id);
                setPulseArea(area.id);
                setTimeout(() => setPulseArea(null), 600);
              }}
              whileHover={{ opacity: 1, scale: 1.02 }}
              animate={pulseArea === area.id ? { scale: [1, 1.05, 1] } : {}}
            >
              {/* Landmark building */}
              <div className="absolute text-2xl pointer-events-none"
                style={{
                  left: `${50 + Math.cos((startAngle + actualSweep/2) * Math.PI / 180) * 28}%`,
                  top: `${50 + Math.sin((startAngle + actualSweep/2) * Math.PI / 180) * 28}%`,
                  transform: "translate(-50%, -50%)",
                }}>
                {getBuildingEmoji(area.id, area.level)}
              </div>
              {/* Level stars */}
              <div className="absolute pointer-events-none"
                style={{
                  left: `${50 + Math.cos((startAngle + actualSweep/2) * Math.PI / 180) * 18}%`,
                  top: `${50 + Math.sin((startAngle + actualSweep/2) * Math.PI / 180) * 18}%`,
                  transform: "translate(-50%, -50%)",
                }}>
                {Array.from({ length: area.level }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-[8px]">★</span>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-stone-900/90 border-2 border-amber-500/40 flex items-center justify-center text-3xl z-20 shadow-lg">
          🌍
        </div>
      </div>

      {/* Orbit ring */}
      <div className="absolute inset-[-4px] rounded-full border border-stone-600/20 pointer-events-none" />
      <div className="absolute inset-[-8px] rounded-full border border-stone-600/10 pointer-events-none" />
    </div>
  );
}

// Keyframe for stars (injected via useEffect in the component)
const twinkleCSS = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.9; }
  }
`;
