import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  filterMatchingDomainItems,
  isMatchingDomain,
  isSingleUriMatch,
} from "../packages/ui/src/features/vault/vault-domain-matching.ts";
import {
  type LoginVaultItem,
  UriMatchMode,
  VaultItemType,
} from "@gistwarden/domain";

function createMockLoginItem(
  id: string,
  name: string,
  uris?: { uri: string; match?: UriMatchMode | null }[],
): LoginVaultItem {
  return {
    id,
    type: VaultItemType.Login,
    name,
    favorite: false,
    reprompt: 0,
    fields: [],
    creationDate: new Date().toISOString(),
    revisionDate: new Date().toISOString(),
    login: {
      username: "user",
      password: "password123",
      uris: uris || [],
    },
  };
}

Deno.test("Vault Domain Matching - Strictly uses item.login.uris, ignores item.name", () => {
  const noUriItem = createMockLoginItem("1", "panel.io", []);
  assertEquals(
    isMatchingDomain(noUriItem, "panel.io"),
    false,
    "Item without URIs must NOT match domain even if item.name equals domain",
  );

  const linkedinItem = createMockLoginItem("2", "My Linkedin", []);
  assertEquals(
    isMatchingDomain(linkedinItem, "https://site.in"),
    false,
    "Item without URIs must NOT match site.in",
  );

  const githubItem = createMockLoginItem("3", "panel.io", [
    { uri: "https://github.com" },
  ]);
  assertEquals(
    isMatchingDomain(githubItem, "panel.io"),
    false,
    "Item with URI set to github.com must NOT match panel.io regardless of item.name",
  );
});

Deno.test("Vault Domain Matching - Single URI Match Engine (isSingleUriMatch)", () => {
  // 1. UriMatchMode.Domain (0 - Default Base Domain)
  assertEquals(
    isSingleUriMatch(
      "https://app.example.com/login",
      "login.example.com",
      UriMatchMode.Domain,
    ),
    true,
    "Base domain match mode should match subdomains of same eTLD+1",
  );
  assertEquals(
    isSingleUriMatch(
      "https://app.example.com/login",
      "otherdomain.com",
      UriMatchMode.Domain,
    ),
    false,
    "Base domain match mode should fail for different base domain",
  );

  // 2. UriMatchMode.Host (1 - Host)
  assertEquals(
    isSingleUriMatch(
      "https://sub.example.com/page",
      "sub.example.com",
      UriMatchMode.Host,
    ),
    true,
    "Host mode should match exact host",
  );
  assertEquals(
    isSingleUriMatch(
      "https://sub.example.com/page",
      "app.example.com",
      UriMatchMode.Host,
    ),
    false,
    "Host mode should fail when subdomains differ",
  );

  // 3. UriMatchMode.StartsWith (2 - StartsWith)
  assertEquals(
    isSingleUriMatch(
      "https://example.com/app",
      "https://example.com/app/dashboard",
      UriMatchMode.StartsWith,
    ),
    true,
    "StartsWith mode should match when current URL starts with stored URI",
  );
  assertEquals(
    isSingleUriMatch(
      "https://example.com/app",
      "https://example.com/other",
      UriMatchMode.StartsWith,
    ),
    false,
    "StartsWith mode should fail when prefix does not match",
  );

  // 4. UriMatchMode.Exact (3 - Exact)
  assertEquals(
    isSingleUriMatch(
      "https://example.com/login?id=1",
      "https://example.com/login?id=1",
      UriMatchMode.Exact,
    ),
    true,
    "Exact mode should match exact URL string",
  );
  assertEquals(
    isSingleUriMatch(
      "https://EXAMPLE.COM/login?ID=1",
      "https://example.com/login?id=1",
      UriMatchMode.Exact,
    ),
    true,
    "Exact mode should match case-insensitively",
  );
  assertEquals(
    isSingleUriMatch(
      "https://example.com/login?id=1",
      "https://example.com/login?id=2",
      UriMatchMode.Exact,
    ),
    false,
    "Exact mode should fail if URL differs",
  );

  // 5. UriMatchMode.Regex (4 - Regex)
  assertEquals(
    isSingleUriMatch(
      "^https://.*\\.example\\.com$",
      "https://admin.example.com",
      UriMatchMode.Regex,
    ),
    true,
    "Regex mode should match valid regular expression pattern",
  );
  assertEquals(
    isSingleUriMatch(
      "^https://.*\\.example\\.com$",
      "https://example.org",
      UriMatchMode.Regex,
    ),
    false,
    "Regex mode should fail if pattern does not match",
  );
  assertEquals(
    isSingleUriMatch(
      "a".repeat(251),
      "https://admin.example.com",
      UriMatchMode.Regex,
    ),
    false,
    "Regex mode should return false for excessively long pattern to prevent ReDoS",
  );

  // 6. UriMatchMode.Never (5 - Never)
  assertEquals(
    isSingleUriMatch(
      "https://example.com",
      "https://example.com",
      UriMatchMode.Never,
    ),
    false,
    "Never mode must always return false",
  );
});

Deno.test("Vault Domain Matching - Vault item with multiple URIs and custom match policies", () => {
  const itemWithPolicies = createMockLoginItem("item-1", "Multi-URI Item", [
    { uri: "https://never-match.com", match: UriMatchMode.Never },
    { uri: "https://exact.com/login", match: UriMatchMode.Exact },
    { uri: "https://host.example.com", match: UriMatchMode.Host },
  ]);

  // Never match URI
  assertEquals(isMatchingDomain(itemWithPolicies, "never-match.com"), false);

  // Exact match URI
  assertEquals(
    isMatchingDomain(itemWithPolicies, "https://exact.com/login"),
    true,
  );
  assertEquals(
    isMatchingDomain(itemWithPolicies, "https://exact.com/other"),
    false,
  );

  // Host match URI
  assertEquals(isMatchingDomain(itemWithPolicies, "host.example.com"), true);
  assertEquals(isMatchingDomain(itemWithPolicies, "other.example.com"), false);
});

Deno.test("Vault Domain Matching - filterMatchingDomainItems strictly matches by URI and sorts exact matches first", () => {
  const items = [
    createMockLoginItem("1", "panel.io", []), // No URI
    createMockLoginItem("2", "Base Match Item", [{
      uri: "https://sub.panel.io",
    }]), // Base domain match
    createMockLoginItem("3", "Exact Host Match Item", [{
      uri: "https://panel.io",
    }]), // Exact host match
  ];

  const matched = filterMatchingDomainItems(items, "panel.io");

  // Only item 2 and item 3 are returned, and item 3 (exact host match) is sorted first
  assertEquals(matched.length, 2);
  assertEquals(matched[0].id, "3");
  assertEquals(matched[1].id, "2");
});
