import { setStore, store } from "@/core/store.ts";
import {
  getAllSettings,
  getSessionItem,
  setSessionItem,
  setSessionUnlocked,
  updateSettings,
} from "@/core/storage.ts";
import {
  clearDerivedKey,
  decryptData,
  encryptData,
  setDerivedKey,
} from "@/core/crypto.ts";
import { notifyBackground, sendMessageToBackground } from "@/core/messaging.ts";
import {
  DownloadFromGistResponseSchema,
  GistPayloadSchema,
  VaultListSchema,
  type VaultTimeoutAction,
  View,
} from "@/core/types.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import {
  MSG_DOWNLOAD_FROM_GIST,
  MSG_RESET_TIMEOUT,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_GITHUB_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/core/constants.ts";

export async function updateSessionTimeout(
  timeout: string,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });
}

export async function unlockWithKey(
  key: CryptoKey,
): Promise<Result<void, TranslationKey>> {
  const settingsRes = await getAllSettings();
  if (settingsRes.isErr()) return err(settingsRes.error);
  const settings = settingsRes.value;
  const sessionTokenRes = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const sessionToken = sessionTokenRes.isOk() ? sessionTokenRes.value : null;
  const githubConfigured = !!settings.githubTokenEncrypted || !!sessionToken;
  if (!githubConfigured) {
    clearDerivedKey();
    return err("login_error_invalid_token");
  }

  clearDerivedKey(); // Reset

  // Save key bytes to session storage
  await setDerivedKey(key);

  // Decrypt GitHub Token
  if (settings.githubTokenEncrypted && settings.githubTokenIv) {
    const decryptRes = await decryptData(
      settings.githubTokenEncrypted,
      settings.githubTokenIv,
      key,
    );
    if (decryptRes.isOk()) {
      const setTokenRes = await setSessionItem(
        SESSION_KEY_GITHUB_TOKEN,
        decryptRes.value,
      );
      if (setTokenRes.isErr()) {
        return err(setTokenRes.error);
      }
    } else {
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
  let targetView = store.view === View.Fido2Prompt
    ? View.Fido2Prompt
    : View.Vault;
  let selectedItem = undefined;

  if (itemId && store.view !== View.Fido2Prompt) {
    const foundItem = items.find((i) => i.id === itemId);
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

  const sessionRes = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const sessionVal = sessionRes.isOk() ? sessionRes.value : null;
  const finalToken = typeof sessionVal === "string" ? sessionVal : "";
  setStore({
    vaultItems: items,
    githubToken: finalToken,
    githubConfigured: true,
    isLocked: false,
    view: targetView,
    selectedItem,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });

  return ok();
}
