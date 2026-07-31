import type {
  Folder,
  TrashVaultItem,
  VaultItem,
  VaultPayload,
} from "@gistwarden/domain";

function parseTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function mergeFolders(
  localFolders: readonly Folder[],
  remoteFolders: readonly Folder[],
): Folder[] {
  const folderMap = new Map<string, Folder>();
  for (const f of localFolders) {
    if (f.id && f.name) {
      folderMap.set(f.id, f);
    }
  }
  for (const f of remoteFolders) {
    if (f.id && f.name && !folderMap.has(f.id)) {
      folderMap.set(f.id, f);
    }
  }
  return Array.from(folderMap.values());
}

export function mergeVaultItems(
  localItems: readonly VaultItem[],
  remoteItems: readonly VaultItem[],
  lastSyncTimestamp: number,
): VaultItem[] {
  const itemMap = new Map<string, VaultItem>();
  const localMap = new Map<string, VaultItem>();

  for (const localItem of localItems) {
    localMap.set(localItem.id, localItem);
  }

  for (const remoteItem of remoteItems) {
    const localItem = localMap.get(remoteItem.id);

    if (localItem) {
      const localRevTime = parseTimestamp(localItem.revisionDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (localRevTime >= remoteRevTime) {
        itemMap.set(localItem.id, localItem);
      } else {
        itemMap.set(remoteItem.id, remoteItem);
      }
    } else {
      const remoteCreationTime = parseTimestamp(remoteItem.creationDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (
        lastSyncTimestamp === 0 ||
        remoteCreationTime > lastSyncTimestamp ||
        remoteRevTime > lastSyncTimestamp
      ) {
        itemMap.set(remoteItem.id, remoteItem);
      }
    }
  }

  for (const localItem of localItems) {
    if (!itemMap.has(localItem.id)) {
      const remoteItem = remoteItems.find((r) => r.id === localItem.id);

      if (!remoteItem) {
        const localCreationTime = parseTimestamp(localItem.creationDate);
        const localRevTime = parseTimestamp(localItem.revisionDate);
        if (
          lastSyncTimestamp === 0 ||
          localCreationTime > lastSyncTimestamp ||
          localRevTime > lastSyncTimestamp
        ) {
          itemMap.set(localItem.id, localItem);
        }
      }
    }
  }

  return Array.from(itemMap.values());
}

export function mergeVaultPayload(
  localPayload: Partial<VaultPayload>,
  remotePayload: Partial<VaultPayload>,
  lastSyncTimestamp: number,
): VaultPayload {
  const localTrash = localPayload.trash || [];
  const remoteTrash = remotePayload.trash || [];

  const mergedFolders = localPayload.folders !== undefined
    ? localPayload.folders
    : mergeFolders(
      localPayload.folders || [],
      remotePayload.folders || [],
    );

  const trashMap = new Map<string, TrashVaultItem>();
  for (const tItem of [...localTrash, ...remoteTrash]) {
    const existing = trashMap.get(tItem.item.id);
    if (!existing) {
      trashMap.set(tItem.item.id, tItem);
    } else {
      const existingDelTime = parseTimestamp(existing.deletedDate);
      const newDelTime = parseTimestamp(tItem.deletedDate);
      if (newDelTime >= existingDelTime) {
        trashMap.set(tItem.item.id, tItem);
      }
    }
  }

  const candidateItems = mergeVaultItems(
    localPayload.items || [],
    remotePayload.items || [],
    lastSyncTimestamp,
  );

  const finalItems: VaultItem[] = [];
  for (const item of candidateItems) {
    const trashEntry = trashMap.get(item.id);
    if (trashEntry) {
      const delTime = parseTimestamp(trashEntry.deletedDate);
      const revTime = parseTimestamp(item.revisionDate);
      if (delTime >= revTime) {
        continue;
      } else {
        trashMap.delete(item.id);
      }
    }
    finalItems.push(item);
  }

  return {
    folders: mergedFolders,
    items: finalItems,
    trash: Array.from(trashMap.values()),
  };
}
