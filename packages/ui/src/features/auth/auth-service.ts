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
  applyVaultPayloadToStore,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  getAccountSettings,
  getGithubToken,
} from "@gistwarden/repository";
import {
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
  computeHmac,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  importAesGcmKey,
  logger,
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
  type Folder,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
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
} from "@/core/constants.ts";

export interface SetupUnlockedSessionOptions {
  targetView?: View;
  selectedItem?: VaultItem;
}

async function setupUnlockedSession(
  key: CryptoKey,
  vaultPayload: VaultPayload,
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

  applyVaultPayloadToStore({
    folders: vaultPayload.folders || [],
    items: vaultPayload.items || [],
    trash: vaultPayload.trash || [],
  });
  setAccountStore({
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
  const updatedMpConfig = {
    ...accountStore.masterPasswordConfig,
    salt: saltBase64,
  };
  await updateAccountSettings({ masterPasswordConfig: updatedMpConfig });
  setAccountStore("masterPasswordConfig", updatedMpConfig);

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
    const updatedGithubConfig = {
      ...accountStore.githubConfig,
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
    };
    await updateAccountSettings({
      githubConfig: updatedGithubConfig,
    });
    setAccountStore("githubConfig", updatedGithubConfig);
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
  return await setupUnlockedSession(key, { folders: [], items: [], trash: [] });
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
  Result<
    VaultPayload & {
      targetView: View;
      selectedItem?: VaultItem;
    },
    TranslationKey
  >
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

  let folders: Folder[] = [];
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
    folders = payloadResult.data.folders || [];
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

  return ok({ folders, items, trash, targetView, selectedItem });
}

export async function verifyMasterPasswordSecurity(): Promise<
  Result<{ attempts: number; salt: string }, TranslationKey>
> {
  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const config = accSettings.masterPasswordConfig ||
    DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
  const secSalt = config.salt;

  if (secSalt) {
    if (
      config.failedAttempts > 0 || config.lockoutUntil > 0 || config.failedMac
    ) {
      const macRes = await computeHmac(
        `${config.failedAttempts}:${config.lockoutUntil}`,
        secSalt,
      );
      const expectedMac = macRes.isOk() ? macRes.value : "";
      if (!config.failedMac || config.failedMac !== expectedMac) {
        logger.storage.error(
          "Master password security data tampered! Logging out.",
        );
        await logoutVaultSession();
        return err("login_error_mp_tampered");
      }
    }

    const now = Date.now();
    if (now < config.lockoutUntil) {
      return err("login_error_mp_cooldown");
    }
  }

  return ok({ attempts: config.failedAttempts, salt: secSalt });
}

export async function recordMasterPasswordFailure(
  currentAttempts: number,
  salt: string,
): Promise<void> {
  const nextAttempts = currentAttempts + 1;
  const penaltySeconds = Math.pow(2, nextAttempts);
  const lockoutUntil = Date.now() + penaltySeconds * 1000;
  const secSalt = salt || generateSalt().toBase64();
  const macRes = await computeHmac(`${nextAttempts}:${lockoutUntil}`, secSalt);
  const failedMac = macRes.isOk() ? macRes.value : "";

  const updatedConfig = {
    salt: secSalt,
    failedAttempts: nextAttempts,
    lockoutUntil,
    failedMac,
  };

  setAccountStore("masterPasswordConfig", updatedConfig);
  await updateAccountSettings({ masterPasswordConfig: updatedConfig });
  await new Promise((r) => setTimeout(r, 600));
}

export async function resetMasterPasswordSecurity(salt: string): Promise<void> {
  const secSalt = salt || generateSalt().toBase64();
  const resetMacRes = await computeHmac("0:0", secSalt);
  const resetMac = resetMacRes.isOk() ? resetMacRes.value : "";
  const resetConfig = {
    salt: secSalt,
    failedAttempts: 0,
    lockoutUntil: 0,
    failedMac: resetMac,
  };
  setAccountStore("masterPasswordConfig", resetConfig);
  await updateAccountSettings({ masterPasswordConfig: resetConfig });
}

export async function unlock(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const secRes = await verifyMasterPasswordSecurity();
  if (secRes.isErr()) {
    return err(secRes.error);
  }
  const { attempts, salt: secSalt } = secRes.value;

  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) {
    await recordMasterPasswordFailure(attempts, secSalt);
    return err(accSettingsRes.error);
  }
  const accSettings = accSettingsRes.value;
  const githubConfig = accSettings.githubConfig;
  const currentToken = await getGithubToken();
  const githubConfigured = !!githubConfig.githubTokenEncrypted ||
    !!currentToken || !!accountStore.githubToken;
  if (!githubConfigured) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, secSalt);
    return err("login_error_invalid_token");
  }

  let saltBase64 = accSettings.masterPasswordConfig.salt;
  let key: CryptoKey | null = null;
  clearDerivedKey();

  // A. Nếu có salt cục bộ, derive key và giải mã Token
  if (saltBase64) {
    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
      return err(keyRes.error);
    }
    key = keyRes.value;
    if (!key) {
      clearDerivedKey();
      await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
      return err("login_error_wrong_mp");
    }
    if (githubConfig.githubTokenEncrypted && githubConfig.githubTokenIv) {
      const decryptRes = await decryptData(
        githubConfig.githubTokenEncrypted,
        githubConfig.githubTokenIv,
        key,
      );
      if (decryptRes.isErr()) {
        logger.storage.warn("Failed to decrypt githubToken");
        clearDerivedKey();
        await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
        return err(decryptRes.error);
      }
    }
  }

  // B. Đọc cache hoặc tải Gist content
  const gistRes = await resolveGistContent();
  if (gistRes.isErr()) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
    return err(gistRes.error);
  }
  const { content: existingGistContent, salt: extractedSalt } = gistRes.value;
  if (extractedSalt && !saltBase64) {
    saltBase64 = extractedSalt;
    const updatedMpConfig = {
      ...accSettings.masterPasswordConfig,
      salt: saltBase64,
    };
    await updateAccountSettings({ masterPasswordConfig: updatedMpConfig });
    setAccountStore("masterPasswordConfig", updatedMpConfig);
  }

  // C. Nếu chưa có salt, trả về lỗi không tìm thấy Gist
  if (!saltBase64) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
    return err("github_error_gist_not_found");
  }

  // D. Đảm bảo key đã được derive
  if (!key) {
    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      await recordMasterPasswordFailure(attempts, saltBase64);
      return err(keyRes.error);
    }
    key = keyRes.value;
  }
  if (!key) {
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err("settings_error_mp_fail");
  }

  // E. Onboarding token mã hóa
  const activeToken = await getGithubToken();
  if (
    activeToken &&
    (!githubConfig.githubTokenEncrypted || !githubConfig.githubTokenIv)
  ) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isErr()) {
      clearDerivedKey();
      await recordMasterPasswordFailure(attempts, saltBase64);
      return err(encryptRes.error);
    }
    const updatedGithubConfig = {
      ...githubConfig,
      githubTokenEncrypted: encryptRes.value.ciphertext,
      githubTokenIv: encryptRes.value.iv,
    };
    await updateAccountSettings({
      githubConfig: updatedGithubConfig,
    });
    setAccountStore("githubConfig", updatedGithubConfig);
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  }

  // F. Giải mã két sắt từ Gist
  if (!existingGistContent) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err("github_error_gist_not_found");
  }

  const decryptVaultRes = await decryptGistVault(existingGistContent, key);
  if (decryptVaultRes.isErr()) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err(decryptVaultRes.error);
  }

  await resetMasterPasswordSecurity(saltBase64);

  const { folders, items, trash, targetView, selectedItem } =
    decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);
  return await setupUnlockedSession(
    key,
    { folders, items, trash },
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
  const githubConfigured = !!accSettings.githubConfig.githubTokenEncrypted ||
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

  const { folders, items, trash, targetView, selectedItem } =
    decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);
  return await setupUnlockedSession(
    key,
    { folders, items, trash },
    { targetView, selectedItem },
  );
}

