import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateWorkoutSuggestion } from "@/lib/anthropic/suggest";
import { getTodayDateString } from "@/lib/utils";

// AIによる当日メニュー提案(設計書8章)。今日の体重が未記録の場合は提案できない。
export async function POST() {
  const supabase = createSupabaseServerClient();
  const today = getTodayDateString();

  const [{ data: bodyMetrics, error: bodyMetricsError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("body_metrics")
        .select("weight_kg, fatigue_level, body_fat_pct")
        .eq("date", today)
        .maybeSingle(),
      supabase.from("profile").select("height_cm, goal").eq("id", 1).maybeSingle(),
    ]);

  if (bodyMetricsError || profileError) {
    return NextResponse.json(
      { error: (bodyMetricsError ?? profileError)!.message },
      { status: 500 },
    );
  }

  if (!bodyMetrics) {
    return NextResponse.json(
      { error: "今日の体重がまだ記録されていません。先に体重を記録してください。" },
      { status: 400 },
    );
  }

  const suggestion = await generateWorkoutSuggestion(supabase, {
    weightKg: bodyMetrics.weight_kg,
    fatigueLevel: bodyMetrics.fatigue_level,
    heightCm: profile?.height_cm ?? null,
    bodyFatPct: bodyMetrics.body_fat_pct,
    goal: profile?.goal ?? null,
  });

  return NextResponse.json(suggestion);
}
