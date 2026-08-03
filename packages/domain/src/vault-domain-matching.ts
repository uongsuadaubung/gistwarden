import { getBaseDomain, getHostname } from "./domain-utils.ts";
import {
  UriMatchMode,
  type VaultItem,
  VaultListSchema,
} from "./vault-schemas.ts";
import { isLoginItem, VaultItemType } from "./vault-types.ts";
import {
  callWasmAndValidate,
  filterMatchingDomainItemsWasmJs,
  filterVaultItemsByQueryWasmJs,
  initWasmAsync,
  isSingleUriMatchWasm,
} from "./wasm/index.ts";

export async function isSingleUriMatchAsync(
  storedUri: string,
  currentDomainOrUrl: string,
  itemMatchMode?: UriMatchMode | null,
  overrideDefaultMode?: UriMatchMode,
): Promise<boolean> {
  if (!storedUri || !currentDomainOrUrl) return false;
  await initWasmAsync();

  const targetHost = getHostname(currentDomainOrUrl);
  const itemHost = getHostname(storedUri);
  const targetBase = getBaseDomain(currentDomainOrUrl);
  const itemBase = getBaseDomain(storedUri);

  return isSingleUriMatchWasm(
    storedUri,
    currentDomainOrUrl,
    itemMatchMode,
    overrideDefaultMode,
    targetHost,
    itemHost,
    targetBase,
    itemBase,
  );
}

export function isSingleUriMatch(
  storedUri: string,
  currentDomainOrUrl: string,
  itemMatchMode?: UriMatchMode | null,
  overrideDefaultMode?: UriMatchMode,
): boolean {
  if (!storedUri || !currentDomainOrUrl) return false;

  const targetHost = getHostname(currentDomainOrUrl);
  const itemHost = getHostname(storedUri);
  const targetBase = getBaseDomain(currentDomainOrUrl);
  const itemBase = getBaseDomain(storedUri);

  return isSingleUriMatchWasm(
    storedUri,
    currentDomainOrUrl,
    itemMatchMode,
    overrideDefaultMode,
    targetHost,
    itemHost,
    targetBase,
    itemBase,
  );
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
    return itemHost === targetHost;
  });
}

export function filterMatchingDomainItems(
  items: VaultItem[],
  domainOrUrl: string,
  overrideDefaultMode?: UriMatchMode,
): VaultItem[] {
  if (!domainOrUrl || !items || items.length === 0) return [];
  return callWasmAndValidate(
    () =>
      filterMatchingDomainItemsWasmJs(items, domainOrUrl, overrideDefaultMode),
    VaultListSchema,
    [],
  );
}

export function filterVaultItemsByQuery(
  items: VaultItem[],
  searchQuery: string,
  filterType: string = "all",
): VaultItem[] {
  if (!items || items.length === 0) return [];
  if (!searchQuery && filterType === "all") return items;

  return callWasmAndValidate(
    () => filterVaultItemsByQueryWasmJs(items, searchQuery, filterType),
    VaultListSchema,
    [],
  );
}
