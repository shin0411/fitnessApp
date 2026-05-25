export type LevelType = 'physical' | 'beauty' | 'knowledge' | 'comprehensive';

export type ThemeName = 'kawaii' | 'cool' | 'beautiful' | 'simple';

export type Mode = 'normal' | 'bad' | 'rest' | 'saiyan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type BodyMetricType = 'weight' | 'body_fat' | 'bmi' | 'heart_rate';

export type ActivityType = 'run' | 'walk' | 'cycle' | 'hike';

export interface UserLevel {
  user_id: string;
  level_type: LevelType;
  level: number;
  total_xp: number;
  current_title: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  birth_date: string | null;
  gender: string | null;
  theme: ThemeName;
  invite_code: string | null;
  invited_by: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface ProfileDetails {
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  mbti: string | null;
  updated_at: string;
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
  duration_seconds: number | null;
  flexibility_score: number | null;
  is_personal_record: boolean;
  created_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  exercise_type: string | null;
  created_at: string;
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
  avg_response_seconds: number;
  xp_earned: number;
  created_at: string;
}

export interface PhotoAnalysis {
  id: string;
  user_id: string;
  analysis_type: 'face' | 'body' | 'flexibility';
  storage_path: string;
  ai_response: Record<string, unknown>;
  scores: Record<string, number>;
  xp_earned: number;
  feedback: string;
  is_peer_review: boolean;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  photo_path: string | null;
  ai_recognized_items: FoodItem[];
  user_added_items: FoodItem[];
  final_nutrition: NutritionData;
  physical_xp_earned: number;
  logged_at: string;
}

export interface FoodItem {
  name: string;
  quantity_g: number;
  confidence?: number;
}

export interface NutritionData {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  vitamin_a_mcg?: number;
  vitamin_b1_mg?: number;
  vitamin_b2_mg?: number;
  vitamin_b6_mg?: number;
  vitamin_b12_mcg?: number;
  vitamin_c_mg?: number;
  vitamin_d_mcg?: number;
  vitamin_e_mg?: number;
  vitamin_k_mcg?: number;
  folate_mcg?: number;
  iron_mg?: number;
  calcium_mg?: number;
  zinc_mg?: number;
  magnesium_mg?: number;
}

export interface DailyActivity {
  user_id: string;
  date: string;
  step_count: number;
  active_minutes: number;
  screen_time_minutes: number;
  sleep_minutes: number | null;
  sleep_quality: 'poor' | 'fair' | 'good' | 'excellent' | null;
  current_mode: Mode;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  metric_type: BodyMetricType;
  value: number;
  unit: string;
  source: 'manual' | 'apple_health' | 'google_fit' | 'bluetooth';
  recorded_at: string;
}

export interface GpsSession {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  distance_meters: number;
  duration_seconds: number;
  elevation_gain: number;
  route_geojson: unknown | null;
  calories_estimated: number;
  physical_xp_earned: number;
  started_at: string;
}

export interface Quest {
  id: string;
  quest_type: 'daily' | 'weekly' | 'event';
  title: string;
  description: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  xp_reward: number;
  level_type: LevelType;
  expires_at: string | null;
}

export interface UserQuestProgress {
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  assigned_date: string;
}

export interface Achievement {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  level_type: LevelType;
  condition_type: string;
  condition_value: Record<string, unknown>;
}

export interface GlobalEffortScore {
  user_id: string;
  score_date: string;
  aes_score: number;
  daily_rank: number;
  weekly_rank: number;
  monthly_rank: number;
  ai_comment: string;
}

export interface BenchmarkPersona {
  id: string;
  archetype: string;
  display_name: string;
  illustration_url: string | null;
  level: number;
  physique_params: Record<string, unknown>;
  beauty_params: Record<string, unknown>;
  knowledge_params: Record<string, unknown>;
  description: string;
  gender: string;
}

export interface Streak {
  user_id: string;
  streak_type: string;
  streak_days: number;
  last_activity_date: string | null;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  xpColor: string;
}
