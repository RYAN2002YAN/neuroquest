"use client";

import { motion } from "framer-motion";
import { useAnimation } from "@/lib/animation-context";

export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const { enabled } = useAnimation();
  if (!enabled) return <span className={className}>{value}</span>;

  return (
    <motion.span
      key={value}
      initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/** Press animation wrapper — shrinks on click */
export function Pressable({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { enabled } = useAnimation();
  return (
    <motion.div
      whileTap={enabled ? { scale: 0.94 } : {}}
      transition={{ type: "spring", stiffness: 600, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
