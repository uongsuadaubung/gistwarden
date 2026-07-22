import { err, ok, Result, ResultAsync } from "neverthrow";
import type { Fido2Credential } from "@/core/types.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";
import { encode as cborEncode } from "cbor-x";

// Utility functions to convert P1363 ECDSA signature to ASN.1 DER format
function encodeDerInteger(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start++;
  }
  const trimmed = bytes.subarray(start);
  const needsZero = (trimmed[0] & 0x80) !== 0;
  const len = trimmed.length + (needsZero ? 1 : 0);
  const res = new Uint8Array(2 + len);
  res[0] = 0x02;
  res[1] = len;
  if (needsZero) {
    res[2] = 0x00;
    res.set(trimmed, 3);
  } else {
    res.set(trimmed, 2);
  }
  return res;
}

export function p1363ToDer(
  signature: Uint8Array,
): Result<Uint8Array, TranslationKey> {
  if (signature.length !== 64) {
    return err("toast_error");
  }
  const rBytes = encodeDerInteger(signature.subarray(0, 32));
  const sBytes = encodeDerInteger(signature.subarray(32, 64));
  const bodyLen = rBytes.length + sBytes.length;
  const dst = new Uint8Array(2 + bodyLen);
  dst[0] = 0x30;
  dst[1] = bodyLen;
  dst.set(rBytes, 2);
  dst.set(sBytes, 2 + rBytes.length);
  return ok(dst);
}

// Helpers for Base64URL conversions using native Uint8Array built-ins
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
}

export function base64UrlToBuffer(
  str: string,
): Result<Uint8Array, TranslationKey> {
  return Result.fromThrowable(
    () => Uint8Array.fromBase64(str.trim(), { alphabet: "base64url" }),
    (): TranslationKey => "toast_error",
  )();
}

// --- Crypto Suble Wrappers ---

export function exportKeyJwkAsync(
  key: CryptoKey,
  errKey: TranslationKey,
): ResultAsync<JsonWebKey, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.exportKey("jwk", key),
    (e): TranslationKey => {
      console.error("[Passkey Crypto] exportKey JWK error:", e);
      return errKey;
    },
  );
}

export function exportKeyBufferAsync(
  format: "pkcs8" | "spki" | "raw",
  key: CryptoKey,
  errKey: TranslationKey,
): ResultAsync<ArrayBuffer, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.exportKey(format, key),
    (e): TranslationKey => {
      console.error(`[Passkey Crypto] exportKey ${format} error:`, e);
      return errKey;
    },
  ).andThen((val) => {
    if (val instanceof ArrayBuffer) return ok(val);
    return err(errKey);
  });
}

export interface ImportKeyAsyncOptions {
  format: "pkcs8" | "spki" | "raw";
  keyData: BufferSource;
  algorithm:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | AesKeyAlgorithm;
  extractable: boolean;
  keyUsages: KeyUsage[];
  errKey: TranslationKey;
}

export function importKeyAsync(
  options: ImportKeyAsyncOptions,
): ResultAsync<CryptoKey, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.importKey(
      options.format,
      options.keyData,
      options.algorithm,
      options.extractable,
      options.keyUsages,
    ),
    (e): TranslationKey => {
      console.error("[Passkey Crypto] importKey error:", e);
      return options.errKey;
    },
  );
}

export function digestAsync(
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
  errKey: TranslationKey,
): ResultAsync<ArrayBuffer, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.digest(algorithm, data),
    (e): TranslationKey => {
      console.error("[Passkey Crypto] digest error:", e);
      return errKey;
    },
  );
}

export function signAsync(
  algorithm:
    | AlgorithmIdentifier
    | RsaPssParams
    | EcdsaParams
    | HmacImportParams,
  key: CryptoKey,
  data: BufferSource,
  errKey: TranslationKey,
): ResultAsync<ArrayBuffer, TranslationKey> {
  return ResultAsync.fromPromise(
    crypto.subtle.sign(algorithm, key, data),
    (e): TranslationKey => {
      console.error("[Passkey Crypto] sign error:", e);
      return errKey;
    },
  );
}

// ---------------------------

export async function createPasskeyKeyPair(): Promise<
  Result<CryptoKeyPair, TranslationKey>
> {
  return await ResultAsync.fromPromise(
    crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign"],
    ),
    (e): TranslationKey => {
      console.error("[Passkey Crypto] Key generation error:", e);
      return "fido2_error_create_failed";
    },
  );
}

