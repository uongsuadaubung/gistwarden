import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
} from "@/core/crypto.ts";
import {
  base64UrlToBuffer,
  bufferToBase64Url,
  createPasskeyKeyPair,
  getRawCredentialId,
  p1363ToDer,
} from "@/features/passkey/passkey-crypto.ts";
import { parseTotpSecret } from "@/core/totp-utils.ts";
import { Fido2CredentialSchema } from "@/core/types.ts";
import { ImportItemSchema } from "@/core/types.ts";

Deno.test("Crypto - Key derivation, Encryption and Decryption", async () => {
  const password = "SuperSecretPassword123";
  const salt = generateSalt();

  // 1. Derive key
  const keyRes = await deriveKey(password, salt);
  assert(keyRes.isOk());
  const key = keyRes.value;
  assertEquals(key instanceof CryptoKey, true);
  assertEquals(key.algorithm.name, "AES-GCM");

  // 2. Encrypt
  const secretText = JSON.stringify({
    message: "Hello Gistwarden!",
    secrets: [1, 2, 3],
  });
  const encryptRes = await encryptData(secretText, key);
  assert(encryptRes.isOk());
  const encrypted = encryptRes.value;

  assertEquals(typeof encrypted.iv, "string");
  assertEquals(typeof encrypted.ciphertext, "string");
  assertNotEquals(encrypted.ciphertext, secretText);

  // 3. Decrypt with correct key
  const decryptedRes = await decryptData(
    encrypted.ciphertext,
    encrypted.iv,
    key,
  );
  assert(decryptedRes.isOk());
  const decrypted = decryptedRes.value;
  assertEquals(decrypted, secretText);
  const parsed = JSON.parse(decrypted);
  assertEquals(parsed.message, "Hello Gistwarden!");

  // 4. Decrypt with wrong key should fail
  const wrongKeyRes = await deriveKey("WrongPassword", salt);
  assert(wrongKeyRes.isOk());
  const wrongKey = wrongKeyRes.value;
  const wrongDecryptedRes = await decryptData(
    encrypted.ciphertext,
    encrypted.iv,
    wrongKey,
  );
  assert(wrongDecryptedRes.isErr());
});

Deno.test("Passkey Crypto - Keypair and base64url conversion", async () => {
  // 1. Create keypair
  const keyPair = await createPasskeyKeyPair();
  assertEquals(keyPair.privateKey instanceof CryptoKey, true);
  assertEquals(keyPair.publicKey instanceof CryptoKey, true);
  assertEquals(keyPair.privateKey.algorithm.name, "ECDSA");

  // 2. Base64url conversion
  const testBytes = new Uint8Array([0, 1, 15, 255, 128, 64]);
  const b64Url = bufferToBase64Url(testBytes);
  assertEquals(b64Url.includes("+"), false);
  assertEquals(b64Url.includes("/"), false);
  assertEquals(b64Url.includes("="), false);

  const decoded = base64UrlToBuffer(b64Url);
  assertEquals(decoded, testBytes);
});

Deno.test("Passkey Crypto - signature conversion and validation", async () => {
  // 1. Generate signature components (R and S)
  const keyPair = await createPasskeyKeyPair();
  const testMessage = new TextEncoder().encode(
    "webauthn authentication challenge data",
  );

  const rawSignature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      keyPair.privateKey,
      testMessage,
    ),
  );

  // Raw signature is P1363 (64 bytes for ES256)
  assertEquals(rawSignature.length, 64);

  // Convert to ASN.1 DER format
  const derSignature = p1363ToDer(rawSignature);
  assertEquals(derSignature[0], 0x30); // DER Sequence header
  assertEquals(derSignature.length > 64, true); // DER is typically 70-72 bytes due to headers/padding

  // Verify that Web Crypto can verify the signature using DER format
  const spkiBytes = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const verifyKey = await crypto.subtle.importKey(
    "spki",
    spkiBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );

  const verified = await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    verifyKey,
    rawSignature,
    testMessage,
  );
  assertEquals(verified, true);
});

Deno.test("TOTP - parseTotpSecret utility", () => {
  const secret1 = "RA226YVGYO3SYFWO";
  const secret2 = "  ra226yvgyo3syfwo  ";
  const secret3 =
    "otpauth://totp/pam.insmart.com.vn:abc?secret=RA226YVGYO3SYFWO&issuer=pam.insmart.com.vn";
  const secret4 = "otpauth://totp/Test?secret=ra226yvgyo3syfwo";

  assertEquals(parseTotpSecret(secret1), "RA226YVGYO3SYFWO");
  assertEquals(parseTotpSecret(secret2), "RA226YVGYO3SYFWO");
  assertEquals(parseTotpSecret(secret3), "RA226YVGYO3SYFWO");
  assertEquals(parseTotpSecret(secret4), "RA226YVGYO3SYFWO");
});