export async function unlockVaultWithMasterPassword(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const secRes = await verifyMasterPasswordSecurity();
  if (secRes.isErr()) {
    return err(secRes.error);
  }
  const { attempts, salt: secSalt } = secRes.value;

  const accSettingsRes = await getAccountSettings();
  if (accSettingsRes.isErr()) {
    await recordMasterPasswordFailure(attempts, secSalt);
    return err(accSettingsRes.error);
  }
  const accSettings = accSettingsRes.value;
  const currentToken = await getGithubToken();
  const githubConfigured = !!accSettings.githubConfig.githubTokenEncrypted ||
    !!currentToken || !!accountStore.githubToken;
  if (!githubConfigured) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, secSalt);
    return err("login_error_invalid_token");
  }

  const saltBase64 = accSettings.masterPasswordConfig.salt;
  if (!saltBase64) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, secSalt);
    return err("login_error_wrong_mp");
  }

  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err(keyRes.error);
  }

  const unlockRes = await unlockVaultWithKey(keyRes.value);
  if (unlockRes.isErr()) {
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err(unlockRes.error);
  }

  await resetMasterPasswordSecurity(saltBase64);
  return ok();
}

async function clearPinUnlockState(): Promise<void> {
  setAccountStore("pinConfig", DEFAULT_PIN_CONFIG);
  setSettingsStore("requireMasterPasswordOnRestart", true);
  await updateAccountSettings({ pinConfig: DEFAULT_PIN_CONFIG });
  await updateExtensionSettings({ requireMasterPasswordOnRestart: true });
}

