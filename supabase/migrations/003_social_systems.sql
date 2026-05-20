-- ═══════════════════════════════════════════
-- NeuroQuest v3: 社交系统
-- 星球访客 · 共同星球 · 鼓励包 · 邀请奖励 · 匿名树洞
-- ═══════════════════════════════════════════

-- 1. 星球访客记录
CREATE TABLE IF NOT EXISTS public.planet_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  left_star BOOLEAN DEFAULT false,
  star_message TEXT DEFAULT '',
  visited_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planet_visits_host ON public.planet_visits(host_id, visited_at DESC);

-- 2. 共同星球
CREATE TABLE IF NOT EXISTS public.shared_planets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_planet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planet_id UUID NOT NULL REFERENCES public.shared_planets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(planet_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.shared_planet_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planet_id UUID NOT NULL REFERENCES public.shared_planets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  xp_contributed INTEGER DEFAULT 0,
  contributed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 鼓励包
CREATE TABLE IF NOT EXISTS public.encouragement_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '加油！我在你的星球上看到你在努力。',
  gold_amount INTEGER DEFAULT 5,
  opened BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ
);

-- 4. 邀请码
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 匿名树洞
CREATE TABLE IF NOT EXISTS public.tree_hole_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  likes_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,  -- AI moderation flag
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tree_hole_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.tree_hole_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 6. 成就补充：社交达人
INSERT INTO public.achievement_defs (id, title, description, category, required_count, xp_reward) VALUES
  ('first_visit', '初次到访', '访问一个好友的星球', 'social', 1, 100),
  ('star_giver', '星光使者', '给好友留下10颗小星星', 'social', 10, 200),
  ('shared_world', '共创世界', '参与一个共同星球', 'social', 1, 200),
  ('encourager', '温暖之手', '发送5个鼓励包', 'social', 5, 200),
  ('inviter', '引路人', '邀请一个好友加入', 'social', 1, 150),
  ('tree_hole_first', '树洞初语', '在树洞发布第一条匿名消息', 'social', 1, 100)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════ INDEXES ═══════════════════
CREATE INDEX IF NOT EXISTS idx_shared_planet_members ON public.shared_planet_members(planet_id);
CREATE INDEX IF NOT EXISTS idx_encouragement_receiver ON public.encouragement_packs(receiver_id, opened);
CREATE INDEX IF NOT EXISTS idx_tree_hole_posts_time ON public.tree_hole_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_codes_creator ON public.invite_codes(creator_id);

-- ═══════════════════ RLS ═══════════════════
ALTER TABLE public.planet_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_planet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_planet_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragement_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_hole_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_hole_likes ENABLE ROW LEVEL SECURITY;

-- Visits: host can see who visited, visitor can see their own
CREATE POLICY "Host can see visits" ON public.planet_visits FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "Visitor can insert" ON public.planet_visits FOR INSERT WITH CHECK (auth.uid() = visitor_id);
CREATE POLICY "Visitor can update own star" ON public.planet_visits FOR UPDATE USING (auth.uid() = visitor_id);

-- Shared planets
CREATE POLICY "Members can read shared planet" ON public.shared_planets FOR SELECT
  USING (id IN (SELECT planet_id FROM public.shared_planet_members WHERE user_id = auth.uid()) OR creator_id = auth.uid());
CREATE POLICY "Anyone can create shared planet" ON public.shared_planets FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Members can read members" ON public.shared_planet_members FOR SELECT
  USING (planet_id IN (SELECT planet_id FROM public.shared_planet_members WHERE user_id = auth.uid()));
CREATE POLICY "Creator can add members" ON public.shared_planet_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.shared_planets WHERE id = planet_id AND creator_id = auth.uid()));

CREATE POLICY "Members can see contributions" ON public.shared_planet_contributions FOR SELECT
  USING (planet_id IN (SELECT planet_id FROM public.shared_planet_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can insert contributions" ON public.shared_planet_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Encouragement
CREATE POLICY "Sender and receiver can see" ON public.encouragement_packs FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Friends can send encouragement" ON public.encouragement_packs FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.friendships WHERE (user_id = sender_id AND friend_id = receiver_id AND status = 'accepted') OR (user_id = receiver_id AND friend_id = sender_id AND status = 'accepted')));

-- Invite codes
CREATE POLICY "Creator can read own codes" ON public.invite_codes FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can create code" ON public.invite_codes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Anyone can read by code" ON public.invite_codes FOR SELECT USING (true);

-- Tree hole: anonymous reads, own writes
CREATE POLICY "Anyone can read visible posts" ON public.tree_hole_posts FOR SELECT USING (is_visible = true);
CREATE POLICY "Users can post anonymously" ON public.tree_hole_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Poster can update own" ON public.tree_hole_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can like posts" ON public.tree_hole_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see likes" ON public.tree_hole_likes FOR SELECT USING (true);

-- RPC: 点赞计数
CREATE OR REPLACE FUNCTION public.increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tree_hole_posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
