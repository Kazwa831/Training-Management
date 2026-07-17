/**
 * 今日の日付を "YYYY-MM-DD" 形式で返す(日本時間基準)。
 * サーバーはUTCで動くことが多く、単純に new Date() を使うと
 * 日本時間の深夜0時〜9時の間だけ日付が1日ずれてしまうため、
 * タイムゾーンを明示して計算する。
 */
export function getTodayDateString(): string {
  // "sv-SE"ロケールはYYYY-MM-DD形式で日付を返すため、DB(date型)にそのまま渡せる
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

/**
 * 身長(cm)と体重(kg)からBMIを算出する。
 * BMI = 体重(kg) / 身長(m)^2
 * あくまで参考値であることをUI側で明記すること(設計書4.2節)。
 */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
