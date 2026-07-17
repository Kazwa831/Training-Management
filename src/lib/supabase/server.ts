import { createClient } from "@supabase/supabase-js";

/**
 * サーバー側専用のSupabaseクライアント。
 * service role keyを使うため、Route Handler / Server Actionなどサーバー側コードからのみ呼び出すこと。
 * クライアントコンポーネントからは絶対に呼び出さない。
 */
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が設定されていません(.env.localを確認してください)",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // サーバー側で都度クライアントを作るため、セッション永続化は不要
      persistSession: false,
    },
  });
}
