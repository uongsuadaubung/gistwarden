import { getBaseDomain, getHostname } from "./domain-utils.ts";
import { UriMatchMode, type VaultItem } from "./vault-schemas.ts";
import { isLoginItem, VaultItemType } from "./vault-types.ts";

export function isSingleUriMatch(
  storedUri: string,
  currentDomainOrUrl: string,
  itemMatchMode?: UriMatchMode | null,
  overrideDefaultMode?: UriMatchMode,
): boolean {
  if (!storedUri || !currentDomainOrUrl) return false;

  const effectiveMode = itemMatchMode ??
    overrideDefaultMode ??
    UriMatchMode.Domain;

  if (effectiveMode === UriMatchMode.Never) {
    return false;
  }

  const sUri = storedUri.trim();
  const cUrl = currentDomainOrUrl.trim();

  if (effectiveMode === UriMatchMode.Exact) {
    return cUrl.toLowerCase() === sUri.toLowerCase();
  }

  if (effectiveMode === UriMatchMode.StartsWith) {
    return cUrl.toLowerCase().startsWith(sUri.toLowerCase());
  }

  if (effectiveMode === UriMatchMode.Host) {
    const targetHost = getHostname(cUrl);
    const itemHost = getHostname(sUri);
    return Boolean(targetHost && itemHost && targetHost === itemHost);
  }

  if (effectiveMode === UriMatchMode.Regex) {
    if (sUri.length > 250) return false;
    try {
      return new RegExp(sUri, "i").test(cUrl);
    } catch {
      return false;
    }
  }

  const targetBase = getBaseDomain(cUrl);
  const itemBase = getBaseDomain(sUri);
  return Boolean(targetBase && itemBase && targetBase === itemBase);
}

export function isMatchingDomain(
  item: VaultItem,
  domainOrUrl: string,
  overrideDefaultMode?: UriMatchMode,
): boolean {
  if (!domainOrUrl) return false;
  if (!isLoginItem(item)) return false;

  const uris = item.login.uris;
  if (!uris || uris.length === 0) return false;

  return uris.some((u: { uri: string; match?: UriMatchMode | null }) =>
    isSingleUriMatch(u.uri, domainOrUrl, u.match, overrideDefaultMode)
  );
}

export function isExactDomainMatch(item: VaultItem, domain: string): boolean {
  if (!domain) return false;
  if (!isLoginItem(item)) return false;
  const targetHost = getHostname(domain);
  if (!targetHost) return false;

  const uris = item.login.uris;
  if (!uris || uris.length === 0) return false;

  return uris.some((u: { uri: string; match?: UriMatchMode | null }) => {
    if (u.match === UriMatchMode.Never) return false;
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
  overrideDefaultMode?: UriMatchMode,
): VaultItem[] {
  if (!domain) return [];
  let list = items;
  if (filterType && filterType !== "all") {
    list = list.filter((item) => item.type === filterType);
  }
  const filtered = list.filter((item) =>
    isMatchingDomain(item, domain, overrideDefaultMode)
  );

  const exactMatchIds = new Set(
    filtered.filter((item) => isExactDomainMatch(item, domain)).map((
      item,
    ) => item.id),
  );

  return [...filtered].sort((a, b) => {
    const aExact = exactMatchIds.has(a.id);
    const bExact = exactMatchIds.has(b.id);

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const nameCmp = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (nameCmp !== 0) return nameCmp;

    const uA = isLoginItem(a) ? (a.login.username || "") : "";
    const uB = isLoginItem(b) ? (b.login.username || "") : "";
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
      if (!isLoginItem(item)) return nameMatch;
      const usernameMatch = Boolean(
        item.login.username?.toLowerCase().includes(q),
      );
      const uriMatch = Boolean(
        item.login.uris?.some((u: { uri: string }) =>
          u.uri.toLowerCase().includes(q)
        ),
      );
      return nameMatch || usernameMatch || uriMatch;
    });
  }
  return sortVaultItemsByName(list);
}
