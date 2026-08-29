import { getBaseDomain, getHostname, toPunycodeUrl } from "./domain-utils.ts";
import { UriMatchMode, type VaultItem } from "./vault-schemas.ts";
import {
  DomainMatchSpec,
  filterVaultItemsBySpec,
  SearchQuerySpec,
  TypeMatchSpec,
} from "./vault-specifications.ts";
import { isLoginItem, type VaultItemType } from "./vault-types.ts";

const URI_MATCH_STRATEGIES: Record<
  UriMatchMode,
  (storedUri: string, currentUrl: string) => boolean
> = {
  [UriMatchMode.Domain]: (sUri, cUrl) => {
    const targetBase = getBaseDomain(cUrl);
    const itemBase = getBaseDomain(sUri);
    return Boolean(targetBase && itemBase && targetBase === itemBase);
  },
  [UriMatchMode.Host]: (sUri, cUrl) => {
    const targetHost = getHostname(cUrl);
    const itemHost = getHostname(sUri);
    return Boolean(targetHost && itemHost && targetHost === itemHost);
  },
  [UriMatchMode.StartsWith]: (sUri, cUrl) => {
    const sPunyUrl = toPunycodeUrl(sUri);
    const cPunyUrl = toPunycodeUrl(cUrl);
    return (
      cUrl.toLowerCase().startsWith(sUri.toLowerCase()) ||
      (Boolean(sPunyUrl) && Boolean(cPunyUrl) && cPunyUrl.startsWith(sPunyUrl))
    );
  },
  [UriMatchMode.Exact]: (sUri, cUrl) => {
    const sPunyUrl = toPunycodeUrl(sUri);
    const cPunyUrl = toPunycodeUrl(cUrl);
    return (
      cUrl.toLowerCase() === sUri.toLowerCase() ||
      (Boolean(sPunyUrl) && Boolean(cPunyUrl) && cPunyUrl === sPunyUrl)
    );
  },
  [UriMatchMode.Regex]: (sUri, cUrl) => {
    if (sUri.length > 250) return false;
    try {
      return new RegExp(sUri, "i").test(cUrl);
    } catch {
      return false;
    }
  },
  [UriMatchMode.Never]: () => false,
};

export function isSingleUriMatch(
  storedUri: string,
  currentDomainOrUrl: string,
  itemMatchMode?: UriMatchMode | null,
  overrideDefaultMode?: UriMatchMode,
): boolean {
  if (!storedUri || !currentDomainOrUrl) return false;

  const effectiveMode =
    itemMatchMode ?? overrideDefaultMode ?? UriMatchMode.Domain;

  const matcher =
    URI_MATCH_STRATEGIES[effectiveMode] ??
    URI_MATCH_STRATEGIES[UriMatchMode.Domain];

  return matcher(storedUri.trim(), currentDomainOrUrl.trim());
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
    isSingleUriMatch(u.uri, domainOrUrl, u.match, overrideDefaultMode),
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
    }),
  );
}

export function filterMatchingDomainItems(
  items: VaultItem[],
  domain: string,
  filterType: VaultItemType | "all" = "all",
  overrideDefaultMode?: UriMatchMode,
): VaultItem[] {
  if (!domain) return [];

  const spec = new TypeMatchSpec(filterType).and(
    new DomainMatchSpec(domain, overrideDefaultMode),
  );
  const filtered = filterVaultItemsBySpec(items, spec);

  const exactMatchIds = new Set(
    filtered
      .filter((item) => isExactDomainMatch(item, domain))
      .map((item) => item.id),
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

    const uA = isLoginItem(a) ? a.login.username || "" : "";
    const uB = isLoginItem(b) ? b.login.username || "" : "";
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
  const spec = new TypeMatchSpec(filterType).and(
    new SearchQuerySpec(searchQuery),
  );
  const matchedList = filterVaultItemsBySpec(items, spec);
  return sortVaultItemsByName(matchedList);
}
