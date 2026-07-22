import { getDomain, getHostname as tldtsGetHostname } from "tldts";
import { Result } from "neverthrow";
import { isLoginItem, type VaultItem } from "@/core/types.ts";

/**
 * Phân tích URL an toàn sử dụng neverthrow Result.
 */
export function safeParseUrl(url: string): Result<URL, string> {
  return Result.fromThrowable(
    () => new URL(url),
    (e) => e instanceof Error ? e.message : String(e),
  )();
}

/**
 * Trích xuất Hostname từ một URL hoặc chuỗi tên miền (đã loại bỏ www., protocol, port, path).
 */
export function getHostname(input: string): string {
  if (!input) return "";
  const host = tldtsGetHostname(input);
  if (!host) return "";
  return host.startsWith("www.") ? host.slice(4) : host;
}

/**
 * Trích xuất base domain (registered domain / eTLD+1) từ một URL hoặc Hostname sử dụng tldts
 * dựa trên danh sách chuẩn Public Suffix List (PSL).
 *
 * Ví dụ:
 * - auth.github.com -> github.com
 * - google.com.vn -> google.com.vn
 * - sub.google.com.vn -> google.com.vn
 * - sub.k12.wa.us -> k12.wa.us
 * - localhost -> localhost
 * - 127.0.0.1 -> 127.0.0.1
 */
export function getBaseDomain(input: string): string {
  if (!input) return "";
  const domain = getDomain(input);
  if (domain) {
    return domain;
  }
  return getHostname(input);
}

/**
 * Lấy hostname hoặc domain từ một VaultItem (áp dụng cho LoginItem)
 */
export function getDomainFromItem(item: VaultItem): string | null {
  if (!isLoginItem(item) || !item.login.uris || item.login.uris.length === 0) {
    return null;
  }
  const uri = item.login.uris[0].uri;
  let hostname = uri;
  if (!/^https?:\/\//i.test(hostname)) {
    hostname = "http://" + hostname;
  }
  return safeParseUrl(hostname).map((url) => url.hostname).unwrapOr(null);
}
