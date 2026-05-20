import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimationProvider } from "@/lib/animation-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroQuest — ADHD 游戏化任务管理",
  description: "把任务变成怪物，把你的生活变成一场冒险。专为 ADHD 大脑设计的 RPG 任务管理系统。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-stone-950 text-stone-100 antialiased">
        <AnimationProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
