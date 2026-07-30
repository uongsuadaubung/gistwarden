import { err, ok, Result } from "neverthrow";
import { logger, type TranslationKey } from "@gistwarden/domain";

/**
 * Custom safe fetch helper of Gistwarden network architecture.
 * All network calls across the application MUST use this helper instead of raw global fetch.
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  return await fetch(url, options);
}

/**
 * Gửi yêu cầu fetch và đọc nội dung văn bản (text) một cách an toàn.
 * Trả về Result<string, TranslationKey>.
 */
export async function fetchText(
  url: string,
  options?: RequestInit,
): Promise<Result<string, TranslationKey>> {
  let res: Response;
  try {
    res = await safeFetch(url, options);
  } catch (e) {
    logger.network.warn(`Request to ${url} failed:`, e);
    return err("network_error_fetch_failed");
  }

  if (!res.ok) {
    if (res.status === 413 || res.status === 422) {
      return err("github_error_gist_size_limit");
    }
    if (res.status === 403 || res.status === 429) {
      return err("github_error_rate_limit");
    }
    return err("network_error_http_status");
  }

  try {
    const text = await res.text();
    return ok(text);
  } catch (e) {
    logger.network.warn("Reading response text failed:", e);
    return err("network_error_read_failed");
  }
}

/**
 * Gửi yêu cầu fetch và đọc nội dung JSON một cách an toàn.
 * Trả về Result<unknown, TranslationKey>.
 */
export async function fetchJson(
  url: string,
  options?: RequestInit,
): Promise<Result<unknown, TranslationKey>> {
  let res: Response;
  try {
    res = await safeFetch(url, options);
  } catch (e) {
    logger.network.warn(`Request to ${url} failed:`, e);
    return err("network_error_fetch_failed");
  }

  if (!res.ok) {
    return err("network_error_http_status");
  }

  try {
    const data: unknown = await res.json();
    return ok(data);
  } catch (e) {
    logger.network.warn("Parsing response JSON failed:", e);
    return err("network_error_read_failed");
  }
}

/**
 * Gửi yêu cầu fetch và đọc nội dung Blob một cách an toàn.
 * Trả về Result<Blob, TranslationKey>.
 */
export async function fetchBlob(
  url: string,
  options?: RequestInit,
): Promise<Result<Blob, TranslationKey>> {
  let res: Response;
  try {
    res = await safeFetch(url, options);
  } catch (e) {
    logger.network.warn(`Request to ${url} failed:`, e);
    return err("network_error_fetch_failed");
  }

  if (!res.ok) {
    return err("network_error_http_status");
  }

  try {
    const blob = await res.blob();
    return ok(blob);
  } catch (e) {
    logger.network.warn("Reading response blob failed:", e);
    return err("network_error_read_failed");
  }
}
