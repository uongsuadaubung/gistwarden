import { err, ok, Result } from "neverthrow";
import type { Fido2Credential } from "@gistwarden/domain";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";
import {
  encodeCoseEC2PublicKey,
  generateAssertionSignatureBase,
  generateAuthData as generateAuthDataWasm,
  packAttestationObject,
} from "@/core/cbor-utils.ts";
import { p1363ToDerWasm } from "@/core/crypto.ts";

// IANA COSE Key Parameters & Algorithm Identifiers (RFC 8152 / RFC 9052)
export const COSE_KEY_PARAM_KTY = 1;
export const COSE_KEY_PARAM_ALG = 3;
export const COSE_KEY_PARAM_CRV = -1;
export const COSE_KEY_PARAM_X = -2;
export const COSE_KEY_PARAM_Y = -3;

export const COSE_KTY_EC2 = 2;
export const COSE_ALG_ES256 = -7;
export const COSE_CRV_P256 = 1;

// W3C WebAuthn Authenticator Data Flags (Section 6.1)
export const AUTH_DATA_FLAG_UP = 0x01; // User Present (Bit 0)
export const AUTH_DATA_FLAG_UV = 0x04; // User Verified (Bit 2)
export const AUTH_DATA_FLAG_BE = 0x08; // Backup Eligibility (Bit 3)
export const AUTH_DATA_FLAG_BS = 0x10; // Backup State (Bit 4)
export const AUTH_DATA_FLAG_AT = 0x40; // Attested Credential Data Present (Bit 6)

/**
 * Chuyển đổi định dạng chữ ký ECDSA từ chuẩn IEEE P1363 (chuỗi nhị phân thô (r || s) 64-byte)
 * sang định dạng ASN.1 DER (RFC 3279 / RFC 5758 / X.509 DER structure) ủy quyền cho Rust WebAssembly.
 */
export function p1363ToDer(
  signature: Uint8Array,
): Result<Uint8Array, TranslationKey> {
  try {
    const der = p1363ToDerWasm(signature);
    return ok(der);
  } catch (e: unknown) {
    return err("toast_error");
  }
}

// Helpers for Base64URL conversions using native Uint8Array built-ins
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return bytes.toBase64({ alphabet: "base64url", omitPadding: true });
}

export function base64UrlToBuffer(
  str: string,
): Result<Uint8Array, TranslationKey> {
  try {
    const res = Uint8Array.fromBase64(str.trim(), { alphabet: "base64url" });
    return ok(res);
  } catch {
    return err("toast_error");
  }
}

// --- Crypto Suble Wrappers ---

export async function exportKeyJwkAsync(
  key: CryptoKey,
  errKey: TranslationKey,
): Promise<Result<JsonWebKey, TranslationKey>> {
  try {
    const res = await crypto.subtle.exportKey("jwk", key);
    return ok(res);
  } catch (e) {
    console.error("[Passkey Crypto] exportKey JWK error:", e);
    return err(errKey);
  }
}

export async function exportKeyBufferAsync(
  format: "pkcs8" | "spki" | "raw",
  key: CryptoKey,
  errKey: TranslationKey,
): Promise<Result<ArrayBuffer, TranslationKey>> {
  try {
    const val = await crypto.subtle.exportKey(format, key);
    if (val instanceof ArrayBuffer) return ok(val);
    return err(errKey);
  } catch (e) {
    console.error(`[Passkey Crypto] exportKey ${format} error:`, e);
    return err(errKey);
  }
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

export async function importKeyAsync(
  options: ImportKeyAsyncOptions,
): Promise<Result<CryptoKey, TranslationKey>> {
  try {
    const res = await crypto.subtle.importKey(
      options.format,
      options.keyData,
      options.algorithm,
      options.extractable,
      options.keyUsages,
    );
    return ok(res);
  } catch (e) {
    console.error("[Passkey Crypto] importKey error:", e);
    return err(options.errKey);
  }
}

export async function digestAsync(
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
  errKey: TranslationKey,
): Promise<Result<ArrayBuffer, TranslationKey>> {
  try {
    const res = await crypto.subtle.digest(algorithm, data);
    return ok(res);
  } catch (e) {
    console.error("[Passkey Crypto] digest error:", e);
    return err(errKey);
  }
}

export async function signAsync(
  algorithm:
    | AlgorithmIdentifier
    | RsaPssParams
    | EcdsaParams
    | HmacImportParams,
  key: CryptoKey,
  data: BufferSource,
  errKey: TranslationKey,
): Promise<Result<ArrayBuffer, TranslationKey>> {
  try {
    const res = await crypto.subtle.sign(algorithm, key, data);
    return ok(res);
  } catch (e) {
    console.error("[Passkey Crypto] sign error:", e);
    return err(errKey);
  }
}

// ---------------------------

export async function createPasskeyKeyPair(): Promise<
  Result<CryptoKeyPair, TranslationKey>
> {
  try {
    const res = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign"],
    );
    if (res && "publicKey" in res && "privateKey" in res) {
      return ok(res);
    }
    return err("fido2_error_create_failed");
  } catch (e) {
    console.error("[Passkey Crypto] Key generation error:", e);
    return err("fido2_error_create_failed");
  }
}

// AAGUID (Authenticator Attestation GUID) đại diện duy nhất cho Gistwarden Authenticator (16 bytes)
export const AAGUID = new TextEncoder().encode("LazyPasskeyGist1");

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
  let keyX: Uint8Array | undefined;
  let keyY: Uint8Array | undefined;

  if (params.publicKey && params.credentialId) {
    const jwkRes = await exportKeyJwkAsync(
      params.publicKey,
      "fido2_error_create_failed",
    );
    if (jwkRes.isErr()) return err(jwkRes.error);
    const jwk = jwkRes.value;
    if (!jwk.x || !jwk.y) return err("fido2_error_create_failed");

    const keyXRes = base64UrlToBuffer(jwk.x);
    if (keyXRes.isErr()) return err(keyXRes.error);
    keyX = keyXRes.value;

    const keyYRes = base64UrlToBuffer(jwk.y);
    if (keyYRes.isErr()) return err(keyYRes.error);
    keyY = keyYRes.value;
  }

  const authData = generateAuthDataWasm(
    params.rpId,
    params.counter,
    params.userPresent,
    params.userVerified,
    params.credentialId,
    keyX,
    keyY,
  );

  return ok(authData);
}

// Generate assertion signature
export async function generateAssertionSignature(
  authData: Uint8Array,
  clientDataHash: Uint8Array,
  privateKey: CryptoKey,
): Promise<Result<Uint8Array, TranslationKey>> {
  const sigBase = generateAssertionSignatureBase(authData, clientDataHash);

  const sigRes = await signAsync(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    new Uint8Array(sigBase),
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
    try {
      const bytes = Uint8Array.fromHex(hex);
      if (bytes.length === 16) {
        return ok(bytes);
      }
    } catch {
      // Ignore hex parse error and fall back
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
    userHandle: typeof options.user.id === "string"
      ? options.user.id
      : (options.user.id
        ? bufferToBase64Url(new Uint8Array(options.user.id))
        : undefined),
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
      publicKeyAlgorithm: COSE_ALG_ES256,
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
