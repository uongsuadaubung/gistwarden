/**
 * CBOR primitives (RFC 8949) & WebAuthn / COSE Key helpers.
 * Re-export 100% trực tiếp từ mô-đun Rust WebAssembly.
 */
export {
  generateAssertionSignatureBaseWasm as generateAssertionSignatureBase,
  generateAuthDataWasm as generateAuthData,
} from "./wasm/index.ts";
