import {
  createDefaultVaultItem,
  encryptData,
  type Folder,
  getBaseDomain,
  getDomainFromItem,
  isLoginItem,
  type LoginVaultItem,
  mergeVaultItem,
  MSG_VAULT_ITEMS_UPDATED,
  type SaveActionPayload,
  SESSION_KEY_ENCRYPTED_VAULT,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultItemType,
  type VaultPayload,
} from "@gistwarden/domain";
import { setSessionItem, updateAccountSettings } from "@gistwarden/repository";
import { getSyncProvider } from "@gistwarden/network";
import { err, ok, Result } from "neverthrow";
import { deleteGistRoute } from "./messaging-contracts.ts";
import { getSessionKey } from "./crypto-usecases.ts";
import { broadcastMessage, sendBackgroundMessage } from "./messaging.ts";
import { syncVaultToGist } from "./vault-sync-usecase.ts";

export async function executeVaultMutationUseCase(
  currentPayload: VaultPayload,
  salt: string,
  mutationFn: (payload: VaultPayload) => VaultPayload | Promise<VaultPayload>,
): Promise<Result<VaultPayload, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !salt) {
    return err("login_title_locked");
  }

  const updatedPayload = await mutationFn(currentPayload);

  const uploadRes = await syncVaultToGist(
    updatedPayload.items,
    key,
    salt,
    {
      trashItems: updatedPayload.trash,
      folders: updatedPayload.folders,
    },
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  return ok(updatedPayload);
}

export async function addFolderUseCase(
  currentPayload: VaultPayload,
  salt: string,
  name: string,
): Promise<
  Result<{ payload: VaultPayload; newFolder: Folder }, TranslationKey>
> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return err("folder_error_empty_name");
  }
  const isDuplicate = currentPayload.folders.some(
    (f) => f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  if (isDuplicate) {
    return err("folder_error_duplicate_name");
  }
  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name: trimmedName,
  };

  const res = await executeVaultMutationUseCase(
    currentPayload,
    salt,
    (payload) => ({
      ...payload,
      folders: [...payload.folders, newFolder],
    }),
  );
  if (res.isErr()) return err(res.error);
  return ok({ payload: res.value, newFolder });
}

export async function renameFolderUseCase(
  currentPayload: VaultPayload,
  salt: string,
  id: string,
  newName: string,
): Promise<Result<VaultPayload, TranslationKey>> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return err("folder_error_empty_name");
  }
  const isDuplicate = currentPayload.folders.some(
    (f) =>
      f.id !== id && f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  if (isDuplicate) {
    return err("folder_error_duplicate_name");
  }

  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => ({
    ...payload,
    folders: payload.folders.map((f) =>
      f.id === id ? { ...f, name: trimmedName } : f
    ),
  }));
}

export async function deleteFolderUseCase(
  currentPayload: VaultPayload,
  salt: string,
  id: string,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => ({
    folders: payload.folders.filter((f) => f.id !== id),
    items: payload.items.map((item) =>
      item.folderId === id ? { ...item, folderId: null } : item
    ),
    trash: payload.trash,
  }));
}

export async function saveItemUseCase(
  currentPayload: VaultPayload,
  salt: string,
  item: Partial<VaultItem>,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => {
    let updatedList: VaultItem[];
    if (item.id) {
      updatedList = payload.items.map((v) => {
        if (v.id !== item.id) return v;
        return mergeVaultItem(v, item);
      });
    } else {
      const newItem = createDefaultVaultItem(item);
      updatedList = [...payload.items, newItem];
    }
    return {
      ...payload,
      items: updatedList,
    };
  });
}

export async function deleteVaultItemsUseCase(
  currentPayload: VaultPayload,
  salt: string,
  ids: string[],
): Promise<Result<VaultPayload, TranslationKey>> {
  if (ids.length === 0) {
    return ok(currentPayload);
  }

  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => {
    const idSet = new Set(ids);
    const itemsToMove = payload.items.filter((v) => idSet.has(v.id));
    const remainingItems = payload.items.filter((v) => !idSet.has(v.id));
    const deletedDate = new Date().toISOString();
    const addedTrash: TrashVaultItem[] = itemsToMove.map((item) => ({
      item,
      deletedDate,
    }));
    return {
      folders: payload.folders,
      items: remainingItems,
      trash: [...payload.trash, ...addedTrash],
    };
  });
}

export async function moveVaultItemsToFolderUseCase(
  currentPayload: VaultPayload,
  salt: string,
  ids: string[],
  folderId: string | null,
): Promise<Result<VaultPayload, TranslationKey>> {
  if (ids.length === 0) {
    return ok(currentPayload);
  }

  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => {
    const idSet = new Set(ids);
    const updatedItems = payload.items.map((item) => {
      if (idSet.has(item.id)) {
        return {
          ...item,
          folderId,
          revisionDate: new Date().toISOString(),
        };
      }
      return item;
    });

    return {
      ...payload,
      items: updatedItems,
    };
  });
}

