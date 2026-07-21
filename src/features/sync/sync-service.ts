import { reconcile } from "solid-js/store";
import { setStore, store } from "@/core/store.ts";
import { setSessionItem } from "@/core/storage.ts";
import {
  MSG_DOWNLOAD_FROM_GIST,
  SESSION_KEY_ENCRYPTED_VAULT,
  STORE_KEY_SYNC_ERROR,
  STORE_KEY_SYNCING,
  STORE_KEY_VAULT_ITEMS,
} from "@/core/constants.ts";
import { decryptData, getSessionKey } from "@/core/crypto.ts";
import {
  DownloadFromGistResponseSchema,
  VaultListSchema,
} from "@/core/types.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";

import { sendMessageToBackground } from "@/core/messaging.ts";

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

  const sendResult = await sendMessageToBackground({
    type: MSG_DOWNLOAD_FROM_GIST,
  });
  if (sendResult.isErr()) {
    const errorKey = sendResult.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const parseRes = DownloadFromGistResponseSchema.safeParse(sendResult.value);
  if (!parseRes.success) {
    const errorKey = "toast_error";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const res = parseRes.data;

  if (!res.success) {
    const errorKey = "toast_error";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const setSessionRes = await setSessionItem(
    SESSION_KEY_ENCRYPTED_VAULT,
    res.content || "",
  );
  if (setSessionRes.isErr()) {
    const errorKey = setSessionRes.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  let payload: { ciphertext?: string; iv?: string };
  try {
    payload = JSON.parse(res.content || "{}");
  } catch (_e) {
    const errorKey = "toast_error";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const decryptRes = await decryptData(
    payload.ciphertext || "",
    payload.iv || "",
    key,
  );
  if (decryptRes.isErr()) {
    const errorKey = decryptRes.error;
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const decrypted = decryptRes.value;

  let decryptedJson: unknown;
  try {
    decryptedJson = JSON.parse(decrypted);
  } catch (_e) {
    const errorKey = "toast_error";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }

  const parseVaultRes = VaultListSchema.safeParse(decryptedJson);
  if (!parseVaultRes.success) {
    const errorKey = "storage_error";
    setStore(STORE_KEY_SYNCING, false);
    setStore(STORE_KEY_SYNC_ERROR, t(errorKey));
    return err(errorKey);
  }
  const items = parseVaultRes.data;

  setStore(STORE_KEY_VAULT_ITEMS, reconcile(items));
  setStore(STORE_KEY_SYNCING, false);
  return ok();
}
