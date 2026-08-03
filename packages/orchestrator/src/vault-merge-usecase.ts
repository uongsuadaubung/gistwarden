import {
  callWasmAndValidate,
  type Folder,
  FolderSchema,
  mergeFoldersWasmJs,
  mergeVaultItemsWasmJs,
  mergeVaultPayloadWasmJs,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";

export function mergeFolders(
  localFolders: readonly Folder[],
  remoteFolders: readonly Folder[],
): Folder[] {
  return callWasmAndValidate(
    () => mergeFoldersWasmJs(localFolders, remoteFolders),
    FolderSchema.array(),
    [],
  );
}

export function mergeVaultItems(
  localItems: readonly VaultItem[],
  remoteItems: readonly VaultItem[],
  lastSyncTimestamp: number,
): VaultItem[] {
  return callWasmAndValidate(
    () => mergeVaultItemsWasmJs(localItems, remoteItems, lastSyncTimestamp),
    VaultListSchema,
    [],
  );
}

export function mergeVaultPayload(
  localPayload: Partial<VaultPayload>,
  remotePayload: Partial<VaultPayload>,
  lastSyncTimestamp: number,
): VaultPayload {
  const fallback: VaultPayload = { folders: [], items: [], trash: [] };
  return callWasmAndValidate(
    () =>
      mergeVaultPayloadWasmJs(localPayload, remotePayload, lastSyncTimestamp),
    VaultPayloadSchema,
    fallback,
  );
}
