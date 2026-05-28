export type LevelType = 'physical' | 'beauty' | 'knowledge' | 'comprehensive';

export type ThemeName = 'kawaii' | 'cool' | 'beautiful' | 'simple';

export type Mode = 'normal' | 'bad' | 'rest' | 'saiyan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface ThemeColors {
  primary: string;
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export interface UserLevel {
  user_id: string;
  level_type: LevelType;
  level: number;
  total_xp: number;
  current_title: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  theme: ThemeName;
  invite_code: string | null;
  onboarding_completed: boolean;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  title: string | null;
  started_at: string;
  finished_at: string | null;
  physical_xp_earned: number;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_personal_record: boolean;
  created_at?: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  created_at?: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  difficulty: number;
  question_text: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  time_limit_seconds: number;
}

export interface QuizSession {
  id: string;
  user_id: string;
  subject: string;
  difficulty_used: number;
  total_questions: number;
  correct_count: number;
  xp_earned: number;
  created_at?: string;
}

export interface Quest {
  id: string;
  quest_type: 'daily' | 'weekly' | 'event';
  title: string;
  description: string;
  xp_reward: number;
}

export interface UserQuestProgress {
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  assigned_date: string;
  quest?: Quest;
}

export interface Achievement {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Streak {
  user_id: string;
  streak_type: string;
  streak_days: number;
  last_activity_date: string | null;
}

export interface GlobalEffortScore {
  user_id: string;
  score_date: string;
  aes_score: number;
  daily_rank: number;
  ai_comment: string;
}

export interface Guild {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
}

export interface GuildMember {
  guild_id: string;
  user_id: string;
  role: string;
  profile?: Profile;
}

export interface NutritionData {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  final_nutrition: NutritionData;
  physical_xp_earned: number;
  logged_at: string;
}

export interface PhotoAnalysis {
  id: string;
  user_id: string;
  analysis_type: 'face' | 'body' | 'flexibility';
  ai_response: Record<string, unknown>;
  scores: Record<string, number>;
  xp_earned: number;
  created_at?: string;
}
