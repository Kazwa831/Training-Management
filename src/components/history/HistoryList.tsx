"use client";

import { useEffect, useState } from "react";
import { DAY_TYPE_LABELS, getExerciseById } from "@/lib/exercises";
import type { DayType, FatigueLevel } from "@/types/database";

type DaySummary = {
  date: string;
  weightKg: number | null;
  fatigueLevel: FatigueLevel | null;
  dayType: DayType | null;
};

type DayDetail = {
  bodyFatPct: number | null;
  note: string | null;
  aiComment: string | null;
  cardio: { exerciseId: string; targetMinutes: number | null; actualMinutes: number | null } | null;
  exercises: {
    exerciseId: string;
    sets: { actualReps: number | null; actualWeight: number | null }[];
  }[];
};

// 日付を「7月17日(金)」のような表示に整形する
function formatDateLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日(${weekday})`;
}

async function fetchDayDetail(date: string): Promise<DayDetail> {
  const [bodyMetricsRes, workoutLogRes] = await Promise.all([
    fetch(`/api/body-metrics?date=${date}`),
    fetch(`/api/workout-logs?date=${date}`),
  ]);
  const bodyMetrics = await bodyMetricsRes.json();
  const workoutLog = await workoutLogRes.json();

  return {
    bodyFatPct: bodyMetrics.bodyFatPct ?? null,
    note: workoutLog.note ?? null,
    aiComment: workoutLog.aiComment ?? null,
    cardio: workoutLog.cardio ?? null,
    exercises: workoutLog.exercises ?? [],
  };
}

function HistoryDayRow({ day }: { day: DaySummary }) {
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  async function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open || detail || isLoadingDetail) return;
    setIsLoadingDetail(true);
    const result = await fetchDayDetail(day.date);
    setDetail(result);
    setIsLoadingDetail(false);
  }

  return (
    <details
      className="rounded-md border border-neutral-800 bg-neutral-900/50"
      onToggle={handleToggle}
    >
      <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-4 py-2 text-sm">
        <span className="font-medium text-neutral-100">{formatDateLabel(day.date)}</span>
        <span className="flex items-center gap-3 text-neutral-400">
          {day.weightKg != null && <span>{day.weightKg}kg</span>}
          {day.dayType && (
            <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-xs text-amber-400">
              {DAY_TYPE_LABELS[day.dayType]}
            </span>
          )}
        </span>
      </summary>

      <div className="space-y-3 px-4 pb-4 text-sm">
        {isLoadingDetail && <p className="text-neutral-500">読み込み中...</p>}

        {detail && (
          <>
            <div className="flex gap-4 text-neutral-400">
              <span>疲労度: {day.fatigueLevel ?? "未記録"}</span>
              <span>体脂肪率: {detail.bodyFatPct != null ? `${detail.bodyFatPct}%` : "未記録"}</span>
            </div>

            {detail.cardio && (
              <p className="text-neutral-300">
                有酸素: {getExerciseById(detail.cardio.exerciseId)?.name ?? detail.cardio.exerciseId}
                {detail.cardio.actualMinutes != null && ` ${detail.cardio.actualMinutes}分`}
                {detail.cardio.targetMinutes != null && `(目標${detail.cardio.targetMinutes}分)`}
              </p>
            )}

            {detail.exercises.length > 0 && (
              <ul className="space-y-2">
                {detail.exercises.map((entry) => {
                  const exercise = getExerciseById(entry.exerciseId);
                  return (
                    <li key={entry.exerciseId} className="rounded-md bg-neutral-900 p-3">
                      <p className="font-medium text-neutral-100">
                        {exercise?.name ?? entry.exerciseId}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {entry.sets
                          .map((set) => {
                            const reps = set.actualReps != null ? `${set.actualReps}回` : null;
                            const weight =
                              set.actualWeight != null ? `${set.actualWeight}kg` : null;
                            if (!reps && !weight) return "-";
                            // 体幹種目など重量を伴わない種目は回数のみ表示する
                            return [weight, reps].filter(Boolean).join("×");
                          })
                          .join(" / ")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            {detail.aiComment && (
              <p className="rounded-md bg-neutral-900 p-3 text-neutral-300">
                {detail.aiComment}
              </p>
            )}

            {detail.note && <p className="text-neutral-400">メモ: {detail.note}</p>}

            {detail.exercises.length === 0 && !detail.cardio && (
              <p className="text-neutral-500">この日の種目記録はありません。</p>
            )}
          </>
        )}
      </div>
    </details>
  );
}

// 履歴画面:日付降順のログ一覧、タップで詳細展開(設計書 5章)
export function HistoryList() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/history");
      const data = await response.json();
      setDays(data.days ?? []);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-neutral-400">読み込み中...</p>;
  }

  if (days.length === 0) {
    return <p className="text-sm text-neutral-400">まだ記録がありません。</p>;
  }

  return (
    <div className="space-y-2">
      {days.map((day) => (
        <HistoryDayRow key={day.date} day={day} />
      ))}
    </div>
  );
}
