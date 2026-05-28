-- FitnessRPG Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text,
  theme text default 'cool',
  invite_code text unique,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, invite_code)
  values (
    new.id,
    split_part(new.email, '@', 1),
    upper(substring(replace(new.id::text, '-', ''), 1, 8))
  )
  on conflict (id) do nothing;

  -- Initialize 4-axis levels
  insert into user_levels (user_id, level_type, level, total_xp, current_title)
  values
    (new.id, 'physical',      1, 0, '見習い'),
    (new.id, 'beauty',        1, 0, '見習い'),
    (new.id, 'knowledge',     1, 0, '見習い'),
    (new.id, 'comprehensive', 1, 0, 'ビギナー')
  on conflict (user_id, level_type) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. 4-Axis Levels
create table if not exists user_levels (
  user_id uuid references profiles(id) on delete cascade,
  level_type text not null,
  level integer default 1,
  total_xp bigint default 0,
  current_title text,
  updated_at timestamptz default now(),
  primary key (user_id, level_type)
);

-- 3. Streaks
create table if not exists streaks (
  user_id uuid references profiles(id) on delete cascade,
  streak_type text,
  streak_days integer default 0,
  last_activity_date date,
  primary key (user_id, streak_type)
);

-- 4. Exercises
create table if not exists exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz default now()
);

-- 5. Workout Sessions
create table if not exists workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  physical_xp_earned integer default 0
);

-- 6. Workout Sets
create table if not exists workout_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  set_number integer,
  weight numeric,
  reps integer,
  is_personal_record boolean default false,
  created_at timestamptz default now()
);

-- 7. Quiz Questions
create table if not exists quiz_questions (
  id uuid default gen_random_uuid() primary key,
  subject text,
  difficulty integer,
  question_text text,
  choices jsonb,
  correct_index integer,
  explanation text,
  time_limit_seconds integer
);

-- 8. Quiz Sessions
create table if not exists quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text,
  difficulty_used integer,
  total_questions integer,
  correct_count integer,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- 9. Photo Analyses
create table if not exists photo_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  analysis_type text,
  storage_path text,
  ai_response jsonb,
  scores jsonb,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- 10. Quests
create table if not exists quests (
  id text primary key,
  quest_type text,
  title text,
  description text,
  xp_reward integer,
  level_type text
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

-- 11. Guilds
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

-- 12. Achievements
create table if not exists achievements (
  id text primary key,
  category text,
  name text,
  description text,
  icon text,
  xp_reward integer default 0,
  level_type text
);

create table if not exists user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text references achievements(id),
  earned_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- 13. Global Effort Scores
create table if not exists global_effort_scores (
  user_id uuid references profiles(id) on delete cascade,
  score_date date,
  aes_score numeric,
  daily_rank integer,
  ai_comment text,
  primary key (user_id, score_date)
);

-- 14. Meal Logs
create table if not exists meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meal_type text,
  final_nutrition jsonb,
  physical_xp_earned integer default 0,
  logged_at timestamptz default now()
);

-- =============================================================
-- RLS (Row Level Security) - users can only see their own data
-- =============================================================
alter table profiles            enable row level security;
alter table user_levels         enable row level security;
alter table streaks             enable row level security;
alter table exercises           enable row level security;
alter table workout_sessions    enable row level security;
alter table workout_sets        enable row level security;
alter table quiz_sessions       enable row level security;
alter table photo_analyses      enable row level security;
alter table user_quest_progress enable row level security;
alter table guild_members       enable row level security;
alter table user_achievements   enable row level security;
alter table global_effort_scores enable row level security;
alter table meal_logs           enable row level security;

