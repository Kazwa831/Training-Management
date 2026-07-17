import { EXERCISES, getExerciseMediaUrl } from "@/lib/exercises";
import type { ExerciseCategory } from "@/types/exercise";

const CATEGORY_ORDER: ExerciseCategory[] = ["legs", "push", "pull", "core", "cardio"];

// カテゴリごとの表示ラベルと色分け。プロトタイプのUIトーンを踏襲
// (下半身=amber、上半身プッシュ=rust寄りのorange、上半身プル=moss寄りのlime、有酸素+体幹=steel寄りのsky)
const CATEGORY_STYLES: Record<
  ExerciseCategory,
  { label: string; textClass: string; borderClass: string }
> = {
  legs: { label: "下半身", textClass: "text-amber-400", borderClass: "border-amber-500/40" },
  push: {
    label: "上半身プッシュ",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/40",
  },
  pull: { label: "上半身プル", textClass: "text-lime-400", borderClass: "border-lime-500/40" },
  core: { label: "体幹", textClass: "text-sky-400", borderClass: "border-sky-500/40" },
  cardio: { label: "有酸素", textClass: "text-sky-400", borderClass: "border-sky-500/40" },
};

// 種目カタログの一覧表示。カテゴリごとに開閉できるようにして、フォーム確認動画へのリンクを添える。
// TODO: セット数・回数・重量の記録・保存への接続は次のステップで実装する
export function ExerciseCatalog() {
  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category) => {
        const style = CATEGORY_STYLES[category];
        const exercises = EXERCISES.filter((exercise) => exercise.category === category);

        return (
          <details
            key={category}
            className={`rounded-md border ${style.borderClass} bg-neutral-900/50`}
          >
            <summary
              className={`min-h-[44px] cursor-pointer px-4 py-2 text-sm font-medium ${style.textClass}`}
            >
              {style.label}({exercises.length}種目)
            </summary>
            <ul className="space-y-3 px-4 pb-4">
              {exercises.map((exercise) => (
                <li key={exercise.id} className="rounded-md bg-neutral-900 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-neutral-100">{exercise.name}</p>
                    {exercise.media && (
                      <a
                        href={getExerciseMediaUrl(exercise.media)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[44px] shrink-0 items-center rounded-md border border-neutral-700 px-3 text-xs text-neutral-300"
                      >
                        フォームを見る
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {exercise.muscleGroups.join(" / ")}
                  </p>
                  <p className="mt-1 text-sm text-neutral-300">{exercise.description}</p>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
