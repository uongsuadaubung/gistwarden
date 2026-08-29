import { describe, expect, test } from "bun:test";
import {
  DomainMatchSpec,
  FavoriteSpec,
  FolderMatchSpec,
  filterVaultItemsBySpec,
  SearchQuerySpec,
  TypeMatchSpec,
  UriMatchMode,
  VaultItemBuilder,
  VaultItemType,
} from "@gistwarden/domain";

describe("Vault Specification Pattern", () => {
  const login1 = VaultItemBuilder.login()
    .setName("GitHub Work")
    .setUsername("dev-work")
    .addUri("https://github.com/work", UriMatchMode.Domain)
    .setFavorite(true)
    .setFolderId("folder-1")
    .build();

  const login2 = VaultItemBuilder.login()
    .setName("GitLab Personal")
    .setUsername("personal-user")
    .addUri("https://gitlab.com", UriMatchMode.Domain)
    .setFavorite(false)
    .setFolderId(null)
    .build();

  const note1 = VaultItemBuilder.note()
    .setName("Secret Notes")
    .setNotes("top secret content")
    .setFavorite(true)
    .setFolderId("folder-1")
    .build();

  const allItems = [login1, login2, note1];

  test("TypeMatchSpec filters items strictly by type", () => {
    const loginSpec = new TypeMatchSpec(VaultItemType.Login);
    const results = filterVaultItemsBySpec(allItems, loginSpec);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.type === VaultItemType.Login)).toBe(true);

    const noteSpec = new TypeMatchSpec(VaultItemType.SecureNote);
    expect(filterVaultItemsBySpec(allItems, noteSpec)).toHaveLength(1);
  });

  test("DomainMatchSpec matches login items by URI domain", () => {
    const ghSpec = new DomainMatchSpec("https://github.com/settings");
    const results = filterVaultItemsBySpec(allItems, ghSpec);
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("GitHub Work");
  });

  test("Composite Specification (and, or, not) combinators", () => {
    const favLoginSpec = new TypeMatchSpec(VaultItemType.Login).and(
      new FavoriteSpec(),
    );
    const favLogins = filterVaultItemsBySpec(allItems, favLoginSpec);
    expect(favLogins).toHaveLength(1);
    expect(favLogins[0]?.name).toBe("GitHub Work");

    const folder1OrGitlabSpec = new FolderMatchSpec("folder-1").or(
      new DomainMatchSpec("https://gitlab.com"),
    );
    expect(filterVaultItemsBySpec(allItems, folder1OrGitlabSpec)).toHaveLength(
      3,
    );

    const nonFavSpec = new FavoriteSpec().not();
    const nonFavs = filterVaultItemsBySpec(allItems, nonFavSpec);
    expect(nonFavs).toHaveLength(1);
    expect(nonFavs[0]?.name).toBe("GitLab Personal");
  });

  test("SearchQuerySpec matches across name, username, notes, and URIs", () => {
    const q1 = new SearchQuerySpec("gitlab");
    expect(filterVaultItemsBySpec(allItems, q1)).toHaveLength(1);

    const q2 = new SearchQuerySpec("work");
    expect(filterVaultItemsBySpec(allItems, q2)).toHaveLength(1);

    const q3 = new SearchQuerySpec("secret");
    expect(filterVaultItemsBySpec(allItems, q3)).toHaveLength(1);
  });
});
