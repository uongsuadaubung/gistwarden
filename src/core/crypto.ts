import { argon2id } from "hash-wasm";
import {
  getAllSettings,
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "@/core/storage.ts";
import {
  SESSION_KEY_DERIVED_KEY,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/core/constants.ts";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";
export const ARGON2_ITERATIONS = 3;
export const ARGON2_MEMORY = 65536; // 64MB

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Result<CryptoKey, TranslationKey>> {
  const argonRes = await ResultAsync.fromPromise(
    argon2id({
      password: password,
      salt: salt,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY,
      parallelism: 1,
      hashLength: 32,
      outputType: "binary",
    }),
    (): TranslationKey => "settings_error_mp_fail",
  );
  if (argonRes.isErr()) return err(argonRes.error);

  const keyBytes = argonRes.value;
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

  const encryptRes = await ResultAsync.fromPromise(
    crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(data),
    ),
    (): TranslationKey => "toast_error",
  );
  if (encryptRes.isErr()) return err(encryptRes.error);

  const ciphertextBuffer = encryptRes.value;
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
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(ciphertextBase64));

  const decryptRes = await ResultAsync.fromPromise(
    crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    ),
    (): TranslationKey => "login_error_wrong_mp",
  );
  if (decryptRes.isErr()) return err(decryptRes.error);

  return ok(decoder.decode(decryptRes.value));
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return new Uint8Array(buffer).toBase64();
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.fromBase64(base64).buffer;
}

let derivedCryptoKey: CryptoKey | null = null;

export function clearDerivedKey(): void {
  derivedCryptoKey = null;
}

export async function setDerivedKey(key: CryptoKey | null): Promise<void> {
  derivedCryptoKey = key;
  if (key) {
    const raw = await crypto.subtle.exportKey("raw", key);
    const base64 = arrayBufferToBase64(raw);
    await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);
  } else {
    await removeSessionItem(SESSION_KEY_DERIVED_KEY);
  }
}

export async function getOrDeriveKey(
  password: string,
  saltBase64: string,
): Promise<Result<CryptoKey, TranslationKey>> {
  if (derivedCryptoKey) return ok(derivedCryptoKey);

  const saltBuffer = base64ToArrayBuffer(saltBase64);
  const salt = new Uint8Array(saltBuffer);

  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) {
    return err(deriveRes.error);
  }
  derivedCryptoKey = deriveRes.value;

  // Export raw bytes and save as Base64 to Session Storage
  const raw = await crypto.subtle.exportKey("raw", derivedCryptoKey);
  const base64 = arrayBufferToBase64(raw);
  await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);

  return ok(derivedCryptoKey);
}

export async function getSessionKey(): Promise<CryptoKey | null> {
  if (derivedCryptoKey) return derivedCryptoKey;

  const base64 = await getSessionItem(SESSION_KEY_DERIVED_KEY);
  if (typeof base64 === "string" && base64) {
    const buffer = base64ToArrayBuffer(base64);
    const importRes = await ResultAsync.fromPromise(
      crypto.subtle.importKey(
        "raw",
        buffer,
        { name: "AES-GCM", length: 256 },
        true, // extractable
        ["encrypt", "decrypt"],
      ),
      (e) => e,
    );
    if (importRes.isErr()) {
      console.error(
        "[Crypto] Failed to import key from session storage:",
        importRes.error,
      );
      return null;
    }
    derivedCryptoKey = importRes.value;
    return derivedCryptoKey;
  }
  return null;
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  const ivB64 = await getSessionItem(SESSION_KEY_VERIFICATION_IV);
  const ciphertextB64 = await getSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
  );
  const settings = await getAllSettings();
  const saltBase64 = settings.salt;
  if (
    typeof ivB64 !== "string" ||
    typeof ciphertextB64 !== "string" ||
    !saltBase64
  ) {
    return false;
  }

  const saltBuffer = base64ToArrayBuffer(saltBase64);
  const salt = new Uint8Array(saltBuffer);
  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) return false;
  const key = deriveRes.value;

  const decryptedRes = await decryptData(ciphertextB64, ivB64, key);
  if (decryptedRes.isErr()) return false;

  return decryptedRes.value === "verification_token";
}

