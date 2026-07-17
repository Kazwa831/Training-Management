import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 90; // 個人利用アプリのため、まずは直近90日分(約3か月)を対象にする

// グラフ画面:種目別重量推移(種目選択式、設計書 5章)
// 1日に複数セット行っていることがあるため、その日の最大重量を代表値として返す
export async function GET(request: NextRequest) {
  const exerciseId = request.nextUrl.searchParams.get("exerciseId");
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseIdは必須です" }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const supabase = createSupabaseServerClient();

  const { data: logs, error: logsError } = await supabase
    .from("workout_logs")
    .select("id, date")
    .order("date", { ascending: false })
    .limit(limit);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const dateByLogId = new Map((logs ?? []).map((log) => [log.id, log.date]));
  const logIds = Array.from(dateByLogId.keys());

  if (logIds.length === 0) {
    return NextResponse.json({ points: [] });
  }

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("workout_log_id, actual_weight")
    .eq("exercise_id", exerciseId)
    .in("workout_log_id", logIds)
    .not("actual_weight", "is", null);

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 });
  }

  // 同じ日に複数セットがある場合は、その日の最大重量を代表値として使う
  const maxWeightByDate = new Map<string, number>();
  for (const set of sets ?? []) {
    const date = dateByLogId.get(set.workout_log_id);
    if (!date) continue;
    const weight = set.actual_weight as number;
    const current = maxWeightByDate.get(date);
    if (current === undefined || weight > current) {
      maxWeightByDate.set(date, weight);
    }
  }

  const points = Array.from(maxWeightByDate.entries())
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return NextResponse.json({ points });
}
