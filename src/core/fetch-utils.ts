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
    (e): TranslationKey => {
      console.warn(`[Fetch] Request to ${url} failed:`, e);
      return "network_error_fetch_failed";
    },
  );
  if (fetchRes.isErr()) {
    return err(fetchRes.error);
  }
  const res = fetchRes.value;
  if (!res.ok) {
    if (res.status === 413 || res.status === 422) {
      return err("github_error_gist_size_limit");
    }
    if (res.status === 403 || res.status === 429) {
      return err("github_error_rate_limit");
    }
    return err("network_error_http_status");
  }

  const textRes = await ResultAsync.fromPromise(
    res.text(),
    (e): TranslationKey => {
      console.warn("[Fetch] Reading response text failed:", e);
      return "network_error_read_failed";
    },
  );
  if (textRes.isErr()) {
    return err(textRes.error);
  }
  return ok(textRes.value);
}

/**
 * Gửi yêu cầu fetch và đọc nội dung Blob một cách an toàn.
 * Trả về Result<Blob, TranslationKey>.
 */
export async function fetchBlob(
  url: string,
  options?: RequestInit,
): Promise<Result<Blob, TranslationKey>> {
  const fetchRes = await ResultAsync.fromPromise(
    fetch(url, options),
    (e): TranslationKey => {
      console.warn(`[Fetch] Request to ${url} failed:`, e);
      return "network_error_fetch_failed";
    },
  );
  if (fetchRes.isErr()) {
    return err(fetchRes.error);
  }
  const res = fetchRes.value;
  if (!res.ok) {
    return err("network_error_http_status");
  }

  const blobRes = await ResultAsync.fromPromise(
    res.blob(),
    (e): TranslationKey => {
      console.warn("[Fetch] Reading response blob failed:", e);
      return "network_error_read_failed";
    },
  );
  if (blobRes.isErr()) {
    return err(blobRes.error);
  }
  return ok(blobRes.value);
}
