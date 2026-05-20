"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_HAIR_OPTIONS, AVATAR_HAIR_COLORS, AVATAR_OUTFIT_OPTIONS, AVATAR_OUTFIT_COLORS } from "@/lib/types";
import type { AvatarConfig } from "@/lib/types";
import { Shirt, Scissors, Palette, Save } from "lucide-react";

interface Props { avatar: AvatarConfig; onUpdate: (a: AvatarConfig) => void; }

export function AvatarEditor({ avatar, onUpdate }: Props) {
  const [local, setLocal] = useState<AvatarConfig>(avatar);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ avatar: local }).eq("id", user.id);
    onUpdate(local);
    toast.success("形象已保存！");
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-stone-800 border-2 border-amber-600/50 flex items-center justify-center text-5xl"
          style={{ background: `radial-gradient(circle at 50% 50%, ${local.outfitColor}40, ${local.outfitColor}20)` }}>
          {local.gender === "male" ? "🧙‍♂️" : "🧙‍♀️"}
        </div>
      </div>

      {/* Hair */}
      <div>
        <label className="text-xs text-stone-400 flex items-center gap-1 mb-2"><Scissors className="h-3 w-3" />发型</label>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_HAIR_OPTIONS.map(h => (
            <Badge key={h} variant={local.hair === h ? "default" : "outline"}
              className={`cursor-pointer ${local.hair === h ? "bg-amber-600" : "border-stone-600 text-stone-400 hover:text-stone-200"}`}
              onClick={() => setLocal({ ...local, hair: h })}>{h}</Badge>
          ))}
        </div>
      </div>

      {/* Hair Color */}
      <div>
        <label className="text-xs text-stone-400 flex items-center gap-1 mb-2"><Palette className="h-3 w-3" />发色</label>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_HAIR_COLORS.map(c => (
            <div key={c} onClick={() => setLocal({ ...local, hairColor: c })}
              className={`w-7 h-7 rounded-full cursor-pointer border-2 ${local.hairColor === c ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>

      {/* Outfit */}
      <div>
        <label className="text-xs text-stone-400 flex items-center gap-1 mb-2"><Shirt className="h-3 w-3" />服装</label>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_OUTFIT_OPTIONS.map(o => (
            <Badge key={o} variant={local.outfit === o ? "default" : "outline"}
              className={`cursor-pointer ${local.outfit === o ? "bg-emerald-600" : "border-stone-600 text-stone-400 hover:text-stone-200"}`}
              onClick={() => setLocal({ ...local, outfit: o })}>{o}</Badge>
          ))}
        </div>
      </div>

      {/* Outfit Color */}
      <div>
        <label className="text-xs text-stone-400 flex items-center gap-1 mb-2"><Palette className="h-3 w-3" />服装颜色</label>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_OUTFIT_COLORS.map(c => (
            <div key={c} onClick={() => setLocal({ ...local, outfitColor: c })}
              className={`w-7 h-7 rounded-full cursor-pointer border-2 ${local.outfitColor === c ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white"><Save className="h-4 w-4 mr-2" />保存形象</Button>
    </div>
  );
}
