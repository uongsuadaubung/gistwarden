import {
  addFolderUseCase,
  clearVaultUseCase,
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
} from "@gistwarden/orchestrator";

import {
  accountStore,
  applyVaultPayloadToStore,
  setAccountStore,
} from "@/core/store.ts";
import {
  type Folder,
  type TrashVaultItem,
  type VaultItem,
  type VaultPayload,
} from "@gistwarden/domain";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

async function getOrBuildCurrentPayload(): Promise<VaultPayload> {
  const decrypted = await getDecryptedVaultItems();
  return decrypted || {
    folders: accountStore.folders || [],
    items: accountStore.vaultItems || [],
    trash: accountStore.trashItems || [],
  };
}

export async function persistAndReconcileVault(
  items: VaultItem[],
  trashItems: TrashVaultItem[] = accountStore.trashItems || [],
  folders: Folder[] = accountStore.folders || [],
): Promise<Result<VaultItem[], TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await executeVaultMutationUseCase(
    { ...payload, items, trash: trashItems, folders },
    salt,
    (p) => ({ ...p, items, trash: trashItems, folders }),
  );
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok(res.value.items);
}

export async function addFolder(
  name: string,
): Promise<Result<Folder, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await addFolderUseCase(payload, salt, name);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value.payload);
  return ok(res.value.newFolder);
}

export async function renameFolder(
  id: string,
  newName: string,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await renameFolderUseCase(payload, salt, id, newName);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteFolder(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await deleteFolderUseCase(payload, salt, id);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await saveItemUseCase(payload, salt, item);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  return await deleteVaultItems([id]);
}

export async function deleteVaultItems(
  ids: string[],
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await deleteVaultItemsUseCase(payload, salt, ids);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function moveVaultItemsToFolder(
  ids: string[],
  folderId: string | null,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await moveVaultItemsToFolderUseCase(payload, salt, ids, folderId);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function restoreVaultItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await restoreVaultItemUseCase(payload, salt, id);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeTrashItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await purgeTrashItemUseCase(payload, salt, id);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeAllTrash(): Promise<Result<void, TranslationKey>> {
  const payload = await getOrBuildCurrentPayload();
  const salt = accountStore.masterPasswordConfig.salt || "";
  const res = await purgeAllTrashUseCase(payload, salt);
  if (res.isErr()) return err(res.error);
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function clearVault(): Promise<Result<void, TranslationKey>> {
  const res = await clearVaultUseCase(accountStore.gistId);
  if (res.isErr()) return err(res.error);

  setAccountStore({
    gistId: "",
    vaultItems: [],
    lastSync: 0,
  });
  return ok();
}
