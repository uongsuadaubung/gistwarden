import { reconcile } from "solid-js/store";
import { accountStore, setAccountStore, setUiStore } from "@/core/store.ts";
import {
  STORE_KEY_SYNC_ERROR,
  STORE_KEY_SYNCING,
  STORE_KEY_VAULT_ITEMS,
} from "@/core/constants.ts";
import { getSessionKey } from "@/core/crypto.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
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

  const uploadRes = await syncVaultToGist(
    accountStore.vaultItems,
    key,
    accountStore.salt,
    accountStore.trashItems || [],
  );

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