export async function restoreVaultItemUseCase(
  currentPayload: VaultPayload,
  salt: string,
  id: string,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => {
    const trashEntry = payload.trash.find((t) => t.item.id === id);
    if (!trashEntry) return payload;
    const remainingTrash = payload.trash.filter((t) => t.item.id !== id);
    const restoredItem: VaultItem = {
      ...trashEntry.item,
      revisionDate: new Date().toISOString(),
    };
    return {
      folders: payload.folders,
      items: [...payload.items, restoredItem],
      trash: remainingTrash,
    };
  });
}

export async function purgeTrashItemUseCase(
  currentPayload: VaultPayload,
  salt: string,
  id: string,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => ({
    ...payload,
    trash: payload.trash.filter((t) => t.item.id !== id),
  }));
}

export async function purgeAllTrashUseCase(
  currentPayload: VaultPayload,
  salt: string,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(currentPayload, salt, (payload) => ({
    ...payload,
    trash: [],
  }));
}

export async function clearVaultUseCase(
  gistId?: string,
): Promise<Result<void, TranslationKey>> {
  if (gistId) {
    const sendResult = await sendBackgroundMessage(deleteGistRoute, {
      content: gistId,
    });
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }
    const val = sendResult.value;
    if (
      typeof val === "object" &&
      val !== null &&
      "success" in val &&
      val.success === false
    ) {
      return err("messaging_error_send_failed");
    }
  }

  const updateSettingsRes = await updateAccountSettings({
    githubConfig: {
      gistId: "",
      githubTokenEncrypted: "",
      githubTokenIv: "",
      username: "",
      avatarUrl: "",
    },
    lastSync: 0,
  });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  return ok();
}

export async function batchSavePayloads(
  vaultData: { items: VaultItem[]; key: Uint8Array; salt: string },
  payloads: SaveActionPayload[],
): Promise<boolean> {
  if (payloads.length === 0) return true;

  const updatedItems = [...vaultData.items];
  const nowStr = new Date().toISOString();
  let hasRealChanges = false;

  for (const payload of payloads) {
    const payloadDomain = getBaseDomain(payload.domain || "");
    const payloadUser = payload.username.toLowerCase().trim();

    const existingIdx = updatedItems.findIndex((item) => {
      if (!isLoginItem(item)) return false;
      if (payload.actionType === "update" && item.id === payload.itemId) {
        return true;
      }
      const itemDomain = getDomainFromItem(item);
      if (!itemDomain) return false;
      const matchDomain = getBaseDomain(itemDomain) === payloadDomain;
      const matchUser =
        (item.login.username || "").toLowerCase().trim() === payloadUser;
      return matchDomain && matchUser;
    });

    if (existingIdx !== -1) {
      const existingItem = updatedItems[existingIdx];
      if (isLoginItem(existingItem)) {
        if (existingItem.login.password === payload.password) {
          continue;
        }
        const updatedLoginItem: LoginVaultItem = {
          ...existingItem,
          login: {
            ...existingItem.login,
            password: payload.password,
          },
          revisionDate: nowStr,
        };
        updatedItems[existingIdx] = updatedLoginItem;
        hasRealChanges = true;
      }
    } else {
      const newItem: LoginVaultItem = {
        id: crypto.randomUUID(),
        type: VaultItemType.Login,
        name: payload.domain || "New Login",
        login: {
          username: payload.username,
          password: payload.password,
          uris: payload.domain ? [{ uri: `https://${payload.domain}` }] : [],
        },
        notes: "",
        favorite: false,
        reprompt: 0,
        fields: [],
        creationDate: nowStr,
        revisionDate: nowStr,
      };
      updatedItems.push(newItem);
      hasRealChanges = true;
    }
  }

  if (!hasRealChanges) {
    return true;
  }

  const encryptRes = await encryptData(
    JSON.stringify(updatedItems),
    vaultData.key,
  );
  if (encryptRes.isErr()) return false;

  const payloadObj = JSON.stringify({
    salt: vaultData.salt,
    iv: encryptRes.value.iv,
    ciphertext: encryptRes.value.ciphertext,
  });

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payloadObj);
  if (setRes.isErr()) return false;

  vaultData.items = updatedItems;
  const uploadRes = await getSyncProvider().upload(payloadObj);
  broadcastMessage({ type: MSG_VAULT_ITEMS_UPDATED });
  return uploadRes.isOk();
}