// Attestation Object CBOR Packer using cbor-x library
export function packAttestationObject(authData: Uint8Array): Uint8Array {
  return new Uint8Array(
    cborEncode({
      fmt: "none",
      attStmt: {},
      authData,
    }),
  );
}

// Generate AuthData
// AAGUID of Gistwarden: 4c617a79-5061-7373-6b65-794769737431 (LazyPasskeyGist1)
export const AAGUID = new Uint8Array([
  0x4c,
  0x61,
  0x7a,
  0x79,
  0x50,
  0x61,
  0x73,
  0x73,
  0x6b,
  0x65,
  0x79,
  0x47,
  0x69,
  0x73,
  0x74,
  0x31,
]);

interface GenerateAuthDataParams {
  rpId: string;
  credentialId?: Uint8Array;
  counter: number;
  userPresent: boolean;
  userVerified: boolean;
  publicKey?: CryptoKey;
}

export async function generateAuthData(
  params: GenerateAuthDataParams,
): Promise<Result<Uint8Array, TranslationKey>> {
  const authData: number[] = [];

  // 1. rpIdHash (32 bytes)
  const rpIdBytes = new TextEncoder().encode(params.rpId);
  const rpIdHashRes = await digestAsync(
    "SHA-256",
    rpIdBytes,
    "fido2_error_create_failed",
  );
  if (rpIdHashRes.isErr()) return err(rpIdHashRes.error);
  const rpIdHash = new Uint8Array(rpIdHashRes.value);
  authData.push(...rpIdHash);

  // 2. flags (1 byte)
  let flags = 0;
  if (params.userPresent) flags |= 0b00000001;
  if (params.userVerified) flags |= 0b00000100;
  if (params.publicKey) flags |= 0b01000000; // Has attested credential data
  flags |= 0b00001000; // Backup eligibility (always eligible)
  flags |= 0b00010000; // Backup state (always backed up via gist)
  authData.push(flags);

  // 3. signCount (4 bytes)
  const counterBytes = new Uint8Array(4);
  new DataView(counterBytes.buffer).setUint32(0, params.counter, false);
  authData.push(...counterBytes);

  // 4. attestedCredentialData (if applicable)
  if (params.publicKey && params.credentialId) {
    // aaguid (16 bytes)
    const aaguid = new Uint8Array(16);
    authData.push(...aaguid);

    // credentialIdLength (2 bytes)
    const credIdLen = params.credentialId.length;
    const credIdLenBytes = new Uint8Array(2);
    new DataView(credIdLenBytes.buffer).setUint16(0, credIdLen, false);
    authData.push(...credIdLenBytes);

    // credentialId
    authData.push(...params.credentialId);

    // Export public key as JWK to get X and Y coordinates
    const jwkRes = await exportKeyJwkAsync(
      params.publicKey,
      "fido2_error_create_failed",
    );
    if (jwkRes.isErr()) return err(jwkRes.error);
    const jwk = jwkRes.value;
    if (!jwk.x || !jwk.y) return err("fido2_error_create_failed");

    const keyXRes = base64UrlToBuffer(jwk.x);
    if (keyXRes.isErr()) return err(keyXRes.error);
    const keyX = keyXRes.value;

    const keyYRes = base64UrlToBuffer(jwk.y);
    if (keyYRes.isErr()) return err(keyYRes.error);
    const keyY = keyYRes.value;

    // Map with keys: 1 (kty: 2 = EC2), 3 (alg: -7 = ES256), -1 (crv: 1 = P-256), -2 (x), -3 (y)
    const coseBytes = new Uint8Array(77);
    coseBytes.set(
      [0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20],
      0,
    );
    coseBytes.set(keyX, 10);
    coseBytes.set([0x22, 0x58, 0x20], 10 + 32);
    coseBytes.set(keyY, 10 + 32 + 3);

    authData.push(...coseBytes);
  }

  return ok(new Uint8Array(authData));
}

// Generate assertion signature
export async function generateAssertionSignature(
  authData: Uint8Array,
  clientDataHash: Uint8Array,
  privateKey: CryptoKey,
): Promise<Result<Uint8Array, TranslationKey>> {
  const sigBase = new Uint8Array(authData.length + clientDataHash.length);
  sigBase.set(authData, 0);
  sigBase.set(clientDataHash, authData.length);

  const sigRes = await signAsync(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    sigBase,
    "fido2_error_assert_failed",
  );
  if (sigRes.isErr()) return err(sigRes.error);

  const rawSignature = new Uint8Array(sigRes.value);
  const derRes = p1363ToDer(rawSignature);
  if (derRes.isErr()) return err(derRes.error);
  return ok(derRes.value);
}

