import {
  decryptData,
  encryptData,
  type Folder,
  safeJsonParse,
  SESSION_KEY_ENCRYPTED_VAULT,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import {
  EncryptedPayloadSchema,
  setSessionItem,
  updateAccountSettings,
} from "@gistwarden/repository";
import { err, ok, Result } from "neverthrow";
import {
  downloadFromGistRoute,
  uploadToGistRoute,
} from "./messaging-contracts.ts";
import { sendBackgroundMessage } from "./messaging.ts";
import { mergeVaultPayload } from "./vault-merge-usecase.ts";

export async function fetchAndMergeRemoteVaultUseCase(
  localItems: VaultItem[],
  localTrash: TrashVaultItem[],
  key: Uint8Array,
  options?: {
    folders?: Folder[];
    lastSync?: number;
  },
): Promise<Result<VaultPayload, TranslationKey>> {
  const localFolders = options?.folders || [];
  const lastSync = options?.lastSync || 0;

  const sendResult = await sendBackgroundMessage(downloadFromGistRoute);
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }
  const rawContent = sendResult.value.content || "";
  if (!rawContent) {
    return ok({ folders: localFolders, items: localItems, trash: localTrash });
  }

  const parseJsonRes = safeJsonParse(rawContent || "{}");
  const payloadParse = EncryptedPayloadSchema.safeParse(
    parseJsonRes.isOk() ? parseJsonRes.value : {},
  );
  const payload = payloadParse.success ? payloadParse.data : {};

  const { ciphertext, iv } = payload;
  if (!ciphertext || !iv) {
    return ok({ folders: localFolders, items: localItems, trash: localTrash });
  }

  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) {
    return err("sync_error_remote_password_changed");
  }

  const parseVaultRes = safeJsonParse(decryptRes.value);
  if (parseVaultRes.isErr()) {
    return err("sync_error_corrupted_payload");
  }

  let remoteFolders: Folder[] = [];
  let remoteItems: VaultItem[] = [];
  let remoteTrash: TrashVaultItem[] = [];

  const rawVal = parseVaultRes.value;
  if (Array.isArray(rawVal)) {
    const remoteVaultParse = VaultListSchema.safeParse(rawVal);
    if (!remoteVaultParse.success) {
      return err("sync_error_invalid_format");
    }
    remoteItems = remoteVaultParse.data;
  } else {
    const remoteVaultParse = VaultPayloadSchema.safeParse(rawVal);
    if (!remoteVaultParse.success) {
      return err("sync_error_invalid_format");
    }
    remoteFolders = remoteVaultParse.data.folders || [];
    remoteItems = remoteVaultParse.data.items;
    remoteTrash = remoteVaultParse.data.trash || [];
  }

  const merged = mergeVaultPayload(
    { folders: localFolders, items: localItems, trash: localTrash },
    { folders: remoteFolders, items: remoteItems, trash: remoteTrash },
    lastSync,
  );
  return ok(merged);
}

export async function syncVaultToGist(
  items: VaultItem[],
  key: Uint8Array,
  salt: string,
  options?: {
    trashItems?: TrashVaultItem[];
    folders?: Folder[];
    lastSync?: number;
  },
): Promise<Result<VaultItem[], TranslationKey>> {
  const trashItems = options?.trashItems || [];
  const folders = options?.folders || [];
  const parsedResult = VaultListSchema.safeParse(items);
  if (!parsedResult.success) {
    return err("storage_error");
  }
  const validatedList = parsedResult.data;

  const mergeResult = await fetchAndMergeRemoteVaultUseCase(
    validatedList,
    trashItems,
    key,
    { folders, lastSync: options?.lastSync },
  );
  if (mergeResult.isErr()) {
    return err(mergeResult.error);
  }
  const finalPayloadToSave = mergeResult.value;

  const payloadObject = {
    folders: finalPayloadToSave.folders,
    items: finalPayloadToSave.items,
    trash: finalPayloadToSave.trash,
  };

  const encryptRes = await encryptData(
    JSON.stringify(payloadObject),
    key,
  );
  if (encryptRes.isErr()) {
    return err("storage_error");
  }
  const encrypted = encryptRes.value;
  const payload = JSON.stringify({
    salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });

  const payloadBytes = new TextEncoder().encode(payload).length;
  const MAX_GIST_BYTES = 10 * 1024 * 1024;
  const WARN_GIST_BYTES = 5 * 1024 * 1024;

  if (payloadBytes > MAX_GIST_BYTES) {
    return err("github_error_gist_size_limit");
  }

  if (payloadBytes > WARN_GIST_BYTES) {
    const sizeMB = (payloadBytes / (1024 * 1024)).toFixed(1);
    console.warn(`[Sync] Vault Gist size near limit: ${sizeMB} MB`);
  }

  const sendResult = await sendBackgroundMessage(uploadToGistRoute, {
    content: payload,
  });
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);
  if (setRes.isErr()) {
    return err(setRes.error);
  }

  const now = Date.now();
  await updateAccountSettings({ lastSync: now });

  return ok(finalPayloadToSave.items);
}
