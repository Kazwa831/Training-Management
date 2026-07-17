import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils";

// body_metricsは日付ごとに1件(date列がunique)。体重・体脂肪率・疲労度を
// プロフィール画面/今日画面のどちらからでも部分的に更新できるようにする。
const upsertSchema = z.object({
  date: z.iso.date().optional(), // 省略時は今日の日付を使う
  weightKg: z.number().positive().max(500).optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  fatigueLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]).optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が正しくありません" },
      { status: 400 },
    );
  }

  const { date, weightKg, bodyFatPct, fatigueLevel } = parsed.data;
  const targetDate = date ?? getTodayDateString();
  const supabase = createSupabaseServerClient();

  const { data: existing, error: selectError } = await supabase
    .from("body_metrics")
    .select("id")
    .eq("date", targetDate)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existing) {
    // 既存の記録がある日付は、渡された項目だけを部分更新する
    const updateFields: Record<string, number> = {};
    if (weightKg !== undefined) updateFields.weight_kg = weightKg;
    if (bodyFatPct !== undefined) updateFields.body_fat_pct = bodyFatPct;
    if (fatigueLevel !== undefined) updateFields.fatigue_level = fatigueLevel;

    const { error } = await supabase
      .from("body_metrics")
      .update(updateFields)
      .eq("date", targetDate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // 新規の日付はweight_kgがNOT NULLのため、体重が無いと新規作成できない
    if (weightKg === undefined) {
      return NextResponse.json(
        {
          error:
            "この日の体重がまだ記録されていません。先に「今日」画面で体重を記録してください。",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("body_metrics").insert({
      date: targetDate,
      weight_kg: weightKg,
      body_fat_pct: bodyFatPct ?? null,
      fatigue_level: fatigueLevel ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
