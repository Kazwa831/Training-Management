import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicClient, SUGGEST_MODEL } from "./client";
import { DAY_TYPE_LABELS, getExercisesByCategory } from "@/lib/exercises";
import type { DayType, FatigueLevel, Goal } from "@/types/database";
import type { Exercise } from "@/types/exercise";

const DAY_TYPE_ROTATION: DayType[] = ["legs", "push", "pull", "cardio_core"];

export interface SuggestionInput {
  weightKg: number;
  fatigueLevel: FatigueLevel | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  goal: Goal | null;
}

export interface SuggestedExercise {
  exerciseId: string;
  targetReps?: number;
  targetWeightHint?: number;
}

export interface SuggestionResult {
  source: "ai" | "fallback";
  dayType: DayType;
  comment: string;
  exercises: SuggestedExercise[];
  cardio?: { exerciseId: string; targetMinutes?: number };
}

/** 直近のワークアウト日のday_typeから、次に行うべき種目タイプをローテーションで決める */
async function determineNextDayType(supabase: SupabaseClient): Promise<DayType> {
  const { data } = await supabase
    .from("workout_logs")
    .select("day_type")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastDayType = data?.day_type as DayType | null | undefined;
  if (!lastDayType) return "legs";

  const currentIndex = DAY_TYPE_ROTATION.indexOf(lastDayType);
  const nextIndex = (currentIndex + 1) % DAY_TYPE_ROTATION.length;
  return DAY_TYPE_ROTATION[nextIndex];
}

/** 種目ごとの直近の使用重量を調べる(過去の実績から、フォールバック時の重量目安に使う) */
async function fetchLastWeightByExercise(
  supabase: SupabaseClient,
): Promise<Map<string, number>> {
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id")
    .order("date", { ascending: false })
    .limit(20);

  const logIds = (logs ?? []).map((log) => log.id as string);
  if (logIds.length === 0) return new Map();

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("exercise_id, actual_weight, workout_log_id")
    .in("workout_log_id", logIds)
    .not("actual_weight", "is", null);

  // logsは日付降順で取得しているので、配列内で先に出てくるworkout_log_idほど新しい記録
  const logRank = new Map(logIds.map((id, index) => [id, index]));
  const bestRankByExercise = new Map<string, number>();
  const result = new Map<string, number>();

  for (const set of sets ?? []) {
    const rank = logRank.get(set.workout_log_id) ?? Number.MAX_SAFE_INTEGER;
    const currentBest = bestRankByExercise.get(set.exercise_id);
    if (currentBest === undefined || rank < currentBest) {
      bestRankByExercise.set(set.exercise_id, rank);
      result.set(set.exercise_id, set.actual_weight as number);
    }
  }

  return result;
}

const GOAL_LABEL: Record<Goal, string> = {
  bulk: "増量",
  cut: "減量",
  maintain: "維持",
};

function buildCandidateExercises(dayType: DayType): {
  strengthExercises: Exercise[];
  cardioExercises: Exercise[];
} {
  if (dayType === "cardio_core") {
    return {
      strengthExercises: getExercisesByCategory("core"),
      cardioExercises: getExercisesByCategory("cardio"),
    };
  }
  return { strengthExercises: getExercisesByCategory(dayType), cardioExercises: [] };
}

function buildFallbackSuggestion(
  dayType: DayType,
  input: SuggestionInput,
  lastWeightByExercise: Map<string, number>,
): SuggestionResult {
  const { strengthExercises, cardioExercises } = buildCandidateExercises(dayType);

  // 疲労度が高い日は回数を減らし、重量も少し落とす簡易調整(設計書8.3節:ルールベース版は簡易調整でよい)
  const isHighFatigue = (input.fatigueLevel ?? 3) >= 4;
  const targetReps = isHighFatigue ? 8 : 10;
  const weightMultiplier = isHighFatigue ? 0.9 : 1;

  // 種目数が多いカテゴリ(上半身プッシュ/プル)は、1日でこなしやすい4種目に絞る
  const pickedExercises = strengthExercises.slice(0, 4);

  const exercises: SuggestedExercise[] = pickedExercises.map((exercise) => {
    const lastWeight = lastWeightByExercise.get(exercise.id);
    return {
      exerciseId: exercise.id,
      targetReps,
      ...(lastWeight != null
        ? { targetWeightHint: Math.round(lastWeight * weightMultiplier * 2) / 2 }
        : {}),
    };
  });

  const cardio =
    dayType === "cardio_core" && cardioExercises.length > 0
      ? { exerciseId: cardioExercises[0].id, targetMinutes: isHighFatigue ? 15 : 20 }
      : undefined;

  return {
    source: "fallback",
    dayType,
    comment:
      "AI提案を利用できなかったため、直近の記録とローテーションに基づく標準メニューを提案しています。",
    exercises,
    cardio,
  };
}

