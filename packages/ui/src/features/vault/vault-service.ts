import { setSessionItem, updateAccountSettings } from "@/core/storage.ts";
import { encryptData } from "@gistwarden/domain";
import { getSessionKey } from "@gistwarden/orchestrator";
import {
  accountStore,
  applyVaultPayloadToStore,
  setAccountStore,
} from "@/core/store.ts";
import { isLoginItem, VaultItemType } from "@gistwarden/domain";
import {
  type Folder,
  type LoginVaultItem,
  type SaveActionPayload,
  type TrashVaultItem,
  type VaultItem,
  type VaultPayload,
} from "@gistwarden/domain";
import { broadcastMessage, sendBackgroundMessage } from "@/core/messaging.ts";

import { syncVaultToGist } from "../sync/sync-utils.ts";
import { deleteGistRoute } from "@gistwarden/orchestrator";
import {
  MSG_VAULT_ITEMS_UPDATED,
  SESSION_KEY_ENCRYPTED_VAULT,
} from "@/core/constants.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { getBaseDomain, getDomainFromItem } from "@/core/domain-utils.ts";
import { getSyncProvider } from "@/providers/sync-provider-registry.ts";
import {
  createDefaultVaultItem,
  mergeVaultItem,
} from "@/features/vault/vault-utils.ts";
import { getDecryptedVaultItems } from "./vault-repository.ts";

export async function executeVaultMutation(
  mutationFn: (
    currentPayload: VaultPayload,
  ) => VaultPayload | Promise<VaultPayload>,
): Promise<Result<VaultItem[], TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.masterPasswordConfig.salt) {
    return err("login_title_locked");
  }

  // 1. Lấy dữ liệu két sắt mới nhất từ Gist (Decrypt) hoặc fallback từ local store
  const decrypted = await getDecryptedVaultItems();
  const currentPayload: VaultPayload = decrypted || {
    folders: accountStore.folders || [],
    items: accountStore.vaultItems || [],
    trash: accountStore.trashItems || [],
  };

  // 2. Thực thi thao tác biến đổi dữ liệu (Mutation Intent)
  const updatedPayload = await mutationFn(currentPayload);

  // 3. Đồng bộ dữ liệu mới đã được biến đổi lên Gist và cập nhật Store local
  const uploadRes = await syncVaultToGist(
    updatedPayload.items,
    key,
    accountStore.masterPasswordConfig.salt,
    {
      trashItems: updatedPayload.trash,
      folders: updatedPayload.folders,
    },
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  applyVaultPayloadToStore(updatedPayload);
  return ok(updatedPayload.items);
}

export async function persistAndReconcileVault(
  items: VaultItem[],
  trashItems: TrashVaultItem[] = accountStore.trashItems || [],
  folders: Folder[] = accountStore.folders || [],
): Promise<Result<VaultItem[], TranslationKey>> {
  return await executeVaultMutation((_payload) => ({
    folders,
    items,
    trash: trashItems,
  }));
}

export async function addFolder(
  name: string,
): Promise<Result<Folder, TranslationKey>> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return err("folder_error_empty_name");
  }
  const isDuplicate = (accountStore.folders || []).some(
    (f) => f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  if (isDuplicate) {
    return err("folder_error_duplicate_name");
  }
  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name: trimmedName,
  };

  const res = await executeVaultMutation((payload) => ({
    ...payload,
    folders: [...payload.folders, newFolder],
  }));
  if (res.isErr()) return err(res.error);
  return ok(newFolder);
}

export async function renameFolder(
  id: string,
  newName: string,
): Promise<Result<void, TranslationKey>> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return err("folder_error_empty_name");
  }
  const isDuplicate = (accountStore.folders || []).some(
    (f) =>
      f.id !== id && f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );
  if (isDuplicate) {
    return err("folder_error_duplicate_name");
  }

  const res = await executeVaultMutation((payload) => ({
    ...payload,
    folders: payload.folders.map((f) =>
      f.id === id ? { ...f, name: trimmedName } : f
    ),
  }));
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function deleteFolder(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const res = await executeVaultMutation((payload) => ({
    folders: payload.folders.filter((f) => f.id !== id),
    items: payload.items.map((item) =>
      item.folderId === id ? { ...item, folderId: null } : item
    ),
    trash: payload.trash,
  }));
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const res = await executeVaultMutation((payload) => {
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
  if (res.isErr()) return err(res.error);
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
  if (ids.length === 0) {
    return ok();
  }

  const res = await executeVaultMutation((payload) => {
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
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function restoreVaultItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const res = await executeVaultMutation((payload) => {
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
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function purgeTrashItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const res = await executeVaultMutation((payload) => ({
    ...payload,
    trash: payload.trash.filter((t) => t.item.id !== id),
  }));
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function purgeAllTrash(): Promise<Result<void, TranslationKey>> {
  const res = await executeVaultMutation((payload) => ({
    ...payload,
    trash: [],
  }));
  if (res.isErr()) return err(res.error);
  return ok();
}

export async function clearVault(): Promise<Result<void, TranslationKey>> {
  const gistId = accountStore.gistId;
  if (gistId) {
    const sendResult = await sendBackgroundMessage(deleteGistRoute, {
      content: gistId,
    });
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }
    if (!sendResult.value.success) {
      return err(sendResult.value.error || "messaging_error_send_failed");
    }
  }

  // Reset local account settings
  const updatedGithubConfig = {
    ...accountStore.githubConfig,
    gistId: "",
  };
  const updateSettingsRes = await updateAccountSettings({
    githubConfig: updatedGithubConfig,
    lastSync: 0,
  });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  setAccountStore({
    gistId: "",
    vaultItems: [],
    lastSync: 0,
  });
  return ok();
}

export async function batchSavePayloads(
  vaultData: { items: VaultItem[]; key: CryptoKey; salt: string },
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
