import { z } from "zod";
import { setStore, store } from "@/core/store.ts";
import {
  type AppSettings,
  clearAlarm,
  clearLocal,
  clearSession,
  getAllSettings,
  getLocalItem,
  getSessionItem,
  getSessionItems,
  hasSessionStorage,
  isSessionUnlocked,
  removeSessionItem,
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
  VaultListSchema,
  View,
} from "@/core/types.ts";
import {
  isTranslationKey,
  setLanguage,
  SupportLanguage,
  type TranslationKey,
} from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { safeJsonParse } from "@/core/json-utils.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import {
  ALARM_NAME_VAULT_TIMEOUT,
  APP_NAME,
  LOCAL_STORAGE_KEY_THEME,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_RESET_TIMEOUT,
  SESSION_KEY_DERIVED_KEY,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_GITHUB_TOKEN,
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  SESSION_KEY_SESSION_INITIALIZED,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  STORE_KEY_IS_LOADED,
  STORE_KEY_IS_LOCKED,
  STORE_KEY_SALT,
  STORE_KEY_VIEW,
} from "@/core/constants.ts";

async function handleBrowserRestartCleanup(
  settings: AppSettings,
): Promise<void> {
  if (!hasSessionStorage()) {
    return;
  }
  const sessionInitialized = await getSessionItem(
    SESSION_KEY_SESSION_INITIALIZED,
  );
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
  const themeVal = await getLocalItem(LOCAL_STORAGE_KEY_THEME);
  const finalTheme = themeVal === "light" ? "light" : "dark";
  if (finalTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  return finalTheme;
}

async function resolveGithubToken(
  settings: AppSettings,
  key: CryptoKey | null,
): Promise<string> {
  const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  let decryptedToken = "";
  if (settings.githubTokenEncrypted && settings.githubTokenIv && key) {
    const decryptRes = await decryptData(
      settings.githubTokenEncrypted,
      settings.githubTokenIv,
      key,
    );
    if (decryptRes.isOk()) {
      decryptedToken = decryptRes.value;
      await setSessionItem(SESSION_KEY_GITHUB_TOKEN, decryptedToken);
    } else {
      console.error("Failed to decrypt GitHub Token:", decryptRes.error);
    }
  } else if (sessionToken && typeof sessionToken === "string") {
    decryptedToken = sessionToken;
  }
  return decryptedToken;
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

  let rawRes: unknown;
  const cachedVal = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedContent = typeof cachedVal === "string" ? cachedVal : undefined;

  if (cachedContent) {
    rawRes = { success: true, content: cachedContent };
  } else {
    const sendResult = await sendMessageToBackground({
      type: MSG_DOWNLOAD_FROM_GIST,
    });
    if (sendResult.isErr()) {
      handleInitError(sendResult.error);
      return;
    }
    const parsedFetchResResult = DownloadFromGistResponseSchema.safeParse(
      sendResult.value,
    );
    if (!parsedFetchResResult.success) {
      handleInitError("storage_error");
      return;
    }
    const parsedFetchRes = parsedFetchResResult.data;

    if (parsedFetchRes.success && parsedFetchRes.content) {
      await setSessionItem(
        SESSION_KEY_ENCRYPTED_VAULT,
        parsedFetchRes.content,
      );
    }
    rawRes = parsedFetchRes;
  }

  const resResult = DownloadFromGistResponseSchema.safeParse(rawRes);
  if (!resResult.success) {
    handleInitError("storage_error");
    return;
  }
  const res = resResult.data;

  if (res && res.success && res.content) {
    const content = res.content;
    const payloadResultRaw = safeJsonParse(content);
    if (payloadResultRaw.isErr()) {
      handleInitError(payloadResultRaw.error);
      return;
    }
    const payloadResult = GistPayloadSchema.safeParse(payloadResultRaw.value);
    if (!payloadResult.success) {
      handleInitError("storage_error");
      return;
    }
    const payload = payloadResult.data;

    const decryptRes = await decryptData(
      payload.ciphertext,
      payload.iv,
      key,
    );
    if (decryptRes.isErr()) {
      handleInitError(decryptRes.error);
      return;
    }

    const itemsJsonResult = safeJsonParse(decryptRes.value);
    if (itemsJsonResult.isErr()) {
      handleInitError(itemsJsonResult.error);
      return;
    }

    const itemsResult = VaultListSchema.safeParse(itemsJsonResult.value);
    if (!itemsResult.success) {
      handleInitError("storage_error");
      return;
    }
    const items = itemsResult.data;

    let targetView = isFido2Prompt ? View.Fido2Prompt : View.Vault;
    let selectedItem = undefined;

    const itemId = params.get("itemId");
    if (itemId && !isFido2Prompt) {
      const foundItem = items.find((i) => i.id === itemId);
      if (foundItem) {
        selectedItem = foundItem;
        targetView = View.ItemDetail;
      }
    } else if (!isFido2Prompt) {
      const sessionData = await getSessionItems([
        SESSION_KEY_LAST_VIEW,
        SESSION_KEY_LAST_SELECTED_ITEM_ID,
      ]);
      const savedView = sessionData[SESSION_KEY_LAST_VIEW];
      const savedItemId = sessionData[SESSION_KEY_LAST_SELECTED_ITEM_ID];

      const ViewSchema = z.nativeEnum(View);
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
          if (
            targetView === View.ItemDetail ||
            targetView === View.ItemEdit
          ) {
            targetView = View.Vault;
          }
        }
      }
    }

    setStore({
      vaultItems: items,
      isLocked: false,
      view: targetView,
      selectedItem,
    });
    notifyBackground({ type: MSG_RESET_TIMEOUT });
  } else {
    // If downloading fails but we have setup, it could be network issue or empty gist
    setStore({
      isLocked: false,
      view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
    });
    notifyBackground({ type: MSG_RESET_TIMEOUT });
  }
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

  const settings = await getAllSettings();
  await handleBrowserRestartCleanup(settings);

  const key = await getSessionKey();
  const sessionUnlockedVal = await isSessionUnlocked();
  const currentTheme = await loadAndApplyTheme();

  const decryptedToken = await resolveGithubToken(settings, key);
  const githubConfigured = !!settings.githubTokenEncrypted ||
    !!(await getSessionItem(SESSION_KEY_GITHUB_TOKEN));

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
    applyInitialView(githubConfigured, settings.welcomeAccepted, isFido2Prompt);
  }

  // Subscribe to settings changes
  subscribeToSettings(async (newSettings) => {
    const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
    const githubConfigured = !!newSettings.githubTokenEncrypted ||
      !!sessionToken;
    const finalToken = typeof sessionToken === "string" ? sessionToken : "";

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
    });
    if (newSettings.language !== store.language) {
      setLanguage(
        newSettings.language === "vi" ? SupportLanguage.Vi : SupportLanguage.En,
      );
    }
  });

  setStore(STORE_KEY_IS_LOADED, true);
}

