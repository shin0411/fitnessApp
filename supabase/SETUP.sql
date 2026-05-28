-- =====================================================
-- FitnessRPG: ONE-SHOT SUPABASE SETUP (copy & paste once)
-- =====================================================
-- Run this entire file in Supabase Dashboard > SQL Editor
-- Order: Schema → Storage & Triggers → Seed Data
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text,
  birth_date date,
  gender text,
  theme text default 'simple',
  invite_code text unique,
  invited_by uuid references profiles(id),
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- Optional profile details (height, weight, body type, MBTI)
create table if not exists profile_details (
  user_id uuid references profiles(id) on delete cascade primary key,
  height_cm numeric,
  weight_kg numeric,
  body_type text,
  mbti text,
  updated_at timestamptz default now()
);

-- 4-axis levels (all capped at Lv.999)
create table if not exists user_levels (
  user_id uuid references profiles(id) on delete cascade,
  level_type text not null,
  level integer default 1 check (level >= 1 and level <= 999),
  total_xp bigint default 0,
  current_title text,
  updated_at timestamptz default now(),
  primary key (user_id, level_type)
);

create table if not exists streaks (
  user_id uuid references profiles(id) on delete cascade,
  streak_type text,
  streak_days integer default 0,
  last_activity_date date,
  primary key (user_id, streak_type)
);

create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  muscle_group text,
  exercise_type text,
  created_at timestamptz default now()
);

create table if not exists workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  physical_xp_earned integer default 0
);

create table if not exists workout_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  set_number integer,
  weight numeric,
  reps integer,
  duration_seconds integer,
  flexibility_score numeric,
  is_personal_record boolean default false,
  created_at timestamptz default now()
);

create table if not exists quiz_questions (
  id uuid default gen_random_uuid() primary key,
  subject text,
  difficulty integer check (difficulty >= 1 and difficulty <= 20),
  question_text text,
  choices jsonb,
  correct_index integer,
  explanation text,
  time_limit_seconds integer
);

create table if not exists quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text,
  difficulty_used integer,
  total_questions integer,
  correct_count integer,
  avg_response_seconds numeric,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

create table if not exists age_level_expectations (
  age_group text,
  subject text,
  expected_level integer,
  primary key (age_group, subject)
);

create table if not exists photo_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  analysis_type text check (analysis_type in ('face', 'body', 'flexibility')),
  storage_path text,
  ai_response jsonb,
  scores jsonb,
  xp_earned integer default 0,
  feedback text,
  is_peer_review boolean default false,
  created_at timestamptz default now()
);

create table if not exists beauty_care_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  care_type text,
  logged_at timestamptz default now(),
  details jsonb,
  xp_earned integer default 0
);

create table if not exists body_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  metric_type text,
  value numeric,
  unit text,
  source text default 'manual',
  recorded_at timestamptz default now()
);

create table if not exists gps_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  activity_type text,
  distance_meters numeric,
  duration_seconds integer,
  elevation_gain numeric,
  route_geojson jsonb,
  calories_estimated integer,
  physical_xp_earned integer default 0,
  started_at timestamptz default now()
);

create table if not exists daily_activity (
  user_id uuid references profiles(id) on delete cascade,
  date date,
  step_count integer default 0,
  active_minutes integer default 0,
  screen_time_minutes integer default 0,
  sleep_minutes integer,
  sleep_quality text,
  current_mode text default 'normal',
  primary key (user_id, date)
);

create table if not exists mode_override_log (
  user_id uuid references profiles(id) on delete cascade,
  date date,
  system_mode text,
  user_ignored boolean default false,
  consecutive_ignores integer default 0,
  saiyan_triggered boolean default false,
  primary key (user_id, date)
);

create table if not exists meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  photo_path text,
  ai_recognized_items jsonb,
  user_added_items jsonb,
  final_nutrition jsonb,
  physical_xp_earned integer default 0,
  logged_at timestamptz default now()
);

