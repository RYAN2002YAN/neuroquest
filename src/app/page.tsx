import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sword, LogIn, UserPlus, Star, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/20 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-500/20">
          <Sword className="h-12 w-12 text-stone-900" />
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold text-amber-300 mb-4 tracking-tight">
          NeuroQuest
        </h1>
        <p className="text-xl md:text-2xl text-amber-200/70 mb-2 font-serif">
          你的任务不是负担，是怪物。
        </p>
        <p className="text-lg text-stone-400 mb-12 max-w-lg mx-auto">
          专为 ADHD 大脑设计的 RPG 任务管理系统。<br />
          把生活变成冒险，把拖延变成战斗。
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Zap, title: "3 秒创建任务", desc: "不需要填表，输入名称就发布" },
            { icon: Star, title: "即时奖励反馈", desc: "完成任务 = 击败怪物 + 获得 XP" },
            { icon: Users, title: "公会协作", desc: "和好友组队，互相监督" },
          ].map(f => (
            <div key={f.title} className="bg-stone-900/60 border border-stone-800/50 rounded-xl p-5 text-center">
              <f.icon className="h-8 w-8 mx-auto mb-3 text-amber-400" />
              <h3 className="text-amber-200 font-bold mb-1">{f.title}</h3>
              <p className="text-stone-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="h-14 px-8 text-lg bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold">
              <UserPlus className="h-5 w-5 mr-2" />创建冒险者角色
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-amber-800/40 text-amber-200 hover:bg-amber-900/20">
              <LogIn className="h-5 w-5 mr-2" />已有角色？登录
            </Button>
          </Link>
        </div>

        <p className="text-stone-600 text-sm mt-8">
          需要邮箱注册 · Google 登录即将开放 · 完全免费
        </p>
      </div>
    </div>
  );
}
