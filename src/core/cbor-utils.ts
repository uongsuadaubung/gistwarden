/**
 * Minimal hand-rolled CBOR primitives (RFC 8949) & WebAuthn / COSE Key helpers.
 * An toàn với dữ liệu lớn: không dùng spread operator trên mảng byte.
 */

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function cborEncodeLength(
  majorType: number,
  length: number,
): Uint8Array {
  const mt = majorType << 5;
  if (length < 24) return Uint8Array.of(mt | length);
  if (length < 256) return Uint8Array.of(mt | 24, length);
  if (length < 65536) {
    return Uint8Array.of(mt | 25, (length >> 8) & 0xff, length & 0xff);
  }
  return Uint8Array.of(
    mt | 26,
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
  );
}

export function cborTextString(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str);
  return concatBytes([cborEncodeLength(3, bytes.length), bytes]);
}

export function cborByteString(bytes: Uint8Array): Uint8Array {
  return concatBytes([cborEncodeLength(2, bytes.length), bytes]);
}

export function cborMapHeader(numPairs: number): Uint8Array {
  return cborEncodeLength(5, numPairs);
}

export function cborPositiveInt(n: number): Uint8Array {
  return cborEncodeLength(0, n);
}

export function cborNegativeInt(n: number): Uint8Array {
  // n là số nguyên dương biểu diễn cho giá trị -1-n
  return cborEncodeLength(1, n);
}

// --- Attestation Object CBOR Packer (no external deps) ---
export function packAttestationObject(authData: Uint8Array): Uint8Array {
  return concatBytes([
    cborMapHeader(3),
    cborTextString("fmt"),
    cborTextString("none"),
    cborTextString("attStmt"),
    cborMapHeader(0), // {} - rỗng
    cborTextString("authData"),
    cborByteString(authData),
  ]);
}

// --- COSE EC2 Public Key Packer (no external deps) ---
export function encodeCoseEC2PublicKey(
  x: Uint8Array,
  y: Uint8Array,
): Uint8Array {
  return concatBytes([
    cborMapHeader(5),
    cborPositiveInt(1),
    cborPositiveInt(2), // 1(kty) : 2(EC2)
    cborPositiveInt(3),
    cborNegativeInt(6), // 3(alg) : -7(ES256)
    cborNegativeInt(0),
    cborPositiveInt(1), // -1(crv) : 1(P-256)
    cborNegativeInt(1),
    cborByteString(x), // -2(x)
    cborNegativeInt(2),
    cborByteString(y), // -3(y)
  ]);
}
