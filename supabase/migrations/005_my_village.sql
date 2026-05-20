-- ═══════════════════════════════════════════
-- NeuroQuest v5: 我的村庄
-- 农场 · 牧场 · 小屋 · 广场
-- ═══════════════════════════════════════════

-- 1. 农场种子
CREATE TABLE IF NOT EXISTS public.seed_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🌱',
  stages INTEGER DEFAULT 4,
  tasks_per_stage INTEGER DEFAULT 3,
  harvest_xp INTEGER DEFAULT 100,
  harvest_gold INTEGER DEFAULT 30,
  season TEXT DEFAULT 'all',
  price INTEGER DEFAULT 50
);

-- 2. 用户农场
CREATE TABLE IF NOT EXISTS public.farm_plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plot_index INTEGER NOT NULL,
  seed_id TEXT REFERENCES public.seed_defs(id),
  growth INTEGER DEFAULT 0,
  planted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plot_index)
);

-- 3. 动物定义
CREATE TABLE IF NOT EXISTS public.animal_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🐾',
  baby_emoji TEXT DEFAULT '🥚',
  stages INTEGER DEFAULT 3,
  tasks_per_stage INTEGER DEFAULT 5,
  byproduct_name TEXT DEFAULT '爱心',
  byproduct_emoji TEXT DEFAULT '💝',
  byproduct_xp INTEGER DEFAULT 50,
  byproduct_gold INTEGER DEFAULT 20,
  price INTEGER DEFAULT 200
);

-- 4. 用户牧场
CREATE TABLE IF NOT EXISTS public.ranch_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES public.animal_defs(id),
  pen_index INTEGER NOT NULL,
  name TEXT DEFAULT '',
  growth INTEGER DEFAULT 0,
  adult BOOLEAN DEFAULT false,
  last_harvest_date DATE,
  UNIQUE(user_id, pen_index)
);

-- 5. 家具 (扩展商店)
CREATE TABLE IF NOT EXISTS public.furniture_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🪑',
  category TEXT NOT NULL CHECK (category IN ('chair','table','bed','decoration','wall','floor')),
  style TEXT NOT NULL CHECK (style IN ('rustic','cute','modern','cyberpunk')),
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  price INTEGER DEFAULT 200,
  required_level INTEGER DEFAULT 1
);

-- 6. 用户小屋
CREATE TABLE IF NOT EXISTS public.cabin_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  furniture_id TEXT NOT NULL REFERENCES public.furniture_defs(id),
  room TEXT DEFAULT 'main',
  pos_x REAL DEFAULT 0,
  pos_y REAL DEFAULT 0,
  rotation INTEGER DEFAULT 0
);

-- 7. 小屋点赞
CREATE TABLE IF NOT EXISTS public.cabin_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cabin_owner_id, visitor_id)
);

-- ═══════════════════ SEED DATA ═══════════════════

-- 种子
INSERT INTO public.seed_defs (id, name, emoji, stages, tasks_per_stage, harvest_xp, harvest_gold, season, price) VALUES
  ('carrot', '胡萝卜', '🥕', 3, 2, 60, 15, 'spring', 30),
  ('tomato', '番茄', '🍅', 4, 3, 100, 25, 'summer', 50),
  ('corn', '玉米', '🌽', 4, 3, 110, 28, 'summer', 55),
  ('pumpkin', '南瓜', '🎃', 5, 4, 200, 50, 'autumn', 80),
  ('sunflower', '向日葵', '🌻', 4, 3, 120, 30, 'summer', 60),
  ('strawberry', '草莓', '🍓', 3, 2, 80, 20, 'spring', 35),
  ('radish', '白萝卜', '🍃', 3, 2, 70, 18, 'winter', 40)
ON CONFLICT (id) DO NOTHING;

-- 动物
INSERT INTO public.animal_defs (id, name, emoji, baby_emoji, stages, tasks_per_stage, byproduct_name, byproduct_emoji, byproduct_xp, byproduct_gold, price) VALUES
  ('chick', '小鸡', '🐔', '🐣', 3, 3, '鸡蛋', '🥚', 30, 10, 100),
  ('duck', '小鸭', '🦆', '🐥', 3, 3, '鸭蛋', '🥚', 35, 12, 120),
  ('rabbit', '小兔', '🐰', '🐇', 4, 4, '兔毛', '☁️', 50, 18, 200),
  ('cat', '小猫', '🐱', '🐱', 4, 5, '陪伴', '💕', 60, 20, 300),
  ('dog', '小狗', '🐕', '🐶', 5, 6, '忠诚', '🦴', 80, 25, 400),
  ('sheep', '小羊', '🐑', '🐑', 4, 4, '羊毛', '☁️', 55, 20, 250)
ON CONFLICT (id) DO NOTHING;

-- 家具 (各风格)
INSERT INTO public.furniture_defs (id, name, emoji, category, style, width, height, price, required_level) VALUES
  ('chair_wood', '木椅', '🪑', 'chair', 'rustic', 1, 1, 100, 6),
  ('table_wood', '木桌', '🪵', 'table', 'rustic', 2, 1, 200, 6),
  ('bed_simple', '简朴木床', '🛏️', 'bed', 'rustic', 2, 2, 300, 6),
  ('plant_pot', '盆栽', '🪴', 'decoration', 'rustic', 1, 1, 80, 6),
  ('chair_cute', '草莓椅', '🍓', 'chair', 'cute', 1, 1, 150, 7),
  ('table_cute', '爱心桌', '💗', 'table', 'cute', 2, 1, 250, 7),
  ('bed_cute', '云朵床', '☁️', 'bed', 'cute', 2, 2, 400, 7),
  ('rug_heart', '心形地毯', '❤️', 'floor', 'cute', 2, 1, 120, 7),
  ('chair_modern', '简约椅', '💺', 'chair', 'modern', 1, 1, 200, 8),
  ('table_modern', '玻璃桌', '🔲', 'table', 'modern', 2, 1, 350, 8),
  ('bed_modern', '悬浮床', '🛌', 'bed', 'modern', 2, 2, 600, 8),
  ('lamp_neon', '霓虹灯', '💡', 'decoration', 'modern', 1, 1, 180, 8),
  ('chair_cyber', '电路椅', '⚡', 'chair', 'cyberpunk', 1, 1, 300, 10),
  ('table_cyber', '全息桌', '🔮', 'table', 'cyberpunk', 2, 1, 500, 10),
  ('bed_cyber', '休眠舱', '🛸', 'bed', 'cyberpunk', 2, 2, 800, 10),
  ('wall_neon', '霓虹壁纸', '🌈', 'wall', 'cyberpunk', 1, 1, 400, 10)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.seed_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranch_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read seeds" ON public.seed_defs FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own farm" ON public.farm_plots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can read animals" ON public.animal_defs FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own animals" ON public.ranch_animals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can read furniture" ON public.furniture_defs FOR SELECT USING (true);
CREATE POLICY "Users can CRUD own cabin" ON public.cabin_layout FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read likes" ON public.cabin_likes FOR SELECT USING (true);
CREATE POLICY "Visitors can insert likes" ON public.cabin_likes FOR INSERT WITH CHECK (auth.uid() = visitor_id);