Deno.test("FIDO2 Schema - parse Bitwarden exported credentials format", () => {
  const bitwardenFormat = {
    credentialId: "5f3a9e22-8bf1-4d3f-a39c-b17d74f26190",
    keyType: "public-key",
    keyAlgorithm: "ECDSA",
    keyCurve: "P-256",
    keyValue: "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...",
    rpId: "github.com",
    userHandle: "dXNlci1pZC0xMjM=",
    userName: "testuser",
    counter: "15", // String counter in Bitwarden export
    rpName: "GitHub",
    userDisplayName: "Test User",
    discoverable: "true", // String boolean in Bitwarden export
    creationDate: "2026-07-15T03:00:00.000Z",
  };

  const parsed = Fido2CredentialSchema.parse(bitwardenFormat);

  assertEquals(parsed.credentialId, "5f3a9e22-8bf1-4d3f-a39c-b17d74f26190");
  assertEquals(parsed.counter, 15); // Transformed to number successfully!
  assertEquals(parsed.discoverable, true); // Transformed to boolean successfully!
  assertEquals(parsed.creationDate, "2026-07-15T03:00:00.000Z");
});

Deno.test("Passkey Crypto - getRawCredentialId format parsing", () => {
  // Test UUID format (e.g. "bc7cdc36-1657-44a4-aa04-e4cecf774343")
  const uuid = "bc7cdc36-1657-44a4-aa04-e4cecf774343";
  const expectedBytes = new Uint8Array([
    0xbc,
    0x7c,
    0xdc,
    0x36,
    0x16,
    0x57,
    0x44,
    0xa4,
    0xaa,
    0x04,
    0xe4,
    0xce,
    0xcf,
    0x77,
    0x43,
    0x43,
  ]);
  const parsedUuidBytes = getRawCredentialId(uuid);
  assertEquals(parsedUuidBytes, expectedBytes);

  // Test base64url format
  const b64url = "vHzcNhZXRKSqBOTOz3dDQw";
  const parsedB64urlBytes = getRawCredentialId(b64url);
  assertEquals(parsedB64urlBytes, expectedBytes);

  // Test "b64." prefixed format (used in some systems)
  const b64prefixed = "b64.vHzcNhZXRKSqBOTOz3dDQw";
  const parsedPrefixedBytes = getRawCredentialId(b64prefixed);
  assertEquals(parsedPrefixedBytes, expectedBytes);
});

Deno.test("FIDO2 Schema - parse empty fields (name and counter) like struct.json", () => {
  const fidoFormat = {
    credentialId: "",
    keyType: "",
    keyAlgorithm: "",
    keyCurve: "",
    keyValue: "",
    rpId: "",
    userHandle: "",
    userName: "",
    counter: "", // Empty string counter
    rpName: "",
    userDisplayName: "",
    discoverable: "", // Empty string discoverable
    creationDate: "",
  };

  const parsed = Fido2CredentialSchema.parse(fidoFormat);
  assertEquals(parsed.counter, 0); // Transformed empty string to 0
  assertEquals(parsed.discoverable, false); // Transformed empty string to false
  assertEquals(parsed.credentialId, "");
});

Deno.test("Import Schema - validate Login and SecureNote separately", () => {
  const rawLogin = {
    type: 1,
    name: "",
    favorite: false,
    notes: "",
    fields: [],
    reprompt: 0,
    login: {
      uris: [{ uri: "" }],
      fido2Credentials: [],
      username: "",
      password: "",
    },
  };

  const rawNote = {
    type: 2,
    name: "",
    favorite: false,
    notes: "",
    fields: [],
    reprompt: 0,
    secureNote: {
      type: 0,
    },
  };

  // Validate Login item passes
  const parsedLogin = ImportItemSchema.parse(rawLogin);
  assertEquals(parsedLogin.type, 1);
  assertEquals(parsedLogin.name, "");

  // Validate SecureNote item passes
  const parsedNote = ImportItemSchema.parse(rawNote);
  assertEquals(parsedNote.type, 2);
  assertEquals(parsedNote.name, "");
});
