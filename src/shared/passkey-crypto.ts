import type { Fido2Credential } from "./types.ts";

// Utility functions to convert P1363 ECDSA signature to ASN.1 DER format
function getParamSize(keySize: number) {
  return ((keySize / 8) | 0) + (keySize % 8 === 0 ? 0 : 1);
}

const paramBytes = getParamSize(256); // ES256 param bytes (32)

function countPadding(
  buf: Uint8Array,
  start: number,
  end: number,
): { padding: number; needs0x00: boolean } {
  let padding = 0;
  while (start + padding < end && buf[start + padding] === 0) {
    padding++;
  }
  const needs0x00 = (buf[start + padding] & 0x80) === 0x80;
  return { padding, needs0x00 };
}

export function p1363ToDer(signature: Uint8Array): Uint8Array {
  const signatureBytes = signature.length;
  if (signatureBytes !== paramBytes * 2) {
    throw new TypeError(
      `ES256 signatures must be ${paramBytes * 2} bytes, saw ${signatureBytes}`,
    );
  }

  const { padding: rPadding, needs0x00: rNeeds0x00 } = countPadding(
    signature,
    0,
    paramBytes,
  );
  const { padding: sPadding, needs0x00: sNeeds0x00 } = countPadding(
    signature,
    paramBytes,
    signature.length,
  );

  const rActualLength = paramBytes - rPadding;
  const sActualLength = paramBytes - sPadding;

  const rLength = rActualLength + (rNeeds0x00 ? 1 : 0);
  const sLength = sActualLength + (sNeeds0x00 ? 1 : 0);

  const rsBytes = 2 + rLength + 2 + sLength;
  const shortLength = rsBytes < 0x80;

  const dst = new Uint8Array((shortLength ? 2 : 3) + rsBytes);

  let offset = 0;
  dst[offset++] = 0x30; // ENCODED_TAG_SEQ
  if (shortLength) {
    dst[offset++] = rsBytes;
  } else {
    dst[offset++] = 0x80 | 1;
    dst[offset++] = rsBytes & 0xff;
  }

  // Encoding 'R' component
  dst[offset++] = 0x02; // ENCODED_TAG_INT
  dst[offset++] = rLength;
  if (rNeeds0x00) {
    dst[offset++] = 0;
  }
  dst.set(signature.subarray(rPadding, rPadding + rActualLength), offset);
  offset += rActualLength;

  // Encoding 'S' component
  dst[offset++] = 0x02; // ENCODED_TAG_INT
  dst[offset++] = sLength;
  if (sNeeds0x00) {
    dst[offset++] = 0;
  }
  dst.set(
    signature.subarray(
      paramBytes + sPadding,
      paramBytes + sPadding + sActualLength,
    ),
    offset,
  );

  return dst;
}

// Helpers for Base64URL conversions
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function base64UrlToBuffer(str: string): Uint8Array {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Illegal base64url string!");
  }
  const binaryString = atob(output);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate P-256 ECDSA Key Pair
export async function createPasskeyKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"],
  );
}

