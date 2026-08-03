import { assert, assertEquals, test } from "./assert.ts";
import { generateTotpSafe, parseTotpSecret } from "@gistwarden/domain";

test("TOTP - RFC 6238 Standard Test Vectors", async () => {
  // RFC 6238 Secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" (ASCII: "12345678901234567890")
  const secretRfc = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  // Test at timestamp 59000 (Counter 1) -> 287082
  const res1 = await generateTotpSafe(secretRfc, 59000 - Date.now());
  assert(res1.isOk());
  if (res1.isOk()) {
    assertEquals(res1.value, "287082");
  }

  // Test at timestamp 1111111109000 (Counter 37037036) -> 081804
  const res2 = await generateTotpSafe(secretRfc, 1111111109000 - Date.now());
  assert(res2.isOk());
  if (res2.isOk()) {
    assertEquals(res2.value, "081804");
  }

  // Test at timestamp 1234567890000 (Counter 41152263) -> 005924
  const res3 = await generateTotpSafe(secretRfc, 1234567890000 - Date.now());
  assert(res3.isOk());
  if (res3.isOk()) {
    assertEquals(res3.value, "005924");
  }

  // Secret: "JBSWY3DPEHPK3PXP" (ASCII: "Hello!") at counter 1 -> 996554
  const res4 = await generateTotpSafe("JBSWY3DPEHPK3PXP", 59000 - Date.now());
  assert(res4.isOk());
  if (res4.isOk()) {
    assertEquals(res4.value, "996554");
  }
});

test("TOTP - parseTotpSecret URL & Raw format", () => {
  const uri =
    "otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
  assertEquals(parseTotpSecret(uri), "JBSWY3DPEHPK3PXP");
  assertEquals(parseTotpSecret("  jbsw y3dp ehpk 3pxp  "), "JBSWY3DPEHPK3PXP");
});
