import { z } from "zod";
import { reconcile } from "solid-js/store";
import { setStore, store } from "@/core/store.ts";
import { clearAlarm } from "@/core/alarms.ts";
import {
  type AppSettings,
  clearLocal,
  clearSession,
  clearUnlockedSessionState,
  getAllSettings,
  getGithubToken,
  getLocalItem,
  getSessionItem,
  getSessionItems,
  hasSessionStorage,
  isSessionUnlocked,
  setSessionItem,
  setSessionUnlocked,
  subscribeToSettings,
  updateSettings,
} from "@/core/storage.ts";
import {
  clearDerivedKey,
  decryptData,
  encryptData,
  generateSalt,
  getOrDeriveKey,
  getSessionKey,
  setDerivedKey,
} from "@/core/crypto.ts";
import { notifyBackground, sendMessageToBackground } from "@/core/messaging.ts";
import {
  DownloadFromGistResponseSchema,
  GistPayloadSchema,
  type VaultItem,
  VaultListSchema,
  View,
} from "@/core/types.ts";
import {
  setLanguage,
  SupportLanguage,
  type TranslationKey,
} from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import { fetchGistContent } from "@/features/sync/github-api.ts";

import {
  ALARM_NAME_VAULT_TIMEOUT,
  APP_NAME,
  LOCAL_STORAGE_KEY_THEME,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_RESET_TIMEOUT,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  SESSION_KEY_SESSION_INITIALIZED,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  STORE_KEY_IS_LOADED,
  STORE_KEY_IS_LOCKED,
  STORE_KEY_SALT,
  STORE_KEY_VAULT_ITEMS,
  STORE_KEY_VIEW,
} from "@/core/constants.ts";

async function handleBrowserRestartCleanup(
  settings: AppSettings,
): Promise<void> {
  if (!hasSessionStorage()) {
    return;
  }
  const sessionInitRes = await getSessionItem(
    SESSION_KEY_SESSION_INITIALIZED,
  );
  const sessionInitialized = sessionInitRes.isOk()
    ? sessionInitRes.value
    : null;
  if (!sessionInitialized) {
    const action = settings.vaultTimeoutAction || "lock";
    if (action === "logout") {
      console.debug(
        `[Store] Phát hiện khởi động lại trình duyệt và hành động là logout. Đang đăng xuất...`,
      );
      await clearLocal();
      await clearSession();
    }
    await setSessionItem(SESSION_KEY_SESSION_INITIALIZED, true);
  }
}

async function loadAndApplyTheme(): Promise<"dark" | "light"> {
  const themeRes = await getLocalItem(LOCAL_STORAGE_KEY_THEME);
  const themeVal = themeRes.isOk() ? themeRes.value : null;
  const finalTheme = themeVal === "light" ? "light" : "dark";
  if (finalTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  return finalTheme;
}

async function fetchEncryptedVaultContent(): Promise<
  Result<string | null, TranslationKey>
> {
  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    return ok(cachedVal);
  }

  const fetchRes = await fetchGistContent();
  if (fetchRes.isOk() && fetchRes.value.rawContent) {
    await setSessionItem(
      SESSION_KEY_ENCRYPTED_VAULT,
      fetchRes.value.rawContent,
    );
    return ok(fetchRes.value.rawContent);
  }

  return ok(null);
}

async function resolveSavedViewAndItem(
  items: VaultItem[],
  isFido2Prompt: boolean,
  params: URLSearchParams,
): Promise<{ targetView: View; selectedItem?: VaultItem }> {
  let targetView = isFido2Prompt ? View.Fido2Prompt : View.Vault;
  let selectedItem: VaultItem | undefined = undefined;

  const itemId = params.get("itemId");
  if (itemId && !isFido2Prompt) {
    const foundItem = items.find((i) => i.id === itemId);
    if (foundItem) {
      selectedItem = foundItem;
      targetView = View.ItemDetail;
    }
  } else if (!isFido2Prompt) {
    const sessionDataRes = await getSessionItems([
      SESSION_KEY_LAST_VIEW,
      SESSION_KEY_LAST_SELECTED_ITEM_ID,
    ]);
    const sessionData = sessionDataRes.isOk() ? sessionDataRes.value : {};
    const savedView = sessionData[SESSION_KEY_LAST_VIEW];
    const savedItemId = sessionData[SESSION_KEY_LAST_SELECTED_ITEM_ID];

    const ViewSchema = z.enum(View);
    const viewParsed = ViewSchema.safeParse(savedView);
    if (viewParsed.success) {
      const viewVal = viewParsed.data;
      if (viewVal !== View.Login && viewVal !== View.Welcome) {
        targetView = viewVal;
      }
    }

    if (typeof savedItemId === "string") {
      const foundItem = items.find((i) => i.id === savedItemId);
      if (foundItem) {
        selectedItem = foundItem;
      } else {
        if (targetView === View.ItemDetail || targetView === View.ItemEdit) {
          targetView = View.Vault;
        }
      }
    }
  }

  return { targetView, selectedItem };
}

