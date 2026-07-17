import type { Exercise, ExerciseCategory, ExerciseMedia } from "@/types/exercise";

/**
 * 種目カタログ(下半身6・上半身プッシュ6/プル5・体幹3・有酸素4 = 計24種目)。
 * ジムの設備が変わった時だけここを修正すればよいよう、DBテーブル化せずコード内定数として持つ(設計書6章末尾)。
 *
 * フォーム確認用動画は、著作権・保守性・実装コストを考慮し、
 * YouTube公式のリンクを新しいタブで開く方式を採用している(埋め込みiframeは採用していない)。
 */
export const EXERCISES: Exercise[] = [
  // ── 下半身(legs) ──────────────────────────────
  {
    id: "squat",
    name: "スクワット",
    category: "legs",
    muscleGroups: ["大腿四頭筋", "臀筋", "ハムストリングス"],
    description:
      "下半身種目の基本。肩幅程度に足を開き、膝とお尻を曲げてしゃがみ、立ち上がる。",
    media: { type: "youtube", videoId: "WEvfJoTnCp8" },
  },
  {
    id: "leg-press",
    name: "レッグプレス",
    category: "legs",
    muscleGroups: ["大腿四頭筋", "臀筋"],
    description:
      "マシンに座り、足でプレートを押し出す種目。スクワットよりも腰への負担が少ない。",
    media: { type: "youtube", videoId: "XhKQQ9WoaPU" },
  },
  {
    id: "leg-extension",
    name: "レッグエクステンション",
    category: "legs",
    muscleGroups: ["大腿四頭筋"],
    description: "マシンに座り、膝を伸ばしてパッドを持ち上げ、太もも前面を鍛える種目。",
    media: { type: "youtube", videoId: "SvnV7N3FoV4" },
  },
  {
    id: "leg-curl",
    name: "レッグカール",
    category: "legs",
    muscleGroups: ["ハムストリングス"],
    description: "マシンに座る/うつ伏せになり、膝を曲げてパッドを引き上げ、太もも裏を鍛える種目。",
    media: { type: "youtube", videoId: "8LHWSVarxlw" },
  },
  {
    id: "stiff-leg-deadlift",
    name: "スティッフレッグドデッドリフト",
    category: "legs",
    muscleGroups: ["ハムストリングス", "臀筋"],
    description:
      "膝を軽く曲げたまま上体を前傾させてバーベルを下ろし、太もも裏〜お尻を伸ばしながら鍛える種目。",
    media: { type: "youtube", videoId: "q3yc_ER8lVE" },
  },
  {
    id: "seated-calf-raise",
    name: "シーテッドカーフレイズ",
    category: "legs",
    muscleGroups: ["ふくらはぎ"],
    description: "マシンに座った状態でかかとを上げ下げし、ふくらはぎを鍛える種目。",
    media: { type: "youtube", videoId: "yvt2VjXNzNk" },
  },

  // ── 上半身プッシュ(push) ──────────────────────
  {
    id: "bench-press",
    name: "ベンチプレス",
    category: "push",
    muscleGroups: ["大胸筋", "上腕三頭筋"],
    description: "ベンチに仰向けになり、バーベルを胸の上まで下ろして押し上げる、上半身プッシュの基本種目。",
    media: { type: "youtube", videoId: "gIYD2vAk0ZU" },
  },
  {
    id: "dumbbell-shoulder-press",
    name: "ダンベルショルダープレス",
    category: "push",
    muscleGroups: ["三角筋"],
    description: "ダンベルを肩の高さから頭上へ押し上げる種目。肩まわりを鍛える。",
    media: { type: "youtube", videoId: "l9tKrjjrDEM" },
  },
  {
    id: "incline-dumbbell-press",
    name: "インクラインダンベルプレス",
    category: "push",
    muscleGroups: ["大胸筋"],
    description: "背もたれを斜めに上げたベンチでダンベルを押し上げ、胸の上部を鍛える種目。",
    media: { type: "youtube", videoId: "IYmn5kpoiMY" },
  },
  {
    id: "dumbbell-fly",
    name: "ダンベルフライ",
    category: "push",
    muscleGroups: ["大胸筋"],
    description: "仰向けでダンベルを弧を描くように開閉し、胸をストレッチしながら鍛える種目。",
    media: { type: "youtube", videoId: "Sz68ItX4-D4" },
  },
  {
    id: "triceps-extension",
    name: "トライセプスエクステンション",
    category: "push",
    muscleGroups: ["上腕三頭筋"],
    description: "肘を固定し、前腕だけを動かして二の腕の裏側(上腕三頭筋)を鍛える種目。",
    media: { type: "youtube", videoId: "Xdy5c2SRXlk" },
  },
  {
    id: "side-raise",
    name: "サイドレイズ",
    category: "push",
    muscleGroups: ["三角筋"],
    description: "ダンベルを体の横から肩の高さまで持ち上げ、肩の丸みを作る種目。",
    media: { type: "youtube", videoId: "xMAGvn4s8Tg" },
  },

  // ── 上半身プル(pull) ──────────────────────────
  {
    id: "lat-pulldown",
    name: "ラットプルダウン",
    category: "pull",
    muscleGroups: ["広背筋"],
    description: "マシンのバーを座った状態で胸の前まで引き下げ、背中の広がりを鍛える種目。",
    media: { type: "youtube", videoId: "qy64wWjmNO0" },
  },
  {
    id: "seated-row",
    name: "シーテッドロー",
    category: "pull",
    muscleGroups: ["広背筋", "僧帽筋"],
    description: "マシンに座り、ハンドルをお腹に向かって引き寄せ、背中を鍛える種目。",
    media: { type: "youtube", videoId: "7BX-RNCB5Ew" },
  },
  {
    id: "one-hand-dumbbell-row",
    name: "ワンハンドダンベルロウ",
    category: "pull",
    muscleGroups: ["広背筋"],
    description: "ベンチに片手・片膝をつき、反対の手でダンベルを引き上げる種目。左右交互に行う。",
    media: { type: "youtube", videoId: "byXKnuxmB3s" },
  },
  {
    id: "barbell-curl",
    name: "バーベルカール",
    category: "pull",
    muscleGroups: ["上腕二頭筋"],
    description: "バーベルを下から持ち、肘を固定したまま巻き上げ、力こぶ(上腕二頭筋)を鍛える種目。",
    media: { type: "youtube", videoId: "BBSknE84H_g" },
  },
  {
    id: "face-pull",
    name: "フェイスプル",
    category: "pull",
    muscleGroups: ["三角筋", "僧帽筋"],
    description: "ケーブルを顔に向かって引き寄せ、肩の後ろ側・上背部を鍛える種目。",
    media: { type: "youtube", videoId: "q4WLlXVIEmE" },
  },

  // ── 体幹(core) ────────────────────────────────
  {
    id: "plank",
    name: "プランク",
    category: "core",
    muscleGroups: ["体幹"],
    description: "肘とつま先で体を一直線に支え、姿勢をキープする体幹トレーニング。",
    media: { type: "youtube", videoId: "lSKmC3kLT6w" },
  },
  {
    id: "crunch",
    name: "クランチ",
    category: "core",
    muscleGroups: ["体幹"],
    description: "仰向けで上体を軽く丸めるように起こし、お腹前面(腹直筋)を鍛える種目。",
    media: { type: "youtube", videoId: "qtAe_Yph6uQ" },
  },
  {
    id: "russian-twist",
    name: "ロシアンツイスト",
    category: "core",
    muscleGroups: ["体幹"],
    description: "座った状態で上体を左右にひねり、脇腹(腹斜筋)を鍛える種目。",
    media: { type: "youtube", videoId: "pAu2jlou79M" },
  },

  // ── 有酸素(cardio) ────────────────────────────
  {
    id: "treadmill",
    name: "トレッドミル",
    category: "cardio",
    muscleGroups: ["心肺機能"],
    description: "ランニングマシンでの歩行・走行。速度や傾斜を調整して負荷を変えられる。",
    media: { type: "youtube", videoId: "EKV_Y2BmEPg" },
  },
  {
    id: "exercise-bike",
    name: "エアロバイク",
    category: "cardio",
    muscleGroups: ["心肺機能"],
    description: "座ってペダルを漕ぐ有酸素マシン。膝への負担が少なく初心者にも扱いやすい。",
    media: { type: "youtube", videoId: "9mGLGb4PazI" },
  },
  {
    id: "elliptical",
    name: "クロストレーナー",
    category: "cardio",
    muscleGroups: ["心肺機能"],
    description: "腕と脚を同時に動かして全身運動になる有酸素マシン。関節への衝撃が少ない。",
    media: { type: "youtube", videoId: "u-dzpsS_IIk" },
  },
  {
    id: "stair-climber",
    name: "ステアクライマー",
    category: "cardio",
    muscleGroups: ["心肺機能"],
    description: "階段を昇り続けるような動きの有酸素マシン。お尻・太もも周りにも効く。",
    media: { type: "youtube", videoId: "SBSIES7Y7Rg" },
  },
];

/** カテゴリで種目を絞り込む(今後の手動メニュー選択画面等で使用) */
export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISES.filter((exercise) => exercise.category === category);
}

/** idから種目を取得する */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id);
}

/** フォーム確認用メディアの遷移先URLを取得する(mediaの種類が増えてもここだけ直せばよい) */
export function getExerciseMediaUrl(media: ExerciseMedia): string {
  switch (media.type) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${media.videoId}`;
    case "gif":
    case "model3d":
      return media.url;
  }
}
