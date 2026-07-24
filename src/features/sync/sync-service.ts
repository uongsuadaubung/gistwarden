import { reconcile } from "solid-js/store";
import { setStore, store } from "@/core/store.ts";
import { setSessionItem } from "@/core/storage.ts";
import {
  SESSION_KEY_ENCRYPTED_VAULT,
  STORE_KEY_SYNC_ERROR,
  STORE_KEY_SYNCING,
  STORE_KEY_VAULT_ITEMS,
} from "@/core/constants.ts";
import { decryptData, getSessionKey } from "@/core/crypto.ts";
import { VaultListSchema } from "@/core/types.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import { fetchGistContent } from "@/features/sync/github-api.ts";

export async function syncVault(): Promise<Result<void, TranslationKey>> {
  setStore(STORE_KEY_SYNCING, true);
  setStore(STORE_KEY_SYNC_ERROR, "");

  const key = await getSessionKey();
  if (!key || !store.salt) {
    const errorKey = "login_title_locked";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const fetchRes = await fetchGistContent();
  if (fetchRes.isErr()) {
    const errorKey = fetchRes.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const setSessionRes = await setSessionItem(
    SESSION_KEY_ENCRYPTED_VAULT,
    fetchRes.value.rawContent,
  );

  if (setSessionRes.isErr()) {
    const errorKey = setSessionRes.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const decryptRes = await decryptData(
    fetchRes.value.ciphertext || "",
    fetchRes.value.iv || "",
    key,
  );

  if (decryptRes.isErr()) {
    const errorKey = decryptRes.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const decrypted = decryptRes.value;

  const parseDecryptedRes = safeJsonParse(decrypted);
  if (parseDecryptedRes.isErr()) {
    const errorKey = "sync_error_corrupted_payload";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const decryptedJson = parseDecryptedRes.value;

  const parseVaultRes = VaultListSchema.safeParse(decryptedJson);
  if (!parseVaultRes.success) {
    const errorKey = "sync_error_invalid_format";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const items = parseVaultRes.data;

  setStore(STORE_KEY_VAULT_ITEMS, reconcile(items));
  setStore(STORE_KEY_SYNCING, false);
  return ok();
}
