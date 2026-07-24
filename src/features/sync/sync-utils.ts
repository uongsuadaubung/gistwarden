import { z } from "zod";
import { decryptData, encryptData } from "@/core/crypto.ts";
import { type VaultItem, VaultListSchema } from "@/core/types.ts";

import { setSessionItem, updateSettings } from "@/core/storage.ts";
import {
  MSG_UPLOAD_TO_GIST,
  SESSION_KEY_ENCRYPTED_VAULT,
} from "@/core/constants.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { showToast } from "@/core/ui-service.ts";
import { err, ok, Result } from "neverthrow";
import { mergeVaultItems } from "@/features/sync/sync-merge.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { store } from "@/core/store.ts";
import { fetchGistContent } from "@/features/sync/github-api.ts";

export const SyncResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

async function fetchAndMergeRemoteVault(
  localItems: VaultItem[],
  key: CryptoKey,
): Promise<Result<VaultItem[], TranslationKey>> {
  const fetchRes = await fetchGistContent();
  if (fetchRes.isErr()) {
    return ok(localItems);
  }

  const { ciphertext, iv } = fetchRes.value;
  if (!ciphertext || !iv) {
    return ok(localItems);
  }

  const decryptRes = await decryptData(ciphertext, iv, key);

  // Early return ngay nếu giải mã thất bại (Master Password trên Gist đã bị máy khác đổi!)
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
    store.lastSync || 0,
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

  // Pre-download check & merge dữ liệu với early return
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

  const sendResult = await sendMessageToBackground({
    type: MSG_UPLOAD_TO_GIST,
    content: payload,
  });
  if (sendResult.isErr()) {
    return err("storage_error");
  }
  const parseResResult = SyncResponseSchema.safeParse(sendResult.value);
  if (!parseResResult.success) {
    return err("storage_error");
  }
  const res = parseResResult.data;

  if (!res.success) {
    if (
      res.error === "github_error_gist_size_limit" ||
      res.error === "github_error_rate_limit"
    ) {
      return err(res.error);
    }
    return err("storage_error");
  }

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);
  if (setRes.isErr()) {
    return err(setRes.error);
  }

  await updateSettings({ lastSync: Date.now() });

  return ok(finalItemsToSave);
}
