import { reconcile } from "solid-js/store";
import { sessionManager } from "@/core/session-manager.ts";
import {
  persistSessionKey,
  updateSessionTimeoutUseCase,
} from "@/core/session-usecases.ts";
import type {
  VaultTimeoutAction,
  VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import {
  accountStore,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import {
  getAccountSettings,
  getGithubToken,
  getSessionItem,
  removeSessionItem,
  resetAccountSettings,
  setSessionItem,
  setSessionUnlocked,
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  importAesGcmKey,
} from "@gistwarden/domain";
import {
  clearDerivedKey,
  getOrDeriveKey,
  getSessionKey,
  setDerivedKey,
} from "@gistwarden/orchestrator";
import {
  broadcastMessage,
  notifyBackground,
  sendBackgroundMessage,
} from "@/core/messaging.ts";
import { View } from "@/core/types.ts";
import { clearAlarm } from "@/core/alarms.ts";
import {
  downloadFromGistRoute,
  uploadToGistRoute,
} from "@gistwarden/orchestrator";
import { GistPayloadSchema } from "@gistwarden/repository";
import {
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";

import {
  ALARM_NAME_VAULT_TIMEOUT,
  MSG_USER_ACTIVITY,
  MSG_VAULT_LOGGED_OUT,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  SESSION_KEYS_ON_LOCK,
  STORE_KEY_SALT,
} from "@/core/constants.ts";

export interface SetupUnlockedSessionOptions {
  targetView?: View;
  selectedItem?: VaultItem;
}

async function setupUnlockedSession(
  key: CryptoKey,
  vaultPayload: { items: VaultItem[]; trash?: TrashVaultItem[] },
  options?: SetupUnlockedSessionOptions,
): Promise<Result<void, TranslationKey>> {
  await setDerivedKey(key);
  const verificationStr = "verification_token";
  const encryptVerifyRes = await encryptData(verificationStr, key);
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

  const finalToken = await getGithubToken();
  const targetView = options?.targetView;
  const selectedItem = options?.selectedItem;
  const finalView = targetView ||
    (uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault);

  setAccountStore({
    vaultItems: vaultPayload.items,
    trashItems: vaultPayload.trash || [],
    githubToken: finalToken,
    githubConfigured: true,
    isLocked: false,
    sessionUnlocked: true,
  });
  setUiStore({
    view: finalView,
    selectedItem: selectedItem || null,
  });
  notifyBackground({ type: MSG_USER_ACTIVITY });
  return ok();
}

async function resolveGistContent(): Promise<
  Result<{ content: string; salt?: string }, TranslationKey>
> {
  let content = "";

  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    content = cachedVal;
  } else {
    const sendResult = await sendBackgroundMessage(
      downloadFromGistRoute,
    );
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }
    if (!sendResult.value.success) {
      return err(sendResult.value.error || "messaging_error_send_failed");
    }
    content = sendResult.value.content || "";
  }

  let salt: string | undefined;
  if (content) {
    const payloadJsonRes = safeJsonParse(content);
    if (payloadJsonRes.isOk()) {
      const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (payloadResult.success && payloadResult.data.salt) {
        salt = payloadResult.data.salt;
      }
    }
  }

  return ok({ content, salt });
}

export async function createNewVault(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const tokenToEncrypt = accountStore.githubToken ||
    (await getGithubToken()) || "";
  clearDerivedKey();

  const rawSalt = generateSalt();
  const saltBase64 = rawSalt.toBase64();
  await updateAccountSettings({ salt: saltBase64 });
  setAccountStore(STORE_KEY_SALT, saltBase64);

  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    clearDerivedKey();
    return err(keyRes.error);
  }
  const key = keyRes.value;

  if (tokenToEncrypt) {
    const encryptRes = await encryptData(tokenToEncrypt, key);
    if (encryptRes.isErr()) {
      clearDerivedKey();
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    await updateAccountSettings({
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
    });
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  }

  const initialPayloadObject = { items: [], trash: [] };
  const encryptVaultRes = await encryptData(
    JSON.stringify(initialPayloadObject),
    key,
  );
  if (encryptVaultRes.isErr()) {
    clearDerivedKey();
    return err(encryptVaultRes.error);
  }

  const { iv: vaultIv, ciphertext: vaultCiphertext } = encryptVaultRes.value;
  const payloadToUpload = JSON.stringify({
    ciphertext: vaultCiphertext,
    iv: vaultIv,
    salt: saltBase64,
  });

  const sendResult = await sendBackgroundMessage(uploadToGistRoute, {
    content: payloadToUpload,
  });
  if (sendResult.isErr()) {
    clearDerivedKey();
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    clearDerivedKey();
    return err(sendResult.value.error || "messaging_error_send_failed");
  }

  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payloadToUpload);
  return await setupUnlockedSession(key, { items: [], trash: [] });
}

