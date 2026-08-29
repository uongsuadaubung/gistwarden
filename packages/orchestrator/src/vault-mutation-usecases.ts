import {
  asFolderId,
  asGistId,
  asVaultItemId,
  createDefaultVaultItem,
  decryptData,
  encryptData,
  type Folder,
  type FolderId,
  type GoogleMigrationAccountMapping,
  getBaseDomain,
  getDomainFromItem,
  isLoginItem,
  type LoginVaultItem,
  MSG_VAULT_ITEMS_UPDATED,
  mergeVaultItem,
  type SaveActionPayload,
  SESSION_KEY_ENCRYPTED_VAULT,
  safeJsonParse,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultItemBuilder,
  type VaultItemId,
  VaultItemType,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import {
  DEFAULT_SYNC_CONFIG,
  EncryptedPayloadSchema,
  getAccountSettings,
  getSessionItem,
  getSyncToken,
  removeSessionItem,
  setSessionItem,
  updateAccountSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { broadcastMessage } from "./messaging.ts";
import { getSyncProvider } from "./sync-provider-registry.ts";
import { syncVaultToGist } from "./sync-usecases.ts";

export type DecryptedVaultData = VaultPayload & {
  key: CryptoKey;
  salt: string;
};

export async function getDecryptedVaultItems(
  key: CryptoKey,
): Promise<DecryptedVaultData | null> {
  const rawVaultRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const rawVault = rawVaultRes.isOk() ? rawVaultRes.value : null;
  if (typeof rawVault !== "string" || !rawVault) {
    return { folders: [], items: [], trash: [], key, salt: "" };
  }

  const parsePayloadRes = safeJsonParse(rawVault);
  if (parsePayloadRes.isErr()) {
    return { folders: [], items: [], trash: [], key, salt: "" };
  }

  const payloadParse = EncryptedPayloadSchema.safeParse(parsePayloadRes.value);
  if (
    !payloadParse.success ||
    !payloadParse.data.ciphertext ||
    !payloadParse.data.iv
  ) {
    return { folders: [], items: [], trash: [], key, salt: "" };
  }

  const { ciphertext, iv, salt } = payloadParse.data;
  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) {
    return { folders: [], items: [], trash: [], key, salt: salt || "" };
  }

  const parseItemsRes = safeJsonParse(decryptRes.value);
  if (parseItemsRes.isErr()) {
    return { folders: [], items: [], trash: [], key, salt: salt || "" };
  }

  let folders: Folder[] = [];
  let items: VaultItem[] = [];
  let trash: TrashVaultItem[] = [];
  const rawVal = parseItemsRes.value;
  if (Array.isArray(rawVal)) {
    const validateRes = VaultListSchema.safeParse(rawVal);
    if (!validateRes.success) {
      return { folders: [], items: [], trash: [], key, salt: salt || "" };
    }
    items = validateRes.data;
  } else {
    const validateRes = VaultPayloadSchema.safeParse(rawVal);
    if (!validateRes.success) {
      return { folders: [], items: [], trash: [], key, salt: salt || "" };
    }
    folders = validateRes.data.folders || [];
    items = validateRes.data.items;
    trash = validateRes.data.trash || [];
  }

  return { folders, items, trash, key, salt: salt || "" };
}

export async function executeVaultMutationUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  mutationFn: (payload: VaultPayload) => VaultPayload | Promise<VaultPayload>,
): Promise<Result<VaultPayload, TranslationKey>> {
  if (!salt) {
    return err("login_title_locked");
  }

  const updatedPayload = await mutationFn(currentPayload);

  const uploadRes = await syncVaultToGist(updatedPayload.items, key, salt, {
    vaultMode,
    trashItems: updatedPayload.trash,
    folders: updatedPayload.folders,
    skipRemoteMerge: true,
  });

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  return ok(updatedPayload);
}

export async function addFolderUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
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
    id: asFolderId(crypto.randomUUID()),
    name: trimmedName,
  };

  const res = await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
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
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  id: FolderId,
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

  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => ({
      ...payload,
      folders: payload.folders.map((f) =>
        f.id === id ? { ...f, name: trimmedName } : f,
      ),
    }),
  );
}

export async function deleteFolderUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  id: FolderId,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => ({
      folders: payload.folders.filter((f) => f.id !== id),
      items: payload.items.map((item) =>
        item.folderId === id ? { ...item, folderId: null } : item,
      ),
      trash: payload.trash,
    }),
  );
}

export async function saveItemUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  item: Partial<VaultItem>,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => {
      let updatedList: VaultItem[];
      const isExisting = item.id
        ? payload.items.some((v) => v.id === item.id)
        : false;
      if (item.id && isExisting) {
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
    },
  );
}

export async function deleteVaultItemsUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  ids: VaultItemId[],
): Promise<Result<VaultPayload, TranslationKey>> {
  if (ids.length === 0) {
    return ok(currentPayload);
  }

  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => {
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
    },
  );
}

export async function moveVaultItemsToFolderUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  ids: VaultItemId[],
  folderId: FolderId | null,
): Promise<Result<VaultPayload, TranslationKey>> {
  if (ids.length === 0) {
    return ok(currentPayload);
  }

  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => {
      const idSet = new Set(ids);
      const targetFolderId = folderId
        ? asFolderId(folderId)
        : folderId === null
          ? null
          : undefined;
      const updatedItems = payload.items.map((item) => {
        if (idSet.has(item.id)) {
          return {
            ...item,
            folderId: targetFolderId,
            revisionDate: new Date().toISOString(),
          };
        }
        return item;
      });

      return {
        ...payload,
        items: updatedItems,
      };
    },
  );
}

export async function restoreVaultItemUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  id: VaultItemId,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => {
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
    },
  );
}

export async function purgeTrashItemUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  id: VaultItemId,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => ({
      ...payload,
      trash: payload.trash.filter((t) => t.item.id !== id),
    }),
  );
}

export async function purgeAllTrashUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
): Promise<Result<VaultPayload, TranslationKey>> {
  return await executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => ({
      ...payload,
      trash: [],
    }),
  );
}

export async function clearVaultUseCase(
  mode: VaultMode,
  gistId?: string,
): Promise<Result<void, TranslationKey>> {
  const provider = getSyncProvider(mode);
  const token = await getSyncToken(mode);
  const accRes = await getAccountSettings(mode);
  const acc = accRes.isOk() ? accRes.value : null;
  const syncConfig = acc?.syncConfig;

  const deleteRes = await provider.delete(
    gistId ? asGistId(gistId) : undefined,
    {
      token: token || undefined,
      serverUrl: syncConfig?.serverUrl,
    },
  );
  if (deleteRes.isErr()) {
    return err(deleteRes.error);
  }

  const savedServerUrl = syncConfig?.serverUrl || "";
  const updateSettingsRes = await updateAccountSettings(
    {
      syncConfig: {
        ...DEFAULT_SYNC_CONFIG,
        ...(savedServerUrl ? { serverUrl: savedServerUrl } : {}),
      },
      lastSync: 0,
    },
    mode,
  );
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  await removeSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  return ok();
}

export async function batchSavePayloads(
  vaultData: { items: VaultItem[]; key: CryptoKey; salt: string },
  payloads: SaveActionPayload[],
  vaultMode: VaultMode = "github_gist",
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
      if (existingItem && isLoginItem(existingItem)) {
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
      const newItem = VaultItemBuilder.login()
        .setName(payload.domain || "New Login")
        .setCredentials(payload.username, payload.password)
        .addUri(payload.domain ? `https://${payload.domain}` : "")
        .build();
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

  const provider = getSyncProvider(vaultMode);
  const token = await getSyncToken(vaultMode);
  const accRes = await getAccountSettings(vaultMode);
  const syncConfig = accRes.isOk() ? accRes.value.syncConfig : undefined;

  const uploadRes = await provider.upload(payloadObj, {
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
    gistId: syncConfig?.gistId,
    username: syncConfig?.username,
  });

  if (uploadRes.isOk()) {
    const gistId = uploadRes.value.gistId;
    if (gistId && syncConfig && gistId !== syncConfig.gistId) {
      await updateAccountSettings(
        {
          syncConfig: { ...syncConfig, gistId },
          lastSync: Date.now(),
        },
        vaultMode,
      );
    } else {
      await updateAccountSettings({ lastSync: Date.now() }, vaultMode);
    }
  }

  broadcastMessage({ type: MSG_VAULT_ITEMS_UPDATED });
  return uploadRes.isOk();
}

export async function batchImportGoogleMigrationAccountsUseCase(
  currentPayload: VaultPayload,
  key: CryptoKey,
  salt: string,
  vaultMode: VaultMode,
  mappings: GoogleMigrationAccountMapping[],
): Promise<Result<VaultPayload, TranslationKey>> {
  const nowStr = new Date().toISOString();

  return executeVaultMutationUseCase(
    currentPayload,
    key,
    salt,
    vaultMode,
    (payload) => {
      const updatedItems = [...payload.items];

      for (const itemMap of mappings) {
        if (itemMap.action === "skip") continue;

        if (itemMap.action === "link" && itemMap.targetItemId) {
          const targetIndex = updatedItems.findIndex(
            (item) => item.id === itemMap.targetItemId,
          );
          if (targetIndex !== -1) {
            const existingItem = updatedItems[targetIndex];
            if (existingItem && isLoginItem(existingItem)) {
              updatedItems[targetIndex] = {
                ...existingItem,
                login: {
                  ...existingItem.login,
                  totp: itemMap.account.otpauthUrl,
                },
                revisionDate: nowStr,
              };
            }
          }
        } else if (itemMap.action === "create") {
          const titleName = itemMap.account.issuer
            ? `${itemMap.account.issuer} (${itemMap.account.name})`
            : itemMap.account.name || "Google Authenticator Import";

          const newItem = VaultItemBuilder.login()
            .setName(titleName)
            .setUsername(itemMap.account.name || "")
            .setTotp(itemMap.account.otpauthUrl)
            .build();
          updatedItems.push(newItem);
        }
      }

      return {
        ...payload,
        items: updatedItems,
      };
    },
  );
}
