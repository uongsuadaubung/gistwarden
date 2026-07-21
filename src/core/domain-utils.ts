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
 * Trích xuất base domain (registered domain / domain chính) từ một URL hoặc Hostname
 * Ví dụ:
 * - auth.github.com -> github.com
 * - google.com.vn -> google.com.vn
 * - sub.google.com.vn -> google.com.vn
 * - localhost -> localhost
 * - 127.0.0.1 -> 127.0.0.1
 */
export function getHostname(input: string): string {
  if (!input) return "";
  let host = input.toLowerCase().trim();

  // Loại bỏ protocol
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // Loại bỏ path
  host = host.split("/")[0];

  // Loại bỏ port
  host = host.split(":")[0];

  // Loại bỏ www.
  if (host.startsWith("www.")) {
    host = host.slice(4);
  }
  return host;
}

export function getBaseDomain(input: string): string {
  const host = getHostname(input);
  if (!host) return "";

  const parts = host.split(".");
  if (parts.length <= 2) {
    return host;
  }

  // Kiểm tra IPv4
  const isIPv4 = parts.length === 4 && parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
  if (isIPv4) {
    return host;
  }

  // Danh sách ccSLD phổ biến
  const ccSLDs = [
    "com",
    "co",
    "net",
    "org",
    "edu",
    "gov",
    "mil",
    "biz",
    "info",
    "name",
    "asn",
  ];

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  if (ccSLDs.includes(secondLast) && last.length === 2) {
    if (parts.length >= 3) {
      return parts.slice(-3).join(".");
    }
  }

  return parts.slice(-2).join(".");
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
