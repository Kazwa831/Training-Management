"use client";

import { useEffect, useState } from "react";
import { EXERCISES, getExerciseById, getExerciseMediaUrl } from "@/lib/exercises";
import type { DayType } from "@/types/database";
import type { Exercise, ExerciseCategory } from "@/types/exercise";

const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "legs", label: "下半身" },
  { value: "push", label: "上半身プッシュ" },
  { value: "pull", label: "上半身プル" },
  { value: "cardio_core", label: "有酸素+体幹" },
];

// day_typeに応じて、セットを記録する対象カテゴリを決める
// (cardio_coreの日は、有酸素は分単位で別管理し、体幹種目をセットで記録する)
function categoryForDayType(dayType: DayType): ExerciseCategory {
  if (dayType === "cardio_core") return "core";
  return dayType;
}

type SetInput = {
  reps: string;
  weight: string;
  targetReps?: number;
  targetWeightHint?: number;
};
type SelectedExercise = { exercise: Exercise; sets: SetInput[] };

type WorkoutLogResponse = {
  date: string;
  dayType: DayType | null;
  note: string | null;
  aiComment: string | null;
  cardio: { exerciseId: string; targetMinutes: number | null; actualMinutes: number | null } | null;
  exercises: {
    exerciseId: string;
    sets: {
      targetReps: number | null;
      targetWeightHint: number | null;
      actualReps: number | null;
      actualWeight: number | null;
    }[];
  }[];
};

type SuggestionResponse = {
  source: "ai" | "fallback";
  dayType: DayType;
  comment: string;
  exercises: { exerciseId: string; targetReps?: number; targetWeightHint?: number }[];
  cardio?: { exerciseId: string; targetMinutes?: number };
};

