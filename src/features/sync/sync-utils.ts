import { z } from "zod";
import { decryptData, encryptData } from "@/core/crypto.ts";
import {
  type VaultItem,
  VaultListSchema,
} from "@/features/vault/vault-schemas.ts";
import { setSessionItem, updateAccountSettings } from "@/core/storage.ts";
import { SESSION_KEY_ENCRYPTED_VAULT } from "@/core/constants.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { showToast } from "@/core/ui-service.ts";
import { err, ok, Result } from "neverthrow";
import { mergeVaultItems } from "@/features/sync/sync-merge.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { accountStore, setAccountStore } from "@/core/store.ts";
import { getSyncProvider } from "@/features/sync/sync-provider-registry.ts";
import { EncryptedPayloadSchema } from "@/features/sync/sync-schemas.ts";

export const SyncResponseSchema = z.object({
  success: z.boolean(),
  error: z.custom<TranslationKey>().optional(),
});

async function fetchAndMergeRemoteVault(
  localItems: VaultItem[],
  key: CryptoKey,
): Promise<Result<VaultItem[], TranslationKey>> {
  const downloadRes = await getSyncProvider().download();
  if (downloadRes.isErr()) {
    return ok(localItems);
  }
  const rawContent = downloadRes.value;
  if (!rawContent) {
    return ok(localItems);
  }

  const parseJsonRes = safeJsonParse(rawContent || "{}");
  const payloadParse = EncryptedPayloadSchema.safeParse(
    parseJsonRes.isOk() ? parseJsonRes.value : {},
  );
  const payload = payloadParse.success ? payloadParse.data : {};

  const { ciphertext, iv } = payload;
  if (!ciphertext || !iv) {
    return ok(localItems);
  }

  const decryptRes = await decryptData(ciphertext, iv, key);

  if (decryptRes.isErr()) {
    return err("sync_error_remote_password_changed");
  }

  const parseVaultRes = safeJsonParse(decryptRes.value);
  if (parseVaultRes.isErr()) {
    return ok(localItems);
  }

  const remoteVaultParse = VaultListSchema.safeParse(parseVaultRes.value);
  if (!remoteVaultParse.success) {
    return ok(localItems);
  }

  const merged = mergeVaultItems(
    localItems,
    remoteVaultParse.data,
    accountStore.lastSync || 0,
  );
  return ok(merged);
}

export async function syncVaultToGist(
  items: VaultItem[],
  key: CryptoKey,
  salt: string,
): Promise<Result<VaultItem[], TranslationKey>> {
  const parsedResult = VaultListSchema.safeParse(items);
  if (!parsedResult.success) {
    return err("storage_error");
  }
  const validatedList = parsedResult.data;

  // Hòa nhập 2 chiều trước khi lưu để bảo toàn dữ liệu từ các thiết bị khác
  const mergeResult = await fetchAndMergeRemoteVault(validatedList, key);
  if (mergeResult.isErr()) {
    return err(mergeResult.error);
  }
  const finalItemsToSave = mergeResult.value;

  const encryptRes = await encryptData(
    JSON.stringify(finalItemsToSave),
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
    showToast(
      t("github_warning_gist_size_near_limit", { sizeMB }),
      "info",
    );
  }

  const uploadRes = await getSyncProvider().upload(payload);
  if (uploadRes.isErr()) {
    if (
      uploadRes.error === "github_error_gist_size_limit" ||
      uploadRes.error === "github_error_rate_limit"
    ) {
      return err(uploadRes.error);
    }
    return err("storage_error");
  }

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);
  if (setRes.isErr()) {
    return err(setRes.error);
  }

  const now = Date.now();
  setAccountStore("lastSync", now);
  await updateAccountSettings({ lastSync: now });

  return ok(finalItemsToSave);
}