export async function unlock(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const settings = await getAllSettings();
  const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const githubConfigured = !!settings.githubTokenEncrypted || !!sessionToken;
  if (!githubConfigured) {
    clearDerivedKey();
    return err("login_error_invalid_token");
  }

  let saltBase64 = settings.salt;
  let key: CryptoKey | null = null;

  clearDerivedKey(); // Reset

  // A. Nếu có salt cục bộ, derive key và giải mã Token ngay lập tức trước khi làm bất cứ việc gì khác!
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
        console.warn(
          "Failed to decrypt githubToken (possibly wrong password or changed salt on another device)",
        );
        clearDerivedKey();
        return err(decryptRes.error);
      }
      const setTokenRes = await setSessionItem(
        SESSION_KEY_GITHUB_TOKEN,
        decryptRes.value,
      );
      if (setTokenRes.isErr()) {
        clearDerivedKey();
        return err(setTokenRes.error);
      }
    }
  }

  let existingGistContent = "";
  let hasExistingGist = false;

  // B. Tải Gist từ GitHub về
  const sendResult = await sendMessageToBackground({
    type: MSG_DOWNLOAD_FROM_GIST,
  });
  if (sendResult.isErr()) {
    clearDerivedKey();
    return err(sendResult.error);
  }

  const downloadResResult = DownloadFromGistResponseSchema.safeParse(
    sendResult.value,
  );
  if (!downloadResResult.success) {
    clearDerivedKey();
    return err("storage_error");
  }
  const downloadRes = downloadResResult.data;

  if (downloadRes.success && downloadRes.content) {
    existingGistContent = downloadRes.content;
    hasExistingGist = true;

    // Nếu chưa có salt cục bộ nhưng trên Gist đã có salt, trích xuất nó
    if (!saltBase64) {
      const payloadJsonRes = safeJsonParse(downloadRes.content);
      if (payloadJsonRes.isErr()) {
        clearDerivedKey();
        return err(payloadJsonRes.error);
      }
      const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (!payloadResult.success) {
        clearDerivedKey();
        return err("storage_error");
      }
      const payload = payloadResult.data;
      if (payload.salt) {
        saltBase64 = payload.salt;
        await updateSettings({ salt: saltBase64 });
        setStore(STORE_KEY_SALT, saltBase64);
      }
    }
  }

  // C. Nếu vẫn chưa có salt (cả cục bộ và trên Gist đều không có), tạo két sắt mới hoàn toàn
  if (!saltBase64) {
    const rawSalt = generateSalt();
    saltBase64 = rawSalt.toBase64();
    await updateSettings({ salt: saltBase64 });
    setStore(STORE_KEY_SALT, saltBase64);

    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      return err(keyRes.error);
    }
    key = keyRes.value;

    // Lưu token mã hóa vào đĩa (onboarding)
    const tokenToEncrypt = typeof sessionToken === "string" ? sessionToken : "";
    if (tokenToEncrypt) {
      const encryptRes = await encryptData(tokenToEncrypt, key);
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

    await setDerivedKey(key);
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

    const sessionVal = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
    const finalToken = typeof sessionVal === "string" ? sessionVal : "";
    setStore({
      vaultItems: [],
      githubToken: finalToken,
      githubConfigured: true,
      isLocked: false,
      view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
      sessionUnlocked: true,
    });
    notifyBackground({ type: MSG_RESET_TIMEOUT });
    return ok();
  }

  // D. Đảm bảo key đã được tạo (nếu chưa được tạo ở bước A do lúc đó chưa có salt)
  if (!key) {
    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      clearDerivedKey();
      return err(keyRes.error);
    }
    key = keyRes.value;
  }

  // E. Nếu đây là onboarding (sessionToken chứa token thô) và nay đã có salt, thực hiện mã hóa lưu vào đĩa
  if (sessionToken && typeof sessionToken === "string") {
    const encryptRes = await encryptData(sessionToken, key);
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

  if (!hasExistingGist || !existingGistContent) {
    // Có salt nhưng không có Gist (ví dụ Gist bị xóa thủ công trên GitHub), tạo lại Gist trống
    const uploadRes = await syncVaultToGist([], key, saltBase64);
    if (uploadRes.isErr()) {
      clearDerivedKey();
      return err(uploadRes.error);
    }

    await setDerivedKey(key);
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

    const sessionVal = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
    const finalToken = typeof sessionVal === "string" ? sessionVal : "";
    setStore({
      vaultItems: [],
      githubToken: finalToken,
      githubConfigured: true,
      isLocked: false,
      view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
      sessionUnlocked: true,
    });
    notifyBackground({ type: MSG_RESET_TIMEOUT });
    return ok();
  }

  // F. Giải mã dữ liệu két sắt từ Gist
  const payloadJsonRes = safeJsonParse(existingGistContent);
  if (payloadJsonRes.isErr()) {
    clearDerivedKey();
    return err(payloadJsonRes.error);
  }
  const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
  if (!payloadResult.success) {
    clearDerivedKey();
    return err("storage_error");
  }
  const payload = payloadResult.data;

  const decryptRes = await decryptData(payload.ciphertext, payload.iv, key);
  if (decryptRes.isErr()) {
    clearDerivedKey();
    const errMsg = decryptRes.error;
    if (
      errMsg.includes("OperationError") || errMsg === "login_error_wrong_mp"
    ) {
      return err("login_error_wrong_mp");
    }
    return err(isTranslationKey(errMsg) ? errMsg : "login_error_wrong_mp");
  }

  const itemsJsonRes = safeJsonParse(decryptRes.value);
  if (itemsJsonRes.isErr()) {
    clearDerivedKey();
    return err(itemsJsonRes.error);
  }
  const itemsResult = VaultListSchema.safeParse(itemsJsonRes.value);
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

  await setDerivedKey(key);
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

  const sessionVal = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const finalToken = typeof sessionVal === "string" ? sessionVal : "";
  setStore({
    vaultItems: items,
    githubToken: finalToken,
    githubConfigured: true,
    isLocked: false,
    view: targetView,
    selectedItem,
    sessionUnlocked: true,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });

  return ok();
}

export async function lock() {
  clearDerivedKey();

  await removeSessionItem([
    SESSION_KEY_DERIVED_KEY,
    SESSION_KEY_VERIFICATION_IV,
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    SESSION_KEY_GITHUB_TOKEN,
    SESSION_KEY_ENCRYPTED_VAULT,
    SESSION_KEY_LAST_VIEW,
    SESSION_KEY_LAST_SELECTED_ITEM_ID,
  ]);

  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  setStore({
    vaultItems: [],
    githubToken: "",
    isLocked: true,
    view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
  });
}

export async function logout() {
  await setSessionUnlocked(false);
  clearDerivedKey();

  await removeSessionItem([
    SESSION_KEY_DERIVED_KEY,
    SESSION_KEY_VERIFICATION_IV,
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    SESSION_KEY_GITHUB_TOKEN,
    SESSION_KEY_ENCRYPTED_VAULT,
    SESSION_KEY_LAST_VIEW,
    SESSION_KEY_LAST_SELECTED_ITEM_ID,
  ]);

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