// 今日画面:AI提案 or 手動で種目タイプを選び、種目ごとのセット(回数・重量)を記録する(設計書 4.1節・5章・8章)
// TODO(Phase2): インターバルタイマーは別のステップで実装する
export function WorkoutRecorder() {
  const [isLoading, setIsLoading] = useState(true);
  const [dayType, setDayType] = useState<DayType | null>(null);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [cardioExerciseId, setCardioExerciseId] = useState("");
  const [cardioTargetMinutes, setCardioTargetMinutes] = useState("");
  const [cardioActualMinutes, setCardioActualMinutes] = useState("");
  const [note, setNote] = useState("");
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [suggestionSource, setSuggestionSource] = useState<"ai" | "fallback" | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/workout-logs");
      const data: WorkoutLogResponse = await response.json();

      if (data.dayType) {
        setDayType(data.dayType);
        setNote(data.note ?? "");
        setAiComment(data.aiComment);
        if (data.cardio) {
          setCardioExerciseId(data.cardio.exerciseId);
          setCardioTargetMinutes(
            data.cardio.targetMinutes != null ? String(data.cardio.targetMinutes) : "",
          );
          setCardioActualMinutes(
            data.cardio.actualMinutes != null ? String(data.cardio.actualMinutes) : "",
          );
        }
        setSelected(
          data.exercises.flatMap((entry) => {
            const exercise = getExerciseById(entry.exerciseId);
            if (!exercise) return []; // カタログに存在しないIDは無視する
            return [
              {
                exercise,
                sets: entry.sets.map((set) => ({
                  reps: set.actualReps != null ? String(set.actualReps) : "",
                  weight: set.actualWeight != null ? String(set.actualWeight) : "",
                  targetReps: set.targetReps ?? undefined,
                  targetWeightHint: set.targetWeightHint ?? undefined,
                })),
              },
            ];
          }),
        );
      }
      setIsLoading(false);
    }
    load();
  }, []);

  function handleSelectDayType(value: DayType) {
    setDayType(value);
    setSelected([]);
    setCardioExerciseId("");
    setCardioTargetMinutes("");
    setCardioActualMinutes("");
    setAiComment(null);
    setSuggestionSource(null);
  }

  async function handleGetSuggestion() {
    setSuggestionError(null);
    setIsSuggesting(true);

    const response = await fetch("/api/suggest", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setSuggestionError(data.error ?? "AI提案の取得に失敗しました");
      setIsSuggesting(false);
      return;
    }

    const suggestion = data as SuggestionResponse;
    setDayType(suggestion.dayType);
    setAiComment(suggestion.comment);
    setSuggestionSource(suggestion.source);
    setNote("");
    setSelected(
      suggestion.exercises.flatMap((suggested) => {
        const exercise = getExerciseById(suggested.exerciseId);
        if (!exercise) return [];
        return [
          {
            exercise,
            sets: [
              {
                reps: "",
                weight: "",
                targetReps: suggested.targetReps,
                targetWeightHint: suggested.targetWeightHint,
              },
            ],
          },
        ];
      }),
    );
    if (suggestion.cardio) {
      setCardioExerciseId(suggestion.cardio.exerciseId);
      setCardioTargetMinutes(
        suggestion.cardio.targetMinutes != null ? String(suggestion.cardio.targetMinutes) : "",
      );
      setCardioActualMinutes("");
    } else {
      setCardioExerciseId("");
      setCardioTargetMinutes("");
      setCardioActualMinutes("");
    }

    setIsSuggesting(false);
  }

  function addExercise(exercise: Exercise) {
    setSelected((prev) => [...prev, { exercise, sets: [{ reps: "", weight: "" }] }]);
  }

  function removeExercise(exerciseId: string) {
    setSelected((prev) => prev.filter((entry) => entry.exercise.id !== exerciseId));
  }

  function addSet(exerciseId: string) {
    setSelected((prev) =>
      prev.map((entry) =>
        entry.exercise.id === exerciseId
          ? { ...entry, sets: [...entry.sets, { reps: "", weight: "" }] }
          : entry,
      ),
    );
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setSelected((prev) =>
      prev.map((entry) =>
        entry.exercise.id === exerciseId
          ? { ...entry, sets: entry.sets.filter((_, i) => i !== setIndex) }
          : entry,
      ),
    );
  }

  function updateSet(
    exerciseId: string,
    setIndex: number,
    field: "reps" | "weight",
    value: string,
  ) {
    setSelected((prev) =>
      prev.map((entry) =>
        entry.exercise.id === exerciseId
          ? {
              ...entry,
              sets: entry.sets.map((set, i) =>
                i === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : entry,
      ),
    );
  }

  async function handleSave() {
    if (!dayType) {
      setError("種目タイプを選んでください");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    const exercisesPayload = selected
      .map((entry) => ({
        exerciseId: entry.exercise.id,
        sets: entry.sets
          .filter((set) => set.reps !== "" || set.weight !== "")
          .map((set) => ({
            ...(set.targetReps != null ? { targetReps: set.targetReps } : {}),
            ...(set.targetWeightHint != null ? { targetWeightHint: set.targetWeightHint } : {}),
            ...(set.reps !== "" ? { actualReps: Number(set.reps) } : {}),
            ...(set.weight !== "" ? { actualWeight: Number(set.weight) } : {}),
          })),
      }))
      .filter((entry) => entry.sets.length > 0);

    const response = await fetch("/api/workout-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayType,
        ...(note !== "" ? { note } : {}),
        ...(aiComment ? { aiComment } : {}),
        ...(dayType === "cardio_core" && cardioExerciseId !== ""
          ? {
              cardio: {
                exerciseId: cardioExerciseId,
                ...(cardioTargetMinutes !== ""
                  ? { targetMinutes: Number(cardioTargetMinutes) }
                  : {}),
                ...(cardioActualMinutes !== ""
                  ? { actualMinutes: Number(cardioActualMinutes) }
                  : {}),
              },
            }
          : {}),
        exercises: exercisesPayload,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "保存に失敗しました");
      setIsSaving(false);
      return;
    }

    setMessage("メニューを保存しました");
    setIsSaving(false);
  }

  const candidateExercises = dayType
    ? EXERCISES.filter(
        (exercise) =>
          exercise.category === categoryForDayType(dayType) &&
          !selected.some((entry) => entry.exercise.id === exercise.id),
      )
    : [];
  const cardioCandidates = EXERCISES.filter((exercise) => exercise.category === "cardio");

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-neutral-400">保存済みの記録を読み込み中...</p>}

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
        <button
          type="button"
          onClick={handleGetSuggestion}
          disabled={isSuggesting}
          className="min-h-[44px] w-full rounded-md bg-amber-500 font-medium text-neutral-950 disabled:opacity-50"
        >
          {isSuggesting ? "提案を作成中..." : "AI提案を受け取る"}
        </button>
        <p className="mt-2 text-xs text-neutral-500">
          今日の体重・疲労度をもとに、種目タイプとメニューの目安を提案します(先に体重の記録が必要です)。
        </p>
        {suggestionError && <p className="mt-2 text-sm text-red-400">{suggestionError}</p>}
        {aiComment && (
          <div className="mt-3 rounded-md bg-neutral-900 p-3">
            <p className="text-xs text-neutral-500">
              {suggestionSource === "fallback" ? "標準メニュー(フォールバック)" : "AI提案"}
            </p>
            <p className="mt-1 text-sm text-neutral-200">{aiComment}</p>
          </div>
        )}
      </div>

      <div>
        <span className="block text-sm text-neutral-400">種目タイプ</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {DAY_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectDayType(option.value)}
              className={`min-h-[44px] rounded-md border text-sm ${
                dayType === option.value
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : "border-neutral-700 text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {dayType === "cardio_core" && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-sm text-neutral-400">有酸素</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cardioCandidates.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setCardioExerciseId(exercise.id)}
                className={`min-h-[44px] rounded-md border px-3 text-sm ${
                  cardioExerciseId === exercise.id
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-neutral-700 text-neutral-300"
                }`}
              >
                {exercise.name}
              </button>
            ))}
          </div>

          {cardioExerciseId !== "" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500">目標時間(分)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={cardioTargetMinutes}
                  onChange={(e) => setCardioTargetMinutes(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500">実施時間(分)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={cardioActualMinutes}
                  onChange={(e) => setCardioActualMinutes(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {dayType && candidateExercises.length > 0 && (
        <div>
          <p className="text-sm text-neutral-400">
            {dayType === "cardio_core" ? "体幹の種目を追加" : "種目を追加"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {candidateExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => addExercise(exercise)}
                className="min-h-[44px] rounded-md border border-neutral-700 px-3 text-sm text-neutral-300"
              >
                + {exercise.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.map((entry) => (
        <div
          key={entry.exercise.id}
          className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-neutral-100">{entry.exercise.name}</p>
            <div className="flex items-center gap-2">
              {entry.exercise.media && (
                <a
                  href={getExerciseMediaUrl(entry.exercise.media)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center rounded-md border border-neutral-700 px-3 text-xs text-neutral-300"
                >
                  フォーム
                </a>
              )}
              <button
                type="button"
                onClick={() => removeExercise(entry.exercise.id)}
                className="flex min-h-[44px] items-center rounded-md border border-neutral-700 px-3 text-xs text-red-400"
              >
                削除
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {entry.sets.map((set, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 text-xs text-neutral-500">{index + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={
                    set.targetReps != null ? `回数(目安${set.targetReps})` : "回数"
                  }
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(entry.exercise.id, index, "reps", e.target.value)
                  }
                  className="min-h-[44px] w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={
                    set.targetWeightHint != null
                      ? `重量(目安${set.targetWeightHint}kg)`
                      : "重量(kg)"
                  }
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(entry.exercise.id, index, "weight", e.target.value)
                  }
                  className="min-h-[44px] w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => removeSet(entry.exercise.id, index)}
                  className="flex min-h-[44px] w-11 shrink-0 items-center justify-center rounded-md border border-neutral-700 text-neutral-400"
                  aria-label="このセットを削除"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSet(entry.exercise.id)}
              className="min-h-[44px] w-full rounded-md border border-dashed border-neutral-700 text-sm text-neutral-400"
            >
              + セットを追加
            </button>
          </div>
        </div>
      ))}

      {dayType && (
        <div>
          <label htmlFor="note" className="block text-sm text-neutral-400">
            メモ(任意)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {dayType && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="min-h-[44px] w-full rounded-md bg-amber-500 font-medium text-neutral-950 disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "メニューを保存"}
        </button>
      )}
    </div>
  );
}
