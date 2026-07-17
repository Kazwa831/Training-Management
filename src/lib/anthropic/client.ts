import Anthropic from "@anthropic-ai/sdk";

/**
 * サーバー側専用のAnthropicクライアント。
 * APIキーが未設定の場合はnullを返す(呼び出し側でルールベースのフォールバックに切り替える)。
 */
export function createAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// 設計書8.1節で推奨されているモデル
export const SUGGEST_MODEL = "claude-sonnet-5";
