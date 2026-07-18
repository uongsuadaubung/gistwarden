import { z } from "zod";
import { setStore, store } from "./store.ts";
import {
  clearMasterPassword,
  getAllSettings,
  getMasterPassword,
  getSessionItem,
  getSessionItems,
  isSessionUnlocked,
  removeSessionItem,
  setMasterPassword,
  setSessionItem,
  setSessionUnlocked,
  subscribeToSettings,
  updateSettings,
} from "./storage.ts";
import {
  clearDerivedKey,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  getOrDeriveKey,
} from "./crypto.ts";
import {
  DownloadFromGistResponseSchema,
  ValidateTokenResponseSchema,
  VaultListSchema,
  type VaultTimeoutAction,
  View,
} from "./types.ts";
import { setLanguage, SupportLanguage } from "./i18n.ts";
import { syncVaultToGist } from "./sync-utils.ts";
import {
  APP_NAME,
  LOCAL_STORAGE_KEY_THEME,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_RESET_TIMEOUT,
  MSG_VALIDATE_TOKEN,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_IS_LOADED,
  STORE_KEY_IS_LOCKED,
  STORE_KEY_SALT,
  STORE_KEY_VIEW,
} from "./constants.ts";
import { setGlobalLoading } from "./ui-service.ts";

export async function init() {
  console.log(`[Store] Initializing ${APP_NAME} Store...`);
  const settings = await getAllSettings();
  const masterPassword = await getMasterPassword();
  const sessionUnlockedVal = await isSessionUnlocked();

  let currentTheme: "dark" | "light" = "dark";
  if (typeof chrome !== "undefined" && chrome.storage) {
    const res = await chrome.storage.local.get(LOCAL_STORAGE_KEY_THEME);
    currentTheme = res[LOCAL_STORAGE_KEY_THEME] === "light" ? "light" : "dark";
  }

  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }

  setStore({
    githubToken: settings.githubToken,
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

  // Check mode FIDO2 prompt
  const params = new URLSearchParams(window.location.search);
  const isFido2Prompt = params.get("mode") === "fido2-prompt";

  if (isFido2Prompt) {
    setStore(STORE_KEY_VIEW, View.Fido2Prompt);
  }

  if (settings.githubToken && masterPassword && settings.salt) {
    try {
      const key = await getOrDeriveKey(masterPassword, settings.salt);

      let rawRes: unknown;
      const cachedVal = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
      const cachedContent = typeof cachedVal === "string"
        ? cachedVal
        : undefined;

      if (cachedContent) {
        rawRes = { success: true, content: cachedContent };
      } else {
        const fetchRes = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: MSG_DOWNLOAD_FROM_GIST }, resolve);
        });
        const parsedFetchRes = DownloadFromGistResponseSchema.parse(fetchRes);
        if (parsedFetchRes.success && parsedFetchRes.content) {
          await setSessionItem(
            SESSION_KEY_ENCRYPTED_VAULT,
            parsedFetchRes.content,
          );
        }
        rawRes = fetchRes;
      }

      const res = DownloadFromGistResponseSchema.parse(rawRes);

      if (res && res.success && res.content) {
        const payload = JSON.parse(res.content);
        const decrypted = await decryptData(
          payload.ciphertext,
          payload.iv,
          key,
        );
        const items = VaultListSchema.parse(JSON.parse(decrypted));

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
        chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});
      } else {
        // If downloading fails but we have setup, it could be network issue or empty gist
        setStore({
          isLocked: false,
          view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
        });
        chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});
      }
    } catch (err) {
      console.error("[Store] Decryption on load failed:", err);
      setStore(STORE_KEY_IS_LOCKED, true);
      if (!isFido2Prompt) setStore(STORE_KEY_VIEW, View.Login);
    }
  } else {
    setStore(STORE_KEY_IS_LOCKED, true);
    if (!isFido2Prompt) {
      if (!settings.githubToken && !settings.welcomeAccepted) {
        setStore(STORE_KEY_VIEW, View.Welcome);
      } else {
        setStore(STORE_KEY_VIEW, View.Login);
      }
    }
  }

  // Subscribe to settings changes
  subscribeToSettings((newSettings) => {
    setStore({
      githubToken: newSettings.githubToken,
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAllSettings();
    if (!settings.githubToken) {
      return { success: false, error: "Chưa cấu hình Token GitHub" };
    }

    let saltBase64 = settings.salt;
    let existingGistContent = "";
    let hasExistingGist = false;

    // 1. Nếu salt cục bộ bị trống (ví dụ sau khi logout), tải Gist từ GitHub về để trích xuất salt cũ
    if (!saltBase64) {
      const rawDownloadRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: MSG_DOWNLOAD_FROM_GIST }, resolve);
      });
      const downloadRes = DownloadFromGistResponseSchema.parse(rawDownloadRes);

      if (downloadRes.success && downloadRes.content) {
        try {
          const payload = JSON.parse(downloadRes.content);
          if (payload.salt) {
            saltBase64 = payload.salt;
            await updateSettings({ salt: saltBase64 });
            setStore(STORE_KEY_SALT, saltBase64);
            existingGistContent = downloadRes.content;
            hasExistingGist = true;
          }
        } catch (_err) {
          // Lỗi định dạng JSON, coi như chưa có Gist hợp lệ
        }
      }
    } else {
      // Nếu đã có salt cục bộ, tải dữ liệu két sắt từ Gist về bình thường
      const rawDownloadRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: MSG_DOWNLOAD_FROM_GIST }, resolve);
      });
      const downloadRes = DownloadFromGistResponseSchema.parse(rawDownloadRes);
      if (downloadRes.success && downloadRes.content) {
        existingGistContent = downloadRes.content;
        hasExistingGist = true;
      }
    }

    clearDerivedKey(); // Reset

    // 2. Nếu vẫn không có salt (cả cục bộ và trên GitHub Gist đều không có), tạo két sắt mới hoàn toàn
    if (!saltBase64) {
      const rawSalt = generateSalt();
      saltBase64 = btoa(String.fromCharCode(...rawSalt));
      await updateSettings({ salt: saltBase64 });
      setStore(STORE_KEY_SALT, saltBase64);

      const key = await getOrDeriveKey(password, saltBase64);
      const uploadRes = await syncVaultToGist([], key, saltBase64);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "Không thể tạo Gist trên GitHub");
      }

      await setMasterPassword(password);
      await setSessionUnlocked(true);
      setStore({
        vaultItems: [],
        isLocked: false,
        view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
        sessionUnlocked: true,
      });
      chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});
      return { success: true };
    }

    // 3. Sử dụng salt (được khôi phục từ Gist hoặc có sẵn) để tạo khóa
    const key = await getOrDeriveKey(password, saltBase64);

    if (!hasExistingGist || !existingGistContent) {
      // Có salt nhưng không có Gist (có thể bị xóa trên GitHub), tạo lại Gist trống
      const uploadRes = await syncVaultToGist([], key, saltBase64);

      if (!uploadRes.success) {
        return {
          success: false,
          error: uploadRes.error || "Lỗi tải két sắt từ Gist",
        };
      }

      await setMasterPassword(password);
      await setSessionUnlocked(true);
      setStore({
        vaultItems: [],
        isLocked: false,
        view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
        sessionUnlocked: true,
      });
      chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});
      return { success: true };
    }

    // 4. Giải mã dữ liệu két sắt từ Gist
    const payload = JSON.parse(existingGistContent);
    const decrypted = await decryptData(payload.ciphertext, payload.iv, key);
    const items = VaultListSchema.parse(JSON.parse(decrypted));

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

    await setMasterPassword(password);
    await setSessionUnlocked(true);
    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);

    setStore({
      vaultItems: items,
      isLocked: false,
      view: targetView,
      selectedItem,
      sessionUnlocked: true,
    });
    chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});

    return { success: true };
  } catch (err) {
    console.error("[Store] Unlock failed:", err);
    clearDerivedKey();
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Mật khẩu Master không đúng" };
  }
}

