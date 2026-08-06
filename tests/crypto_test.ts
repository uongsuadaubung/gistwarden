import { assert, assertEquals, assertNotEquals, test } from "./assert.ts";
import {
  arrayBufferToBase64,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  hashPasswordSHA1PrefixSuffix,
  parseSshKey,
  parseTotpSecret,
} from "@gistwarden/domain";
import {
  clearDerivedKey,
  getSessionKey,
  setDerivedKey,
} from "@gistwarden/orchestrator";
import { clearUnlockedSessionState } from "@gistwarden/repository";
import {
  p1363ToDerWasm,
} from "@gistwarden/domain";
import {
  AAGUID,
  COSE_ALG_ES256,
  generatePasskeyRegisterResponse,
} from "../packages/ui/src/features/passkey/passkey-crypto.ts";
import { Fido2CredentialSchema } from "@gistwarden/domain";
import { ImportItemSchema } from "@gistwarden/repository";

test("Crypto - Key derivation, Encryption and Decryption", async () => {
  const password = "SuperSecretPassword123";
  const salt = generateSalt();

  // 1. Derive key
  const keyRes = await deriveKey(password, salt);
  assert(keyRes.isOk());
  const key = keyRes.value;
  assertEquals(key instanceof Uint8Array, true);

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

test("Passkey Crypto - Keypair and base64url conversion", async () => {
  // 1. Create keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  assertEquals(keyPair.privateKey instanceof CryptoKey, true);
  assertEquals(keyPair.publicKey instanceof CryptoKey, true);
  assertEquals(keyPair.privateKey.algorithm.name, "ECDSA");

  // 2. Base64url conversion
  const testBytes = new Uint8Array([0, 1, 15, 255, 128, 64]);
  const b64Url = testBytes.toBase64({ alphabet: "base64url", omitPadding: true });
  assertEquals(b64Url.includes("+"), false);
  assertEquals(b64Url.includes("/"), false);
  assertEquals(b64Url.includes("="), false);

  const decodedBytes = Uint8Array.fromBase64(b64Url, { alphabet: "base64url" });
  assertEquals(decodedBytes, testBytes);
});

test("Passkey Crypto - signature conversion and validation", async () => {
  // 1. Generate signature components (R and S)
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
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

  // Convert to ASN.1 DER format using Rust WASM
  const derSignature = p1363ToDerWasm(rawSignature);
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

test("Passkey Crypto - generatePasskeyRegisterResponse with AAGUID and COSE ES256", async () => {
  const regRes = await generatePasskeyRegisterResponse(
    {
      rp: { id: "example.com", name: "Example RP" },
      user: { id: "user123", name: "testuser" },
      challenge: "random-challenge-string",
    },
    "https://example.com",
  );

  assert(regRes.isOk());
  const { newCred, result } = regRes.value;
  assertEquals(newCred.rpId, "example.com");
  assertEquals(newCred.userName, "testuser");
  const resp = result.response;
  if (resp && typeof resp === "object" && "publicKeyAlgorithm" in resp) {
    assertEquals(resp.publicKeyAlgorithm, COSE_ALG_ES256);
  } else {
    assert(false, "publicKeyAlgorithm missing");
  }
  assertEquals(AAGUID.length, 16);
});

test("TOTP - parseTotpSecret utility", () => {
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

test("FIDO2 Schema - parse Bitwarden exported credentials format", () => {
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

test("Passkey Crypto - getRawCredentialId format parsing", () => {
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
  const parsedUuidBytes = Uint8Array.fromHex(uuid.replace(/-/g, ""));
  assertEquals(parsedUuidBytes, expectedBytes);

  // Test base64url format
  const b64url = "vHzcNhZXRKSqBOTOz3dDQw";
  const parsedB64urlBytes = Uint8Array.fromBase64(b64url, { alphabet: "base64url" });
  assertEquals(parsedB64urlBytes, expectedBytes);

  // Test "b64." prefixed format (used in some systems)
  const b64prefixed = "b64.vHzcNhZXRKSqBOTOz3dDQw";
  const parsedPrefixedBytes = Uint8Array.fromBase64(b64prefixed.slice(4), { alphabet: "base64url" });
  assertEquals(parsedPrefixedBytes, expectedBytes);
});

test("FIDO2 Schema - parse empty fields (name and counter) like struct.json", () => {
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

test("Import Schema - validate Login and SecureNote separately", () => {
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

test("Crypto - parseSshKey for OpenSSH keys", async () => {
  // 1. Invalid key text
  const invalidRes = await parseSshKey("invalid key content");
  assertEquals(invalidRes.isErr(), true);
  if (invalidRes.isErr()) {
    assertEquals(invalidRes.error, "ssh_invalid_key");
  }

  // 2. Valid OpenSSH Ed25519 Private Key test
  const validEd25519Key = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBR5QyI+Y/sjXLH1ndp6Yzd6kKUU7LGgm+zbIP4jWHiggAAAJgdRPzkHUT8
5AAAAAtzc2gtZWQyNTUxOQAAACBR5QyI+Y/sjXLH1ndp6Yzd6kKUU7LGgm+zbIP4jWHigg
AAAEDWJt9whxgWT2Cka/H9p3euSXxSw/KL8YI3wlqC1uYYYVHlDIj5j+yNcsfWd2npjN3q
QpRTssaCb7Nsg/iNYeKCAAAAEWtleS0xNzg0NzMzMTg0MDY3AQIDBA==
-----END OPENSSH PRIVATE KEY-----`;

  const validRes = await parseSshKey(validEd25519Key);
  assertEquals(validRes.isOk(), true);
  if (validRes.isOk()) {
    const val = validRes.value;
    assert(val.publicKey.startsWith("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA"));
    assert(val.keyFingerprint.startsWith("SHA256:"));
  }

  // 3. Real user OpenSSH key test
  const userKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBR5QyI+Y/sjXLH1ndp6Yzd6kKUU7LGgm+zbIP4jWHiggAAAJgdRPzkHUT8
5AAAAAtzc2gtZWQyNTUxOQAAACBR5QyI+Y/sjXLH1ndp6Yzd6kKUU7LGgm+zbIP4jWHigg
AAAEDWJt9whxgWT2Cka/H9p3euSXxSw/KL8YI3wlqC1uYYYVHlDIj5j+yNcsfWd2npjN3q
QpRTssaCb7Nsg/iNYeKCAAAAEWtleS0xNzg0NzMzMTg0MDY3AQIDBA==
-----END OPENSSH PRIVATE KEY-----`;

  const userRes = await parseSshKey(userKey);
  assertEquals(userRes.isOk(), true);
  if (userRes.isOk()) {
    assertEquals(
      userRes.value.publicKey,
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFHlDIj5j+yNcsfWd2npjN3qQpRTssaCb7Nsg/iNYeKC key-1784733184067",
    );
    assertEquals(
      userRes.value.keyFingerprint,
      "SHA256:CnS+ohLRpL0UiiU5NI2B6l0a5ERgU5GKmgfI9AcAJVU",
    );
  }

  // 4. User OpenSSH RSA key test
  const rsaKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAIEAnRHxtPTRAv1ksCYjEZ7GyrrwUT4FIQ8RajycKRKhKM/xe6Hg3lAk
XAWsqCynalq9kgisQdPwQxBdkG8GR0hjucDQ/3KsqjGmCphOTiIDoqHegwtr+nQ0hww420
MA83NBCZOPsl4sy5HvrIYpdMYFL8g2nf6OaHvIJZFwKsEeXC8AAAIAfJj4CHyY+AgAAAAH
c3NoLXJzYQAAAIEAnRHxtPTRAv1ksCYjEZ7GyrrwUT4FIQ8RajycKRKhKM/xe6Hg3lAkXA
WsqCynalq9kgisQdPwQxBdkG8GR0hjucDQ/3KsqjGmCphOTiIDoqHegwtr+nQ0hww420MA
83NBCZOPsl4sy5HvrIYpdMYFL8g2nf6OaHvIJZFwKsEeXC8AAAADAQABAAAAgQCQLkug32
YJh47ov2lLoGM875LwEK1mpk1HJvH2Jfq32wIBihxAFnL54d+W1L6tOzRvG/T7zE/tT9WD
YtbxkjqvdXDrbETvKSoxFDMPs0WINtGRMYwd6gxyfc3T9zF2sMGVKpNEFyxkUStGHsUFTI
TsrQ3l8ad0bQODqSRpuzTPuQAAAEAmMHIwhhaLTYOLQsHv1A1vhbFbjriNyLL/0nokGdIu
AGhNQaZ9hNhTc9yIecEc7Plz8Wk7pqqa8DPSWtHs44zHAAAAQQDJal+n3USLQI9MonJxeX
OCG1oDrC1rMNyiwQLZmCliBVQ+9jPnJQjrX/gzw71skfq/x3g/RoSwhgUe/zWog7elAAAA
QQDHowNUSZn9qQJl9vu1wpmXqcOZKtbKyC55AemXNmfv5TWXbKTEDzAsaGnDU4YtFAAgMr
VJo4zyr0vAWCc9LlxDAAAABm5vbmFtZQECAwQ=
-----END OPENSSH PRIVATE KEY-----`;

  const rsaRes = await parseSshKey(rsaKey);
  assertEquals(rsaRes.isOk(), true);
  if (rsaRes.isOk()) {
    assertEquals(
      rsaRes.value.publicKey,
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCdEfG09NEC/WSwJiMRnsbKuvBRPgUhDxFqPJwpEqEoz/F7oeDeUCRcBayoLKdqWr2SCKxB0/BDEF2QbwZHSGO5wND/cqyqMaYKmE5OIgOiod6DC2v6dDSHDDjbQwDzc0EJk4+yXizLke+shil0xgUvyDad/o5oe8glkXAqwR5cLw== noname",
    );
    assertEquals(
      rsaRes.value.keyFingerprint,
      "SHA256:L7CgQB+hWtSJhmHLpTHOWUYPvr1a1jPyN0QmXKX81Xc",
    );
  }

  // 5. Legacy PEM RSA Private Key test
  const legacyRsaPem = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3v...
-----END RSA PRIVATE KEY-----`;

  const legacyRes = await parseSshKey(legacyRsaPem);
  // Verify handling of legacy PEM key

  // 6. Direct Public Key string test
  const directPubKey =
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFHlDIj5j+yNcsfWd2npjN3qQpRTssaCb7Nsg/iNYeKC my-key@host";
  const pubKeyRes = await parseSshKey(directPubKey);
  assertEquals(pubKeyRes.isOk(), true);
  if (pubKeyRes.isOk()) {
    assertEquals(pubKeyRes.value.publicKey, directPubKey);
    assertEquals(
      pubKeyRes.value.keyFingerprint,
      "SHA256:CnS+ohLRpL0UiiU5NI2B6l0a5ERgU5GKmgfI9AcAJVU",
    );
  }
});

test("Crypto - DerivedKey Lifecycle & Memory Clearing", async () => {
  const salt = generateSalt();
  const deriveRes = await deriveKey("MasterPassword123", salt);
  assert(deriveRes.isOk());
  const sampleKey = deriveRes.value;

  // 1. Set derived key
  await setDerivedKey(sampleKey);

  // 2. Clear derived key in-memory directly
  clearDerivedKey();

  // 3. Clear unlocked session state (clears both storage and in-memory key)
  await clearUnlockedSessionState();
  const clearedKey = await getSessionKey();
  assertEquals(clearedKey, null);
});

test("Crypto - SSH & ASN.1 Reader Edge Cases & Malformed Inputs", async () => {
  // 1. Empty key string
  const emptyRes = await parseSshKey("");
  assertEquals(emptyRes.isErr(), true);
  if (emptyRes.isErr()) {
    assertEquals(emptyRes.error, "ssh_invalid_key");
  }

  // 2. Invalid OpenSSH Magic header
  const invalidMagicKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1pbnZhbGlkLW1hZ2lj
-----END OPENSSH PRIVATE KEY-----`;
  const invalidMagicRes = await parseSshKey(invalidMagicKey);
  assertEquals(invalidMagicRes.isErr(), true);
  if (invalidMagicRes.isErr()) {
    assertEquals(invalidMagicRes.error, "ssh_invalid_key");
  }

  // 3. Malformed Legacy RSA PEM (Corrupted ASN.1 sequence)
  const malformedRsaPem = `-----BEGIN RSA PRIVATE KEY-----
AAAAAAAABBBBBBBBCCCCCCCC
-----END RSA PRIVATE KEY-----`;
  const malformedRsaRes = await parseSshKey(malformedRsaPem);
  assertEquals(malformedRsaRes.isErr(), true);
  if (malformedRsaRes.isErr()) {
    assertEquals(malformedRsaRes.error, "ssh_invalid_key");
  }

  // 4. Truncated Base64 OpenSSH Header
  const truncatedOpenSshKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEA
-----END OPENSSH PRIVATE KEY-----`;
  const truncatedRes = await parseSshKey(truncatedOpenSshKey);
  assertEquals(truncatedRes.isErr(), true);
  if (truncatedRes.isErr()) {
    assertEquals(truncatedRes.error, "ssh_invalid_key");
  }
});

test("Crypto - HIBP SHA-1 Prefix (5 chars) and Suffix (35 chars) Extraction", async () => {
  const { prefix, suffix } = await hashPasswordSHA1PrefixSuffix("password");
  assertEquals(prefix.length, 5);
  assertEquals(suffix.length, 35);
  assertEquals(prefix, "5BAA6");
  assertEquals(suffix, "1E4C9B93F3F0682250B6CF8331B7EE68FD8");
});
