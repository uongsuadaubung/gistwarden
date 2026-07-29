import { reconcile } from "solid-js/store";
import { accountStore, setAccountStore } from "@/core/store.ts";
import { STORE_KEY_VAULT_ITEMS } from "@/core/constants.ts";
import { getSessionKey } from "@gistwarden/orchestrator";
import type { TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";

export async function syncVault(): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.masterPasswordConfig.salt) {
    return err("login_title_locked");
  }

  const uploadRes = await syncVaultToGist(
    accountStore.vaultItems,
    key,
    accountStore.masterPasswordConfig.salt,
    { trashItems: accountStore.trashItems || [] },
  );

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  setAccountStore(STORE_KEY_VAULT_ITEMS, reconcile(uploadRes.value));
  return ok();
}
