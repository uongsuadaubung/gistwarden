import { setSessionItem, updateAccountSettings } from "@/core/storage.ts";
import { encryptData, getSessionKey } from "@/core/crypto.ts";
import { accountStore, setAccountStore } from "@/core/store.ts";
import { reconcile } from "solid-js/store";
import { isLoginItem, VaultItemType } from "@/features/vault/vault-types.ts";
import {
  type LoginVaultItem,
  type SaveActionPayload,
  type TrashVaultItem,
  type VaultItem,
} from "@/features/vault/vault-schemas.ts";
import { broadcastMessage, sendBackgroundMessage } from "@/core/messaging.ts";

import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import { deleteGistRoute } from "@/features/sync/sync-schemas.ts";
import {
  MSG_VAULT_ITEMS_UPDATED,
  SESSION_KEY_ENCRYPTED_VAULT,
  STORE_KEY_VAULT_ITEMS,
} from "@/core/constants.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { getBaseDomain, getDomainFromItem } from "@/core/domain-utils.ts";
import { getSyncProvider } from "@/providers/sync-provider-registry.ts";
import {
  createDefaultVaultItem,
  mergeVaultItem,
} from "@/features/vault/vault-utils.ts";

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    return err("login_title_locked");
  }

  let updatedList: VaultItem[];

  if (item.id) {
    // Edit
    updatedList = accountStore.vaultItems.map((v) => {
      if (v.id !== item.id) return v;
      return mergeVaultItem(v, item);
    });
  } else {
    // New
    const newItem = createDefaultVaultItem(item);
    updatedList = [...accountStore.vaultItems, newItem];
  }

  const uploadRes = await syncVaultToGist(updatedList, key, accountStore.salt);
  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setAccountStore(
    STORE_KEY_VAULT_ITEMS,
    reconcile(validatedList),
  );
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
  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    return err("login_title_locked");
  }

  const idSet = new Set(ids);
  const itemsToMoveToTrash = accountStore.vaultItems.filter((v) =>
    idSet.has(v.id)
  );
  const remainingItems = accountStore.vaultItems.filter((v) =>
    !idSet.has(v.id)
  );

  const deletedDate = new Date().toISOString();
  const addedTrash: TrashVaultItem[] = itemsToMoveToTrash.map((item) => ({
    item,
    deletedDate,
  }));

  const combinedTrash = [...(accountStore.trashItems || []), ...addedTrash];

  const uploadRes = await syncVaultToGist(
    remainingItems,
    key,
    accountStore.salt,
    combinedTrash,
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setAccountStore(
    STORE_KEY_VAULT_ITEMS,
    reconcile(validatedList),
  );
  return ok();
}

export async function restoreVaultItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    return err("login_title_locked");
  }

  const trashEntry = (accountStore.trashItems || []).find(
    (t) => t.item.id === id,
  );
  if (!trashEntry) {
    return ok();
  }

  const remainingTrash = (accountStore.trashItems || []).filter(
    (t) => t.item.id !== id,
  );
  const restoredItem: VaultItem = {
    ...trashEntry.item,
    revisionDate: new Date().toISOString(),
  };

  const updatedItems = [...accountStore.vaultItems, restoredItem];

  const uploadRes = await syncVaultToGist(
    updatedItems,
    key,
    accountStore.salt,
    remainingTrash,
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  setAccountStore(
    STORE_KEY_VAULT_ITEMS,
    reconcile(uploadRes.value),
  );
  return ok();
}

export async function purgeTrashItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    return err("login_title_locked");
  }

  const remainingTrash = (accountStore.trashItems || []).filter(
    (t) => t.item.id !== id,
  );

  const uploadRes = await syncVaultToGist(
    accountStore.vaultItems,
    key,
    accountStore.salt,
    remainingTrash,
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  return ok();
}

export async function purgeAllTrash(): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    return err("login_title_locked");
  }

  const uploadRes = await syncVaultToGist(
    accountStore.vaultItems,
    key,
    accountStore.salt,
    [],
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

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
  const updateSettingsRes = await updateAccountSettings({
    gistId: "",
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
