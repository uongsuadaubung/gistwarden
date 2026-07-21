import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";

export function safeJsonParse(text: string): Result<unknown, TranslationKey> {
  const parseResult = Result.fromThrowable(
    () => JSON.parse(text),
    (_e) => _e,
  )();
  return parseResult.isOk() ? ok(parseResult.value) : err("storage_error");
}
