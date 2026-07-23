import { err, ok, Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

/**
 * Ghi chuỗi văn bản vào bộ nhớ tạm (clipboard) một cách an toàn.
 * Trả về Promise<Result<void, TranslationKey>>.
 */
export async function writeClipboardText(
  text: string,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    !navigator.clipboard.writeText
  ) {
    return err("clipboard_copy_failed");
  }

  const res = await ResultAsync.fromPromise(
    navigator.clipboard.writeText(text),
    (e): TranslationKey => {
      console.warn("[Clipboard] Failed to write text to clipboard:", e);
      return "clipboard_copy_failed";
    },
  );

  if (res.isErr()) {
    return err(res.error);
  }
  return ok();
}
