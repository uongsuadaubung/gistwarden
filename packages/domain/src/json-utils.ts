import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "./i18n.ts";
import { logger } from "./logger.ts";

export function safeJsonParse(
  jsonString: string,
): Result<unknown, TranslationKey> {
  try {
    const data = JSON.parse(jsonString);
    return ok(data);
  } catch (e) {
    logger.app.warn("Failed to parse JSON string:", e);
    return err("sync_error_invalid_format");
  }
}
