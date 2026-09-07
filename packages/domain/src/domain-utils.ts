import { err, ok, type Result } from "neverthrow";
import { getDomain, getHostname as tldtsGetHostname, parse } from "tldts";
import type { TranslationKey } from "./i18n.ts";
import type { VaultItem } from "./vault-schemas.ts";
import { isLoginItem } from "./vault-types.ts";

/**
 * Phân tích URL an toàn sử dụng neverthrow Result.
 */
export function safeParseUrl(url: string): Result<URL, TranslationKey> {
  try {
    return ok(new URL(url));
  } catch (e) {
    console.warn("[DomainUtils] Invalid URL:", e);
    return err("sync_error_invalid_format");
  }
}

/**
 * Chuyển đổi phần hostname của URL (hoặc tên miền) sang dạng Punycode ASCII mà vẫn giữ nguyên protocol, path, query.
 * Ví dụ: "https://chínhphủ.vn/login?a=1" -> "https://xn--chnhph-4va0152d.vn/login?a=1"
 */
export function toPunycodeUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const urlString = hasProtocol ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(urlString);
    const href = url.href.toLowerCase();
    if (!hasProtocol && href.startsWith("http://")) {
      return href.slice(7);
    }
    return href;
  } catch {
    return trimmed.toLowerCase();
  }
}

/**
 * Chuyển đổi tên miền / hostname có ký tự Unicode (ví dụ: chínhphủ.vn) sang dạng Punycode ASCII (xn--chngph-tza99a.vn).
 * Đảm bảo việc so sánh tên miền luôn nhất quán bất kể nguồn nhập là Unicode hay Punycode.
 */
export function toPunycodeHostname(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const urlString = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return trimmed.toLowerCase();
  }
}

/**
 * Trích xuất Hostname từ một URL hoặc chuỗi tên miền (đã loại bỏ www., protocol, port, path).
 */
export function getHostname(input: string): string {
  if (!input) return "";
  const punyHost = toPunycodeHostname(input);
  const host = tldtsGetHostname(punyHost);
  if (!host) return punyHost;
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
  const punyHost = toPunycodeHostname(input);
  const domain = getDomain(punyHost);
  if (domain) {
    return domain;
  }
  return getHostname(punyHost);
}

/**
 * Lấy hostname hoặc domain từ một VaultItem (áp dụng cho LoginItem)
 */
export function getDomainFromItem(item: VaultItem): string | null {
  const firstUri = isLoginItem(item) ? item.login.uris?.[0] : undefined;
  if (!firstUri) {
    return null;
  }
  const uri = firstUri.uri;
  let hostname = uri;
  if (!/^https?:\/\//i.test(hostname)) {
    hostname = `http://${hostname}`;
  }
  return safeParseUrl(hostname)
    .map((url) => url.hostname)
    .unwrapOr(null);
}

/**
 * Trích xuất tên miền/hostname từ URL của tab đang mở
 */
export function extractDomainFromTabUrl(url?: string | null): string {
  if (!url) return "";
  return getHostname(url);
}

/**
 * Thẩm định xem Relying Party ID (rpId) có hợp lệ đối với origin đang gọi WebAuthn hay không.
 * Thực hiện chính xác theo đặc tả W3C WebAuthn Section 5.1.4:
 * - Origin phải sử dụng giao thức HTTPS (ngoại trừ localhost / 127.0.0.1)
 * - Cả rpId và origin phải là tên miền hợp lệ (từ chối IP addresses, trừ localhost / 127.0.0.1)
 * - Cả hai phải có cùng registrable domain (eTLD+1)
 * - Origin phải khớp chính xác với rpId hoặc là subdomain của rpId
 * - Từ chối single-label domain (như TLD trần) trừ khi là localhost
 *
 * @see https://www.w3.org/TR/webauthn-2/#rp-id
 */
export function isValidRpIdForOrigin(rpId: string, origin: string): boolean {
  if (!rpId || !origin) {
    return false;
  }

  const cleanRpId = rpId.trim().toLowerCase();
  const parsedOrigin = parse(origin, { allowPrivateDomains: true });
  const parsedRpId = parse(cleanRpId, { allowPrivateDomains: true });

  if (!parsedRpId || !parsedOrigin) {
    return false;
  }

  // Localhost hoặc 127.0.0.1: hợp lệ khi cả 2 đều là localhost / 127.0.0.1
  const isLocalOrigin =
    parsedOrigin.hostname === "localhost" ||
    parsedOrigin.hostname === "127.0.0.1";
  const isLocalRpId =
    parsedRpId.hostname === "localhost" || parsedRpId.hostname === "127.0.0.1";

  if (isLocalOrigin && isLocalRpId) {
    return true;
  }

  // Origin phải có scheme https:// (ngoại trừ localhost)
  if (!origin.startsWith("https://") && !isLocalOrigin) {
    return false;
  }

  // Từ chối địa chỉ IP (cả 2 phải là tên miền)
  if (parsedRpId.isIp || parsedOrigin.isIp) {
    return false;
  }

  // Từ chối domain 1 nhãn (TLDs) trừ localhost
  if (cleanRpId !== "localhost" && !cleanRpId.includes(".")) {
    return false;
  }

  if (
    parsedOrigin.hostname != null &&
    parsedOrigin.hostname !== "localhost" &&
    !parsedOrigin.hostname.includes(".")
  ) {
    return false;
  }

  // Cùng registrable domain (eTLD+1)
  if (parsedRpId.domain !== parsedOrigin.domain) {
    return false;
  }

  // Khớp chính xác
  if (parsedOrigin.hostname === cleanRpId) {
    return true;
  }

  // Origin là subdomain của rpId (ví dụ: auth.example.com kết thúc bằng .example.com)
  if (
    parsedOrigin.hostname != null &&
    parsedOrigin.hostname.endsWith("." + cleanRpId)
  ) {
    return true;
  }

  return false;
}

/**
 * Trích xuất rpId hiệu lực theo chuẩn W3C WebAuthn Section 5.1.4.
 * Nếu website không khai báo rp.id (hoặc rpId), mặc định lấy hostname của origin.
 * TUYỆT ĐỐI KHÔNG lấy rp.name làm rpId vì rp.name chỉ là tên hiển thị (ví dụ: "GitHub" hay "Google, Inc.").
 */
export function getEffectiveRpId(
  declaredRpId: string | undefined | null,
  origin: string,
): string {
  if (declaredRpId && declaredRpId.trim()) {
    return declaredRpId.trim().toLowerCase();
  }

  const parsed = parse(origin, { allowPrivateDomains: true });
  return (parsed?.hostname || origin).toLowerCase();
}
