import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "./i18n.ts";
import { isLoginItem } from "./vault-types.ts";
import type { VaultItem } from "./vault-schemas.ts";
import {
  getBaseDomainWasm,
  getHostnameWasm,
  initWasmAsync,
} from "./wasm/index.ts";

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
 * Trích xuất Hostname từ một URL hoặc chuỗi tên miền ủy quyền 100% cho Rust WASM.
 */
export function getHostname(input: string): string {
  return getHostnameWasm(input);
}

export async function getHostnameAsync(input: string): Promise<string> {
  await initWasmAsync();
  return getHostnameWasm(input);
}

/**
 * Trích xuất base domain (registered domain / eTLD+1) từ một URL hoặc Hostname ủy quyền 100% cho Rust WASM
 * dựa trên danh sách chuẩn Public Suffix List (PSL).
 */
export function getBaseDomain(input: string): string {
  return getBaseDomainWasm(input);
}

export async function getBaseDomainAsync(input: string): Promise<string> {
  await initWasmAsync();
  return getBaseDomainWasm(input);
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

/**
 * Trích xuất tên miền/hostname từ URL của tab đang mở
 */
export function extractDomainFromTabUrl(url?: string | null): string {
  if (!url) return "";
  return getHostname(url);
}
