// 種目カタログ用の型定義。DBには保存せず、src/lib/exercises.ts のコード内定数として管理する(設計書6章末尾)。

// 種目のカテゴリ。ワークアウト記録のday_type(下半身/上半身プッシュ/上半身プル/有酸素+体幹)に対応するが、
// 体幹と有酸素は種目カタログ上は別カテゴリとして管理する(カタログの内訳が「下半身6・上半身11・体幹3・有酸素4」のため)
export type ExerciseCategory = "legs" | "push" | "pull" | "core" | "cardio";

// 鍛えられる部位。1種目で複数部位に効くこともあるため配列で持つ
export type MuscleGroup =
  | "大腿四頭筋"
  | "ハムストリングス"
  | "臀筋"
  | "ふくらはぎ"
  | "大胸筋"
  | "三角筋"
  | "上腕三頭筋"
  | "広背筋"
  | "僧帽筋"
  | "上腕二頭筋"
  | "体幹"
  | "心肺機能";

/**
 * フォーム確認用の参考メディア。
 * 現時点ではYouTube動画のみだが、将来GIFや3Dアニメーションに差し替え・追加できるよう、
 * 種類(type)ごとに必要な情報を持つユニオン型にしている。
 * 新しい種類を追加したい場合は、このユニオンに型を1つ足すだけでよい。
 */
export type ExerciseMedia =
  | { type: "youtube"; videoId: string }
  | { type: "gif"; url: string } // 将来用(未使用)。GIFに対応する場合はurlにGIFファイルのパスを入れる
  | { type: "model3d"; url: string }; // 将来用(未使用)。3Dモデルに対応する場合はurlにモデルファイルのパスを入れる

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  /** 鍛えられる部位(複数可) */
  muscleGroups: MuscleGroup[];
  /** 初心者向けの簡単な説明(1〜2文程度) */
  description: string;
  /** フォーム確認用の参考動画。未設定の種目があってもよい */
  media?: ExerciseMedia;
}
