import { err, ok, Result } from "neverthrow";
import { toTranslationKey, type TranslationKey } from "./i18n.ts";
import { logger } from "./logger.ts";
import {
  aesGcmDecryptWasm,
  aesGcmEncryptWasm,
  compressDeflateWasm,
  decompressDeflateWasm,
  deriveKeyArgon2idWasm,
  generateRandomBytesWasm,
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
): Promise<Result<Uint8Array, TranslationKey>> {
  try {
    await initWasmAsync();
    const keyBytes = deriveKeyArgon2idWasm(password, salt);
    return ok(keyBytes);
  } catch (e) {
    logger.crypto.error("Key derivation (argon2id WASM) failed:", e);
    const errKey = typeof e === "string"
      ? e
      : (e instanceof Error ? e.message : "");
    return err(toTranslationKey(errKey, "settings_error_mp_fail"));
  }
}

export async function encryptData(
  data: string,
  key: Uint8Array,
): Promise<Result<{ iv: string; ciphertext: string }, TranslationKey>> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  try {
    const plaintextBytes = encoder.encode(data);
    const compressedBytes = compressDeflateWasm(plaintextBytes);
    const ciphertextBuffer = aesGcmEncryptWasm(
      compressedBytes,
      key,
      iv,
    );
    const ivBase64 = arrayBufferToBase64(iv);
    const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

    return ok({ iv: ivBase64, ciphertext: ciphertextBase64 });
  } catch (e) {
    logger.crypto.error("AES-GCM WASM Encryption failed:", e);
    const errKey = typeof e === "string"
      ? e
      : (e instanceof Error ? e.message : "");
    return err(toTranslationKey(errKey, "crypto_error_encrypt_failed"));
  }
}

export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: Uint8Array,
): Promise<Result<string, TranslationKey>> {
  const decoder = new TextDecoder();
  const ivRes = base64ToArrayBuffer(ivBase64);
  if (ivRes.isErr()) return err(ivRes.error);
  const ciphertextRes = base64ToArrayBuffer(ciphertextBase64);
  if (ciphertextRes.isErr()) return err(ciphertextRes.error);

  const iv = new Uint8Array(ivRes.value);
  const ciphertext = new Uint8Array(ciphertextRes.value);

  try {
    const decryptedBuffer = aesGcmDecryptWasm(
      ciphertext,
      key,
      iv,
    );
    const decompressedBytes = decompressDeflateWasm(decryptedBuffer);
    return ok(decoder.decode(decompressedBytes));
  } catch (e) {
    logger.crypto.error(
      "AES-GCM WASM Decryption failed (invalid Master Password / key):",
      e,
    );
    const errKey = typeof e === "string"
      ? e
      : (e instanceof Error ? e.message : "");
    return err(toTranslationKey(errKey, "login_error_wrong_mp"));
  }
}

export async function batchDecryptData(
  items: Array<{ ciphertextBase64: string; ivBase64: string }>,
  key: Uint8Array,
): Promise<Result<Array<Result<string, TranslationKey>>, TranslationKey>> {
  const results: Array<Result<string, TranslationKey>> = [];

  for (const item of items) {
    const ivRes = base64ToArrayBuffer(item.ivBase64);
    const ctRes = base64ToArrayBuffer(item.ciphertextBase64);
    if (ivRes.isErr() || ctRes.isErr()) {
      results.push(err("crypto_error_encrypt_failed"));
      continue;
    }
    try {
      const dec = aesGcmDecryptWasm(
        new Uint8Array(ctRes.value),
        key,
        new Uint8Array(ivRes.value),
      );
      const decompressed = decompressDeflateWasm(dec);
      results.push(ok(new TextDecoder().decode(decompressed)));
    } catch (e) {
      const errKey = typeof e === "string"
        ? e
        : (e instanceof Error ? e.message : "");
      results.push(err(toTranslationKey(errKey, "login_error_wrong_mp")));
    }
  }

  return ok(results);
}

export function generateSalt(): Uint8Array {
  return generateRandomBytesWasm(16);
}

export function arrayBufferToBase64(
  buffer: Uint8Array | ArrayBuffer,
): string {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return u8.toBase64();
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
    const errKey = typeof e === "string"
      ? e
      : (e instanceof Error ? e.message : "");
    return err(toTranslationKey(errKey, "crypto_error_encrypt_failed"));
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
    const errKey = typeof error === "string"
      ? error
      : (error instanceof Error ? error.message : "");
    return err(toTranslationKey(errKey, "login_error_wrong_pin"));
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
    const errKey = typeof e === "string"
      ? e
      : (e instanceof Error ? e.message : "");
    return err(toTranslationKey(errKey, "ssh_invalid_key"));
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

/**
 * An toàn bộ nhớ: Ghi đè toàn bộ mảng byte bằng số 0 để xóa sạch khóa/mật khẩu khỏi RAM.
 */
export function zeroize(buffer: Uint8Array | ArrayBuffer): void {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  u8.fill(0);
}
