/**
 * Rust WASM Self-Initializing Singleton Loader & Automatic Proxy Guard
 * Nạp 100% file `.wasm` trực tiếp từ mô đun Rust compiled.
 */

import type { z } from "zod";
import * as wasmBindgen from "./generated/gistwarden_wasm";
import type { Folder, VaultItem } from "../vault-schemas.ts";

let isWasmLoaded = false;
let initPromise: Promise<boolean> | null = null;

export function ensureWasmInitialized(): boolean {
  if (isWasmLoaded) return true;

  try {
    if (typeof process !== "undefined" && process.versions?.node) {
      const fs = require("node:fs");
      const path = require("node:path");
      const wasmPath = path.join(__dirname, "generated", "gistwarden_wasm_bg.wasm");
      if (fs.existsSync(wasmPath)) {
        const bytes = fs.readFileSync(wasmPath);
        wasmBindgen.initSync({ module: bytes });
        isWasmLoaded = true;
        return true;
      }
    }
  } catch (e) {
    console.warn("[WASM Loader] Sync disk load warning:", e);
  }

  return isWasmLoaded;
}

export async function initWasmAsync(): Promise<boolean> {
  if (isWasmLoaded) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function") {
        const wasmUrl = chrome.runtime.getURL("gistwarden_wasm_bg.wasm");
        const res = await fetch(wasmUrl);
        const bytes = await res.arrayBuffer();
        wasmBindgen.initSync({ module: bytes });
        isWasmLoaded = true;
        return true;
      }
    } catch (e) {
      console.warn("[WASM Loader] Fetching extension .wasm file failed:", e);
    }

    return ensureWasmInitialized();
  })();

  return initPromise;
}

// Auto-trigger WASM preloading on module evaluation in extension contexts
if (typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function") {
  initWasmAsync().catch((e) => console.warn("[WASM Loader] Async preload warning:", e));
}

/**
 * Dynamic Proxy Guard around Rust WASM bindings.
 * AUTOMATICALLY ensures WASM module is initialized before calling ANY function export.
 * Eliminates manual initialization boilerplate on future WASM functions!
 */
export const wasm: typeof wasmBindgen = new Proxy(wasmBindgen, {
  get(_target, prop, receiver) {
    const val = Reflect.get(wasmBindgen, prop, receiver);
    if (typeof val === "function") {
      return (...args: unknown[]) => {
        ensureWasmInitialized();
        return val.apply(wasmBindgen, args);
      };
    }
    return val;
  },
});

/**
 * Ensures WASM is initialized asynchronously before executing any WASM logic.
 */
export async function withWasmAsync<T>(fn: () => T | Promise<T>): Promise<T> {
  await initWasmAsync();
  return fn();
}

export async function greetFromRust(name: string): Promise<string> {
  return `[Rust WASM Ready] ${wasm.greet(name)}`;
}

export async function fastXorRust(
  data: Uint8Array,
  key: Uint8Array,
): Promise<Uint8Array> {
  return wasm.fast_xor(data, key);
}

/**
 * Bóc tách secret Base32 ủy quyền 100% cho Rust WebAssembly (`url` crate)
 */
export function parseTotpSecretWasm(rawSecret: string): string {
  return wasm.parse_totp_secret(rawSecret);
}

/**
 * Sinh mã TOTP 6 chữ số ủy quyền 100% cho Rust WebAssembly (`totp-rs`, `hmac`, `sha1` crates)
 */
export function generateTotpCodeWasm(
  secretBase32: string,
  timestampMs: number = Date.now(),
  periodSecs: number = 30,
): string {
  return wasm.generate_totp_code(
    secretBase32,
    BigInt(timestampMs),
    BigInt(periodSecs),
  );
}

/**
 * Derives a key using Argon2id algorithm in Rust WebAssembly.
 */
export function deriveKeyArgon2idWasm(
  password: string,
  salt: Uint8Array,
  iterations?: number,
  memoryKib?: number,
  hashLength?: number,
): Uint8Array {
  return wasm.derive_key_argon2id(
    password,
    salt,
    iterations ?? null,
    memoryKib ?? null,
    hashLength ?? null,
  );
}

