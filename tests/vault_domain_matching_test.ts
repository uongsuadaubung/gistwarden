import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  filterMatchingDomainItems,
  isExactDomainMatch,
  isMatchingDomain,
} from "@/features/vault/vault-domain-matching.ts";
import { VaultItemType } from "@/features/vault/vault-types.ts";
import type { LoginVaultItem } from "@/features/vault/vault-schemas.ts";

function createMockLoginItem(
  id: string,
  name: string,
  uris?: { uri: string }[],
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
  // Case 1: Item named "panel.io" or "Admin Panel", but with no URIs -> must return FALSE
  const noUriItem = createMockLoginItem("1", "panel.io", []);
  assertEquals(
    isMatchingDomain(noUriItem, "panel.io"),
    false,
    "Item without URIs must NOT match domain even if item.name equals domain",
  );

  // Case 2: Item named "My Linkedin", with no URIs -> must return FALSE
  const linkedinItem = createMockLoginItem("2", "My Linkedin", []);
  assertEquals(
    isMatchingDomain(linkedinItem, "https://site.in"),
    false,
    "Item without URIs must NOT match site.in",
  );

  // Case 3: Item with explicit URI github.com, visiting panel.io -> must return FALSE
  const githubItem = createMockLoginItem("3", "panel.io", [
    { uri: "https://github.com" },
  ]);
  assertEquals(
    isMatchingDomain(githubItem, "panel.io"),
    false,
    "Item with URI set to github.com must NOT match panel.io regardless of item.name",
  );
});

Deno.test("Vault Domain Matching - Valid URI Matching", () => {
  const validGithubItem = createMockLoginItem("4", "GitHub Account", [
    { uri: "https://github.com/login" },
  ]);
  assertEquals(isMatchingDomain(validGithubItem, "github.com"), true);
  assertEquals(isExactDomainMatch(validGithubItem, "github.com"), true);
  assertEquals(isMatchingDomain(validGithubItem, "otherdomain.com"), false);
});

Deno.test("Vault Domain Matching - filterMatchingDomainItems strictly matches by URI", () => {
  const items = [
    createMockLoginItem("1", "panel.io", []), // No URI
    createMockLoginItem("2", "My Linkedin", []), // No URI
    createMockLoginItem("3", "Actual Panel Site", [{
      uri: "https://panel.io",
    }]), // Matches URI
  ];

  const matched = filterMatchingDomainItems(items, "panel.io");

  // Strictly only item 3 with matching URI is returned
  assertEquals(matched.length, 1);
  assertEquals(matched[0].id, "3");
});