// Attestation Object CBOR Packer
export function packAttestationObject(authData: Uint8Array): Uint8Array {
  // We need to encode { fmt: "none", attStmt: {}, authData: Uint8Array }
  const fmtKey = [0x63, 0x66, 0x6d, 0x74]; // "fmt"
  const fmtVal = [0x64, 0x6e, 0x6f, 0x6e, 0x65]; // "none"
  const attStmtKey = [0x67, 0x61, 0x74, 0x74, 0x53, 0x74, 0x6d, 0x74]; // "attStmt"
  const attStmtVal = [0xa0]; // empty map {}
  const authDataKey = [0x68, 0x61, 0x75, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61]; // "authData"

  // authData byte string header
  let authDataHeader: number[];
  const len = authData.length;
  if (len < 256) {
    authDataHeader = [0x58, len];
  } else {
    authDataHeader = [0x59, (len >> 8) & 0xff, len & 0xff];
  }

  const totalLength = 1 + fmtKey.length + fmtVal.length + attStmtKey.length +
    attStmtVal.length + authDataKey.length + authDataHeader.length +
    authData.length;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result[offset++] = 0xa3; // Map of 3 pairs

  result.set(fmtKey, offset);
  offset += fmtKey.length;
  result.set(fmtVal, offset);
  offset += fmtVal.length;

  result.set(attStmtKey, offset);
  offset += attStmtKey.length;
  result.set(attStmtVal, offset);
  offset += attStmtVal.length;

  result.set(authDataKey, offset);
  offset += authDataKey.length;
  result.set(authDataHeader, offset);
  offset += authDataHeader.length;
  result.set(authData, offset);

  return result;
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
): Promise<Uint8Array> {
  const authData: number[] = [];

  // 1. rpIdHash (32 bytes)
  const rpIdBytes = new TextEncoder().encode(params.rpId);
  const rpIdHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", rpIdBytes),
  );
  authData.push(...rpIdHash);

  // 2. flags (1 byte)
  let flags = 0;
  if (params.userPresent) flags |= 0b00000001;
  if (params.userVerified) flags |= 0b00000100;
  if (params.publicKey) flags |= 0b01000000; // Has attested credential data
  flags |= 0b00001000; // Backup eligibility (always eligible)
  flags |= 0b00010000; // Backup state (always backed up via gist)
  authData.push(flags);

  // 3. counter (4 bytes)
  const counter = params.counter;
  authData.push(
    ((counter & 0xff000000) >> 24) & 0xff,
    ((counter & 0x00ff0000) >> 16) & 0xff,
    ((counter & 0x0000ff00) >> 8) & 0xff,
    counter & 0x000000ff,
  );

  // 4. attestedCredentialData (if public key is provided)
  if (params.publicKey && params.credentialId) {
    authData.push(...AAGUID);

    // credentialIdLength (2 bytes)
    const credIdLen = params.credentialId.length;
    authData.push((credIdLen >> 8) & 0xff, credIdLen & 0xff);
    authData.push(...params.credentialId);

    // Export public key as JWK to get X and Y coordinates
    const jwk = await crypto.subtle.exportKey("jwk", params.publicKey);
    if (!jwk.x || !jwk.y) throw new Error("Invalid public key coordinates");

    const keyX = base64UrlToBuffer(jwk.x);
    const keyY = base64UrlToBuffer(jwk.y);

    // Manually format public key in canonical CBOR COSE format for P-256:
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

  return new Uint8Array(authData);
}

// Generate assertion signature
export async function generateAssertionSignature(
  authData: Uint8Array,
  clientDataHash: Uint8Array,
  privateKey: CryptoKey,
): Promise<Uint8Array> {
  const sigBase = new Uint8Array(authData.length + clientDataHash.length);
  sigBase.set(authData, 0);
  sigBase.set(clientDataHash, authData.length);

  const rawSignature = new Uint8Array(
    await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      privateKey,
      sigBase,
    ),
  );

  return p1363ToDer(rawSignature);
}

