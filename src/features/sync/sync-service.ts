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
import { t } from "@/core/i18n.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";

import { sendMessageToBackground } from "@/core/messaging.ts";

export async function syncVault(): Promise<
  { success: boolean; error?: string }
> {
  setStore(STORE_KEY_SYNCING, true);
  setStore(STORE_KEY_SYNC_ERROR, "");
  setGlobalLoading(true, t("vault_syncing"));
  try {
    const key = await getSessionKey();
    if (!key || !store.salt) throw new Error("Vault is locked");

    const rawRes = await sendMessageToBackground({
      type: MSG_DOWNLOAD_FROM_GIST,
    }).catch(() => null);
    const res = DownloadFromGistResponseSchema.parse(rawRes);

    if (!res.success) {
      throw new Error(res.error || "Không thể tải dữ liệu Gist");
    }

    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, res.content);

    const payload = JSON.parse(res.content || "{}");
    const decrypted = await decryptData(payload.ciphertext, payload.iv, key);
    const items = VaultListSchema.parse(JSON.parse(decrypted));

    setStore(STORE_KEY_VAULT_ITEMS, reconcile(items));
    setStore(STORE_KEY_SYNCING, false);
    return { success: true };
  } catch (err) {
    setStore(STORE_KEY_SYNCING, false);
    const errMsg = err instanceof Error ? err.message : String(err);
    setStore(STORE_KEY_SYNC_ERROR, errMsg || "Lỗi đồng bộ");
    return { success: false, error: errMsg || "Lỗi đồng bộ" };
  } finally {
    setGlobalLoading(false);
  }
}
