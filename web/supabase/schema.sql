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
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, invite_code)
  values (
    new.id,
    split_part(new.email, '@', 1),
    upper(substring(replace(new.id::text, '-', ''), 1, 8))
  ) on conflict (id) do nothing;

  insert into public.user_levels (user_id, level_type, level, total_xp, current_title)
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
  subject text, difficulty integer,
  question_text text, choices jsonb,
  correct_index integer, explanation text,
  time_limit_seconds integer
);

-- 8. Quiz Sessions
create table if not exists quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text, difficulty_used integer,
  total_questions integer, correct_count integer,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- 9. Photo Analyses
create table if not exists photo_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  analysis_type text, storage_path text,
  ai_response jsonb, scores jsonb,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- 10. Quests
create table if not exists quests (
  id text primary key, quest_type text,
  title text, description text,
  xp_reward integer, level_type text
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
  name text not null, description text,
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
  id text primary key, category text,
  name text, description text, icon text,
  xp_reward integer default 0, level_type text
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
  score_date date, aes_score numeric,
  daily_rank integer, ai_comment text,
  primary key (user_id, score_date)
);

-- 14. Meal Logs
create table if not exists meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meal_type text, final_nutrition jsonb,
  physical_xp_earned integer default 0,
  logged_at timestamptz default now()
);

-- RLS
alter table profiles             enable row level security;
alter table user_levels          enable row level security;
alter table streaks              enable row level security;
alter table exercises            enable row level security;
alter table workout_sessions     enable row level security;
alter table workout_sets         enable row level security;
alter table quiz_questions       enable row level security;
alter table quiz_sessions        enable row level security;
alter table photo_analyses       enable row level security;
alter table quests               enable row level security;
alter table user_quest_progress  enable row level security;
alter table guilds               enable row level security;
alter table guild_members        enable row level security;
alter table achievements         enable row level security;
alter table user_achievements    enable row level security;
alter table global_effort_scores enable row level security;
alter table meal_logs            enable row level security;

create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "levels_select" on user_levels for select using (auth.uid() = user_id);
create policy "levels_insert" on user_levels for insert with check (auth.uid() = user_id);
create policy "levels_update" on user_levels for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streaks_select" on streaks for select using (auth.uid() = user_id);
create policy "streaks_insert" on streaks for insert with check (auth.uid() = user_id);
create policy "streaks_update" on streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercises_select" on exercises for select using (auth.uid() = user_id);
create policy "exercises_insert" on exercises for insert with check (auth.uid() = user_id);
create policy "exercises_update" on exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercises_delete" on exercises for delete using (auth.uid() = user_id);

create policy "sessions_select" on workout_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on workout_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete" on workout_sessions for delete using (auth.uid() = user_id);

create policy "sets_select" on workout_sets for select
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "sets_insert" on workout_sets for insert
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "sets_delete" on workout_sets for delete
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "quiz_q_select" on quiz_questions for select using (true);
create policy "quiz_s_select" on quiz_sessions for select using (auth.uid() = user_id);
create policy "quiz_s_insert" on quiz_sessions for insert with check (auth.uid() = user_id);

create policy "analyses_select" on photo_analyses for select using (auth.uid() = user_id);
create policy "analyses_insert" on photo_analyses for insert with check (auth.uid() = user_id);

create policy "quests_select" on quests for select using (true);
create policy "quest_prog_select" on user_quest_progress for select using (auth.uid() = user_id);
create policy "quest_prog_insert" on user_quest_progress for insert with check (auth.uid() = user_id);
create policy "quest_prog_update" on user_quest_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "guilds_select" on guilds for select using (true);
create policy "guilds_insert" on guilds for insert with check (auth.uid() = owner_id);
create policy "guilds_update" on guilds for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "guilds_delete" on guilds for delete using (auth.uid() = owner_id);

create policy "guild_members_select" on guild_members for select using (true);
create policy "guild_members_insert" on guild_members for insert with check (auth.uid() = user_id);
create policy "guild_members_delete" on guild_members for delete using (auth.uid() = user_id);

create policy "achievements_select" on achievements for select using (true);
create policy "user_ach_select" on user_achievements for select using (auth.uid() = user_id);
create policy "user_ach_insert" on user_achievements for insert with check (auth.uid() = user_id);

create policy "scores_select" on global_effort_scores for select using (true);
create policy "scores_insert" on global_effort_scores for insert with check (auth.uid() = user_id);

create policy "meals_select" on meal_logs for select using (auth.uid() = user_id);
create policy "meals_insert" on meal_logs for insert with check (auth.uid() = user_id);

-- Seed quests
insert into quests (id, quest_type, title, description, xp_reward, level_type) values
  ('daily_workout', 'daily', 'ワークアウト実施', '1セッション以上の筋トレを記録する', 80, 'physical'),
  ('daily_quiz',    'daily', 'クイズチャレンジ', '5問以上のクイズに挑戦する',         60, 'knowledge'),
  ('daily_analyze', 'daily', 'デイリーチェック', '写真診断を実行する',                 50, 'beauty'),
  ('daily_3sets',   'daily', 'トリプルセット',   '3セット以上の筋トレを記録する',       50, 'physical'),
  ('weekly_streak', 'weekly','週間ストリーク',  '5日連続でワークアウトする',           200,'comprehensive')
on conflict (id) do nothing;

-- Seed achievements
insert into achievements (id, category, name, description, icon, xp_reward, level_type) values
  ('first_workout',    'physical',      '初回の挙重',     '初めてのワークアウトを記録', '🏃', 100, 'physical'),
  ('streak_7',         'physical',      '一週間ストリーク','7日連続ワークアウト',        '🔥', 200, 'physical'),
  ('streak_30',        'physical',      '一ヶ月ストリーク','30日連続ワークアウト',       '💪', 1000,'physical'),
  ('first_quiz',       'knowledge',     '初回のクイズ',   '初めてクイズに挑戦',           '📚', 50,  'knowledge'),
  ('quiz_perfect',     'knowledge',     '満点',           'クイズで全問正解',             '⭐',  300, 'knowledge'),
  ('first_analyze',    'beauty',        '初回診断',       '初めて写真診断を実行',         '📷', 50,  'beauty'),
  ('lv10_physical',    'physical',      'フィジカルLv10', '身体レベル10到達',             '🏆', 500, 'physical'),
  ('lv10_knowledge',   'knowledge',     'ナレッジLv10',   '知識レベル10到達',             '🧠', 500, 'knowledge'),
  ('comprehensive_10', 'comprehensive', '総合レベル10',   '総合レベル10到達',             '🌟', 800, 'comprehensive')
on conflict (id) do nothing;
