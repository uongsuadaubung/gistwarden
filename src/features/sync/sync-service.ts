import { reconcile } from "solid-js/store";
import { accountStore, setAccountStore, setUiStore } from "@/core/store.ts";
import { setSessionItem } from "@/core/storage.ts";
import {
  SESSION_KEY_ENCRYPTED_VAULT,
  STORE_KEY_SYNC_ERROR,
  STORE_KEY_SYNCING,
  STORE_KEY_VAULT_ITEMS,
} from "@/core/constants.ts";
import { decryptData, getSessionKey } from "@/core/crypto.ts";
import { VaultListSchema } from "@/features/vault/vault-schemas.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import { getSyncProvider } from "@/features/sync/sync-provider-registry.ts";
import { EncryptedPayloadSchema } from "@/features/sync/sync-schemas.ts";
import { mergeVaultItems } from "@/features/sync/sync-merge.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";

export async function syncVault(): Promise<Result<void, TranslationKey>> {
  setUiStore(STORE_KEY_SYNCING, true);
  setUiStore(STORE_KEY_SYNC_ERROR, "");

  const key = await getSessionKey();
  if (!key || !accountStore.salt) {
    const errorKey = "login_title_locked";
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const downloadRes = await getSyncProvider().download();
  if (downloadRes.isErr()) {
    const errorKey = downloadRes.error;
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const rawContent = downloadRes.value;

  const setSessionRes = await setSessionItem(
    SESSION_KEY_ENCRYPTED_VAULT,
    rawContent,
  );

  if (setSessionRes.isErr()) {
    const errorKey = setSessionRes.error;
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const parseJsonRes = safeJsonParse(rawContent || "{}");
  const payloadParse = EncryptedPayloadSchema.safeParse(
    parseJsonRes.isOk() ? parseJsonRes.value : {},
  );
  const payload = payloadParse.success ? payloadParse.data : {};

  const decryptRes = await decryptData(
    payload.ciphertext || "",
    payload.iv || "",
    key,
  );

  if (decryptRes.isErr()) {
    const errorKey = decryptRes.error;
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const decrypted = decryptRes.value;

  const parseDecryptedRes = safeJsonParse(decrypted);
  if (parseDecryptedRes.isErr()) {
    const errorKey = "sync_error_corrupted_payload";
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const parseVaultRes = VaultListSchema.safeParse(parseDecryptedRes.value);
  if (!parseVaultRes.success) {
    const errorKey = "sync_error_invalid_format";
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const remoteItems = parseVaultRes.data;
  const mergedItems = mergeVaultItems(
    accountStore.vaultItems,
    remoteItems,
    accountStore.lastSync || 0,
  );

  const uploadRes = await syncVaultToGist(mergedItems, key, accountStore.salt);
  if (uploadRes.isErr()) {
    const errorKey = uploadRes.error;
    setUiStore(STORE_KEY_SYNCING, false);
    setUiStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  setAccountStore(STORE_KEY_VAULT_ITEMS, reconcile(uploadRes.value));
  setUiStore(STORE_KEY_SYNCING, false);
  return ok();
}