-- Profiles
create policy "users can view own profile" on profiles for select using (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- User Levels
create policy "users can view own levels" on user_levels for select using (auth.uid() = user_id);
create policy "users can update own levels" on user_levels for all using (auth.uid() = user_id);

-- Streaks
create policy "users can manage own streaks" on streaks for all using (auth.uid() = user_id);

-- Exercises
create policy "users can manage own exercises" on exercises for all using (auth.uid() = user_id);

-- Workout Sessions
create policy "users can manage own sessions" on workout_sessions for all using (auth.uid() = user_id);

-- Workout Sets (via session ownership)
create policy "users can manage own sets" on workout_sets for all
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- Quiz Sessions
create policy "users can manage own quiz sessions" on quiz_sessions for all using (auth.uid() = user_id);

-- Photo Analyses
create policy "users can manage own analyses" on photo_analyses for all using (auth.uid() = user_id);

-- User Quest Progress
create policy "users can manage own quest progress" on user_quest_progress for all using (auth.uid() = user_id);

-- Guild Members (can see all for public guilds)
create policy "guild members visible" on guild_members for select using (true);
create policy "users can join/leave guilds" on guild_members for all using (auth.uid() = user_id);

-- User Achievements
create policy "users can view own achievements" on user_achievements for all using (auth.uid() = user_id);

-- Global Effort Scores (public leaderboard)
create policy "effort scores are public" on global_effort_scores for select using (true);
create policy "users manage own scores" on global_effort_scores for insert using (auth.uid() = user_id);

-- Meal Logs
create policy "users can manage own meals" on meal_logs for all using (auth.uid() = user_id);

-- Quiz questions are public (read-only)
alter table quiz_questions enable row level security;
create policy "quiz questions are public" on quiz_questions for select using (true);

-- Quests are public (read-only)
alter table quests enable row level security;
create policy "quests are public" on quests for select using (true);

-- Achievements are public (read-only)
create policy "achievements are public" on achievements for select using (true);

-- Guilds are public (read-only)
alter table guilds enable row level security;
create policy "guilds are public" on guilds for select using (true);
create policy "users can create guilds" on guilds for insert with check (auth.uid() = owner_id);
create policy "owners can update guilds" on guilds for update using (auth.uid() = owner_id);
create policy "owners can delete guilds" on guilds for delete using (auth.uid() = owner_id);

-- =============================================================
-- Seed: Daily Quests
-- =============================================================
insert into quests (id, quest_type, title, description, xp_reward, level_type) values
  ('daily_workout',  'daily', 'ワークアウト実施',       '1セッション以上の筋トレを記録する', 80,  'physical'),
  ('daily_quiz',     'daily', 'クイズチャレンジ',         '5問以上のクイズに挑戰する',         60,  'knowledge'),
  ('daily_analyze',  'daily', 'デイリーチェック',         '写真診断を実行する',                   50,  'beauty'),
  ('daily_3sets',    'daily', 'トリプルセット',         '3セット以上の筋トレを記録する',     50,  'physical'),
  ('weekly_streak',  'weekly', '週間ストリーク',        '5日連続でワークアウトする',         200, 'comprehensive')
on conflict (id) do nothing;

-- =============================================================
-- Seed: Sample Achievements
-- =============================================================
insert into achievements (id, category, name, description, icon, xp_reward, level_type) values
  ('first_workout',    'physical',  '初回の挙重',     '初めてのワークアウトを記録',   '🏃', 100,  'physical'),
  ('streak_7',         'physical',  '一週間ストリーク', '7日連続ワークアウト',             '🔥', 200,  'physical'),
  ('streak_30',        'physical',  '一ヶ月ストリーク', '30日連続ワークアウト',            '💪', 1000, 'physical'),
  ('first_quiz',       'knowledge', '初回のクイズ',   '初めてクイズに挑戰',             '📚', 50,   'knowledge'),
  ('quiz_perfect',     'knowledge', '満点',          'クイズで全問正解',                 '⭐', 300,  'knowledge'),
  ('first_analyze',    'beauty',    '鎖骨高チェック',  '初めて写真診断を実行',          '📷', 50,   'beauty'),
  ('lv10_physical',    'physical',  'フィジカルLv10',  '身体レベル10到達',                  '🏆', 500,  'physical'),
  ('lv10_knowledge',   'knowledge', 'ナレッジLv10',   '知識レベル10到達',                   '🧠', 500,  'knowledge'),
  ('comprehensive_10', 'comprehensive', '総合レベル10', '総合レベル10到達',                '🌟', 800,  'comprehensive')
on conflict (id) do nothing;
