import {
  callWasmAndValidate,
  type Folder,
  FolderSchema,
  mergeFoldersWasm,
  mergeVaultItemsWasm,
  mergeVaultPayloadWasm,
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
    () => mergeFoldersWasm(JSON.stringify(localFolders), JSON.stringify(remoteFolders)),
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
    () => mergeVaultItemsWasm(JSON.stringify(localItems), JSON.stringify(remoteItems), lastSyncTimestamp),
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
    () => mergeVaultPayloadWasm(JSON.stringify(localPayload), JSON.stringify(remotePayload), lastSyncTimestamp),
    VaultPayloadSchema,
    fallback,
  );
}
