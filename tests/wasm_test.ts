import { assertEquals, test } from "./assert.ts";
import {
  fastXorRust,
  greetFromRust,
  wasm,
  withWasmAsync,
} from "../packages/domain/src/wasm/index.ts";

test("Rust WASM - greetFromRust auto-init loader", async () => {
  const greeting = await greetFromRust("Gistwarden Developer");
  assertEquals(
    greeting,
    "[Rust WASM Ready] Hello, Gistwarden Developer! Sent from Rust WebAssembly.",
  );
});

test("Rust WASM - fastXorRust computation", async () => {
  const data = new Uint8Array([1, 2, 3, 4]);
  const key = new Uint8Array([255, 255]);
  const result = await fastXorRust(data, key);
  assertEquals(result, new Uint8Array([254, 253, 252, 251]));
});

test("Rust WASM - Proxy Auto-Guard directly calls WASM bindings", () => {
  const secret = wasm.parse_totp_secret(
    "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP",
  );
  assertEquals(secret, "JBSWY3DPEHPK3PXP");
});

test("Rust WASM - withWasmAsync helper auto-loads async WASM", async () => {
  const res = await withWasmAsync(() =>
    wasm.get_hostname("https://sub.github.com/path")
  );
  assertEquals(res, "sub.github.com");
});

test("Rust WASM - parseHibpResponseWasm Binary Search O(log N)", () => {
  const sampleHibpResponse = `
0018A45C355782986202D0001CB42F35E56:2
00D4F6E8FA6EECB2A93F2943AE44930:1
01A0E3C8B7208E20E40A8A962E3B13C:12
E2FC714C4727EE9395F324CD2E7F331F:300
FFF87234912903120391203912039120:999
`.trim();

  // Test match
  const matchCount = wasm.parse_hibp_response(
    sampleHibpResponse,
    "01A0E3C8B7208E20E40A8A962E3B13C",
  );
  assertEquals(matchCount, 12);

  // Test match case-insensitive
  const matchCaseInsensitive = wasm.parse_hibp_response(
    sampleHibpResponse,
    "e2fc714c4727ee9395f324cd2e7f331f",
  );
  assertEquals(matchCaseInsensitive, 300);

  // Test no match
  const noMatchCount = wasm.parse_hibp_response(
    sampleHibpResponse,
    "NONEXISTENTSUFFIX1234567890ABCDEF",
  );
  assertEquals(noMatchCount, 0);
});

test("Rust WASM - batchParseHibpResponseWasm multi-hash lookup", () => {
  const sampleHibpResponse = `
0018A45C355782986202D0001CB42F35E56:2
00D4F6E8FA6EECB2A93F2943AE44930:1
01A0E3C8B7208E20E40A8A962E3B13C:12
`.trim();

  const rawRes = wasm.batch_parse_hibp_response(
    sampleHibpResponse,
    JSON.stringify(["0018A45C355782986202D0001CB42F35E56", "UNKNOWN"]),
  );
  const parsed = JSON.parse(rawRes);
  assertEquals(parsed["0018A45C355782986202D0001CB42F35E56"], 2);
  assertEquals(parsed["UNKNOWN"], 0);
});

test("Rust WASM - generate_auth_data and generate_assertion_signature_base", () => {
  const authData = wasm.generate_auth_data(
    "localhost",
    1,
    true,
    true,
    null,
    null,
    null,
  );
  // 32-byte rpIdHash + 1-byte flags + 4-byte counter = 37 bytes
  assertEquals(authData.length, 37);

  const clientDataHash = new Uint8Array(32);
  const sigBase = wasm.generate_assertion_signature_base(authData, clientDataHash);
  assertEquals(sigBase.length, 37 + 32);
});
