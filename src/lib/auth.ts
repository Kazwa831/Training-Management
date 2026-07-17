import { createHmac, timingSafeEqual } from "crypto";

// 認証用Cookieの名前と有効期限(設計書9章:有効期限は長め、例30日)
export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Cookieに保存するトークンを生成する。
 * パスコードそのものをCookieに保存すると漏洩時に危険なため、
 * 環境変数APP_PASSCODEを鍵にしたHMACを代わりに保存する。
 */
function createAuthToken(passcode: string): string {
  return createHmac("sha256", passcode).update("authenticated").digest("hex");
}

/** 入力されたパスコードが環境変数APP_PASSCODEと一致するか(タイミング攻撃を避けるためtimingSafeEqualで比較) */
export function isCorrectPasscode(input: string): boolean {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return false;

  const inputBuffer = Buffer.from(input);
  const passcodeBuffer = Buffer.from(passcode);
  if (inputBuffer.length !== passcodeBuffer.length) return false;

  return timingSafeEqual(inputBuffer, passcodeBuffer);
}

/** ログイン成功時にCookieへ保存するトークンを発行する */
export function issueAuthToken(): string {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    throw new Error("APP_PASSCODE が設定されていません(.env.localを確認してください)");
  }
  return createAuthToken(passcode);
}

/** リクエストのCookieに入っていたトークンが有効か(proxy.tsから利用) */
export function isValidAuthToken(token: string | undefined): boolean {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode || !token) return false;

  const expected = createAuthToken(passcode);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  if (expectedBuffer.length !== tokenBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