/**
 * Hashes a password using Argon2id algorithm in Rust WebAssembly.
 */
export function hashPasswordArgon2idWasm(
  password: string,
  salt: Uint8Array,
  iterations?: number,
  memoryKib?: number,
): string {
  return wasm.hash_password_argon2id(
    password,
    salt,
    iterations ?? null,
    memoryKib ?? null,
  );
}

/**
 * Trích xuất 5 ký tự đầu (prefix) và phần còn lại (suffix) SHA-1 hash ủy quyền 100% cho Rust WASM.
 */
export function sha1PrefixSuffixWasm(password: string): {
  prefix: string;
  suffix: string;
} {
  const raw = wasm.sha1_prefix_suffix(password);
  const [prefix, suffix] = raw.split(":");
  return { prefix, suffix };
}

/**
 * Tạo mã băm HMAC-SHA256 ủy quyền 100% cho Rust WebAssembly.
 */
export function hmacSha256Wasm(message: string, secretKey: string): string {
  return wasm.hmac_sha256(message, secretKey);
}

/**
 * Chuyển đổi chữ ký ECDSA P-256 IEEE P1363 (64 bytes) sang dạng ASN.1 DER bằng Rust WASM.
 */
export function p1363ToDerWasm(signature: Uint8Array): Uint8Array {
  return wasm.p1363_to_der(signature);
}

/**
 * Phân tích khóa OpenSSH bằng Rust WASM crate ssh-key.
 */
export function parseSshKeyWasm(privateKeyText: string): string[] {
  return wasm.parse_ssh_key(privateKeyText);
}

/**
 * Tạo gói dữ liệu Attestation Object chuẩn CBOR WebAuthn/Passkey bằng Rust WASM.
 */
export function packAttestationObjectWasm(authData: Uint8Array): Uint8Array {
  return wasm.pack_attestation_object(authData);
}

/**
 * Mã hóa COSE EC2 Public Key chuẩn CBOR WebAuthn/Passkey bằng Rust WASM.
 */
export function encodeCoseEc2PublicKeyWasm(
  x: Uint8Array,
  y: Uint8Array,
): Uint8Array {
  return wasm.encode_cose_ec2_public_key(x, y);
}

/**
 * Mã hóa độ dài CBOR chuẩn Major Type bằng Rust WASM.
 */
export function cborEncodeLengthWasm(
  majorType: number,
  length: number,
): Uint8Array {
  return wasm.cbor_encode_length(majorType, length);
}

/**
 * Mã hóa chuỗi Text String (Major Type 3) chuẩn CBOR bằng Rust WASM.
 */
export function cborTextStringWasm(s: string): Uint8Array {
  return wasm.cbor_text_string(s);
}

/**
 * Mã hóa chuỗi Byte String (Major Type 2) chuẩn CBOR bằng Rust WASM.
 */
export function cborByteStringWasm(bytes: Uint8Array): Uint8Array {
  return wasm.cbor_byte_string(bytes);
}

/**
 * Mã hóa Header của Map (Major Type 5) chuẩn CBOR bằng Rust WASM.
 */
export function cborMapHeaderWasm(numPairs: number): Uint8Array {
  return wasm.cbor_map_header(numPairs);
}

/**
 * Mã hóa số nguyên dương (Major Type 0) chuẩn CBOR bằng Rust WASM.
 */
export function cborPositiveIntWasm(n: number): Uint8Array {
  return wasm.cbor_positive_int(n);
}

/**
 * Mã hóa số nguyên âm (Major Type 1) chuẩn CBOR bằng Rust WASM.
 */
export function cborNegativeIntWasm(n: number): Uint8Array {
  return wasm.cbor_negative_int(n);
}

/**
 * Nối mảng các Uint8Array lại thành 1 mảng duy nhất bằng Rust WASM.
 */
export function concatBytesWasm(chunks: Uint8Array[]): Uint8Array {
  return wasm.concat_bytes(chunks);
}

/**
 * Sinh số nguyên ngẫu nhiên bảo mật trong khoảng [0, max - 1] bằng Rust WASM.
 */
