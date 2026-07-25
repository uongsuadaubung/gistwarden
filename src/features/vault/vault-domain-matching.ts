import { getBaseDomain, getHostname } from "@/core/domain-utils.ts";
import { VaultItemType } from "@/features/vault/vault-types.ts";
import type { VaultItem } from "@/features/vault/vault-schemas.ts";

export function isMatchingDomain(item: VaultItem, domain: string): boolean {
  if (!domain) return false;
  if (item.type !== VaultItemType.Login) return false;
  const targetBase = getBaseDomain(domain);
  if (!targetBase) return false;

  const uris = item.login.uris;
  if (!uris || uris.length === 0) return false;

  return uris.some((u) => {
    const itemBase = getBaseDomain(u.uri);
    return Boolean(itemBase && itemBase === targetBase);
  });
}

export function isExactDomainMatch(item: VaultItem, domain: string): boolean {
  if (!domain) return false;
  if (item.type !== VaultItemType.Login) return false;
  const targetHost = getHostname(domain);
  if (!targetHost) return false;

  const uris = item.login.uris;
  if (!uris || uris.length === 0) return false;

  return uris.some((u) => {
    const itemHost = getHostname(u.uri);
    return Boolean(itemHost && itemHost === targetHost);
  });
}

export function sortVaultItemsByName(items: VaultItem[]): VaultItem[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    })
  );
}

export function filterMatchingDomainItems(
  items: VaultItem[],
  domain: string,
  filterType: VaultItemType | "all" = "all",
): VaultItem[] {
  if (!domain) return [];
  let list = items;
  if (filterType && filterType !== "all") {
    list = list.filter((item) => item.type === filterType);
  }
  const filtered = list.filter((item) => isMatchingDomain(item, domain));

  return [...filtered].sort((a, b) => {
    const aExact = isExactDomainMatch(a, domain);
    const bExact = isExactDomainMatch(b, domain);

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const nameCmp = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (nameCmp !== 0) return nameCmp;

    const uA = (a.type === VaultItemType.Login ? a.login?.username : "") || "";
    const uB = (b.type === VaultItemType.Login ? b.login?.username : "") || "";
    return uA.localeCompare(uB, undefined, {
      sensitivity: "base",
      numeric: true,
    });
  });
}

export function filterVaultItemsByQuery(
  items: VaultItem[],
  searchQuery: string,
  filterType: VaultItemType | "all" = "all",
): VaultItem[] {
  const q = searchQuery.toLowerCase().trim();
  let list = items;
  if (filterType && filterType !== "all") {
    list = list.filter((item) => item.type === filterType);
  }
  if (q) {
    list = list.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const usernameMatch = item.type === VaultItemType.Login &&
        item.login.username?.toLowerCase().includes(q);
      const uriMatch = item.type === VaultItemType.Login &&
        item.login.uris?.some((u) => u.uri.toLowerCase().includes(q));
      return nameMatch || usernameMatch || uriMatch;
    });
  }
  return sortVaultItemsByName(list);
}
