/**
 * CBOR primitives (RFC 8949) & WebAuthn / COSE Key helpers.
 * Re-export 100% trực tiếp từ mô-đun Rust WebAssembly.
 */
export {
  concatBytesWasm as concatBytes,
  cborEncodeLengthWasm as cborEncodeLength,
  cborTextStringWasm as cborTextString,
  cborByteStringWasm as cborByteString,
  cborMapHeaderWasm as cborMapHeader,
  cborPositiveIntWasm as cborPositiveInt,
  cborNegativeIntWasm as cborNegativeInt,
  packAttestationObjectWasm as packAttestationObject,
  encodeCoseEc2PublicKeyWasm as encodeCoseEC2PublicKey,
} from "./wasm/index.ts";
