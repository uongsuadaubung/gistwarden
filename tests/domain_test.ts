import {
  createDefaultVaultItem,
  getBaseDomain,
  getEffectiveRpId,
  getHostname,
  isLoginItem,
  isSingleUriMatch,
  isValidRpIdForOrigin,
  type LoginVaultItem,
  mergeVaultItem,
  toPunycodeHostname,
  UriMatchMode,
  VaultItemType,
} from "@gistwarden/domain";
import { assertEquals, test } from "./assert.ts";

test("Domain Utils - getHostname", () => {
  assertEquals(
    getHostname("https://auth.github.com/login?foo=bar"),
    "auth.github.com",
  );
  assertEquals(
    getHostname("http://www.google.com.vn:8080/search"),
    "google.com.vn",
  );
  assertEquals(getHostname("localhost:3000"), "localhost");
  assertEquals(getHostname("http://127.0.0.1:8080/api"), "127.0.0.1");
});

test("Domain Utils - getBaseDomain via tldts Public Suffix List", () => {
  assertEquals(getBaseDomain("auth.github.com"), "github.com");
  assertEquals(
    getBaseDomain("https://sub.google.com.vn/path"),
    "google.com.vn",
  );
  assertEquals(getBaseDomain("google.com.vn"), "google.com.vn");
  assertEquals(getBaseDomain("school.sub.k12.wa.us"), "sub.k12.wa.us");
  assertEquals(getBaseDomain("sub.github.io"), "github.io");
  assertEquals(getBaseDomain("localhost"), "localhost");
  assertEquals(getBaseDomain("http://127.0.0.1:8080"), "127.0.0.1");
  assertEquals(getBaseDomain(""), "");
});

test("Domain Utils - Punycode & IDN Domain Normalization & Matching", () => {
  assertEquals(toPunycodeHostname("chínhphủ.vn"), "xn--chnhph-4va0152d.vn");
  assertEquals(
    toPunycodeHostname("https://xn--chnhph-4va0152d.vn/dir"),
    "xn--chnhph-4va0152d.vn",
  );

  // Exact match Unicode vs Punycode
  assertEquals(
    isSingleUriMatch(
      "https://chínhphủ.vn",
      "https://xn--chnhph-4va0152d.vn",
      UriMatchMode.Exact,
    ),
    true,
  );

  // Host match Unicode vs Punycode
  assertEquals(
    isSingleUriMatch(
      "https://chínhphủ.vn/login",
      "https://xn--chnhph-4va0152d.vn/dashboard",
      UriMatchMode.Host,
    ),
    true,
  );
});

test("Vault Item Utils - mergeVaultItem full login patch update", () => {
  const item = createDefaultVaultItem({
    type: VaultItemType.Login,
    name: "Test Account",
    login: {
      username: "user@example.com",
      password: "OldPassword123!",
      totp: "JBSWY3DPEHPK3PXP",
      uris: [{ uri: "https://example.com" }],
      fido2Credentials: [],
    },
  });

  const updated = mergeVaultItem(item, {
    name: "Updated Account Name",
    login: {
      username: "user@example.com",
      password: "NewPassword456!",
      totp: "JBSWY3DPEHPK3PXP",
      uris: [{ uri: "https://example.com" }],
      fido2Credentials: [],
    },
  });

  assertEquals(updated.name, "Updated Account Name");
  if (updated.type === VaultItemType.Login) {
    assertEquals(updated.login.password, "NewPassword456!");
    assertEquals(updated.login.totp, "JBSWY3DPEHPK3PXP");
  } else {
    throw new Error("Item type mismatch");
  }
});

