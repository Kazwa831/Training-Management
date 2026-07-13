// Supabaseのテーブル構造に対応する型定義(設計書 6章)
// MVP実装フェーズで実データに合わせて拡充する

export type Goal = "bulk" | "cut" | "maintain";
export type DayType = "legs" | "push" | "pull" | "cardio_core";
export type FatigueLevel = 1 | 2 | 3 | 4 | 5;

export interface Profile {
  id: number;
  height_cm: number | null;
  goal: Goal | null;
  updated_at: string;
}

export interface BodyMetrics {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  fatigue_level: FatigueLevel | null;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  day_type: DayType | null;
  ai_comment: string | null;
  cardio_exercise_id: string | null;
  cardio_target_minutes: number | null;
  cardio_actual_minutes: number | null;
  note: string | null;
  feedback: "good" | "bad" | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_index: number;
  target_reps: number | null;
  target_weight_hint: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  note: string | null;
}