// Convert Bitwarden-style credentialId (UUID or b64.) or raw base64url into raw Uint8Array
export function getRawCredentialId(
  credId: string,
): Result<Uint8Array, TranslationKey> {
  const clean = credId.trim();
  if (clean.includes("-") && clean.length === 36) {
    const hex = clean.replace(/-/g, "");
    const parseRes = Result.fromThrowable(
      () => Uint8Array.fromHex(hex),
      (): TranslationKey => "toast_error",
    )();
    if (parseRes.isOk() && parseRes.value.length === 16) {
      return ok(parseRes.value);
    }
  }

  if (clean.startsWith("b64.")) {
    return base64UrlToBuffer(clean.slice(4));
  }

  const decodeResult = base64UrlToBuffer(clean);
  if (decodeResult.isOk()) {
    return ok(decodeResult.value);
  }
  return ok(new TextEncoder().encode(clean));
}

export interface PasskeyRegisterOptions {
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName?: string;
  };
  challenge: string;
}

export interface PasskeyAssertOptions {
  challenge: string;
  rpId?: string;
  userVerification?: "required" | "preferred" | "discouraged";
  allowCredentials?: Array<{
    id: string;
    type: string;
  }>;
}

export async function generatePasskeyRegisterResponse(
  options: PasskeyRegisterOptions,
  origin: string,
): Promise<
  Result<
    { newCred: Fido2Credential; result: Record<string, unknown> },
    TranslationKey
  >
> {
  // 1. Create ECDSA keypair
  const keyPairRes = await createPasskeyKeyPair();
  if (keyPairRes.isErr()) return err(keyPairRes.error);
  const keyPair = keyPairRes.value;

  // 2. Export private key in pkcs8 format to store in Vault
  const pkcs8KeyBufferRes = await exportKeyBufferAsync(
    "pkcs8",
    keyPair.privateKey,
    "fido2_error_create_failed",
  );
  if (pkcs8KeyBufferRes.isErr()) return err(pkcs8KeyBufferRes.error);
  const pkcs8Base64Url = bufferToBase64Url(
    new Uint8Array(pkcs8KeyBufferRes.value),
  );

  // 3. Export public key in spki format
  const spkiKeyBufferRes = await exportKeyBufferAsync(
    "spki",
    keyPair.publicKey,
    "fido2_error_create_failed",
  );
  if (spkiKeyBufferRes.isErr()) return err(spkiKeyBufferRes.error);
  const spkiBase64Url = bufferToBase64Url(
    new Uint8Array(spkiKeyBufferRes.value),
  );

  // 4. Generate credentialId (standard random UUID)
  const credentialIdStr = crypto.randomUUID();
  const credentialIdBytesRes = getRawCredentialId(credentialIdStr);
  if (credentialIdBytesRes.isErr()) return err(credentialIdBytesRes.error);
  const credentialIdBytes = credentialIdBytesRes.value;
  const credIdBase64Url = bufferToBase64Url(credentialIdBytes);

  const creationDate = new Date().toISOString();

  // 5. Build Gistwarden Fido2Credential object
  const newCred: Fido2Credential = {
    credentialId: credentialIdStr,
    keyType: "public-key",
    keyAlgorithm: "ECDSA",
    keyCurve: "P-256",
    keyValue: pkcs8Base64Url,
    rpId: options.rp.id || options.rp.name,
    userHandle: options.user.id,
    userName: options.user.name,
    counter: 0,
    rpName: options.rp.name,
    userDisplayName: options.user.displayName,
    discoverable: true,
    creationDate,
  };

  // 6. Generate authData and CBOR attestationObject
  const authDataRes = await generateAuthData({
    rpId: options.rp.id || options.rp.name,
    credentialId: credentialIdBytes,
    counter: 0,
    userPresent: true,
    userVerified: true,
    publicKey: keyPair.publicKey,
  });
  if (authDataRes.isErr()) return err(authDataRes.error);
  const authData = authDataRes.value;

  const clientDataJSON = JSON.stringify({
    type: "webauthn.create",
    challenge: options.challenge,
    origin,
    crossOrigin: false,
  });

  const result = {
    id: credIdBase64Url,
    rawId: credIdBase64Url,
    response: {
      clientDataJSON: bufferToBase64Url(
        new TextEncoder().encode(clientDataJSON),
      ),
      attestationObject: bufferToBase64Url(packAttestationObject(authData)),
      publicKey: spkiBase64Url,
      publicKeyAlgorithm: -7, // ES256
      authData: bufferToBase64Url(authData),
    },
  };

  return ok({ newCred, result });
}

