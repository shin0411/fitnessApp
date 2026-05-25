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
