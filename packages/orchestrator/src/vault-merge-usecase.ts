import {
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
  const raw = mergeFoldersWasm(
    JSON.stringify(localFolders),
    JSON.stringify(remoteFolders),
  );
  if (!raw) return [];
  const parsed = FolderSchema.array().safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function mergeVaultItems(
  localItems: readonly VaultItem[],
  remoteItems: readonly VaultItem[],
  lastSyncTimestamp: number,
): VaultItem[] {
  const raw = mergeVaultItemsWasm(
    JSON.stringify(localItems),
    JSON.stringify(remoteItems),
    lastSyncTimestamp,
  );
  if (!raw) return [];
  const parsed = VaultListSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function mergeVaultPayload(
  localPayload: Partial<VaultPayload>,
  remotePayload: Partial<VaultPayload>,
  lastSyncTimestamp: number,
): VaultPayload {
  const raw = mergeVaultPayloadWasm(
    JSON.stringify(localPayload),
    JSON.stringify(remotePayload),
    lastSyncTimestamp,
  );
  if (!raw) return { folders: [], items: [], trash: [] };
  const parsed = VaultPayloadSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : { folders: [], items: [], trash: [] };
}