export async function fetchEncryptedVaultContent(): Promise<
  Result<string | null, TranslationKey>
> {
  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    return ok(cachedVal);
  }

  const sendResult = await sendBackgroundMessage(downloadFromGistRoute);
  if (
    sendResult.isOk() && sendResult.value.success && sendResult.value.content
  ) {
    const content = sendResult.value.content;
    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, content);
    return ok(content);
  }

  return ok(null);
}

export async function decryptGistVault(
  content: string,
  key: CryptoKey,
): Promise<
  Result<{
    items: VaultItem[];
    trash: TrashVaultItem[];
    targetView: View;
    selectedItem?: VaultItem;
  }, TranslationKey>
> {
  const payloadJsonRes = safeJsonParse(content);
  if (payloadJsonRes.isErr()) {
    return err(payloadJsonRes.error);
  }
  const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
  if (!payloadResult.success) {
    return err("storage_error");
  }
  const payload = payloadResult.data;

  const decryptRes = await decryptData(payload.ciphertext, payload.iv, key);
  if (decryptRes.isErr()) {
    const errMsg = decryptRes.error;
    if (
      errMsg.includes("OperationError") || errMsg === "login_error_wrong_mp"
    ) {
      return err("login_error_wrong_mp");
    }
    return err(errMsg);
  }

  const itemsJsonRes = safeJsonParse(decryptRes.value);
  if (itemsJsonRes.isErr()) {
    return err(itemsJsonRes.error);
  }

  let items: VaultItem[] = [];
  let trash: TrashVaultItem[] = [];

  const rawVal = itemsJsonRes.value;
  if (Array.isArray(rawVal)) {
    const itemsResult = VaultListSchema.safeParse(rawVal);
    if (!itemsResult.success) return err("storage_error");
    items = itemsResult.data;
  } else {
    const payloadResult = VaultPayloadSchema.safeParse(rawVal);
    if (!payloadResult.success) return err("storage_error");
    items = payloadResult.data.items;
    trash = payloadResult.data.trash || [];
  }

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

  return ok({ items, trash, targetView, selectedItem });
}

export async function unlock(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const currentToken = await getGithubToken();
  const githubConfigured = !!accSettings.githubTokenEncrypted ||
    !!currentToken || !!accountStore.githubToken;
  if (!githubConfigured) {
    clearDerivedKey();
    return err("login_error_invalid_token");
  }

  let saltBase64 = accSettings.salt || accountStore.salt;
  let key: CryptoKey | null = null;
  clearDerivedKey();

  // A. Nếu có salt cục bộ, derive key và giải mã Token
  if (saltBase64) {
    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      return err(keyRes.error);
    }
    key = keyRes.value;
    if (!key) {
      clearDerivedKey();
      return err("login_error_wrong_mp");
    }
    if (accSettings.githubTokenEncrypted && accSettings.githubTokenIv) {
      const decryptRes = await decryptData(
        accSettings.githubTokenEncrypted,
        accSettings.githubTokenIv,
        key,
      );
      if (decryptRes.isErr()) {
        console.warn("Failed to decrypt githubToken");
        clearDerivedKey();
        return err(decryptRes.error);
      }
    }
  }

  // B. Đọc cache hoặc tải Gist content
  const gistRes = await resolveGistContent();
  if (gistRes.isErr()) {
    clearDerivedKey();
    return err(gistRes.error);
  }
  const { content: existingGistContent, salt: extractedSalt } = gistRes.value;
  if (extractedSalt && !saltBase64) {
    saltBase64 = extractedSalt;
    await updateAccountSettings({ salt: saltBase64 });
    setAccountStore(STORE_KEY_SALT, saltBase64);
  }

  // C. Nếu chưa có salt, trả về lỗi không tìm thấy Gist
  if (!saltBase64) {
    clearDerivedKey();
    return err("github_error_gist_not_found");
  }

  // D. Đảm bảo key đã được derive
  if (!key) {
    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      return err(keyRes.error);
    }
    key = keyRes.value;
  }
  if (!key) {
    return err("settings_error_mp_fail");
  }

  // E. Onboarding token mã hóa
  const activeToken = await getGithubToken();
  if (
    activeToken &&
    (!accSettings.githubTokenEncrypted || !accSettings.githubTokenIv)
  ) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isErr()) {
      clearDerivedKey();
      return err(encryptRes.error);
    }
    await updateAccountSettings({
      githubTokenEncrypted: encryptRes.value.ciphertext,
      githubTokenIv: encryptRes.value.iv,
    });
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  }

  // F. Giải mã két sắt từ Gist
  if (!existingGistContent) {
    clearDerivedKey();
    return err("github_error_gist_not_found");
  }

  const decryptVaultRes = await decryptGistVault(existingGistContent, key);
  if (decryptVaultRes.isErr()) {
    clearDerivedKey();
    return err(decryptVaultRes.error);
  }

  const { items, trash, targetView, selectedItem } = decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);
  return await setupUnlockedSession(
    key,
    { items, trash },
    { targetView, selectedItem },
  );
}

