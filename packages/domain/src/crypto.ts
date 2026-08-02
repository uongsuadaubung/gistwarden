import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "./i18n.ts";
import { logger } from "./logger.ts";
import {
  deriveKeyArgon2idWasm,
  hashPasswordArgon2idWasm,
  hmacSha256Wasm,
  initWasmAsync,
  p1363ToDerWasm,
  parseSshKeyWasm,
  sha1PrefixSuffixWasm,
} from "./wasm/index.ts";

export { p1363ToDerWasm };

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Result<CryptoKey, TranslationKey>> {
  let keyBytes: Uint8Array;
  try {
    await initWasmAsync();
    keyBytes = deriveKeyArgon2idWasm(password, salt);
  } catch (e) {
    logger.crypto.error("Key derivation (argon2id WASM) failed:", e);
    return err("settings_error_mp_fail");
  }

  const buffer = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(buffer).set(keyBytes);

  return await importAesGcmKey(buffer, "settings_error_mp_fail");
}

export async function encryptData(
  data: string,
  key: CryptoKey,
): Promise<Result<{ iv: string; ciphertext: string }, TranslationKey>> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let ciphertextBuffer: ArrayBuffer;
  try {
    ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(data),
    );
  } catch (e) {
    logger.crypto.error("AES-GCM Encryption failed:", e);
    return err("crypto_error_encrypt_failed");
  }

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

  return ok({ iv: ivBase64, ciphertext: ciphertextBase64 });
}

export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey,
): Promise<Result<string, TranslationKey>> {
  const decoder = new TextDecoder();
  const ivRes = base64ToArrayBuffer(ivBase64);
  if (ivRes.isErr()) return err(ivRes.error);
  const ciphertextRes = base64ToArrayBuffer(ciphertextBase64);
  if (ciphertextRes.isErr()) return err(ciphertextRes.error);

  const iv = new Uint8Array(ivRes.value);
  const ciphertext = new Uint8Array(ciphertextRes.value);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
  } catch (e) {
    logger.crypto.error(
      "AES-GCM Decryption failed (invalid Master Password / key):",
      e,
    );
    return err("login_error_wrong_mp");
  }

  return ok(decoder.decode(decryptedBuffer));
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return new Uint8Array(buffer).toBase64();
}

export function base64ToArrayBuffer(
  base64: string,
): Result<ArrayBuffer, TranslationKey> {
  try {
    const cleanBase64 = base64.replace(/\s/g, "");
    const u8 = Uint8Array.fromBase64(cleanBase64);
    return ok(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength));
  } catch (e) {
    logger.crypto.error("base64ToArrayBuffer error:", e);
    return err("crypto_error_encrypt_failed");
  }
}

export async function computeHmac(
  message: string,
  secretKey: string,
): Promise<Result<string, TranslationKey>> {
  try {
    await initWasmAsync();
    const signature = hmacSha256Wasm(message, secretKey);
    return ok(signature);
  } catch (e) {
    logger.crypto.error("HMAC computation failed:", e);
    return err("crypto_error_encrypt_failed");
  }
}

export async function hashValue(
  value: string,
  saltBase64: string,
): Promise<Result<string, TranslationKey>> {
  const saltStr = saltBase64;
  if (!saltStr) {
    return err("login_error_wrong_pin");
  }
  const saltBufRes = base64ToArrayBuffer(saltStr || "");
  if (saltBufRes.isErr()) return err(saltBufRes.error);
  const saltUi8 = new Uint8Array(saltBufRes.value);

  try {
    await initWasmAsync();
    const hash = hashPasswordArgon2idWasm(value, saltUi8);
    return ok(hash);
  } catch (error) {
    logger.crypto.error("argon2id WASM hashing failed:", error);
    return err("login_error_wrong_pin");
  }
}

export async function importAesGcmKey(
  buffer: ArrayBuffer,
  errorKey: TranslationKey,
): Promise<Result<CryptoKey, TranslationKey>> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      buffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
    return ok(key);
  } catch (error) {
    logger.crypto.error("Failed to import AES-GCM key:", error);
    return err(errorKey);
  }
}

export async function parseSshKey(privateKeyText: string): Promise<
  Result<{
    publicKey: string;
    keyFingerprint: string;
  }, TranslationKey>
> {
  try {
    await initWasmAsync();
    const res = parseSshKeyWasm(privateKeyText);
    if (!res || res.length < 2) {
      return err("ssh_invalid_key");
    }
    return ok({
      publicKey: res[0],
      keyFingerprint: res[1],
    });
  } catch (e) {
    return err("ssh_invalid_key");
  }
}

/**
 * Băm mật khẩu bằng SHA-1 và tách 5 ký tự đầu (prefix) & phần còn lại (suffix)
 * Phục vụ cơ chế quét HIBP k-Anonymity privacy protection.
 */
export async function hashPasswordSHA1PrefixSuffix(
  password: string,
): Promise<{ prefix: string; suffix: string }> {
  await initWasmAsync();
  return sha1PrefixSuffixWasm(password);
}
