"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { FatigueLevel } from "@/types/database";

const FATIGUE_LEVELS: FatigueLevel[] = [1, 2, 3, 4, 5];

type BodyMetricsResponse = {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  fatigueLevel: FatigueLevel | null;
};

// 今日画面:体重・疲労度の入力(設計書 5章)
// TODO(Phase2以前のMVP範囲): AI提案・手動メニュー選択・セット記録・インターバルタイマーは以降のステップで実装する
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

  if (isLoading) {
    return (
      <main className="p-4">
        <h1 className="text-xl font-bold">今日</h1>
        <p className="mt-4 text-neutral-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">今日</h1>

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
    </main>
  );
}
