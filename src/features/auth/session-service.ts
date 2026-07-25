import {
  accountStore,
  setAccountStore,
  setSettingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import {
  getAccountSettings,
  getGithubToken,
  setSessionItem,
  setSessionUnlocked,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  clearDerivedKey,
  decryptData,
  encryptData,
  setDerivedKey,
} from "@/core/crypto.ts";
import { notifyBackground, sendMessageToBackground } from "@/core/messaging.ts";
import { View } from "@/core/types.ts";
import {
  DownloadFromGistResponseSchema,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import { GistPayloadSchema } from "@/features/sync/sync-schemas.ts";
import {
  type VaultItem,
  VaultListSchema,
} from "@/features/vault/vault-schemas.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import {
  MSG_DOWNLOAD_FROM_GIST,
  MSG_USER_ACTIVITY,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/core/constants.ts";

export async function updateSessionTimeout(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  setSettingsStore({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  await updateExtensionSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  notifyBackground({ type: MSG_USER_ACTIVITY });
}

export async function unlockWithKey(
  key: CryptoKey,
): Promise<Result<void, TranslationKey>> {
  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const githubConfigured = !!accSettings.githubTokenEncrypted ||
    !!accountStore.githubToken;
  if (!githubConfigured) {
    clearDerivedKey();
    return err("login_error_invalid_token");
  }

  clearDerivedKey(); // Reset

  // Save key bytes to session storage
  await setDerivedKey(key);

  // Decrypt GitHub Token check
  if (accSettings.githubTokenEncrypted && accSettings.githubTokenIv) {
    const decryptRes = await decryptData(
      accSettings.githubTokenEncrypted,
      accSettings.githubTokenIv,
      key,
    );
    if (decryptRes.isErr()) {
      console.warn("Failed to decrypt githubToken with provided key");
    }
  }

  // B. Tải Gist từ GitHub về
  const sendResult = await sendMessageToBackground({
    type: MSG_DOWNLOAD_FROM_GIST,
  });
  if (sendResult.isErr()) {
    clearDerivedKey();
    const errMsg = sendResult.error;
    return err(errMsg);
  }

  const downloadResResult = DownloadFromGistResponseSchema.safeParse(
    sendResult.value,
  );
  if (!downloadResResult.success) {
    clearDerivedKey();
    return err("storage_error");
  }
  const downloadRes = downloadResResult.data;

  let existingGistContent = "";
  let hasExistingGist = false;
  if (downloadRes.success && downloadRes.content) {
    existingGistContent = downloadRes.content;
    hasExistingGist = true;
  }

  if (!hasExistingGist || !existingGistContent) {
    clearDerivedKey();
    return err("github_error_gist_not_found");
  }

  // F. Giải mã dữ liệu két sắt từ Gist
  const payloadResult = safeJsonParse(existingGistContent);
  if (payloadResult.isErr()) {
    clearDerivedKey();
    return err(payloadResult.error);
  }
  const payloadRaw = payloadResult.value;
  const payloadParsed = GistPayloadSchema.safeParse(payloadRaw);
  if (!payloadParsed.success) {
    clearDerivedKey();
    return err("storage_error");
  }
  const payload = payloadParsed.data;

  const decryptRes = await decryptData(payload.ciphertext, payload.iv, key);
  if (decryptRes.isErr()) {
    clearDerivedKey();
    return err(decryptRes.error);
  }

  const itemsJsonResult = safeJsonParse(decryptRes.value);
  if (itemsJsonResult.isErr()) {
    clearDerivedKey();
    return err(itemsJsonResult.error);
  }
  const itemsResult = VaultListSchema.safeParse(itemsJsonResult.value);
  if (!itemsResult.success) {
    clearDerivedKey();
    return err("storage_error");
  }
  const items = itemsResult.data;

  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("itemId");
  let targetView = uiStore.view === View.Fido2Prompt
    ? View.Fido2Prompt
    : View.Vault;
  let selectedItem = undefined;

  if (itemId && uiStore.view !== View.Fido2Prompt) {
    const foundItem = items.find((i: VaultItem) => i.id === itemId);
    if (foundItem) {
      selectedItem = foundItem;
      targetView = View.ItemDetail;
    }
  }

  const verificationStr = "verification_token";
  const encryptVerifyRes = await encryptData(
    verificationStr,
    key,
  );
  if (encryptVerifyRes.isErr()) {
    clearDerivedKey();
    return err(encryptVerifyRes.error);
  }
  const { iv: vIv, ciphertext: vCiphertext } = encryptVerifyRes.value;

  const setIvRes = await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
  if (setIvRes.isErr()) return err(setIvRes.error);

  const setCipherRes = await setSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    vCiphertext,
  );
  if (setCipherRes.isErr()) return err(setCipherRes.error);

  await setSessionUnlocked(true);

  const setVaultRes = await setSessionItem(
    SESSION_KEY_ENCRYPTED_VAULT,
    existingGistContent,
  );
  if (setVaultRes.isErr()) return err(setVaultRes.error);

  const finalToken = await getGithubToken();
  setAccountStore({
    vaultItems: items,
    githubToken: finalToken,
    githubConfigured: true,
    isLocked: false,
  });
  setUiStore({
    view: targetView,
    selectedItem: selectedItem || null,
  });
  notifyBackground({ type: MSG_USER_ACTIVITY });

  return ok();
}
