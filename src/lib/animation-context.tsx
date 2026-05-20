"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AnimCtx { enabled: boolean; toggle: () => void; }

const Ctx = createContext<AnimCtx>({ enabled: true, toggle: () => {} });

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const v = localStorage.getItem("nq-anim");
    if (v === "false") setEnabled(false);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("nq-anim", String(next));
  };

  return <Ctx.Provider value={{ enabled, toggle }}>{children}</Ctx.Provider>;
}

export function useAnimation() { return useContext(Ctx); }
