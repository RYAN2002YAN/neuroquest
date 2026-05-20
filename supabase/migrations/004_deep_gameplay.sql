-- ═══════════════════════════════════════════
-- NeuroQuest v4: 深度玩法
-- 农场 · 收集品 · 季节活动 · 习惯 · 专注森林 · 情绪追踪
-- ═══════════════════════════════════════════

-- 1. 农场作物定义
CREATE TABLE IF NOT EXISTS public.crop_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🌱',
  growth_stages INTEGER DEFAULT 4,
  tasks_per_stage INTEGER DEFAULT 3,
  harvest_xp INTEGER DEFAULT 100,
  harvest_gold INTEGER DEFAULT 30,
  season TEXT DEFAULT 'all'
);

-- 2. 用户作物
CREATE TABLE IF NOT EXISTS public.user_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL REFERENCES public.crop_defs(id) ON DELETE CASCADE,
  growth INTEGER DEFAULT 0,
  tasks_since_water INTEGER DEFAULT 0,
  planted_at TIMESTAMPTZ DEFAULT now(),
  harvested BOOLEAN DEFAULT false
);

-- 3. 收集品定义
CREATE TABLE IF NOT EXISTS public.collectible_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '💎',
  category TEXT NOT NULL CHECK (category IN ('fossil','insect','fish','mineral')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')) DEFAULT 'common',
  set_id TEXT,
  drop_chance REAL DEFAULT 0.3
);

-- 4. 收集品组
CREATE TABLE IF NOT EXISTS public.collectible_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  bonus_xp INTEGER DEFAULT 500,
  bonus_title TEXT DEFAULT ''
);

-- 5. 用户收集品
CREATE TABLE IF NOT EXISTS public.user_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id TEXT NOT NULL REFERENCES public.collectible_defs(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, collectible_id)
);

-- 6. 习惯定义
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','custom')) DEFAULT 'daily',
  flexible_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  last_check_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 专注会话
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  tree_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  interrupted BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- ═══════════════════ SEED DATA ═══════════════════

-- 作物
INSERT INTO public.crop_defs (id, name, emoji, growth_stages, tasks_per_stage, harvest_xp, harvest_gold, season) VALUES
  ('wheat', '小麦', '🌾', 3, 2, 60, 15, 'all'),
  ('tomato', '番茄', '🍅', 4, 3, 100, 25, 'summer'),
  ('pumpkin', '南瓜', '🎃', 5, 4, 200, 50, 'autumn'),
  ('sunflower', '向日葵', '🌻', 4, 3, 120, 30, 'summer'),
  ('strawberry', '草莓', '🍓', 3, 2, 80, 20, 'spring'),
  ('snowdrop', '雪花莲', '🌸', 3, 2, 90, 22, 'winter')
ON CONFLICT (id) DO NOTHING;

-- 收集品
INSERT INTO public.collectible_defs (id, name, emoji, category, rarity, set_id, drop_chance) VALUES
  ('fossil_trilobite', '三叶虫化石', '🦴', 'fossil', 'common', 'ancient_sea', 0.4),
  ('fossil_ammonite', '菊石化石', '🐚', 'fossil', 'rare', 'ancient_sea', 0.2),
  ('fossil_dino', '恐龙牙齿', '🦷', 'fossil', 'epic', 'ancient_sea', 0.08),
  ('insect_ladybug', '七星瓢虫', '🐞', 'insect', 'common', 'garden_bugs', 0.35),
  ('insect_butterfly', '蓝闪蝶', '🦋', 'insect', 'rare', 'garden_bugs', 0.18),
  ('insect_beetle', '独角仙', '🪲', 'insect', 'epic', 'garden_bugs', 0.06),
  ('fish_goldfish', '金鱼', '🐟', 'fish', 'common', 'pond_life', 0.3),
  ('fish_kelp', '海带', '🌿', 'fish', 'common', 'pond_life', 0.35),
  ('fish_turtle', '海龟', '🐢', 'fish', 'rare', 'pond_life', 0.15),
  ('fish_whale', '鲸鱼之歌', '🐋', 'fish', 'legendary', 'pond_life', 0.03),
  ('mineral_quartz', '石英', '💎', 'mineral', 'common', 'crystal_cave', 0.3),
  ('mineral_amethyst', '紫水晶', '💜', 'mineral', 'rare', 'crystal_cave', 0.15),
  ('mineral_diamond', '钻石', '💠', 'mineral', 'legendary', 'crystal_cave', 0.02)
ON CONFLICT (id) DO NOTHING;

-- 收集品组
INSERT INTO public.collectible_sets (id, name, description, bonus_xp, bonus_title) VALUES
  ('ancient_sea', '远古海洋', '收集全部远古海洋化石', 500, '古生物学家'),
  ('garden_bugs', '花园虫语', '收集花园里的所有昆虫', 400, '昆虫观察员'),
  ('pond_life', '池塘生态', '收集池塘中的所有生物', 450, '水族馆馆长'),
  ('crystal_cave', '水晶洞穴', '收集所有矿物', 600, '地质学家')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════ INDEXES ═══════════════════
CREATE INDEX IF NOT EXISTS idx_user_crops_user ON public.user_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collectibles_user ON public.user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id, started_at DESC);

-- ═══════════════════ RLS ═══════════════════
ALTER TABLE public.crop_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectible_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectible_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read crop defs" ON public.crop_defs FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own crops" ON public.user_crops FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can read collectibles" ON public.collectible_defs FOR SELECT USING (true);
CREATE POLICY "Everyone can read sets" ON public.collectible_sets FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own collectibles" ON public.user_collectibles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);