export async function generatePasskeyAssertResponse(
  options: PasskeyAssertOptions,
  origin: string,
  cred: Fido2Credential,
  nextCounter: number,
): Promise<Result<{ result: Record<string, unknown> }, TranslationKey>> {
  // 1. Import ECDSA private key from base64url PKCS#8 stored in Vault
  const pkcs8KeyBufferRes = base64UrlToBuffer(cred.keyValue);
  if (pkcs8KeyBufferRes.isErr()) return err(pkcs8KeyBufferRes.error);
  const pkcs8KeyBuffer = pkcs8KeyBufferRes.value;
  const keyData = pkcs8KeyBuffer.buffer;
  if (!(keyData instanceof ArrayBuffer)) {
    return err("fido2_error_assert_failed");
  }
  const privateKeyRes = await importKeyAsync({
    format: "pkcs8",
    keyData,
    algorithm: {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    extractable: true,
    keyUsages: ["sign"],
    errKey: "fido2_error_assert_failed",
  });
  if (privateKeyRes.isErr()) return err(privateKeyRes.error);
  const privateKey = privateKeyRes.value;

  // 2. Construct assertion data
  const clientDataJSON = JSON.stringify({
    type: "webauthn.get",
    challenge: options.challenge,
    origin,
    crossOrigin: false,
  });

  const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);
  const clientDataHashRes = await digestAsync(
    "SHA-256",
    clientDataJSONBytes,
    "fido2_error_assert_failed",
  );
  if (clientDataHashRes.isErr()) return err(clientDataHashRes.error);
  const clientDataHash = new Uint8Array(clientDataHashRes.value);

  // Lay tuy chon yeu cau xac thuc tu options. Mac dinh la true do nguoi dung da mo khoa bang Master Password
  const userVerified = options.userVerification !== "discouraged";

  let rpId = options.rpId || origin;
  if (!options.rpId) {
    const parseResult = safeParseUrl(origin);
    rpId = parseResult.map((u) => u.hostname).unwrapOr(origin);
  }

  const authDataRes = await generateAuthData({
    rpId,
    counter: nextCounter,
    userPresent: true,
    userVerified,
  });
  if (authDataRes.isErr()) return err(authDataRes.error);
  const authData = authDataRes.value;

  const signatureRes = await generateAssertionSignature(
    authData,
    clientDataHash,
    privateKey,
  );
  if (signatureRes.isErr()) return err(signatureRes.error);
  const signature = signatureRes.value;

  // Tu dong tuong thich nguoc: Kiem tra xem trang web dang yeu cau dinh dang ID nao
  // - Neu yeu cau chuoi ASCII UUID 36 ky tu (co che cu), chung ta tra ve dinh dang do.
  // - Mac dinh dung 16-byte raw UUID (co che moi chuan WebAuthn).
  const b64_36 = bufferToBase64Url(
    new TextEncoder().encode(cred.credentialId),
  );

  const useOld36ByteFormat = (options.allowCredentials || []).some(
    (allowed: { id: string }) => allowed.id === b64_36,
  );

  const rawIdRes = Array.isArray(cred.credentialId)
    ? ok(new Uint8Array(cred.credentialId))
    : getRawCredentialId(cred.credentialId);

  if (rawIdRes.isErr()) return err(rawIdRes.error);
  const rawId = rawIdRes.value;

  const credIdBase64Url = useOld36ByteFormat
    ? b64_36
    : bufferToBase64Url(rawId);

  const result = {
    id: credIdBase64Url,
    rawId: credIdBase64Url,
    response: {
      clientDataJSON: bufferToBase64Url(clientDataJSONBytes),
      authenticatorData: bufferToBase64Url(authData),
      signature: bufferToBase64Url(signature),
      userHandle: cred.userHandle || null,
    },
  };

  return ok({ result });
}