export function getRandomBoundedIntWasm(max: number): number {
  return wasm.get_random_bounded_int(max);
}

/**
 * Mật khẩu ngẫu nhiên bảo mật bằng Rust WASM.
 */
export function generatePasswordWasm(
  length: number,
  uppercase: boolean,
  lowercase: boolean,
  numbers: boolean,
  specials: boolean,
  avoidAmbiguous: boolean,
  minNumbers: number,
  minSpecials: number,
): string {
  return wasm.generate_password(
    length,
    uppercase,
    lowercase,
    numbers,
    specials,
    avoidAmbiguous,
    minNumbers,
    minSpecials,
  );
}

/**
 * Mật khẩu dạng cụm từ ngẫu nhiên bảo mật bằng Rust WASM.
 */
export function generatePassphraseWasm(
  numWords: number,
  wordSeparator: string,
  capitalize: boolean,
  includeNumber: boolean,
  wordlist?: string[],
): string {
  return wasm.generate_passphrase(
    numWords,
    wordSeparator,
    capitalize,
    includeNumber,
    wordlist,
  );
}

export function getHostnameWasm(input: string): string {
  return wasm.get_hostname(input);
}

export function getBaseDomainWasm(input: string): string {
  return wasm.get_base_domain(input);
}

export function decodeQrFromBytesWasm(imageBytes: Uint8Array): string {
  return wasm.decode_qr_from_bytes(imageBytes);
}

export function parseCsvWasm(text: string): string[][] {
  const jsonStr = wasm.parse_csv(text);
  return JSON.parse(jsonStr);
}

export function unparseCsvWasm(rows: string[][]): string {
  const jsonRows = JSON.stringify(rows);
  return wasm.unparse_csv(jsonRows);
}

export function exportToBrowserCsvWasm(itemsJson: string): string {
  return wasm.export_to_browser_csv(itemsJson);
}

export function exportToBitwardenCsvWasm(
  itemsJson: string,
  foldersJson: string = "[]",
): string {
  return wasm.export_to_bitwarden_csv(itemsJson, foldersJson);
}

export function parseBrowserCsvImportWasm(csvText: string): {
  importedCount: number;
  newItems: VaultItem[];
} {
  const jsonStr = wasm.parse_browser_csv_import(csvText);
  return JSON.parse(jsonStr);
}

export function parseBitwardenCsvImportWasm(
  csvText: string,
  existingFoldersJson: string = "[]",
): {
  importedCount: number;
  newItems: VaultItem[];
  combinedFolders: Folder[];
} {
  const jsonStr = wasm.parse_bitwarden_csv_import(
    csvText,
    existingFoldersJson,
  );
  return JSON.parse(jsonStr);
}

export function parseJsonImportWasm(
  jsonText: string,
  existingItemsJson: string = "[]",
  existingFoldersJson: string = "[]",
): {
  importedCount: number;
  combinedItems: VaultItem[];
  combinedFolders: Folder[];
} {
  const jsonStr = wasm.parse_json_import(
    jsonText,
    existingItemsJson,
    existingFoldersJson,
  );
  return JSON.parse(jsonStr);
}

export function exportToJsonWasm(
  itemsJson: string,
  foldersJson: string = "[]",
): string {
  return wasm.export_to_json(itemsJson, foldersJson);
}

export function filterMatchingDomainItemsWasm(
  itemsJson: string,
  domainOrUrl: string,
  overrideMode?: number | null,
): string {
  return wasm.filter_matching_domain_items(
    itemsJson,
    domainOrUrl,
    overrideMode ?? null,
  );
}

export function parseHibpResponseWasm(
  responseText: string,
  suffix: string,
): number {
  return wasm.parse_hibp_response(responseText, suffix);
}

export function isSingleUriMatchWasm(
  storedUri: string,
  currentUrl: string,
  matchMode?: number | null,
  overrideMode?: number | null,
  targetHost: string = "",
  itemHost: string = "",
  targetBase: string = "",
  itemBase: string = "",
): boolean {
  return wasm.is_single_uri_match(
    storedUri,
    currentUrl,
    matchMode ?? null,
    overrideMode ?? null,
    targetHost,
    itemHost,
    targetBase,
    itemBase,
  );
}

