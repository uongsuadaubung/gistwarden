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
  const cleanBase64 = base64.replace(/\s/g, "");
  const u8 = Uint8Array.fromBase64(cleanBase64);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
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

class Asn1Reader {
  private offset = 0;

  constructor(private bytes: Uint8Array) {}

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  readTag(): number | null {
    if (this.remaining < 1) return null;
    return this.bytes[this.offset++];
  }

  readLength(): number | null {
    if (this.remaining < 1) return null;
    let len = this.bytes[this.offset++];
    if (len & 0x80) {
      const numBytes = len & 0x7f;
      if (this.remaining < numBytes) return null;
      len = 0;
      for (let i = 0; i < numBytes; i++) {
        len = (len << 8) | this.bytes[this.offset++];
      }
    }
    return len;
  }

  readIntegerBytes(): Uint8Array | null {
    const tag = this.readTag();
    if (tag !== 0x02) return null;
    const len = this.readLength();
    if (len === null || this.remaining < len) return null;
    const bytes = this.bytes.subarray(this.offset, this.offset + len);
    this.offset += len;
    return bytes;
  }

  readSequence(): Asn1Reader | null {
    const tag = this.readTag();
    if (tag !== 0x30) return null;
    const len = this.readLength();
    if (len === null || this.remaining < len) return null;
    const sub = this.bytes.subarray(this.offset, this.offset + len);
    this.offset += len;
    return new Asn1Reader(sub);
  }
}

function encodeMpint(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start++;
  }
  const trimmed = bytes.subarray(start);
  const extraByte = (trimmed[0] & 0x80) ? 1 : 0;
  const result = new Uint8Array(4 + extraByte + trimmed.length);
  const view = new DataView(result.buffer);
  view.setUint32(0, extraByte + trimmed.length, false);
  if (extraByte) {
    result[4] = 0;
  }
  result.set(trimmed, 4 + extraByte);
  return result;
}

function parseLegacyRsaPem(base64Str: string): Uint8Array | null {
  try {
    const bytes = new Uint8Array(base64ToArrayBuffer(base64Str));
    const asn1 = new Asn1Reader(bytes);
    const seq = asn1.readSequence();
    if (!seq) return null;

    const _version = seq.readIntegerBytes();
    const modulus = seq.readIntegerBytes();
    const publicExponent = seq.readIntegerBytes();

    if (!modulus || !publicExponent) return null;

    const keyTypeBytes = new Uint8Array([
      0,
      0,
      0,
      7,
      ...new TextEncoder().encode("ssh-rsa"),
    ]);
    const mpintE = encodeMpint(publicExponent);
    const mpintN = encodeMpint(modulus);

    return new Uint8Array([
      ...keyTypeBytes,
      ...mpintE,
      ...mpintN,
    ]);
  } catch (e) {
    console.error("[parseLegacyRsaPem Error]", e);
    return null;
  }
}

class SshBufferReader {
  private view: DataView;
  private offset = 0;

