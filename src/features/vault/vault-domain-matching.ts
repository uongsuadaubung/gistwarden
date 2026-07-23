import { getBaseDomain, getHostname } from "@/core/domain-utils.ts";
import { type VaultItem, VaultItemType } from "@/core/types.ts";

export function isMatchingDomain(item: VaultItem, domain: string): boolean {
  if (!domain) return false;
  if (item.type !== VaultItemType.Login) return false;
  const targetBase = getBaseDomain(domain);
  if (!targetBase) return false;

  if (item.name.toLowerCase().includes(targetBase)) return true;
  if (item.login.uris) {
    return item.login.uris.some((u) => {
      const itemBase = getBaseDomain(u.uri);
      return itemBase && itemBase === targetBase;
    });
  }
  return false;
}

export function isExactDomainMatch(item: VaultItem, domain: string): boolean {
  if (!domain) return false;
  if (item.type !== VaultItemType.Login) return false;
  const targetHost = getHostname(domain);
  if (!targetHost) return false;

  if (item.name.toLowerCase().includes(targetHost)) return true;
  if (item.login.uris) {
    return item.login.uris.some((u) => {
      const itemHost = getHostname(u.uri);
      return itemHost && itemHost === targetHost;
    });
  }
  return false;
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

    return a.name.localeCompare(b.name, undefined, {
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
