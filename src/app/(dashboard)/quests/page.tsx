"use client";

import { useState } from "react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskList } from "@/components/tasks/task-list";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sword, Scroll, Sun, AlertTriangle, HelpCircle } from "lucide-react";

export default function QuestsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-amber-300 font-bold mb-1">任务日志</h1>
        <p className="text-stone-400">管理你的所有任务和冒险</p>
      </div>

      {/* Quick guide */}
      <Accordion className="bg-stone-900/60 border border-stone-800/50 rounded-xl px-4">
        <AccordionItem value="guide" className="border-none">
          <AccordionTrigger className="text-stone-300 hover:text-amber-300">
            <HelpCircle className="h-4 w-4 mr-2" /> 任务类型说明
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-stone-400">
            <div className="flex items-center gap-2"><Sword className="h-4 w-4 text-amber-400" /> <span className="text-amber-300 font-bold">主线任务</span> — 大目标，比如"完成论文"。可拆分成子任务。</div>
            <div className="flex items-center gap-2"><Scroll className="h-4 w-4 text-blue-400" /> <span className="text-blue-300 font-bold">支线任务</span> — 日常要做的事，比如"运动30分钟"。</div>
            <div className="flex items-center gap-2"><Sun className="h-4 w-4 text-emerald-400" /> <span className="text-emerald-300 font-bold">每日任务</span> — 每天刷新的小任务，比如"喝8杯水"。</div>
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> <span className="text-red-300 font-bold">紧急任务</span> — 优先级最高，即将到期的任务。</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TaskList refreshKey={refreshKey} />

      <QuickAdd onTaskCreated={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}
