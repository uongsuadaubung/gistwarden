import type {
  Folder,
  FolderId,
  TrashVaultItem,
  VaultItem,
  VaultItemId,
  VaultPayload,
} from "@gistwarden/domain";
import {
  addFolderUseCase,
  clearVaultUseCase,
  createItemUseCase,
  deleteFolderUseCase,
  deleteVaultItemsUseCase,
  executeVaultMutationUseCase,
  getDecryptedVaultItems,
  moveVaultItemsToFolderUseCase,
  purgeAllTrashUseCase,
  purgeTrashItemUseCase,
  renameFolderUseCase,
  restoreVaultItemUseCase,
  saveItemUseCase,
  updateItemUseCase,
  vaultSecurityContext,
} from "@gistwarden/orchestrator";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import {
  accountStore,
  applyVaultPayloadToStore,
  setAccountStore,
  settingsStore,
} from "@/core/store.ts";

import { handleGlobalApiError } from "@/core/ui-service.ts";

async function getOrBuildCurrentPayloadAndSalt(): Promise<{
  payload: VaultPayload;
  key: CryptoKey | null;
  salt: string;
}> {
  const key = await vaultSecurityContext.getKey();
  const decrypted = key ? await getDecryptedVaultItems(key) : null;
  const salt = accountStore.masterPasswordConfig.salt || decrypted?.salt || "";
  const payload: VaultPayload = decrypted || {
    folders: accountStore.folders || [],
    items: accountStore.vaultItems || [],
    trash: accountStore.trashItems || [],
  };
  return { payload, key, salt };
}

export async function persistAndReconcileVault(
  items: VaultItem[],
  trashItems: TrashVaultItem[] = accountStore.trashItems || [],
  folders: Folder[] = accountStore.folders || [],
): Promise<Result<VaultItem[], TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await executeVaultMutationUseCase(
    { ...payload, items, trash: trashItems, folders },
    key,
    salt,
    settingsStore.vaultMode,
    (p) => ({ ...p, items, trash: trashItems, folders }),
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok(res.value.items);
}

export async function addFolder(
  name: string,
): Promise<Result<Folder, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await addFolderUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    name,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value.payload);
  return ok(res.value.newFolder);
}

export async function renameFolder(
  id: FolderId,
  newName: string,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await renameFolderUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    id,
    newName,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteFolder(
  id: FolderId,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await deleteFolderUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    id,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function createItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await createItemUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    item,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function updateItem(
  id: VaultItemId,
  patch: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await updateItemUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    id,
    patch,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await saveItemUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    item,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  return await deleteVaultItems([id]);
}

export async function deleteVaultItems(
  ids: VaultItemId[],
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await deleteVaultItemsUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    ids,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function moveVaultItemsToFolder(
  ids: VaultItemId[],
  folderId: FolderId | null,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await moveVaultItemsToFolderUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    ids,
    folderId,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function restoreVaultItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await restoreVaultItemUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    id,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeTrashItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await purgeTrashItemUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
    id,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeAllTrash(): Promise<Result<void, TranslationKey>> {
  const { payload, key, salt } = await getOrBuildCurrentPayloadAndSalt();
  if (!key) return err("login_title_locked");
  const res = await purgeAllTrashUseCase(
    payload,
    key,
    salt,
    settingsStore.vaultMode,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function clearVault(): Promise<Result<void, TranslationKey>> {
  const res = await clearVaultUseCase(
    settingsStore.vaultMode,
    accountStore.gistId,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }

  setAccountStore({
    gistId: "",
    vaultItems: [],
    lastSync: 0,
  });
  return ok();
}