// Convert Bitwarden-style credentialId (UUID or b64.) or raw base64url into raw Uint8Array
export function getRawCredentialId(credId: string): Uint8Array {
  const clean = credId.trim();
  if (clean.includes("-") && clean.length === 36) {
    // Parse standard UUID format (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) to 16 bytes raw array
    const raw = new Uint8Array(16);
    let v;

    // Parse ########-....-....-....-............
    raw[0] = (v = parseInt(clean.slice(0, 8), 16)) >>> 24;
    raw[1] = (v >>> 16) & 0xff;
    raw[2] = (v >>> 8) & 0xff;
    raw[3] = v & 0xff;

    // Parse ........-####-....-....-............
    raw[4] = (v = parseInt(clean.slice(9, 13), 16)) >>> 8;
    raw[5] = v & 0xff;

    // Parse ........-....-####-....-............
    raw[6] = (v = parseInt(clean.slice(14, 18), 16)) >>> 8;
    raw[7] = v & 0xff;

    // Parse ........-....-....-####-............
    raw[8] = (v = parseInt(clean.slice(19, 23), 16)) >>> 8;
    raw[9] = v & 0xff;

    // Parse ........-....-....-....-############
    raw[10] = ((v = parseInt(clean.slice(24, 36), 16)) / 0x10000000000) & 0xff;
    raw[11] = (v / 0x100000000) & 0xff;
    raw[12] = (v >>> 24) & 0xff;
    raw[13] = (v >>> 16) & 0xff;
    raw[14] = (v >>> 8) & 0xff;
    raw[15] = v & 0xff;

    return raw;
  }

  if (clean.startsWith("b64.")) {
    return base64UrlToBuffer(clean.slice(4));
  }

  try {
    return base64UrlToBuffer(clean);
  } catch (_e) {
    return new TextEncoder().encode(clean);
  }
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
): Promise<{ newCred: Fido2Credential; result: Record<string, unknown> }> {
  // 1. Create ECDSA keypair
  const keyPair = await createPasskeyKeyPair();

  // 2. Export private key in pkcs8 format to store in Vault
  const pkcs8KeyBuffer = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  );
  const pkcs8Base64Url = bufferToBase64Url(new Uint8Array(pkcs8KeyBuffer));

  // 3. Export public key in spki format
  const spkiKeyBuffer = await crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );
  const spkiBase64Url = bufferToBase64Url(new Uint8Array(spkiKeyBuffer));

  // 4. Generate credentialId (standard random UUID)
  const credentialIdStr = crypto.randomUUID();
  const credentialIdBytes = getRawCredentialId(credentialIdStr);
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
  const authData = await generateAuthData({
    rpId: options.rp.id || options.rp.name,
    credentialId: credentialIdBytes,
    counter: 0,
    userPresent: true,
    userVerified: true,
    publicKey: keyPair.publicKey,
  });

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

  return { newCred, result };
}

export async function generatePasskeyAssertResponse(
  options: PasskeyAssertOptions,
  origin: string,
  cred: Fido2Credential,
  nextCounter: number,
): Promise<{ result: Record<string, unknown> }> {
  // 1. Import ECDSA private key from base64url PKCS#8 stored in Vault
  const pkcs8KeyBuffer = base64UrlToBuffer(cred.keyValue);
  const keyData = pkcs8KeyBuffer.buffer;
  if (!(keyData instanceof ArrayBuffer)) {
    throw new Error("Expected ArrayBuffer for key data");
  }
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"],
  );

  // 2. Construct assertion data
  const clientDataJSON = JSON.stringify({
    type: "webauthn.get",
    challenge: options.challenge,
    origin,
    crossOrigin: false,
  });

  const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);
  const clientDataHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataJSONBytes),
  );

  // Lay tuy chon yeu cau xac thuc tu options. Mac dinh la true do nguoi dung da mo khoa bang Master Password
  const userVerified = options.userVerification !== "discouraged";

  let rpId = options.rpId;
  if (!rpId) {
    try {
      rpId = new URL(origin).hostname;
    } catch (_) {
      rpId = origin;
    }
  }

  const authData = await generateAuthData({
    rpId,
    counter: nextCounter,
    userPresent: true,
    userVerified,
  });

  const signature = await generateAssertionSignature(
    authData,
    clientDataHash,
    privateKey,
  );

  // Tu dong tuong thich nguoc: Kiem tra xem trang web dang yeu cau dinh dang ID nao
  // - Neu yeu cau chuoi ASCII UUID 36 ky tu (co che cu), chung ta tra ve dinh dang do.
  // - Mac dinh dung 16-byte raw UUID (co che moi chuan WebAuthn).
  const b64_36 = bufferToBase64Url(
    new TextEncoder().encode(cred.credentialId),
  );

  const useOld36ByteFormat = (options.allowCredentials || []).some(
    (allowed: { id: string }) => allowed.id === b64_36,
  );

  const rawCredId = useOld36ByteFormat
    ? new TextEncoder().encode(cred.credentialId)
    : getRawCredentialId(cred.credentialId);
  const credIdBase64Url = useOld36ByteFormat
    ? b64_36
    : bufferToBase64Url(rawCredId);

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

  return { result };
}
