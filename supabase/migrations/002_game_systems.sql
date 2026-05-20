-- ═══════════════════════════════════════════
-- NeuroQuest v2: 角色系统 · 技能树 · 商店 · 成就 · 温和惩罚
-- 在 Supabase SQL Editor 中执行
-- ═══════════════════════════════════════════

-- 1. 扩展 profiles 表 — 加 HP / Energy / Avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS energy INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_energy INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS avatar JSONB DEFAULT '{"gender":"male","hair":"short","hairColor":"#4a3728","outfit":"basic","outfitColor":"#4488cc"}'::jsonb;

-- 2. 技能定义表
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('focus','habit','social','stamina')),
  max_level INTEGER DEFAULT 5,
  icon TEXT DEFAULT 'Star'
);

-- 3. 用户技能表
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  UNIQUE(user_id, skill_id)
);

-- 4. 商店物品表
CREATE TABLE IF NOT EXISTS public.shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('clothing','furniture','decoration','boost')),
  price INTEGER NOT NULL DEFAULT 100,
  required_level INTEGER DEFAULT 1,
  image_url TEXT,
  effect JSONB DEFAULT '{}'::jsonb
);

-- 5. 用户背包表
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- 6. 成就定义表
CREATE TABLE IF NOT EXISTS public.achievement_defs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  icon TEXT DEFAULT 'Award',
  required_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 100
);

-- 7. 重构成就表（加外键）
DROP TABLE IF EXISTS public.achievements CASCADE;
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievement_defs(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 8. 每日任务记录表（用于惩罚检测）
CREATE TABLE IF NOT EXISTS public.daily_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_dailies INTEGER DEFAULT 0,
  completed_dailies INTEGER DEFAULT 0,
  penalty_applied BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);

-- ═══════════════════════════════ INDEXES ═══════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_new ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_user_date ON public.daily_log(user_id, date);

-- ═══════════════════════════════ RLS ═══════════════════════════════
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_log ENABLE ROW LEVEL SECURITY;

-- Skills: everyone can read, only owner can read own user_skills
CREATE POLICY "Everyone can read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Users can read own skills" ON public.user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);

-- Shop: everyone can read, inventory is per-user
CREATE POLICY "Everyone can read shop" ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Users can read own inventory" ON public.inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: everyone can read defs, per-user unlock
CREATE POLICY "Everyone can read achievement defs" ON public.achievement_defs FOR SELECT USING (true);
CREATE POLICY "Users can read own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily log
CREATE POLICY "Users can CRUD own daily log" ON public.daily_log FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════ SEED DATA ═════════════════════════

-- 技能
INSERT INTO public.skills (id, name, description, category, max_level, icon) VALUES
  ('focus_master', '专注大师', '完成主线任务获得专注经验', 'focus', 5, 'Brain'),
  ('early_bird', '早起达人', '每日任务在上午完成获得额外经验', 'habit', 3, 'Sunrise'),
  ('social_butterfly', '社交蝴蝶', '添加好友和组队获得社交经验', 'social', 5, 'Users'),
  ('iron_will', '钢铁意志', '连续完成每日任务增加意志力', 'stamina', 5, 'Shield')
ON CONFLICT (id) DO NOTHING;

-- 成就
INSERT INTO public.achievement_defs (id, title, description, category, required_count, xp_reward) VALUES
  ('first_quest', '初次冒险', '完成第一个任务', 'beginner', 1, 100),
  ('ten_quests', '熟练冒险者', '完成10个任务', 'beginner', 10, 200),
  ('fifty_quests', '资深冒险者', '完成50个任务', 'veteran', 50, 500),
  ('hundred_quests', '传奇冒险者', '完成100个任务', 'veteran', 100, 1000),
  ('three_day_streak', '三日坚持', '连续3天完成每日任务', 'streak', 3, 150),
  ('seven_day_streak', '一周勇士', '连续7天完成每日任务', 'streak', 7, 300),
  ('thirty_day_streak', '月度冠军', '连续30天完成每日任务', 'streak', 30, 1000),
  ('hell_slayer', '地狱征服者', '完成一个地狱难度任务', 'challenge', 1, 300),
  ('social_starter', '初识好友', '添加第一个好友', 'social', 1, 100),
  ('guild_master', '公会之星', '添加5个好友', 'social', 5, 300),
  ('shopaholic', '购物达人', '在商店购买第一件物品', 'lifestyle', 1, 100),
  ('level_five', '初级冒险者', '达到等级5', 'progression', 5, 200),
  ('level_ten', '高级冒险者', '达到等级10', 'progression', 10, 500)
ON CONFLICT (id) DO NOTHING;

-- 商店
INSERT INTO public.shop_items (id, name, description, category, price, required_level, effect) VALUES
  ('outfit_adventurer', '冒险者套装', '经典绿色冒险者服装', 'clothing', 100, 1, '{"type":"avatar","key":"outfit","value":"adventurer"}'),
  ('outfit_mage', '法师长袍', '深蓝色的法师袍', 'clothing', 250, 3, '{"type":"avatar","key":"outfit","value":"mage"}'),
  ('outfit_knight', '骑士铠甲', '闪亮的骑士铠甲', 'clothing', 500, 5, '{"type":"avatar","key":"outfit","value":"knight"}'),
  ('hair_long', '长发发型', '飘逸的长发', 'clothing', 150, 1, '{"type":"avatar","key":"hair","value":"long"}'),
  ('hair_mohawk', '莫西干发型', '叛逆的莫西干发型', 'clothing', 200, 2, '{"type":"avatar","key":"hair","value":"mohawk"}'),
  ('furniture_bed', '舒适木床', '恢复更多精力的木床', 'furniture', 300, 1, '{"type":"boost","stat":"max_energy","amount":20}'),
  ('furniture_desk', '橡木书桌', '提高专注力的书桌', 'furniture', 300, 1, '{"type":"boost","stat":"max_hp","amount":20}'),
  ('decoration_plant', '盆栽绿植', '放在房间里的小盆栽', 'decoration', 80, 1, '{}'),
  ('decoration_sword', '装饰长剑', '挂在墙上的装饰剑', 'decoration', 150, 3, '{}'),
  ('boost_potion', '精力药水', '立即恢复30点精力', 'boost', 50, 1, '{"type":"restore","stat":"energy","amount":30}'),
  ('boost_feast', '大餐', '立即恢复50点生命值', 'boost', 80, 1, '{"type":"restore","stat":"hp","amount":50}')
ON CONFLICT (id) DO NOTHING;
