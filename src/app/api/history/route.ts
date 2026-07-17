import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType, FatigueLevel } from "@/types/database";

// 履歴一覧の1日分。詳細(種目・セット)は一覧には含めず、
// 展開時に既存の /api/body-metrics , /api/workout-logs (どちらも?date=で指定可能)を呼び出す
export interface HistoryDaySummary {
  date: string;
  weightKg: number | null;
  fatigueLevel: FatigueLevel | null;
  dayType: DayType | null;
}

const DEFAULT_LIMIT = 60; // 個人利用アプリのため、まずは直近60日分(約2か月)を返す

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const supabase = createSupabaseServerClient();

  const [{ data: bodyMetrics, error: bodyMetricsError }, { data: workoutLogs, error: workoutLogsError }] =
    await Promise.all([
      supabase
        .from("body_metrics")
        .select("date, weight_kg, fatigue_level")
        .order("date", { ascending: false })
        .limit(limit),
      supabase
        .from("workout_logs")
        .select("date, day_type")
        .order("date", { ascending: false })
        .limit(limit),
    ]);

  if (bodyMetricsError || workoutLogsError) {
    return NextResponse.json(
      { error: (bodyMetricsError ?? workoutLogsError)!.message },
      { status: 500 },
    );
  }

  // body_metrics(体重・疲労度)とworkout_logs(種目タイプ)は別テーブルなので、日付をキーにまとめ直す
  const summaryByDate = new Map<string, HistoryDaySummary>();

  for (const metrics of bodyMetrics ?? []) {
    summaryByDate.set(metrics.date, {
      date: metrics.date,
      weightKg: metrics.weight_kg,
      fatigueLevel: metrics.fatigue_level,
      dayType: null,
    });
  }

  for (const log of workoutLogs ?? []) {
    const existing = summaryByDate.get(log.date);
    if (existing) {
      existing.dayType = log.day_type;
    } else {
      summaryByDate.set(log.date, {
        date: log.date,
        weightKg: null,
        fatigueLevel: null,
        dayType: log.day_type,
      });
    }
  }

  const days = Array.from(summaryByDate.values()).sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );

  return NextResponse.json({ days });
}
