import { argon2id } from "hash-wasm";

export const ARGON2_ITERATIONS = 3;
export const ARGON2_MEMORY = 65536; // 64MB

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyBytes = await argon2id({
    password: password,
    salt: salt,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY,
    parallelism: 1,
    hashLength: 32,
    outputType: "binary",
  });

  const buffer = new ArrayBuffer(keyBytes.byteLength);
  new Uint8Array(buffer).set(keyBytes);

  return crypto.subtle.importKey(
    "raw",
    buffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptData(
  data: string,
  key: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data),
  );

  // Convert binary to base64
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertextBuffer)),
  );

  return { iv: ivBase64, ciphertext: ciphertextBase64 };
}

export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey,
): Promise<string> {
  const decoder = new TextDecoder();
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(
    atob(ciphertextBase64),
    (c) => c.charCodeAt(0),
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return decoder.decode(decryptedBuffer);
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

let derivedCryptoKey: CryptoKey | null = null;

export function clearDerivedKey(): void {
  derivedCryptoKey = null;
}

export function setDerivedKey(key: CryptoKey | null): void {
  derivedCryptoKey = key;
}

export async function getOrDeriveKey(
  password: string,
  saltBase64: string,
): Promise<CryptoKey> {
  if (derivedCryptoKey) return derivedCryptoKey;

  const saltBuffer = base64ToArrayBuffer(saltBase64);
  const salt = new Uint8Array(saltBuffer);

  derivedCryptoKey = await deriveKey(password, salt);
  return derivedCryptoKey;
}

export async function parseSshKey(privateKeyText: string): Promise<{
  publicKey: string;
  keyFingerprint: string;
} | null> {
  try {
    const trimmed = privateKeyText.trim();
    if (!trimmed.includes("-----BEGIN OPENSSH PRIVATE KEY-----")) {
      return null;
    }
    
    // Extract base64 content
    const lines = trimmed.split("\n");
    const base64Lines = lines.filter(line => !line.trim().startsWith("-----"));
    const base64Str = base64Lines.join("").replace(/\s/g, "");
    
    const buffer = base64ToArrayBuffer(base64Str);
    const bytes = new Uint8Array(buffer);
    
    // Read offset 39 (length of publickey_blob)
    if (bytes.length < 43) return null;
    
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const pubKeyLen = view.getUint32(39);
    
    if (bytes.length < 43 + pubKeyLen) return null;
    
    const pubKeyBlob = bytes.slice(43, 43 + pubKeyLen);
    const pubKeyBlobBuffer = pubKeyBlob.buffer.slice(pubKeyBlob.byteOffset, pubKeyBlob.byteOffset + pubKeyBlob.byteLength);
    
    // Read type string
    const typeLen = view.getUint32(43);
    const typeBytes = bytes.slice(47, 47 + typeLen);
    const typeStr = new TextDecoder().decode(typeBytes);
    
    // Encode public key
    const pubKeyBase64 = arrayBufferToBase64(pubKeyBlobBuffer);
    const publicKey = `${typeStr} ${pubKeyBase64}`;
    
    // Compute fingerprint (SHA-256)
    const hashBuffer = await crypto.subtle.digest("SHA-256", pubKeyBlobBuffer);
    const hashBytes = new Uint8Array(hashBuffer);
    const hashBase64 = arrayBufferToBase64(hashBytes.buffer);
    const keyFingerprint = `SHA256:${hashBase64.replace(/=+$/, "")}`;
    
    return {
      publicKey,
      keyFingerprint
    };
  } catch (e) {
    console.error("Failed to parse SSH key", e);
    return null;
  }
}