export async function hashValue(
  value: string,
  saltBase64?: string,
): Promise<Result<string, TranslationKey>> {
  let saltStr = saltBase64;
  if (!saltStr) {
    const settings = await getAllSettings();
    if (!settings.salt) return err("login_error_wrong_pin"); // Adjust if needed
    saltStr = settings.salt;
  }
  const saltBuf = base64ToArrayBuffer(saltStr);
  const saltUi8 = new Uint8Array(saltBuf);

  const hashRes = await ResultAsync.fromPromise(
    argon2id({
      password: value,
      salt: saltUi8,
      parallelism: 1,
      iterations: 3,
      memorySize: 64 * 1024, // 64 MB
      hashLength: 32,
      outputType: "encoded",
    }),
    (error): TranslationKey => {
      console.error("[Crypto] argon2id hashing failed:", error);
      return "login_error_wrong_pin"; // Used commonly for pin/pass hash failures
    },
  );

  return hashRes;
}

export function importAesGcmKey(
  buffer: ArrayBuffer,
  errorKey: TranslationKey,
): ResultAsync<CryptoKey, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.importKey(
      "raw",
      buffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    ),
    (error): TranslationKey => {
      console.error("[Crypto] Failed to import AES-GCM key:", error);
      return errorKey;
    },
  );
}

export async function parseSshKey(privateKeyText: string): Promise<
  Result<{
    publicKey: string;
    keyFingerprint: string;
  }, TranslationKey>
> {
  const trimmed = privateKeyText.trim();
  if (!trimmed.includes("-----BEGIN OPENSSH PRIVATE KEY-----")) {
    return err("ssh_invalid_key");
  }

  // Extract base64 content
  const lines = trimmed.split("\n");
  const base64Lines = lines.filter((line) => !line.trim().startsWith("-----"));
  const base64Str = base64Lines.join("").replace(/\s/g, "");

  const buffer = base64ToArrayBuffer(base64Str);
  const bytes = new Uint8Array(buffer);

  // Read offset 39 (length of publickey_blob)
  if (bytes.length < 43) {
    return err("ssh_invalid_key");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pubKeyLen = view.getUint32(39);

  if (bytes.length < 43 + pubKeyLen) {
    return err("ssh_invalid_key");
  }

  const pubKeyBlob = bytes.slice(43, 43 + pubKeyLen);
  const pubKeyBlobBuffer = pubKeyBlob.buffer.slice(
    pubKeyBlob.byteOffset,
    pubKeyBlob.byteOffset + pubKeyBlob.byteLength,
  );

  // Read type string
  if (bytes.length < 47) {
    return err("ssh_invalid_key");
  }
  const typeLen = view.getUint32(43);
  if (bytes.length < 47 + typeLen) {
    return err("ssh_invalid_key");
  }
  const typeBytes = bytes.slice(47, 47 + typeLen);
  const typeStr = new TextDecoder().decode(typeBytes);

  // Encode public key
  const pubKeyBase64 = arrayBufferToBase64(pubKeyBlobBuffer);
  const publicKey = `${typeStr} ${pubKeyBase64}`;

  // Compute fingerprint (SHA-256)
  const hashRes = await ResultAsync.fromPromise(
    crypto.subtle.digest("SHA-256", pubKeyBlobBuffer),
    (e) => e,
  );
  if (hashRes.isErr()) {
    console.error("Failed to compute SHA-256 fingerprint:", hashRes.error);
    return err("ssh_invalid_key");
  }
  const hashBuffer = hashRes.value;

  const hashBytes = new Uint8Array(hashBuffer);
  const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
  const keyFingerprint = `SHA256:${hashBase64.replace(/=+$/, "")}`;

  return ok({
    publicKey,
    keyFingerprint,
  });
}
