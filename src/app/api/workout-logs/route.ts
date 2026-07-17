import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils";

const setSchema = z.object({
  targetReps: z.number().int().positive().optional(),
  targetWeightHint: z.number().min(0).optional(),
  actualReps: z.number().int().positive().optional(),
  actualWeight: z.number().min(0).optional(),
});

const exerciseEntrySchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.array(setSchema).min(1),
});

const cardioSchema = z.object({
  exerciseId: z.string().min(1),
  targetMinutes: z.number().min(0).optional(),
  actualMinutes: z.number().min(0).optional(),
});

const upsertSchema = z.object({
  date: z.iso.date().optional(), // 省略時は今日の日付を使う
  dayType: z.enum(["legs", "push", "pull", "cardio_core"]),
  note: z.string().optional(),
  aiComment: z.string().optional(), // AI提案を使った場合の提案理由コメント(設計書8章)
  cardio: cardioSchema.optional(),
  exercises: z.array(exerciseEntrySchema).default([]),
});

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const targetDate = dateParam ?? getTodayDateString();
  const supabase = createSupabaseServerClient();

  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .select(
      "id, date, day_type, note, ai_comment, cardio_exercise_id, cardio_target_minutes, cardio_actual_minutes",
    )
    .eq("date", targetDate)
    .maybeSingle();

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  if (!log) {
    return NextResponse.json({
      date: targetDate,
      dayType: null,
      note: null,
      aiComment: null,
      cardio: null,
      exercises: [],
    });
  }

  const { data: sets, error: setsError } = await supabase
    .from("workout_sets")
    .select("exercise_id, set_index, target_reps, target_weight_hint, actual_reps, actual_weight")
    .eq("workout_log_id", log.id)
    .order("set_index", { ascending: true });

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 });
  }

  // exercise_idごとにセットをまとめ直す(DBには種目×セットのフラットな行で保存されているため)
  const exerciseIdOrder: string[] = [];
  const setsByExercise = new Map<
    string,
    {
      targetReps: number | null;
      targetWeightHint: number | null;
      actualReps: number | null;
      actualWeight: number | null;
    }[]
  >();
  for (const set of sets ?? []) {
    if (!setsByExercise.has(set.exercise_id)) {
      setsByExercise.set(set.exercise_id, []);
      exerciseIdOrder.push(set.exercise_id);
    }
    setsByExercise.get(set.exercise_id)!.push({
      targetReps: set.target_reps,
      targetWeightHint: set.target_weight_hint,
      actualReps: set.actual_reps,
      actualWeight: set.actual_weight,
    });
  }

  return NextResponse.json({
    date: log.date,
    dayType: log.day_type,
    note: log.note,
    aiComment: log.ai_comment,
    cardio: log.cardio_exercise_id
      ? {
          exerciseId: log.cardio_exercise_id,
          targetMinutes: log.cardio_target_minutes,
          actualMinutes: log.cardio_actual_minutes,
        }
      : null,
    exercises: exerciseIdOrder.map((exerciseId) => ({
      exerciseId,
      sets: setsByExercise.get(exerciseId)!,
    })),
  });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容が正しくありません" },
      { status: 400 },
    );
  }

  const { date, dayType, note, aiComment, cardio, exercises } = parsed.data;
  const targetDate = date ?? getTodayDateString();
  const supabase = createSupabaseServerClient();

  // workout_logsは日付ごとに1件(date列がunique)。今日の記録をupsertする
  const { data: log, error: upsertError } = await supabase
    .from("workout_logs")
    .upsert(
      {
        date: targetDate,
        day_type: dayType,
        note: note ?? null,
        ai_comment: aiComment ?? null,
        cardio_exercise_id: cardio?.exerciseId ?? null,
        cardio_target_minutes: cardio?.targetMinutes ?? null,
        cardio_actual_minutes: cardio?.actualMinutes ?? null,
      },
      { onConflict: "date" },
    )
    .select("id")
    .single();

  if (upsertError || !log) {
    return NextResponse.json(
      { error: upsertError?.message ?? "保存に失敗しました" },
      { status: 500 },
    );
  }

  // セットは個人利用アプリで件数も少ないため、複雑な差分更新はせず
  // 既存のセットを全削除してから今回の内容で入れ直すシンプルな方式にしている
  const { error: deleteError } = await supabase
    .from("workout_sets")
    .delete()
    .eq("workout_log_id", log.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const setRows = exercises.flatMap((exercise) =>
    exercise.sets.map((set, index) => ({
      workout_log_id: log.id,
      exercise_id: exercise.exerciseId,
      set_index: index + 1,
      target_reps: set.targetReps ?? null,
      target_weight_hint: set.targetWeightHint ?? null,
      actual_reps: set.actualReps ?? null,
      actual_weight: set.actualWeight ?? null,
    })),
  );

  if (setRows.length > 0) {
    const { error: insertError } = await supabase
      .from("workout_sets")
      .insert(setRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