  constructor(private bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  readUint32(): number | null {
    if (this.remaining < 4) return null;
    const val = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return val;
  }

  readBytes(len: number): Uint8Array | null {
    if (len < 0 || this.remaining < len) return null;
    const sub = this.bytes.subarray(this.offset, this.offset + len);
    this.offset += len;
    return sub;
  }

  readString(): string | null {
    const bytes = this.readStringBytes();
    if (!bytes) return null;
    return new TextDecoder().decode(bytes);
  }

  readStringBytes(): Uint8Array | null {
    const len = this.readUint32();
    if (len === null) return null;
    return this.readBytes(len);
  }
}

export async function parseSshKey(privateKeyText: string): Promise<
  Result<{
    publicKey: string;
    keyFingerprint: string;
  }, TranslationKey>
> {
  const trimmed = privateKeyText.trim();

  // 1. Check if direct Public Key string
  if (
    trimmed.startsWith("ssh-") ||
    trimmed.startsWith("ecdsa-") ||
    trimmed.startsWith("sk-")
  ) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      try {
        const pubKeyBlobBuffer = base64ToArrayBuffer(parts[1]);
        const hashRes = await ResultAsync.fromPromise(
          crypto.subtle.digest("SHA-256", pubKeyBlobBuffer),
          (e) => e,
        );
        if (hashRes.isOk()) {
          const hashBytes = new Uint8Array(hashRes.value);
          const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
          return ok({
            publicKey: trimmed,
            keyFingerprint: `SHA256:${hashBase64.replace(/=+$/, "")}`,
          });
        }
      } catch (_e) {
        // Fall through to error
      }
    }
  }

  // 2. Check if Legacy RSA PEM format (-----BEGIN RSA PRIVATE KEY-----)
  if (trimmed.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    const lines = trimmed.split("\n");
    const base64Lines = lines.filter((line) =>
      !line.trim().startsWith("-----")
    );
    const base64Str = base64Lines.join("").replace(/[^A-Za-z0-9+/=]/g, "");
    const pubKeyBlobBytes = parseLegacyRsaPem(base64Str);
    if (pubKeyBlobBytes) {
      const pubKeyBlobBuffer = pubKeyBlobBytes.slice().buffer;
      const pubKeyBase64 = arrayBufferToBase64(pubKeyBlobBuffer);
      const publicKey = `ssh-rsa ${pubKeyBase64}`;
      const hashRes = await ResultAsync.fromPromise(
        crypto.subtle.digest("SHA-256", pubKeyBlobBuffer),
        (e) => e,
      );
      if (hashRes.isOk()) {
        const hashBytes = new Uint8Array(hashRes.value);
        const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
        return ok({
          publicKey,
          keyFingerprint: `SHA256:${hashBase64.replace(/=+$/, "")}`,
        });
      }
    }
    return err("ssh_invalid_key");
  }

  // 3. Modern OpenSSH v1 format (-----BEGIN OPENSSH PRIVATE KEY-----)
  if (!trimmed.includes("-----BEGIN OPENSSH PRIVATE KEY-----")) {
    return err("ssh_invalid_key");
  }

  // Extract base64 content
  const lines = trimmed.split("\n");
  const base64Lines = lines.filter((line) => !line.trim().startsWith("-----"));
  const base64Str = base64Lines.join("").replace(/[^A-Za-z0-9+/=]/g, "");

  let buffer: ArrayBuffer;
  try {
    buffer = base64ToArrayBuffer(base64Str);
  } catch (_e) {
    return err("ssh_invalid_key");
  }

  const bytes = new Uint8Array(buffer);
  const reader = new SshBufferReader(bytes);

  // 1. Header Magic: "openssh-key-v1\0" (15 bytes)
  const magicBytes = reader.readBytes(15);
  if (!magicBytes) return err("ssh_invalid_key");
  const magic = new TextDecoder().decode(magicBytes);
  if (magic !== "openssh-key-v1\0") {
    return err("ssh_invalid_key");
  }

  // 2. Read SSH protocol fields dynamically
  const cipherName = reader.readString();
  const kdfName = reader.readString();
  const kdfOptions = reader.readStringBytes();
  const numKeys = reader.readUint32();

  if (
    cipherName === null ||
    kdfName === null ||
    kdfOptions === null ||
    numKeys === null ||
    numKeys < 1
  ) {
    return err("ssh_invalid_key");
  }

  // 3. Read Public Key 0 Blob
  const pubKeyBlobBytes = reader.readStringBytes();
  if (!pubKeyBlobBytes) return err("ssh_invalid_key");

  const pubKeyBlobBuffer = pubKeyBlobBytes.slice().buffer;

  // 4. Read key type string inside pubKeyBlob
  const pubKeyReader = new SshBufferReader(pubKeyBlobBytes);
  const keyTypeStr = pubKeyReader.readString();
  if (!keyTypeStr) return err("ssh_invalid_key");

  // 5. Read comment from Private Key Section if unencrypted (cipherName === "none")
  let comment = "";
  if (cipherName === "none") {
    const privKeySectionBytes = reader.readStringBytes();
    if (privKeySectionBytes) {
      const privReader = new SshBufferReader(privKeySectionBytes);
      const check1 = privReader.readUint32();
      const check2 = privReader.readUint32();
      if (check1 !== null && check1 === check2) {
        const privKeyType = privReader.readString();
        if (privKeyType === keyTypeStr) {
          if (keyTypeStr === "ssh-ed25519") {
            privReader.readStringBytes(); // pubKey (32 bytes)
            privReader.readStringBytes(); // privKey (64 bytes)
            const c = privReader.readString();
            if (c) comment = c.trim();
          } else if (keyTypeStr === "ssh-rsa") {
            privReader.readStringBytes(); // n
            privReader.readStringBytes(); // e
            privReader.readStringBytes(); // d
            privReader.readStringBytes(); // iqmp
            privReader.readStringBytes(); // p
            privReader.readStringBytes(); // q
            const c = privReader.readString();
            if (c) comment = c.trim();
          } else {
            let lastStr: string | null = null;
            while (privReader.remaining > 0) {
              const str = privReader.readString();
              if (str !== null) lastStr = str;
              else break;
            }
            if (lastStr) comment = lastStr.trim();
          }
        }
      }
    }
  }

  // 6. Encode public key string
  const pubKeyBase64 = arrayBufferToBase64(pubKeyBlobBuffer);
  const publicKey = comment
    ? `${keyTypeStr} ${pubKeyBase64} ${comment}`
    : `${keyTypeStr} ${pubKeyBase64}`;

  // 7. Compute fingerprint (SHA-256)
  const hashRes = await ResultAsync.fromPromise(
    crypto.subtle.digest("SHA-256", pubKeyBlobBuffer),
    (e) => e,
  );
  if (hashRes.isErr()) {
    console.error(
      "[Crypto] Failed to compute SHA-256 fingerprint:",
      hashRes.error,
    );
    return err("ssh_invalid_key");
  }

  const hashBytes = new Uint8Array(hashRes.value);
  const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
  const keyFingerprint = `SHA256:${hashBase64.replace(/=+$/, "")}`;

  return ok({
    publicKey,
    keyFingerprint,
  });
}
