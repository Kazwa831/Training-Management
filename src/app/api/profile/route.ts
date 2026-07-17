import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateBmi } from "@/lib/utils";

// プロフィールは1行のみ運用(設計書6章)。固定でid=1を使う。
const PROFILE_ROW_ID = 1;

export async function GET() {
  const supabase = createSupabaseServerClient();

  const [{ data: profile, error: profileError }, { data: latest, error: latestError }] =
    await Promise.all([
      supabase
        .from("profile")
        .select("height_cm, goal")
        .eq("id", PROFILE_ROW_ID)
        .maybeSingle(),
      supabase
        .from("body_metrics")
        .select("date, weight_kg, body_fat_pct")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileError || latestError) {
    return NextResponse.json(
      { error: (profileError ?? latestError)!.message },
      { status: 500 },
    );
  }

  const heightCm = profile?.height_cm ?? null;
  const weightKg = latest?.weight_kg ?? null;
  const bmi =
    heightCm != null && weightKg != null
      ? calculateBmi(heightCm, weightKg)
      : null;

  return NextResponse.json({
    heightCm,
    goal: profile?.goal ?? null,
    latestWeightKg: weightKg,
    latestBodyFatPct: latest?.body_fat_pct ?? null,
    latestBodyMetricsDate: latest?.date ?? null,
    bmi,
  });
}

const updateProfileSchema = z.object({
  heightCm: z.number().positive().max(300).nullable(),
  goal: z.enum(["bulk", "cut", "maintain"]).nullable(),
});

export async function PUT(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が正しくありません" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("profile").upsert({
    id: PROFILE_ROW_ID,
    height_cm: parsed.data.heightCm,
    goal: parsed.data.goal,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