async function loadAndDecryptVault(
  key: CryptoKey,
  isFido2Prompt: boolean,
  params: URLSearchParams,
): Promise<void> {
  const handleInitError = (errVal: TranslationKey) => {
    console.error("[Store] Decryption on load failed:", errVal);
    setStore(STORE_KEY_IS_LOCKED, true);
    if (!isFido2Prompt) setStore(STORE_KEY_VIEW, View.Login);
  };

  const contentRes = await fetchEncryptedVaultContent();
  if (contentRes.isErr()) {
    handleInitError(contentRes.error);
    return;
  }

  const content = contentRes.value;
  if (!content) {
    setStore({
      isLocked: false,
      view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
    });
    notifyBackground({ type: MSG_RESET_TIMEOUT });
    return;
  }

  const decryptVaultRes = await decryptGistVault(content, key);
  if (decryptVaultRes.isErr()) {
    handleInitError(decryptVaultRes.error);
    return;
  }

  const { items } = decryptVaultRes.value;
  const { targetView, selectedItem } = await resolveSavedViewAndItem(
    items,
    isFido2Prompt,
    params,
  );

  setStore({
    vaultItems: items,
    isLocked: false,
    view: targetView,
    selectedItem,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });
}

function applyInitialView(
  githubConfigured: boolean,
  welcomeAccepted: boolean,
  isFido2Prompt: boolean,
): void {
  setStore(STORE_KEY_IS_LOCKED, true);
  if (!isFido2Prompt) {
    if (!githubConfigured && !welcomeAccepted) {
      setStore(STORE_KEY_VIEW, View.Welcome);
    } else {
      setStore(STORE_KEY_VIEW, View.Login);
    }
  }
}

