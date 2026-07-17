"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { FatigueLevel } from "@/types/database";
import { ExerciseCatalog } from "@/components/today/ExerciseCatalog";
import { WorkoutRecorder } from "@/components/today/WorkoutRecorder";
import { IntervalTimer } from "@/components/today/IntervalTimer";

const FATIGUE_LEVELS: FatigueLevel[] = [1, 2, 3, 4, 5];

type BodyMetricsResponse = {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  fatigueLevel: FatigueLevel | null;
};

// 今日画面:体重・疲労度の入力(設計書 5章)
export default function TodayPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [weightKg, setWeightKg] = useState("");
  const [fatigueLevel, setFatigueLevel] = useState<FatigueLevel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/body-metrics");
      const data: BodyMetricsResponse = await response.json();
      setWeightKg(data.weightKg != null ? String(data.weightKg) : "");
      setFatigueLevel(data.fatigueLevel);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (weightKg === "") {
      setError("体重を入力してください");
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weightKg: Number(weightKg),
        ...(fatigueLevel != null ? { fatigueLevel } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "保存に失敗しました");
      setIsSaving(false);
      return;
    }

    setMessage("保存しました");
    setIsSaving(false);
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">今日</h1>

      {isLoading ? (
        <p className="mt-4 text-neutral-400">読み込み中...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label htmlFor="weight" className="block text-sm text-neutral-400">
              体重(kg)
            </label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-neutral-100"
              placeholder="例: 65.0"
            />
          </div>

          <div>
            <span className="block text-sm text-neutral-400">
              疲労度(1:楽 〜 5:きつい)
            </span>
            <div className="mt-1 flex gap-2">
              {FATIGUE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFatigueLevel(level)}
                  className={`min-h-[44px] flex-1 rounded-md border text-sm ${
                    fatigueLevel === level
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-neutral-700 text-neutral-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[44px] w-full rounded-md bg-amber-500 font-medium text-neutral-950 disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </form>
      )}

      {/* メニュー記録・種目カタログは体重・疲労度の読み込み状態に関わらず常に表示する */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">メニューを記録</h2>
        <p className="mt-1 text-sm text-neutral-400">
          種目タイプを選び、実施した種目・セットを記録します。
        </p>
        <div className="mt-4">
          <WorkoutRecorder />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">種目カタログ</h2>
        <p className="mt-1 text-sm text-neutral-400">
          フォームを確認したいときはこちらから種目を探せます。
        </p>
        <div className="mt-4">
          <ExerciseCatalog />
        </div>
      </section>

      {/* セット間の休憩時間を計測するフローティングタイマー(設計書4.3節) */}
      <IntervalTimer />
    </main>
  );
}