async function handlePinFailure(
  attempts: number,
): Promise<Result<void, TranslationKey>> {
  if (attempts >= 3) {
    await clearPinUnlockState();
    await logoutVaultSession();
    return err("login_error_pin_max_attempts_reached");
  }
  if (attempts === 1) {
    return err("login_error_wrong_pin_2_left");
  }
  return err("login_error_wrong_pin_1_left");
}

export async function unlockVaultWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  const config = accountStore.pinConfig;
  if (!config.enabled || !config.value || !config.iv || !config.salt) {
    return err("login_error_wrong_pin");
  }

  const accSettingsRes = await getAccountSettings();
  const currentConfig = accSettingsRes.isOk()
    ? accSettingsRes.value.pinConfig
    : config;

  if (!currentConfig.enabled || !currentConfig.value || !currentConfig.salt) {
    return err("login_error_wrong_pin");
  }

  // 1. Integrity check: Verify failedMac
  const expectedMacRes = await computeHmac(
    String(currentConfig.failedAttempts),
    currentConfig.salt,
  );
  const expectedMac = expectedMacRes.isOk() ? expectedMacRes.value : "";

  if (
    !currentConfig.failedMac ||
    currentConfig.failedMac !== expectedMac
  ) {
    await clearPinUnlockState();
    await logoutVaultSession();
    return err("login_error_pin_tampered");
  }

  // 2. Lockout check
  if (currentConfig.failedAttempts >= 3) {
    await clearPinUnlockState();
    await logoutVaultSession();
    return err("login_error_pin_max_attempts_reached");
  }

  // 3. Eager write: Increment attempts and compute new MAC before testing cryptographic decryption
  const nextAttempts = currentConfig.failedAttempts + 1;
  const nextMacRes = await computeHmac(
    String(nextAttempts),
    currentConfig.salt,
  );
  const nextMac = nextMacRes.isOk() ? nextMacRes.value : "";

  const updatedConfig = {
    ...currentConfig,
    failedAttempts: nextAttempts,
    failedMac: nextMac,
  };

  setAccountStore("pinConfig", updatedConfig);
  await updateAccountSettings({ pinConfig: updatedConfig });

  // 4. Test PIN decryption
  const saltBufferRes = base64ToArrayBuffer(currentConfig.salt);
  if (saltBufferRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const pinKeyRes = await deriveKey(pin, new Uint8Array(saltBufferRes.value));
  if (pinKeyRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const decryptRes = await decryptData(
    currentConfig.value,
    currentConfig.iv,
    pinKeyRes.value,
  );
  if (decryptRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const bufferRes = base64ToArrayBuffer(decryptRes.value);
  if (bufferRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const importRes = await importAesGcmKey(
    bufferRes.value,
    "login_error_wrong_pin",
  );
  if (importRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  // 5. Success! Reset failedAttempts to 0
  const resetMacRes = await computeHmac("0", currentConfig.salt);
  const resetMac = resetMacRes.isOk() ? resetMacRes.value : "";
  const resetConfig = {
    ...currentConfig,
    failedAttempts: 0,
    failedMac: resetMac,
  };
  setAccountStore("pinConfig", resetConfig);
  await updateAccountSettings({ pinConfig: resetConfig });

  return await unlockVaultWithKey(importRes.value);
}

export async function lockVaultSession(): Promise<void> {
  sessionManager.clearKey();
  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  setAccountStore({
    folders: [],
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
  if (
    !key || !accountStore.masterPasswordConfig.salt || accountStore.isLocked
  ) return;

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
