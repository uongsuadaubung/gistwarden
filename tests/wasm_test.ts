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