create table if not exists nutrition_goals (
  user_id uuid references profiles(id) on delete cascade primary key,
  calories_kcal integer,
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  fiber_g numeric,
  updated_at timestamptz default now()
);

create table if not exists guilds (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references profiles(id),
  max_members integer default 20,
  created_at timestamptz default now()
);

create table if not exists guild_members (
  guild_id uuid references guilds(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (guild_id, user_id)
);

create table if not exists peer_scores (
  id uuid default gen_random_uuid() primary key,
  target_user_id uuid references profiles(id) on delete cascade,
  reviewer_user_id uuid references profiles(id),
  level_type text,
  score integer check (score >= 1 and score <= 10),
  is_anonymous boolean default false,
  evidence_type text,
  created_at timestamptz default now()
);

create table if not exists challenges (
  id uuid default gen_random_uuid() primary key,
  challenger_id uuid references profiles(id),
  challenged_id uuid references profiles(id),
  challenge_type text,
  subject text,
  status text default 'pending',
  result jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists quests (
  id text primary key,
  quest_type text,
  title text,
  description text,
  condition_type text,
  condition_value jsonb,
  xp_reward integer,
  level_type text,
  expires_at timestamptz
);

create table if not exists user_quest_progress (
  user_id uuid references profiles(id) on delete cascade,
  quest_id text references quests(id),
  progress integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  assigned_date date default current_date,
  primary key (user_id, quest_id, assigned_date)
);

create table if not exists benchmark_personas (
  id text primary key,
  archetype text,
  display_name text,
  illustration_url text,
  level integer default 999,
  physique_params jsonb,
  beauty_params jsonb,
  knowledge_params jsonb,
  description text,
  gender text
);

create table if not exists user_goals (
  user_id uuid references profiles(id) on delete cascade primary key,
  target_persona_id text references benchmark_personas(id),
  level_type_priority text,
  custom_goals jsonb,
  set_at timestamptz default now()
);

create table if not exists achievements (
  id text primary key,
  category text,
  name text,
  description text,
  icon text,
  xp_reward integer default 0,
  level_type text,
  condition_type text,
  condition_value jsonb
);

create table if not exists user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text references achievements(id),
  earned_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

create table if not exists global_effort_scores (
  user_id uuid references profiles(id) on delete cascade,
  score_date date,
  aes_score numeric,
  daily_rank integer,
  weekly_rank integer,
  monthly_rank integer,
  ai_comment text,
  primary key (user_id, score_date)
);

-- RLS
alter table profiles enable row level security;
alter table profile_details enable row level security;
alter table user_levels enable row level security;
alter table streaks enable row level security;
alter table exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;
alter table quiz_sessions enable row level security;
alter table photo_analyses enable row level security;
alter table beauty_care_logs enable row level security;
alter table body_metrics enable row level security;
alter table gps_sessions enable row level security;
alter table daily_activity enable row level security;
alter table mode_override_log enable row level security;
alter table meal_logs enable row level security;
alter table nutrition_goals enable row level security;
alter table user_quest_progress enable row level security;
alter table user_achievements enable row level security;
alter table global_effort_scores enable row level security;
alter table quiz_questions enable row level security;
alter table quests enable row level security;
alter table achievements enable row level security;
alter table benchmark_personas enable row level security;

create policy "profiles_own" on profiles for all using (auth.uid() = id);
create policy "profile_details_own" on profile_details for all using (auth.uid() = user_id);
create policy "user_levels_own" on user_levels for all using (auth.uid() = user_id);
create policy "streaks_own" on streaks for all using (auth.uid() = user_id);
create policy "exercises_own" on exercises for all using (auth.uid() = user_id);
create policy "workout_sessions_own" on workout_sessions for all using (auth.uid() = user_id);
create policy "workout_sets_own" on workout_sets for all using (session_id in (select id from workout_sessions where user_id = auth.uid()));
create policy "quiz_sessions_own" on quiz_sessions for all using (auth.uid() = user_id);
create policy "photo_analyses_own" on photo_analyses for all using (auth.uid() = user_id);
create policy "beauty_care_own" on beauty_care_logs for all using (auth.uid() = user_id);
create policy "body_metrics_own" on body_metrics for all using (auth.uid() = user_id);
create policy "gps_sessions_own" on gps_sessions for all using (auth.uid() = user_id);
create policy "daily_activity_own" on daily_activity for all using (auth.uid() = user_id);
create policy "mode_log_own" on mode_override_log for all using (auth.uid() = user_id);
create policy "meal_logs_own" on meal_logs for all using (auth.uid() = user_id);
create policy "nutrition_goals_own" on nutrition_goals for all using (auth.uid() = user_id);
create policy "quest_progress_own" on user_quest_progress for all using (auth.uid() = user_id);
create policy "achievements_own" on user_achievements for all using (auth.uid() = user_id);
create policy "effort_scores_read" on global_effort_scores for select using (true);
create policy "effort_scores_insert" on global_effort_scores for insert with check (auth.uid() = user_id);
create policy "quiz_questions_read" on quiz_questions for select using (true);
create policy "quests_read" on quests for select using (true);
create policy "achievements_read" on achievements for select using (true);
create policy "personas_read" on benchmark_personas for select using (true);

-- Seed quests
insert into quests (id, quest_type, title, description, condition_type, condition_value, xp_reward, level_type) values
  ('daily_workout', 'daily', 'ワークアウト1セッション', '今日1回ワークアウトを記録する', 'workout_session_count', '{"count": 1}', 100, 'physical'),
  ('daily_quiz_5', 'daily', 'クイズ5問チャレンジ', 'クイズを5問解く', 'quiz_question_count', '{"count": 5}', 80, 'knowledge'),
  ('daily_meal_log', 'daily', '食事を記録する', '1食分の食事を記録する', 'meal_log_count', '{"count": 1}', 50, 'physical'),
  ('daily_beauty_care', 'daily', 'スキンケア記録', 'スキンケアを記録する', 'beauty_care_count', '{"count": 1}', 60, 'beauty'),
  ('weekly_workout_5', 'weekly', '今逃1週 5日ワークアウト', '今週 5回以上ワークアウトセッションを完了する', 'workout_session_count_week', '{"count": 5}', 500, 'physical'),
  ('weekly_quiz_30', 'weekly', '週 30問クイズ完走', '今週 30問以上クイズに答える', 'quiz_question_count_week', '{"count": 30}', 400, 'knowledge'),
  ('weekly_meal_all', 'weekly', '7日間食事記録', '今週 7日間食事を記録する', 'meal_streak_days', '{"days": 7}', 600, 'physical')
on conflict (id) do nothing;

-- Seed achievements
insert into achievements (id, category, name, description, icon, xp_reward, level_type, condition_type, condition_value) values
  ('first_workout', 'fitness', '初回ワークアウト', '初めてのワークアウトセッションを完了した', '💪', 200, 'physical', 'workout_session_count', '{"count": 1}'),
  ('first_quiz', 'knowledge', '初回クイズ', '初めてクイズに正解した', '🧠', 100, 'knowledge', 'quiz_correct_count', '{"count": 1}'),
  ('first_meal', 'nutrition', '初回食事記録', '初めて食事を記録した', '🍱', 100, 'physical', 'meal_log_count', '{"count": 1}'),
  ('saiyan_awakening', 'special', 'サイヤ人覚醒', '7日連続で警告を無視して限界を超えた', '⚡', 1000, 'comprehensive', 'saiyan_triggered', '{"triggered": true}'),
  ('level_50_physical', 'fitness', '鉄の意志', 'フィジカルLv.50に到達した', '🔩', 500, 'physical', 'level_reached', '{"level_type": "physical", "level": 50}'),
  ('level_100_physical', 'fitness', '100の試練', 'フィジカルLv.100に到達した', '🏆', 1000, 'physical', 'level_reached', '{"level_type": "physical", "level": 100}'),
  ('level_999_any', 'legend', 'Lv.999 伝説', 'いずれかの軸でLv.999に到達した', '🌟', 9999, 'comprehensive', 'level_reached_999', '{}')
on conflict (id) do nothing;
-- ============================================================================
-- Storage Buckets
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('photo-analyses', 'photo-analyses', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('share-cards', 'share-cards', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Storage RLS: Users can only access their own files (path prefix = user_id)
create policy "users_upload_own_photos" on storage.objects for insert
  with check (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_read_own_photos" on storage.objects for select
  using (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users_delete_own_photos" on storage.objects for delete
  using (
    bucket_id in ('photo-analyses', 'meal-photos')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "share_cards_public_read" on storage.objects for select
  using (bucket_id = 'share-cards');

create policy "users_upload_own_share_cards" on storage.objects for insert
  with check (
    bucket_id = 'share-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Triggers: Auto-create profile & 4-axis levels on signup
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
begin
  generated_code := upper(substring(md5(random()::text) from 1 for 8));

  insert into public.profiles (id, username, invite_code, theme, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text from 1 for 8)),
    generated_code,
    'simple',
    false
  )
  on conflict (id) do nothing;

  insert into public.user_levels (user_id, level_type, level, total_xp, current_title) values
    (new.id, 'physical', 1, 0, '見習いトレーニー'),
    (new.id, 'beauty', 1, 0, '美容初心者'),
    (new.id, 'knowledge', 1, 0, '知識の芽生え'),
    (new.id, 'comprehensive', 1, 0, '成長の始まり')
  on conflict (user_id, level_type) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Helper: Compute comprehensive XP from other 3 axes
-- ============================================================================

create or replace function recompute_comprehensive_xp(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  physical_xp bigint;
  beauty_xp bigint;
  knowledge_xp bigint;
  comp_xp bigint;
begin
  select coalesce(total_xp, 0) into physical_xp from user_levels where user_id = target_user_id and level_type = 'physical';
  select coalesce(total_xp, 0) into beauty_xp from user_levels where user_id = target_user_id and level_type = 'beauty';
  select coalesce(total_xp, 0) into knowledge_xp from user_levels where user_id = target_user_id and level_type = 'knowledge';

  comp_xp := (physical_xp * 0.4 + beauty_xp * 0.3 + knowledge_xp * 0.3)::bigint;

  update user_levels set total_xp = comp_xp, updated_at = now()
    where user_id = target_user_id and level_type = 'comprehensive';
end;
$$;
-- ============================================================================
-- Quiz Questions (5 subjects × multiple difficulties)
-- ============================================================================

insert into quiz_questions (subject, difficulty, question_text, choices, correct_index, explanation, time_limit_seconds) values
  -- Japanese
  ('japanese', 2, '「いぬ」を漢字で書くと？', '["犬","猫","鳥","魚"]'::jsonb, 0, '「犬」と書きます。', 30),
  ('japanese', 3, '「春」を正しく読むのはどれ？', '["はる","なつ","あき","ふゆ"]'::jsonb, 0, '「春」は「はる」と読みます。', 25),
  ('japanese', 5, '「美しい」の対義語は？', '["醜い","新しい","古い","強い"]'::jsonb, 0, '「美しい」の対義語は「醜い」です。', 25),
  ('japanese', 6, '「紅葉」の正しい読みはどれ？', '["こうよう","もみじ","あかは","べにば"]'::jsonb, 1, '「紅葉」は「もみじ」または「こうよう」と読みます。', 20),
  ('japanese', 8, '「矛盾」の意味として正しいのは？', '["筋が通っている","筋が通らない","協力する","賛成する"]'::jsonb, 1, '矛盾とは、つじつまが合わないことを指します。', 20),
  ('japanese', 9, '「風が吹く」の「が」の役割は？', '["主語を示す格助詞","目的語を示す格助詞","接続助詞","終助詞"]'::jsonb, 0, '「が」は主語を示す格助詞です。', 15),
  ('japanese', 12, '『枕草子』の作者は誰？', '["清少納言","紫式部","和泉式部","菅原道真"]'::jsonb, 0, '『枕草子』は平安時代の随筆で、清少納言の作品です。', 12),
  ('japanese', 13, '「行雲流水」の意味は？', '["執着せず自然に任せること","常に努力すること","勝負に勝つこと","知識を蓄えること"]'::jsonb, 0, '行雲流水とは、執着せず自然に任せて生きることです。', 12),
  ('japanese', 15, '古文の「をかし」の意味は？', '["趣がある・興趣がある","悲しい","恐ろしい","うつくしい"]'::jsonb, 0, '「をかし」は「趣がある」「おもしろい」という古語です。', 10),
  ('japanese', 18, '『万葉集』が編纂された時代は？', '["奈良時代","平安時代","鎌倉時代","江戸時代"]'::jsonb, 0, '万葉集は奈良時代に編纂された日本最古の和歌集です。', 8),

  -- English
  ('english', 2, '「ねこ」を英語で言うと？', '["dog","cat","bird","fish"]'::jsonb, 1, '「ねこ」は英語で "cat" です。', 30),
  ('english', 3, '「りんご」を英語で？', '["apple","orange","banana","grape"]'::jsonb, 0, '「りんご」は "apple" です。', 25),
  ('english', 5, '"Hello, how ___ you?" の空欄は？', '["is","are","am","be"]'::jsonb, 1, 'you には are を使います。', 25),
  ('english', 6, '"She ___ to school every day." 空欄に入るのは？', '["go","goes","going","gone"]'::jsonb, 1, '三人称単数現在形なので "goes" が正解です。', 20),
  ('english', 8, '"I have been ___ English for 5 years." の空欄は？', '["study","studied","studying","studies"]'::jsonb, 2, '現在完了進行形なので studying が正解です。', 20),
  ('english', 9, '"I wish I ___ more time." の空欄は？', '["have","had","has","having"]'::jsonb, 1, '仮定法過去の構文では had を使います。', 15),
  ('english', 11, '"By the time he arrived, we ___ already eaten." の空欄は？', '["have","had","has","were"]'::jsonb, 1, '過去完了形で had を使います。', 15),
  ('english', 13, '"Serendipity" の意味は？', '["怒り","偶然の幸運な発見","孤独","深い後悔"]'::jsonb, 1, 'Serendipity は「予期せぬ幸運な発見」を意味します。', 12),
  ('english', 16, 'Which is correct subjunctive mood?', '["I suggest that he goes home.","I suggest that he go home.","I suggest that he going home.","I suggest that he went home."]'::jsonb, 1, 'Subjunctive mood uses the base form: "he go home".', 10),
  ('english', 18, '"Ephemeral" の意味は？', '["永久の","つかの間の","巨大な","神聖な"]'::jsonb, 1, 'Ephemeral は「つかの間の」「短命な」を意味します。', 8),

  -- Math
  ('math', 1, '1 + 1 = ?', '["1","2","3","4"]'::jsonb, 1, '1 + 1 = 2 です。', 30),
  ('math', 3, '3 + 7 = ?', '["8","9","10","11"]'::jsonb, 2, '3 + 7 = 10 です。', 25),
  ('math', 5, '24 ÷ 6 = ?', '["3","4","5","6"]'::jsonb, 1, '24 ÷ 6 = 4 です。', 25),
  ('math', 7, '7 × 8 = ?', '["54","56","58","64"]'::jsonb, 1, '7 × 8 = 56 です。', 20),
  ('math', 8, '2² + 3² = ?', '["10","12","13","25"]'::jsonb, 2, '2² = 4、3² = 9 なので 4 + 9 = 13 です。', 20),
  ('math', 11, 'x² - 5x + 6 = 0 の解は？', '["x = 1, 6","x = 2, 3","x = -2, -3","x = -1, -6"]'::jsonb, 1, '因数分解すると (x-2)(x-3) = 0 です。', 15),
  ('math', 14, 'sin²θ + cos²θ = ?', '["0","1","2","tanθ"]'::jsonb, 1, '三角関数の基本恒等式：sin²θ + cos²θ = 1。', 12),
  ('math', 15, 'log₁₀ 100 = ?', '["1","2","10","100"]'::jsonb, 1, '10² = 100 なので log₁₀ 100 = 2。', 10),
  ('math', 17, '∫(0→1) x² dx = ?', '["1/2","1/3","1/4","1"]'::jsonb, 1, '∫x² dx = x³/3、よって [x³/3]₀¹ = 1/3。', 10),
  ('math', 19, 'lim(x→0) sin(x)/x = ?', '["0","1","∞","undefined"]'::jsonb, 1, '有名な極限：lim(x→0) sin(x)/x = 1。', 8),

  -- Social Studies
  ('social', 3, '日本の首都はどこ？', '["大阪","東京","京都","名古屋"]'::jsonb, 1, '日本の首都は東京です。', 25),
  ('social', 5, '世界で一番大きい大陸は？', '["アフリカ","ユーラシア","北アメリカ","南アメリカ"]'::jsonb, 1, '一番大きい大陸はユーラシア大陸です。', 25),
  ('social', 7, '明治維新が起こったのは何年？', '["1853年","1868年","1889年","1912年"]'::jsonb, 1, '明治維新は1868年に始まりました。', 20),
  ('social', 9, 'EU(欧州連合)の本部がある都市は？', '["パリ","ロンドン","ブリュッセル","ベルリン"]'::jsonb, 2, 'EUの本部はベルギーのブリュッセルにあります。', 15),
  ('social', 11, '日本の三権分立で「司法権」を担うのは？', '["国会","内閣","裁判所","天皇"]'::jsonb, 2, '司法権は裁判所が担います。', 15),
  ('social', 13, '産業革命が最初に起こった国は？', '["フランス","ドイツ","イギリス","アメリカ"]'::jsonb, 2, '産業革命は18世紀後半のイギリスで始まりました。', 12),
  ('social', 16, 'GDP(国内総生産)を初めて提唱した経済学者は？', '["アダム・スミス","ケインズ","サイモン・クズネッツ","ミルトン・フリードマン"]'::jsonb, 2, 'GDPはサイモン・クズネッツが1934年に提唱しました。', 10),

  -- Reading Comprehension / General
  ('comprehension', 4, '「早起きは三文の徳」の意味は？', '["早く起きると良いことがある","三文を稼げる","健康になる","勉強ができる"]'::jsonb, 0, '早起きすると小さなものでも得をするという諺です。', 25),
  ('comprehension', 6, '「一石二鳥」の意味は？', '["二つの石で鳥を撃つ","一つの行動で二つの利益","失敗を二倍する","二度同じことをする"]'::jsonb, 1, '一つの行動で二つの利益を得るたとえです。', 20),
  ('comprehension', 8, '「画竜点睛を欠く」の意味は？', '["完璧である","最も大事な部分が欠けている","絵が下手","目を描かない"]'::jsonb, 1, '最も肝心な部分が欠けていることのたとえです。', 18),
  ('comprehension', 12, '「アンビバレンス」の意味は？', '["一つの感情","相反する感情の共存","強い感情","感情が無いこと"]'::jsonb, 1, '愛と憎しみのような相反する感情が同時に存在する状態。', 12)
on conflict do nothing;

-- ============================================================================
-- Benchmark Personas (Lv.999 goal characters)
-- ============================================================================

insert into benchmark_personas (id, archetype, display_name, level, physique_params, beauty_params, knowledge_params, description, gender) values
  ('greek_warrior', 'physical_male', 'スパルタの戦士', 999,
    '{"strength": 999, "endurance": 950, "flexibility": 880, "muscle_mass_kg": 92}'::jsonb,
    '{"face_score": 850, "skin_score": 880, "posture": 999}'::jsonb,
    '{"strategy": 950, "history": 900, "philosophy": 880}'::jsonb,
    '究極の肉体美と戦士の精神を持つ古代の英雄。フィジカル全振り型の到達点。', 'male'),

  ('parisian_muse', 'beauty_female', 'パリのミューズ', 999,
    '{"flexibility": 920, "posture": 999, "muscle_mass_kg": 52}'::jsonb,
    '{"face_score": 999, "skin_score": 999, "fashion": 999, "elegance": 999}'::jsonb,
    '{"art": 950, "literature": 900, "languages": 880}'::jsonb,
    '美の極致を体現するエレガントなアイコン。ビューティー全振り型。', 'female'),

  ('renaissance_genius', 'knowledge_male', 'ルネサンスの賢者', 999,
    '{"flexibility": 800, "posture": 950}'::jsonb,
    '{"face_score": 800, "skin_score": 850, "presence": 999}'::jsonb,
    '{"science": 999, "art": 999, "philosophy": 999, "languages": 999}'::jsonb,
    'レオナルド・ダ・ヴィンチを彷彿とさせる万能の知性。ナレッジ全振り型。', 'male'),

  ('harmony_warrior', 'comprehensive_female', '調和の戦女神', 999,
    '{"strength": 920, "endurance": 940, "flexibility": 950}'::jsonb,
    '{"face_score": 950, "skin_score": 970, "presence": 999}'::jsonb,
    '{"strategy": 950, "philosophy": 940, "art": 920}'::jsonb,
    '身体・美・知性のすべてを高いレベルで体現する理想像。バランス型の頂点。', 'female'),

  ('zen_master', 'comprehensive_male', '禅の達人', 999,
    '{"strength": 880, "endurance": 999, "flexibility": 999}'::jsonb,
    '{"face_score": 880, "skin_score": 950, "posture": 999}'::jsonb,
    '{"philosophy": 999, "psychology": 980, "art": 920}'::jsonb,
    '心身ともに整い、深い知性と精神性を持つ達人。和の総合型。', 'male'),

  ('idol_hero', 'beauty_male', 'スターアイドル', 999,
    '{"strength": 880, "endurance": 900, "flexibility": 920}'::jsonb,
    '{"face_score": 999, "skin_score": 980, "fashion": 999, "stage_presence": 999}'::jsonb,
    '{"languages": 880, "music": 920}'::jsonb,
    '世界中を魅了するスター性。ビューティー＋パフォーマンス特化。', 'male'),

  ('fitness_queen', 'physical_female', 'フィットネスの女王', 999,
    '{"strength": 950, "endurance": 980, "flexibility": 990, "muscle_mass_kg": 60}'::jsonb,
    '{"face_score": 920, "skin_score": 950, "presence": 980}'::jsonb,
    '{"nutrition": 950, "physiology": 920}'::jsonb,
    '健康美と圧倒的なフィジカルを兼ね備えた女性の理想像。', 'female')
on conflict (id) do nothing;

-- ============================================================================
-- Additional Achievements (expanded set)
-- ============================================================================

insert into achievements (id, category, name, description, icon, xp_reward, level_type, condition_type, condition_value) values
  -- Workout streaks
  ('workout_streak_7', 'fitness', '一週間の鉄人', '7日連続でワークアウトを記録', '🔥', 500, 'physical', 'workout_streak_days', '{"days": 7}'),
  ('workout_streak_30', 'fitness', '鋼の意志', '30日連続でワークアウトを記録', '⚒️', 2000, 'physical', 'workout_streak_days', '{"days": 30}'),
  ('workout_streak_100', 'fitness', '不屈の戦士', '100日連続でワークアウトを記録', '💎', 5000, 'physical', 'workout_streak_days', '{"days": 100}'),
  ('level_10_physical', 'fitness', 'フィジカル新人卒業', 'フィジカルLv.10到達', '🥉', 200, 'physical', 'level_reached', '{"level_type": "physical", "level": 10}'),
  ('level_30_physical', 'fitness', 'ブロンズリフター', 'フィジカルLv.30到達', '🏋️', 400, 'physical', 'level_reached', '{"level_type": "physical", "level": 30}'),
  ('level_200_physical', 'fitness', 'プラチナリフター', 'フィジカルLv.200到達', '⚪', 2500, 'physical', 'level_reached', '{"level_type": "physical", "level": 200}'),
  ('level_500_physical', 'fitness', 'ダイヤモンドリフター', 'フィジカルLv.500到達', '💎', 5000, 'physical', 'level_reached', '{"level_type": "physical", "level": 500}'),
  ('level_10_beauty', 'beauty', 'ビューティー新人卒業', 'ビューティーLv.10到達', '🌸', 200, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 10}'),
  ('level_50_beauty', 'beauty', '美の探求者', 'ビューティーLv.50到達', '💄', 500, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 50}'),
  ('level_100_beauty', 'beauty', '美のアイコン', 'ビューティーLv.100到達', '👑', 1000, 'beauty', 'level_reached', '{"level_type": "beauty", "level": 100}'),
  ('level_10_knowledge', 'knowledge', '知識の卵', 'ナレッジLv.10到達', '🥚', 200, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 10}'),
  ('level_50_knowledge', 'knowledge', '博識者', 'ナレッジLv.50到達', '📚', 500, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 50}'),
  ('level_100_knowledge', 'knowledge', '賢者', 'ナレッジLv.100到達', '🦉', 1000, 'knowledge', 'level_reached', '{"level_type": "knowledge", "level": 100}'),
  ('quiz_perfect_10', 'knowledge', 'クイズ無敵', '10問連続正解', '🎯', 300, 'knowledge', 'quiz_streak', '{"count": 10}'),
  ('quiz_total_100', 'knowledge', '100問達成', 'クイズ通算100問正解', '💯', 400, 'knowledge', 'quiz_correct_total', '{"count": 100}'),
  ('quiz_total_1000', 'knowledge', '知識の海', 'クイズ通算1000問正解', '🌊', 3000, 'knowledge', 'quiz_correct_total', '{"count": 1000}'),
  ('meal_7_days', 'nutrition', '食事マスター', '7日連続で食事を記録', '🍱', 300, 'physical', 'meal_streak_days', '{"days": 7}'),
  ('meal_30_days', 'nutrition', '栄養管理プロ', '30日連続で食事を記録', '🥗', 1000, 'physical', 'meal_streak_days', '{"days": 30}'),
  ('first_invite', 'social', '伝道師', '初めて友達を招待した', '📨', 200, 'comprehensive', 'invite_count', '{"count": 1}'),
  ('invite_10', 'social', 'インフルエンサー', '10人を招待', '📣', 1000, 'comprehensive', 'invite_count', '{"count": 10}'),
  ('first_peer_review', 'social', 'コミュニティ参加', '初めて相互検証を行った', '🤝', 100, 'comprehensive', 'peer_review_count', '{"count": 1}'),
  ('guild_member', 'social', 'ギルドの一員', 'ギルドに加入', '⚔️', 200, 'comprehensive', 'guild_join', '{}'),
  ('good_mode_30', 'lifestyle', '生活の達人', 'Goodモード30日継続', '🌟', 1500, 'comprehensive', 'good_mode_days', '{"days": 30}'),
  ('sleep_master_7', 'lifestyle', '睡眠の賢者', '7日連続で7時間以上睡眠', '😴', 300, 'comprehensive', 'sleep_streak', '{"hours": 7, "days": 7}'),
  ('all_axes_50', 'comprehensive', '全方位戦士', '全ての軸でLv.50以上に到達', '⚡', 2000, 'comprehensive', 'all_axes_level', '{"level": 50}'),
  ('all_axes_100', 'comprehensive', '完全体', '全ての軸でLv.100以上に到達', '🌟', 5000, 'comprehensive', 'all_axes_level', '{"level": 100}'),
  ('comp_500', 'comprehensive', '頂点への道', '総合Lv.500到達', '👑', 5000, 'comprehensive', 'level_reached', '{"level_type": "comprehensive", "level": 500}')
on conflict (id) do nothing;