export async function setupGithub(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const rawRes = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG_VALIDATE_TOKEN, token }, resolve);
  });
  const res = ValidateTokenResponseSchema.parse(rawRes);

  if (res.success) {
    await updateSettings({
      githubToken: token,
      cachedGithubUser: {
        login: res.username || "",
        avatar_url: res.avatarUrl || "",
      },
    });
    setStore({
      githubToken: token,
      cachedGithubUser: {
        login: res.username || "",
        avatar_url: res.avatarUrl || "",
      },
    });
    return { success: true };
  } else {
    return { success: false, error: res.error || "Token không hợp lệ" };
  }
}

export async function lock() {
  await clearMasterPassword();
  clearDerivedKey();

  await removeSessionItem([
    SESSION_KEY_ENCRYPTED_VAULT,
    SESSION_KEY_LAST_VIEW,
    SESSION_KEY_LAST_SELECTED_ITEM_ID,
  ]);

  setStore({
    vaultItems: [],
    isLocked: true,
    view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
  });
}

export async function logout() {
  await clearMasterPassword();
  await setSessionUnlocked(false);
  clearDerivedKey();

  await removeSessionItem([
    SESSION_KEY_ENCRYPTED_VAULT,
    SESSION_KEY_LAST_VIEW,
    SESSION_KEY_LAST_SELECTED_ITEM_ID,
  ]);

  if (typeof chrome !== "undefined" && chrome.storage) {
    await chrome.storage.local.clear();
  }
  setStore({
    githubToken: "",
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

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
  try {
    const masterPassword = await getMasterPassword();
    if (!masterPassword) {
      throw new Error("Vault is locked");
    }
    const rawSalt = generateSalt();
    const pinSaltBase64 = btoa(String.fromCharCode(...rawSalt));
    const pinKey = await deriveKey(pin, rawSalt);
    const { iv, ciphertext } = await encryptData(masterPassword, pinKey);

    await updateSettings({
      pinUnlockEnabled: true,
      pinUnlockValue: ciphertext,
      pinUnlockIv: iv,
      pinUnlockSalt: pinSaltBase64,
      requireMasterPasswordOnRestart: requireRestart,
    });

    return { success: true };
  } catch (err) {
    console.error("[Store] Set PIN failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Failed to set PIN" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function disablePinUnlock(): Promise<void> {
  await updateSettings({
    pinUnlockEnabled: false,
    pinUnlockValue: "",
    pinUnlockIv: "",
    pinUnlockSalt: "",
  });
}

export async function updateSessionTimeout(
  timeout: string,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  chrome.runtime.sendMessage({ type: MSG_RESET_TIMEOUT }).catch(() => {});
}