test("Vault Item Utils - mergeVaultItem preserves existing TOTP key when patch omits totp field", () => {
  const item = createDefaultVaultItem({
    type: VaultItemType.Login,
    name: "Test Account",
    login: {
      username: "user@example.com",
      password: "OldPassword123!",
      totp: "JBSWY3DPEHPK3PXP",
      uris: [{ uri: "https://example.com" }],
      fido2Credentials: [],
    },
  });

  // Mô phỏng Save Prompt: Patch chỉ truyền username và password mới (HOÀN TOÀN BỎ QUA totp)
  const updated = mergeVaultItem(item, {
    login: {
      username: "user@example.com",
      password: "NewPassword456!",
    } as unknown as LoginVaultItem["login"],
  });

  if (isLoginItem(updated)) {
    assertEquals(updated.login.password, "NewPassword456!");
    // Khẳng định totp ban đầu "JBSWY3DPEHPK3PXP" vẫn được giữ nguyên vẹn 100%
    assertEquals(updated.login.totp, "JBSWY3DPEHPK3PXP");
  } else {
    throw new Error("Item type mismatch");
  }
});

test("Domain Utils - isValidRpIdForOrigin (W3C WebAuthn Section 5.1.4)", () => {
  // Valid matching cases
  assertEquals(isValidRpIdForOrigin("google.com", "https://google.com"), true);
  assertEquals(
    isValidRpIdForOrigin("google.com", "https://login.google.com"),
    true,
  );
  assertEquals(
    isValidRpIdForOrigin("google.com", "https://sub.auth.google.com/path"),
    true,
  );
  assertEquals(
    isValidRpIdForOrigin("google.com.vn", "https://login.google.com.vn"),
    true,
  );
  assertEquals(
    isValidRpIdForOrigin("localhost", "http://localhost:3000/login"),
    true,
  );
  assertEquals(
    isValidRpIdForOrigin("127.0.0.1", "http://127.0.0.1:8080"),
    true,
  );

  // Scheme must be HTTPS (except localhost)
  assertEquals(isValidRpIdForOrigin("google.com", "http://google.com"), false);

  // Reject IP addresses as domains
  assertEquals(
    isValidRpIdForOrigin("192.168.1.1", "https://192.168.1.1"),
    false,
  );

  // rpId cannot be more specific / narrow than caller origin
  assertEquals(
    isValidRpIdForOrigin("auth.google.com", "https://google.com"),
    false,
  );

  // Public suffix (eTLD) alone cannot be rpId
  assertEquals(isValidRpIdForOrigin("co.uk", "https://example.co.uk"), false);

  // Single-label domain rejected (unless localhost)
  assertEquals(isValidRpIdForOrigin("com", "https://google.com"), false);
  assertEquals(
    isValidRpIdForOrigin("mycompany", "https://mycompany.com"),
    false,
  );

  // Phishing / cross-origin attempts
  assertEquals(isValidRpIdForOrigin("google.com", "https://evil.com"), false);
  assertEquals(
    isValidRpIdForOrigin("google.com", "https://notgoogle.com"),
    false,
  );
  assertEquals(
    isValidRpIdForOrigin("google.com", "https://google.com.evil.com"),
    false,
  );
  assertEquals(isValidRpIdForOrigin("", "https://google.com"), false);
  assertEquals(isValidRpIdForOrigin("google.com", ""), false);
});

test("Domain Utils - getEffectiveRpId defaults to origin hostname", () => {
  assertEquals(
    getEffectiveRpId("github.com", "https://github.com"),
    "github.com",
  );
  assertEquals(
    getEffectiveRpId("github.com", "https://sub.auth.github.com"),
    "github.com",
  );
  assertEquals(
    getEffectiveRpId("  GITHUB.COM  ", "https://github.com"),
    "github.com",
  );

  // When declared rpId is omitted/empty/null/undefined -> defaults to origin hostname
  assertEquals(
    getEffectiveRpId(undefined, "https://github.com/login"),
    "github.com",
  );
  assertEquals(
    getEffectiveRpId(null, "https://auth.google.com:8080"),
    "auth.google.com",
  );
  assertEquals(getEffectiveRpId("", "https://my-bank.vn/auth"), "my-bank.vn");
  assertEquals(
    getEffectiveRpId(undefined, "http://localhost:3000"),
    "localhost",
  );
});
