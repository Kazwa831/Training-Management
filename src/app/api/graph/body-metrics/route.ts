import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 90; // 個人利用アプリのため、まずは直近90日分(約3か月)を返す

// グラフ画面:体重・体脂肪率・疲労度の推移(設計書 5章)
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const supabase = createSupabaseServerClient();

  // 直近N件を新しい順に取得してから、グラフ表示用に古い順へ並べ替える
  const { data, error } = await supabase
    .from("body_metrics")
    .select("date, weight_kg, body_fat_pct, fatigue_level")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const points = (data ?? [])
    .slice()
    .reverse()
    .map((row) => ({
      date: row.date,
      weightKg: row.weight_kg,
      bodyFatPct: row.body_fat_pct,
      fatigueLevel: row.fatigue_level,
    }));

  return NextResponse.json({ points });
}