export async function unlockVaultWithKey(
  key: CryptoKey,
): Promise<Result<void, TranslationKey>> {
  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const currentToken = await getGithubToken();
  const githubConfigured = !!accSettings.githubTokenEncrypted ||
    !!currentToken || !!accountStore.githubToken;
  if (!githubConfigured) {
    sessionManager.clearKey();
    return err("login_error_invalid_token");
  }

  await persistSessionKey(key);

  const gistRes = await resolveGistContent();
  if (gistRes.isErr()) {
    sessionManager.clearKey();
    return err(gistRes.error);
  }
  const { content: existingGistContent } = gistRes.value;
  if (!existingGistContent) {
    sessionManager.clearKey();
    return err("github_error_gist_not_found");
  }

  const decryptVaultRes = await decryptGistVault(existingGistContent, key);
  if (decryptVaultRes.isErr()) {
    sessionManager.clearKey();
    return err(decryptVaultRes.error);
  }

  const { items, trash, targetView, selectedItem } = decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);
  return await setupUnlockedSession(
    key,
    { items, trash },
    { targetView, selectedItem },
  );
}

export async function unlockVaultWithMasterPassword(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const currentToken = await getGithubToken();
  const githubConfigured = !!accSettings.githubTokenEncrypted ||
    !!currentToken || !!accountStore.githubToken;
  if (!githubConfigured) {
    sessionManager.clearKey();
    return err("login_error_invalid_token");
  }

  const saltBase64 = accSettings.salt || accountStore.salt;
  if (!saltBase64) {
    sessionManager.clearKey();
    return err("login_error_wrong_mp");
  }

  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    sessionManager.clearKey();
    return err(keyRes.error);
  }
  return await unlockVaultWithKey(keyRes.value);
}

export async function unlockVaultWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  if (
    !accountStore.pinUnlockValue ||
    !accountStore.pinUnlockIv ||
    !accountStore.pinUnlockSalt
  ) {
    return err("login_error_wrong_pin");
  }

  const saltBufferRes = base64ToArrayBuffer(accountStore.pinUnlockSalt);
  if (saltBufferRes.isErr()) {
    return err("login_error_wrong_pin");
  }
  const pinKeyRes = await deriveKey(pin, new Uint8Array(saltBufferRes.value));
  if (pinKeyRes.isErr()) {
    return err("login_error_wrong_pin");
  }
  const pinKey = pinKeyRes.value;
  const decryptRes = await decryptData(
    accountStore.pinUnlockValue,
    accountStore.pinUnlockIv,
    pinKey,
  );
  if (decryptRes.isErr()) {
    return err("login_error_wrong_pin");
  }

  const bufferRes = base64ToArrayBuffer(decryptRes.value);
  if (bufferRes.isErr()) {
    return err("login_error_wrong_pin");
  }
  const importRes = await importAesGcmKey(
    bufferRes.value,
    "login_error_wrong_pin",
  );

  if (importRes.isErr()) {
    return err(importRes.error);
  }

  return await unlockVaultWithKey(importRes.value);
}

export async function lockVaultSession(): Promise<void> {
  sessionManager.clearKey();
  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  setAccountStore({
    vaultItems: [],
    trashItems: [],
    githubToken: "",
    isLocked: true,
    sessionUnlocked: false,
  });
  setUiStore({
    view: uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
    selectedItem: null,
  });
}

export async function logoutVaultSession(): Promise<void> {
  sessionManager.clearKey();

  resetAccountStore();
  resetUiStore();

  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
  await resetAccountSettings();
  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);
  await broadcastMessage({ type: MSG_VAULT_LOGGED_OUT });
}

export async function lock(): Promise<void> {
  await lockVaultSession();
}

export async function logout(): Promise<void> {
  await logoutVaultSession();
}

export async function acceptWelcome() {
  await updateExtensionSettings({ welcomeAccepted: true });
  setSettingsStore("welcomeAccepted", true);
  setUiStore("view", View.Login);
}

export async function reloadVaultItems(): Promise<void> {
  const key = await getSessionKey();
  if (!key || !accountStore.salt || accountStore.isLocked) return;

  const contentRes = await fetchEncryptedVaultContent();
  if (contentRes.isErr() || !contentRes.value) return;

  const decryptVaultRes = await decryptGistVault(contentRes.value, key);
  if (decryptVaultRes.isErr()) return;

  const { items, trash } = decryptVaultRes.value;
  setAccountStore("vaultItems", reconcile(items));
  setAccountStore("trashItems", reconcile(trash));
}

export async function updateSessionTimeout(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateSessionTimeoutUseCase(timeout, action);
}