const aiResponseSchema = z.object({
  comment: z.string(),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      targetReps: z.number().int().positive().optional(),
      targetWeightHint: z.number().min(0).optional(),
    }),
  ),
  cardio: z
    .object({
      exerciseId: z.string(),
      targetMinutes: z.number().min(0).optional(),
    })
    .optional(),
});

function extractJson(text: string): unknown {
  // Claudeが```json ... ```のようにコードフェンスで囲むことがあるため、念のため取り除く
  const stripped = text.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(stripped);
}

async function requestAiSuggestion(
  dayType: DayType,
  input: SuggestionInput,
): Promise<SuggestionResult | null> {
  const client = createAnthropicClient();
  if (!client) return null;

  const { strengthExercises, cardioExercises } = buildCandidateExercises(dayType);
  const candidateList = [...strengthExercises, ...cardioExercises]
    .map((exercise) => `- ${exercise.id}: ${exercise.name}(${exercise.muscleGroups.join("/")})`)
    .join("\n");

  const goalGuideline: string = input.goal
    ? {
        bulk: "高重量・中〜低回数を優先。有酸素は最小限(回復目的の軽い有酸素のみ)に留める。",
        cut: "回数をやや増やし、有酸素の時間配分を増やす。ただし疲労度が高い日は無理にボリュームを増やさない。",
        maintain: "現状のバランス型メニューを継続する。",
      }[input.goal]
    : "目標が未設定のため、バランス型メニューを提案する。";

  const systemPrompt = `あなたは経験豊富なパーソナルトレーナーです。ユーザーの体調・体型・目標に応じて、その日の筋トレメニューを提案してください。

# 目標別の調整方針
- 増量: 高重量・中〜低回数を優先。有酸素は最小限(回復目的の軽い有酸素のみ)に留める
- 減量: 回数をやや増やし、有酸素の時間配分を増やす。ただし疲労度が高い日は無理にボリュームを増やさない
- 維持: 現状のバランス型メニューを継続する
- 体脂肪率の推移が目標と逆行している場合は、コメント欄で押し付けがましくない範囲で軽く触れる

# 出力ルール
- 必ず以下のJSON形式のみを出力すること。JSON以外の文字列(説明文・コードフェンスなど)は一切含めないこと
- exerciseIdは下記の「今日選べる種目一覧」に載っているIDのみを使うこと。それ以外のIDを作らないこと
- 種目数は3〜4種目程度にすること

\`\`\`json
{
  "comment": "提案理由のコメント(日本語、2〜3文程度)",
  "exercises": [
    { "exerciseId": "squat", "targetReps": 10, "targetWeightHint": 60 }
  ],
  "cardio": { "exerciseId": "treadmill", "targetMinutes": 20 }
}
\`\`\`

"cardio"は種目タイプが「有酸素+体幹」の場合のみ含めること。それ以外の場合は省略すること。`;

  const userPrompt = `# 今日の情報
- 日付: ${new Date().toISOString().slice(0, 10)}
- 体重: ${input.weightKg}kg
- 疲労度: ${input.fatigueLevel ?? "未記録"}(1:楽 〜 5:きつい)
- 身長: ${input.heightCm != null ? `${input.heightCm}cm` : "未設定"}
- 直近の体脂肪率: ${input.bodyFatPct != null ? `${input.bodyFatPct}%` : "未記録"}
- 目標: ${input.goal ? GOAL_LABEL[input.goal] : "未設定"}(${goalGuideline})
- 今日の種目タイプ: ${DAY_TYPE_LABELS[dayType]}(ローテーションにより決定済み)

# 今日選べる種目一覧
${candidateList}

上記の種目一覧の中から、今日の体調・目標に合ったメニューをJSON形式で提案してください。`;

  try {
    const message = await client.messages.create({
      model: SUGGEST_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsedJson = extractJson(textBlock.text);
    const parsed = aiResponseSchema.safeParse(parsedJson);
    if (!parsed.success) return null;

    // AIが一覧にない種目IDを作ってしまっていないか(ハルシネーション対策)を確認する
    const validIds = new Set([...strengthExercises, ...cardioExercises].map((e) => e.id));
    const allValid = parsed.data.exercises.every((e) => validIds.has(e.exerciseId));
    if (!allValid) return null;
    if (parsed.data.cardio && !validIds.has(parsed.data.cardio.exerciseId)) return null;

    return {
      source: "ai",
      dayType,
      comment: parsed.data.comment,
      exercises: parsed.data.exercises,
      cardio: parsed.data.cardio,
    };
  } catch {
    return null;
  }
}

/** その日のメニュー提案を生成する。AI呼び出しに失敗した場合はルールベースにフォールバックする(設計書8.3節) */
export async function generateWorkoutSuggestion(
  supabase: SupabaseClient,
  input: SuggestionInput,
): Promise<SuggestionResult> {
  const dayType = await determineNextDayType(supabase);

  const aiResult = await requestAiSuggestion(dayType, input);
  if (aiResult) return aiResult;

  const lastWeightByExercise = await fetchLastWeightByExercise(supabase);
  return buildFallbackSuggestion(dayType, input, lastWeightByExercise);
}
