"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAnimation } from "@/lib/animation-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sword, Scroll, Users, User, LogOut, Home, ShoppingBag, Star, Sparkles } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { enabled, toggle } = useAnimation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const links = [
    { href: "/village", label: "村庄", icon: Home },
    { href: "/planet", label: "星球", icon: Star },
    { href: "/quests", label: "任务", icon: Scroll },
    { href: "/shop", label: "商店", icon: ShoppingBag },
    { href: "/social", label: "社交", icon: Users },
    { href: "/profile", label: "角色", icon: User },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-amber-800/20 bg-stone-950/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/village" className="flex items-center gap-2 shrink-0">
          <Sword className="h-6 w-6 text-amber-400" />
          <span className="text-amber-300 font-serif text-xl font-bold">NeuroQuest</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Animation toggle */}
          <Button variant="ghost" size="icon" onClick={toggle}
            title={enabled ? "关闭动画（ADHD友善）" : "开启动画"}
            className={`rounded-full ${enabled ? "text-amber-400" : "text-stone-600"}`}>
            <Sparkles className="h-4 w-4" />
          </Button>

          {links.map(link => (
            <Link key={link.href} href={link.href}>
              <Button variant={pathname === link.href ? "secondary" : "ghost"} size="sm"
                className={`gap-1.5 ${pathname === link.href ? "bg-amber-900/40 text-amber-300" : "text-stone-400 hover:text-stone-200"}`}>
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Button>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full ml-2">
              <Avatar className="h-8 w-8 border border-amber-600/40">
                <AvatarFallback className="bg-amber-900/60 text-amber-300 text-xs">A</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-stone-900 border-amber-800/30 text-stone-200">
              <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer"><User className="h-4 w-4 mr-2" />角色信息</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400"><LogOut className="h-4 w-4 mr-2" />登出</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
