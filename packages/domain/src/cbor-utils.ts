/**
 * CBOR primitives (RFC 8949) & WebAuthn / COSE Key helpers.
 * Re-export 100% trực tiếp từ mô-đun Rust WebAssembly.
 */
export {
  cborByteStringWasm as cborByteString,
  cborEncodeLengthWasm as cborEncodeLength,
  cborMapHeaderWasm as cborMapHeader,
  cborNegativeIntWasm as cborNegativeInt,
  cborPositiveIntWasm as cborPositiveInt,
  cborTextStringWasm as cborTextString,
  concatBytesWasm as concatBytes,
  encodeCoseEc2PublicKeyWasm as encodeCoseEC2PublicKey,
  generateAssertionSignatureBaseWasm as generateAssertionSignatureBase,
  generateAuthDataWasm as generateAuthData,
  packAttestationObjectWasm as packAttestationObject,
} from "./wasm/index.ts";