export async function init() {
  console.log(`[Store] Initializing ${APP_NAME} Store...`);

  const settingsRes = await getAllSettings();
  if (settingsRes.isErr()) {
    return;
  }
  const settings = settingsRes.value;
  await handleBrowserRestartCleanup(settings);

  const key = await getSessionKey();
  const sessionUnlockedVal = await isSessionUnlocked();
  const currentTheme = await loadAndApplyTheme();

  const decryptedToken = await getGithubToken();
  const githubConfigured = !!settings.githubTokenEncrypted ||
    !!decryptedToken || !!store.githubToken;

  setStore({
    githubToken: decryptedToken,
    githubConfigured,
    gistId: settings.gistId,
    salt: settings.salt,
    cachedGithubUser: settings.cachedGithubUser,
    lastSync: settings.lastSync,
    language: settings.language,
    theme: currentTheme,
    welcomeAccepted: settings.welcomeAccepted,
    pinUnlockEnabled: settings.pinUnlockEnabled,
    pinUnlockValue: settings.pinUnlockValue,
    pinUnlockIv: settings.pinUnlockIv,
    pinUnlockSalt: settings.pinUnlockSalt,
    requireMasterPasswordOnRestart: settings.requireMasterPasswordOnRestart,
    vaultTimeout: settings.vaultTimeout,
    vaultTimeoutAction: settings.vaultTimeoutAction,
    sessionUnlocked: sessionUnlockedVal,
    timeOffset: settings.timeOffset || 0,
    autoSubmitOnAutofill: settings.autoSubmitOnAutofill ?? true,
    showAutofillSuggestionsOnFocus: settings.showAutofillSuggestionsOnFocus ??
      true,
  });

  setLanguage(
    settings.language === "vi" ? SupportLanguage.Vi : SupportLanguage.En,
  );

  const params = new URLSearchParams(window.location.search);
  const isFido2Prompt = params.get("mode") === "fido2-prompt";

  if (isFido2Prompt) {
    setStore(STORE_KEY_VIEW, View.Fido2Prompt);
  }

  if (decryptedToken && key && settings.salt) {
    await loadAndDecryptVault(key, isFido2Prompt, params);
  } else {
    if (settings.gistId && settings.salt) {
      const publicRes = await fetchGistContent();
      if (publicRes.isOk() && publicRes.value.rawContent) {
        const content = publicRes.value.rawContent;
        const payloadJsonRes = safeJsonParse(content);
        if (payloadJsonRes.isOk()) {
          const payloadResult = GistPayloadSchema.safeParse(
            payloadJsonRes.value,
          );

          if (payloadResult.success) {
            const payload = payloadResult.data;
            if (
              payload.salt && settings.salt && payload.salt !== settings.salt
            ) {
              console.warn(
                "[Store] Salt mismatch detected during init prefetch (Master Password changed on another device). Auto logging out...",
              );
              await logout();
              setStore(STORE_KEY_IS_LOADED, true);
              return;
            }
            await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, content);
          }
        }
      }
    }
    applyInitialView(githubConfigured, settings.welcomeAccepted, isFido2Prompt);
  }

  subscribeToSettings(async (newSettings) => {
    const finalToken = await getGithubToken();
    const githubConfigured = !!newSettings.githubTokenEncrypted ||
      !!finalToken || !!store.githubToken;

    setStore({
      githubToken: finalToken,
      githubConfigured,
      gistId: newSettings.gistId,
      salt: newSettings.salt,
      cachedGithubUser: newSettings.cachedGithubUser,
      lastSync: newSettings.lastSync,
      language: newSettings.language,
      welcomeAccepted: newSettings.welcomeAccepted,
      pinUnlockEnabled: newSettings.pinUnlockEnabled,
      pinUnlockValue: newSettings.pinUnlockValue,
      pinUnlockIv: newSettings.pinUnlockIv,
      pinUnlockSalt: newSettings.pinUnlockSalt,
      requireMasterPasswordOnRestart:
        newSettings.requireMasterPasswordOnRestart,
      vaultTimeout: newSettings.vaultTimeout,
      vaultTimeoutAction: newSettings.vaultTimeoutAction,
      autoSubmitOnAutofill: newSettings.autoSubmitOnAutofill ?? true,
      showAutofillSuggestionsOnFocus:
        newSettings.showAutofillSuggestionsOnFocus ??
          true,
    });
    if (newSettings.language !== store.language) {
      setLanguage(
        newSettings.language === "vi" ? SupportLanguage.Vi : SupportLanguage.En,
      );
    }
  });

  setStore(STORE_KEY_IS_LOADED, true);
}

async function setupUnlockedSession(
  key: CryptoKey,
  items: VaultItem[],
  targetView?: View,
  selectedItem?: VaultItem,
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
  const finalView = targetView ||
    (store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault);

  setStore({
    vaultItems: items,
    githubToken: finalToken,
    githubConfigured: true,
    isLocked: false,
    view: finalView,
    selectedItem,
    sessionUnlocked: true,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });
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
    const sendResult = await sendMessageToBackground({
      type: MSG_DOWNLOAD_FROM_GIST,
    });
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }
    const downloadResResult = DownloadFromGistResponseSchema.safeParse(
      sendResult.value,
    );
    if (!downloadResResult.success) {
      return err("storage_error");
    }
    if (downloadResResult.data.success && downloadResResult.data.content) {
      content = downloadResResult.data.content;
    }
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

async function initializeNewVault(
  password: string,
  tokenToEncrypt: string,
): Promise<Result<void, TranslationKey>> {
  const rawSalt = generateSalt();
  const saltBase64 = rawSalt.toBase64();
  await updateSettings({ salt: saltBase64 });
  setStore(STORE_KEY_SALT, saltBase64);

  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    clearDerivedKey();
    return err(keyRes.error);
  }
  const key = keyRes.value;

  const activeToken = tokenToEncrypt || (await getGithubToken());
  if (activeToken) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isErr()) {
      clearDerivedKey();
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    await updateSettings({
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
    });
  }

  const uploadRes = await syncVaultToGist([], key, saltBase64);
  if (uploadRes.isErr()) {
    clearDerivedKey();
    return err(uploadRes.error);
  }

  return await setupUnlockedSession(key, []);
}