export function filterVaultItemsByQueryWasm(
  itemsJson: string,
  searchQuery: string,
  filterType: string,
): string {
  return wasm.filter_vault_items_by_query(
    itemsJson,
    searchQuery,
    filterType,
  );
}

export function decodeQrCodeWasm(
  width: number,
  height: number,
  rgbaBytes: Uint8Array,
): string {
  return wasm.decode_qr_code(width, height, rgbaBytes);
}

export function estimatePasswordStrengthWasm(
  pass: string,
  userInputs?: string[],
): { score: number; entropy: number; guesses: number } {
  const inputsJson =
    userInputs && userInputs.length > 0 ? JSON.stringify(userInputs) : "";
  const raw = wasm.estimate_password_strength(pass, inputsJson);
  if (!raw) return { score: 0, entropy: 0, guesses: 1 };
  return JSON.parse(raw);
}

/**
 * Generic Helper to execute WASM functions, parse JSON/JsValue, and validate using Zod schemas.
 * Eliminates repetitive JSON.parse and safeParse boilerplate across the codebase.
 */
export function callWasmAndValidate<T>(
  fn: () => unknown,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  try {
    const raw = fn();
    if (raw === undefined || raw === null || raw === "") return fallback;
    const parsedData = typeof raw === "string" ? JSON.parse(raw) : raw;
    const validated = schema.safeParse(parsedData);
    if (!validated.success) {
      console.warn("[WASM Helper] Zod validation failed:", validated.error);
      return fallback;
    }
    return validated.data;
  } catch (e) {
    console.warn("[WASM Helper] WASM execution failed:", e);
    return fallback;
  }
}

export function filterMatchingDomainItemsWasmJs(
  items: unknown,
  domainOrUrl: string,
  overrideMode?: number | null,
): unknown {
  return (wasm as unknown as Record<string, Function>).filter_matching_domain_items_js(
    items,
    domainOrUrl,
    overrideMode ?? null,
  );
}

export function filterVaultItemsByQueryWasmJs(
  items: unknown,
  searchQuery: string,
  filterType: string,
): unknown {
  return (wasm as unknown as Record<string, Function>).filter_vault_items_by_query_js(
    items,
    searchQuery,
    filterType,
  );
}

export function mergeVaultPayloadWasmJs(
  localPayload: unknown,
  remotePayload: unknown,
  lastSyncTimestamp: number = 0,
): unknown {
  return (wasm as unknown as Record<string, Function>).merge_vault_payload_js(
    localPayload,
    remotePayload,
    BigInt(lastSyncTimestamp),
  );
}

export function mergeFoldersWasmJs(
  localFolders: unknown,
  remoteFolders: unknown,
): unknown {
  return (wasm as unknown as Record<string, Function>).merge_folders_js(
    localFolders,
    remoteFolders,
  );
}

export function mergeVaultItemsWasmJs(
  localItems: unknown,
  remoteItems: unknown,
  lastSyncTimestamp: number = 0,
): unknown {
  return (wasm as unknown as Record<string, Function>).merge_vault_items_js(
    localItems,
    remoteItems,
    BigInt(lastSyncTimestamp),
  );
}

export function mergeVaultPayloadWasm(
  localJson: string,
  remoteJson: string,
  lastSyncTimestamp: number = 0,
): string {
  return wasm.merge_vault_payload(
    localJson,
    remoteJson,
    BigInt(lastSyncTimestamp),
  );
}

export function mergeFoldersWasm(
  localFoldersJson: string,
  remoteFoldersJson: string,
): string {
  return wasm.merge_folders(localFoldersJson, remoteFoldersJson);
}

export function mergeVaultItemsWasm(
  localItemsJson: string,
  remoteItemsJson: string,
  lastSyncTimestamp: number = 0,
): string {
  return wasm.merge_vault_items(
    localItemsJson,
    remoteItemsJson,
    BigInt(lastSyncTimestamp),
  );
}
