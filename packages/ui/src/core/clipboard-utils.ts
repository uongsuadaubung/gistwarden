import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";

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

  try {
    await navigator.clipboard.writeText(text);
    return ok();
  } catch (e) {
    console.warn("[Clipboard] Failed to write text to clipboard:", e);
    return err("clipboard_copy_failed");
  }
}