async function decryptGistVault(
  content: string,
  key: CryptoKey,
): Promise<
  Result<{
    items: VaultItem[];
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
  const itemsResult = VaultListSchema.safeParse(itemsJsonRes.value);
  if (!itemsResult.success) {
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

  return ok({ items, targetView, selectedItem });
}

export async function unlock(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const settingsRes = await getAllSettings();
  if (settingsRes.isErr()) return err(settingsRes.error);
  const settings = settingsRes.value;
  const currentToken = await getGithubToken();
  const githubConfigured = !!settings.githubTokenEncrypted ||
    !!currentToken || !!store.githubToken;
  if (!githubConfigured) {
    clearDerivedKey();
    return err("login_error_invalid_token");
  }

  let saltBase64 = settings.salt;
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
    if (settings.githubTokenEncrypted && settings.githubTokenIv) {
      const decryptRes = await decryptData(
        settings.githubTokenEncrypted,
        settings.githubTokenIv,
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
    await updateSettings({ salt: saltBase64 });
    setStore(STORE_KEY_SALT, saltBase64);
  }

  // C. Nếu chưa có salt (két sắt mới), tạo két sắt mới
  if (!saltBase64) {
    const tokenToEncrypt = store.githubToken || "";
    return await initializeNewVault(password, tokenToEncrypt);
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

  // E. Onboarding token mã hóa
  const activeToken = await getGithubToken();
  if (
    activeToken && (!settings.githubTokenEncrypted || !settings.githubTokenIv)
  ) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isErr()) {
      clearDerivedKey();
      return err(encryptRes.error);
    }
    await updateSettings({
      githubTokenEncrypted: encryptRes.value.ciphertext,
      githubTokenIv: encryptRes.value.iv,
    });
  }

  // F. Xử lý két sắt rỗng hoặc giải mã két sắt từ Gist
  if (!existingGistContent) {
    const uploadRes = await syncVaultToGist([], key, saltBase64);
    if (uploadRes.isErr()) {
      clearDerivedKey();
      return err(uploadRes.error);
    }
    return await setupUnlockedSession(key, []);
  }

  const decryptVaultRes = await decryptGistVault(existingGistContent, key);
  if (decryptVaultRes.isErr()) {
    clearDerivedKey();
    return err(decryptVaultRes.error);
  }

  const { items, targetView, selectedItem } = decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);
  return await setupUnlockedSession(key, items, targetView, selectedItem);
}

export async function lock() {
  clearDerivedKey();

  await clearUnlockedSessionState();

  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  setStore({
    vaultItems: [],
    githubToken: "",
    isLocked: true,
    view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
  });
}

export async function logout() {
  clearDerivedKey();

  await clearUnlockedSessionState();

  await clearLocal();

  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  setStore({
    githubToken: "",
    githubConfigured: false,
    gistId: "",
    salt: "",
    cachedGithubUser: null,
    lastSync: 0,
    vaultItems: [],
    isLocked: true,
    view: View.Login,
    welcomeAccepted: false,
    pinUnlockEnabled: false,
    pinUnlockValue: "",
    pinUnlockIv: "",
    pinUnlockSalt: "",
    requireMasterPasswordOnRestart: true,
    vaultTimeout: "onRestart",
    vaultTimeoutAction: "lock",
    sessionUnlocked: false,
  });
}

export async function acceptWelcome() {
  await updateSettings({ welcomeAccepted: true });
  setStore({
    welcomeAccepted: true,
    view: View.Login,
  });
}

export async function reloadVaultItems(): Promise<void> {
  const key = await getSessionKey();
  if (!key || !store.salt || store.isLocked) return;

  const contentRes = await fetchEncryptedVaultContent();
  if (contentRes.isErr() || !contentRes.value) return;

  const decryptVaultRes = await decryptGistVault(contentRes.value, key);
  if (decryptVaultRes.isErr()) return;

  const { items } = decryptVaultRes.value;
  setStore(STORE_KEY_VAULT_ITEMS, reconcile(items));
}
