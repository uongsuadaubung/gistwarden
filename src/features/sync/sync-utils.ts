import { decryptData, encryptData } from "@/core/crypto.ts";
import {
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  VaultPayloadSchema,
} from "@/features/vault/vault-schemas.ts";
import { setSessionItem, updateAccountSettings } from "@/core/storage.ts";
import {
  downloadFromGistRoute,
  EncryptedPayloadSchema,
  uploadToGistRoute,
} from "@/features/sync/sync-schemas.ts";
import { SESSION_KEY_ENCRYPTED_VAULT } from "@/core/constants.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { mergeVaultPayload } from "@/features/sync/sync-merge.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { accountStore, setAccountStore } from "@/core/store.ts";

async function fetchAndMergeRemoteVault(
  localItems: VaultItem[],
  localTrash: TrashVaultItem[],
  key: CryptoKey,
): Promise<
  Result<{ items: VaultItem[]; trash: TrashVaultItem[] }, TranslationKey>
> {
  const sendResult = await sendBackgroundMessage(downloadFromGistRoute);
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }
  const rawContent = sendResult.value.content || "";
  if (!rawContent) {
    return ok({ items: localItems, trash: localTrash });
  }

  const parseJsonRes = safeJsonParse(rawContent || "{}");
  const payloadParse = EncryptedPayloadSchema.safeParse(
    parseJsonRes.isOk() ? parseJsonRes.value : {},
  );
  const payload = payloadParse.success ? payloadParse.data : {};

  const { ciphertext, iv } = payload;
  if (!ciphertext || !iv) {
    return ok({ items: localItems, trash: localTrash });
  }

  const decryptRes = await decryptData(ciphertext, iv, key);

  if (decryptRes.isErr()) {
    return err("sync_error_remote_password_changed");
  }

  const parseVaultRes = safeJsonParse(decryptRes.value);
  if (parseVaultRes.isErr()) {
    return err("sync_error_corrupted_payload");
  }

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
    remoteItems = remoteVaultParse.data.items;
    remoteTrash = remoteVaultParse.data.trash || [];
  }

  const merged = mergeVaultPayload(
    { items: localItems, trash: localTrash },
    { items: remoteItems, trash: remoteTrash },
    accountStore.lastSync || 0,
  );
  return ok(merged);
}

export async function syncVaultToGist(
  items: VaultItem[],
  key: CryptoKey,
  salt: string,
  trashItems: TrashVaultItem[] = accountStore.trashItems || [],
): Promise<Result<VaultItem[], TranslationKey>> {
  const parsedResult = VaultListSchema.safeParse(items);
  if (!parsedResult.success) {
    return err("storage_error");
  }
  const validatedList = parsedResult.data;

  // Hòa nhập 2 chiều trước khi lưu để bảo toàn dữ liệu từ các thiết bị khác
  const mergeResult = await fetchAndMergeRemoteVault(
    validatedList,
    trashItems,
    key,
  );
  if (mergeResult.isErr()) {
    return err(mergeResult.error);
  }
  const finalPayloadToSave = mergeResult.value;

  const payloadObject = {
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

  // Check pre-upload size limits (GitHub Gist maximum limit is 10 MB)
  const payloadBytes = new TextEncoder().encode(payload).length;
  const MAX_GIST_BYTES = 10 * 1024 * 1024; // 10 MB
  const WARN_GIST_BYTES = 5 * 1024 * 1024; // 5 MB

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
  setAccountStore({
    trashItems: finalPayloadToSave.trash,
    lastSync: now,
  });
  await updateAccountSettings({ lastSync: now });

  return ok(finalPayloadToSave.items);
}
