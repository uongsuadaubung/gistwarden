import { err, ok, Result, ResultAsync } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";

/**
 * Gửi yêu cầu fetch và đọc nội dung văn bản (text) một cách an toàn.
 * Trả về Result<string, TranslationKey>.
 */
export async function fetchText(
  url: string,
  options?: RequestInit,
): Promise<Result<string, TranslationKey>> {
  const fetchRes = await ResultAsync.fromPromise(
    fetch(url, options),
    (e) => {
      console.warn(`[Fetch] Request to ${url} failed:`, e);
      return "toast_error" as const;
    },
  );
  if (fetchRes.isErr()) {
    return err(fetchRes.error);
  }
  const res = fetchRes.value;
  if (!res.ok) {
    return err("toast_error");
  }

  const textRes = await ResultAsync.fromPromise(
    res.text(),
    (e) => {
      console.warn("[Fetch] Reading response text failed:", e);
      return "toast_error" as const;
    },
  );
  if (textRes.isErr()) {
    return err(textRes.error);
  }
  return ok(textRes.value);
}
