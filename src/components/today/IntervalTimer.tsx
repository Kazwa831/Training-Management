"use client";

import { useEffect, useRef, useState } from "react";

const PRESET_SECONDS = [60, 90, 120, 180];

/** 外部の音声ファイルを使わず、Web Audio APIで短いビープ音を鳴らす */
function playBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, context.currentTime);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
    oscillator.onended = () => context.close();
  } catch {
    // Web Audio APIが使えない環境では何もしない
  }
}

/** iOS Safariなど対応していない端末もあるため、非対応時は何もしない */
function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// セット間インターバルタイマー(設計書4.3節)。
// 種目カードとは独立した、画面右下のフローティングウィジェットとして実装している。
// 休憩は同時に1つしか発生しないため、種目ごとに個別のタイマーを持たせるより
// 画面全体で1つの共有タイマーを持つ方がシンプルで、実際の使い方にも合っている。
export function IntervalTimer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          vibrate();
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function handleSelectDuration(seconds: number) {
    setDurationSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
  }

  function handleStartPause() {
    if (remainingSeconds === 0) {
      setRemainingSeconds(durationSeconds);
    }
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setRemainingSeconds(durationSeconds);
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-4 z-40 flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-amber-500 px-3 text-sm font-bold text-neutral-950 shadow-lg"
        aria-label="インターバルタイマーを開く"
      >
        {isRunning ? formatTime(remainingSeconds) : "⏱"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-md border border-neutral-800 bg-neutral-900 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">セット間インターバルタイマー</p>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-neutral-500"
          aria-label="タイマーを閉じる"
        >
          ×
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="text-3xl font-bold tabular-nums text-neutral-100">
          {formatTime(remainingSeconds)}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleStartPause}
            className="min-h-[44px] rounded-md bg-amber-500 px-4 text-sm font-medium text-neutral-950"
          >
            {isRunning ? "一時停止" : remainingSeconds === 0 ? "再スタート" : "開始"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] rounded-md border border-neutral-700 px-4 text-sm text-neutral-300"
          >
            リセット
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {PRESET_SECONDS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => handleSelectDuration(seconds)}
            className={`min-h-[44px] flex-1 rounded-md border text-sm ${
              durationSeconds === seconds
                ? "border-amber-500 bg-amber-500/10 text-amber-400"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            {seconds}秒
          </button>
        ))}
      </div>

      {remainingSeconds === 0 && !isRunning && (
        <p className="mt-2 text-center text-sm text-emerald-400">
          休憩終了！次のセットを始めましょう
        </p>
      )}
    </div>
  );
}
