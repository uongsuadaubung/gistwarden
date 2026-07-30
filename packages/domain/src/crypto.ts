import { argon2id } from "hash-wasm";
import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "./i18n.ts";
import { logger } from "./logger.ts";
export const ARGON2_ITERATIONS = 3;
export const ARGON2_MEMORY = 65536; // 64MB

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Result<CryptoKey, TranslationKey>> {
  let keyBytes: Uint8Array;
  try {
    keyBytes = await argon2id({
      password: password,
      salt: salt,
      iterations: ARGON2_ITERATIONS,
      memorySize: ARGON2_MEMORY,
      parallelism: 1,
      hashLength: 32,
      outputType: "binary",
    });
  } catch (e) {
    logger.crypto.error("Key derivation (argon2id) failed:", e);
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
    const encoder = new TextEncoder();
    const keyData = encoder.encode(
      secretKey || "gistwarden_default_hmac_secret",
    );
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(message),
    );
    return ok(arrayBufferToBase64(signature));
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
    const hash = await argon2id({
      password: value,
      salt: saltUi8,
      parallelism: 1,
      iterations: 3,
      memorySize: 64 * 1024, // 64 MB
      hashLength: 32,
      outputType: "encoded",
    });
    return ok(hash);
  } catch (error) {
    logger.crypto.error("argon2id hashing failed:", error);
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

/**
 * Trình đọc giải mã cấu trúc ASN.1 DER (Distinguished Encoding Rules)
 * dùng để phân tích cú pháp các khóa riêng RSA PEM theo chuẩn RFC 3447 / PKCS #1.
 */
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

/**
 * Mã hóa số nguyên lớn theo chuẩn OpenSSH Wire Format mpint (Multiple Precision Integer)
 * quy định tại RFC 4251 Section 5.
 */
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
  const bytesRes = base64ToArrayBuffer(base64Str);
  if (bytesRes.isErr()) return null;
  const bytes = new Uint8Array(bytesRes.value);

  const asnRes = Result.fromThrowable(
    () => {
      const asn1 = new Asn1Reader(bytes);
      const seq = asn1.readSequence();
      if (!seq) return null;
      const _version = seq.readIntegerBytes();
      const modulus = seq.readIntegerBytes();
      const publicExponent = seq.readIntegerBytes();
      return { modulus, publicExponent };
    },
    (e) => {
      logger.crypto.error("[parseLegacyRsaPem Error]", e);
      return null;
    },
  )();

  if (
    asnRes.isErr() || !asnRes.value || !asnRes.value.modulus ||
    !asnRes.value.publicExponent
  ) {
    return null;
  }

  const { modulus, publicExponent } = asnRes.value;

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
}

/**
 * Trình đọc luồng dữ liệu nhị phân OpenSSH Wire Protocol theo chuẩn RFC 4251 Section 5.
 * Hỗ trợ bóc tách các trường chuỗi (string), số nguyên 32-bit (uint32) và mảng byte thô.
 */
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
      const pubKeyBlobBufferRes = base64ToArrayBuffer(parts[1]);
      if (pubKeyBlobBufferRes.isOk()) {
        const pubKeyBlobBuffer = pubKeyBlobBufferRes.value;
        try {
          const hashBuf = await crypto.subtle.digest(
            "SHA-256",
            pubKeyBlobBuffer,
          );
          const hashBytes = new Uint8Array(hashBuf);
          const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
          return ok({
            publicKey: trimmed,
            keyFingerprint: `SHA256:${hashBase64.replace(/=+$/, "")}`,
          });
        } catch (e) {
          logger.crypto.error("Failed to compute SHA-256 fingerprint:", e);
        }
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
      try {
        const hashBuf = await crypto.subtle.digest("SHA-256", pubKeyBlobBuffer);
        const hashBytes = new Uint8Array(hashBuf);
        const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
        return ok({
          publicKey,
          keyFingerprint: `SHA256:${hashBase64.replace(/=+$/, "")}`,
        });
      } catch (e) {
        logger.crypto.error("Failed to compute SHA-256 fingerprint:", e);
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

  const bufferRes = base64ToArrayBuffer(base64Str);
  if (bufferRes.isErr()) {
    return err("ssh_invalid_key");
  }

  const bytes = new Uint8Array(bufferRes.value);
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
  let hashBuf: ArrayBuffer;
  try {
    hashBuf = await crypto.subtle.digest("SHA-256", pubKeyBlobBuffer);
  } catch (e) {
    logger.crypto.error("Failed to compute SHA-256 fingerprint:", e);
    return err("ssh_invalid_key");
  }

  const hashBytes = new Uint8Array(hashBuf);
  const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
  const keyFingerprint = `SHA256:${hashBase64.replace(/=+$/, "")}`;

  return ok({
    publicKey,
    keyFingerprint,
  });
}

/**
 * Băm mật khẩu bằng SHA-1 và tách 5 ký tự đầu (prefix) & phần còn lại (suffix)
 * Phục vụ cơ chế quét HIBP k-Anonymity privacy protection.
 */
export async function hashPasswordSHA1PrefixSuffix(
  password: string,
): Promise<{ prefix: string; suffix: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return {
    prefix: hashHex.substring(0, 5),
    suffix: hashHex.substring(5),
  };
}
