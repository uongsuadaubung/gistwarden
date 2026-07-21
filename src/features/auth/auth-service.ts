import { z } from "zod";
import { setStore, store } from "@/core/store.ts";
import {
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
import { setLanguage, SupportLanguage } from "@/core/i18n.ts";
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

export async function init() {
  console.log(`[Store] Initializing ${APP_NAME} Store...`);

  // Phóng tránh Race Condition: Đảm bảo Đăng xuất (nếu có) được hoàn tất trước khi đọc cài đặt
  if (hasSessionStorage()) {
    const sessionInitialized = await getSessionItem(
      SESSION_KEY_SESSION_INITIALIZED,
    );
    if (!sessionInitialized) {
      const settings = await getAllSettings();
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

  const settings = await getAllSettings();
  const key = await getSessionKey();
  const sessionUnlockedVal = await isSessionUnlocked();

  let currentTheme: "dark" | "light" = "dark";
  const themeVal = await getLocalItem(LOCAL_STORAGE_KEY_THEME);
  currentTheme = themeVal === "light" ? "light" : "dark";

  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }

  const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const githubConfigured = !!settings.githubTokenEncrypted || !!sessionToken;

  let decryptedToken = "";
  if (settings.githubTokenEncrypted && settings.githubTokenIv && key) {
    try {
      decryptedToken = await decryptData(
        settings.githubTokenEncrypted,
        settings.githubTokenIv,
        key,
      );
      await setSessionItem(SESSION_KEY_GITHUB_TOKEN, decryptedToken);
    } catch (e) {
      console.error("Failed to decrypt GitHub Token:", e);
    }
  } else if (sessionToken && typeof sessionToken === "string") {
    decryptedToken = sessionToken;
  }

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

  // Check mode FIDO2 prompt
  const params = new URLSearchParams(window.location.search);
  const isFido2Prompt = params.get("mode") === "fido2-prompt";

  if (isFido2Prompt) {
    setStore(STORE_KEY_VIEW, View.Fido2Prompt);
  }

  if (decryptedToken && key && settings.salt) {
    try {
      let rawRes: unknown;
      const cachedVal = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
      const cachedContent = typeof cachedVal === "string"
        ? cachedVal
        : undefined;

      if (cachedContent) {
        rawRes = { success: true, content: cachedContent };
      } else {
        const sendResult = await sendMessageToBackground({
          type: MSG_DOWNLOAD_FROM_GIST,
        });
        if (sendResult.isErr()) {
          throw new Error(sendResult.error);
        }
        const parsedFetchRes = DownloadFromGistResponseSchema.parse(
          sendResult.value,
        );
        if (parsedFetchRes.success && parsedFetchRes.content) {
          await setSessionItem(
            SESSION_KEY_ENCRYPTED_VAULT,
            parsedFetchRes.content,
          );
        }
        rawRes = parsedFetchRes;
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
        notifyBackground({ type: MSG_RESET_TIMEOUT });
      } else {
        // If downloading fails but we have setup, it could be network issue or empty gist
        setStore({
          isLocked: false,
          view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
        });
        notifyBackground({ type: MSG_RESET_TIMEOUT });
      }
    } catch (err) {
      console.error("[Store] Decryption on load failed:", err);
      setStore(STORE_KEY_IS_LOCKED, true);
      if (!isFido2Prompt) setStore(STORE_KEY_VIEW, View.Login);
    }
  } else {
    setStore(STORE_KEY_IS_LOCKED, true);
    if (!isFido2Prompt) {
      if (!githubConfigured && !settings.welcomeAccepted) {
        setStore(STORE_KEY_VIEW, View.Welcome);
      } else {
        setStore(STORE_KEY_VIEW, View.Login);
      }
    }
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAllSettings();
    const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
    const githubConfigured = !!settings.githubTokenEncrypted || !!sessionToken;
    if (!githubConfigured) {
      return { success: false, error: "Chưa cấu hình Token GitHub" };
    }

    let saltBase64 = settings.salt;
    let key: CryptoKey | null = null;

    clearDerivedKey(); // Reset

    // A. Nếu có salt cục bộ, derive key và giải mã Token ngay lập tức trước khi làm bất cứ việc gì khác!
    if (saltBase64) {
      key = await getOrDeriveKey(password, saltBase64);
      if (settings.githubTokenEncrypted && settings.githubTokenIv) {
        try {
          const decrypted = await decryptData(
            settings.githubTokenEncrypted,
            settings.githubTokenIv,
            key,
          );
          await setSessionItem(SESSION_KEY_GITHUB_TOKEN, decrypted);
        } catch (_e) {
          console.warn(
            "Failed to decrypt githubToken (possibly wrong password or changed salt on another device)",
          );
          throw new Error("login_error_wrong_mp");
        }
      }
    }

    let existingGistContent = "";
    let hasExistingGist = false;

    // B. Tải Gist từ GitHub về
    // Lúc này chắc chắn token đã có trong session storage (hoặc từ onboarding hoặc từ bước giải mã ở trên)
    const sendResult = await sendMessageToBackground({
      type: MSG_DOWNLOAD_FROM_GIST,
    });
    if (sendResult.isErr()) {
      throw new Error(sendResult.error);
    }
    const downloadRes = DownloadFromGistResponseSchema.parse(sendResult.value);
    if (downloadRes.success && downloadRes.content) {
      existingGistContent = downloadRes.content;
      hasExistingGist = true;

      // Nếu chưa có salt cục bộ nhưng trên Gist đã có salt, trích xuất nó
      if (!saltBase64) {
        try {
          const payload = GistPayloadSchema.parse(
            JSON.parse(downloadRes.content),
          );
          if (payload.salt) {
            saltBase64 = payload.salt;
            await updateSettings({ salt: saltBase64 });
            setStore(STORE_KEY_SALT, saltBase64);
          }
        } catch (_err) {
          // Lỗi định dạng JSON, coi như chưa có Gist hợp lệ
        }
      }
    }

    // C. Nếu vẫn chưa có salt (cả cục bộ và trên Gist đều không có), tạo két sắt mới hoàn toàn
    if (!saltBase64) {
      const rawSalt = generateSalt();
      saltBase64 = btoa(String.fromCharCode(...rawSalt));
      await updateSettings({ salt: saltBase64 });
      setStore(STORE_KEY_SALT, saltBase64);

      key = await getOrDeriveKey(password, saltBase64);

      // Lưu token mã hóa vào đĩa (onboarding)
      const tokenToEncrypt = typeof sessionToken === "string"
        ? sessionToken
        : "";
      if (tokenToEncrypt) {
        const { iv, ciphertext } = await encryptData(tokenToEncrypt, key);
        await updateSettings({
          githubTokenEncrypted: ciphertext,
          githubTokenIv: iv,
        });
      }

      const uploadRes = await syncVaultToGist([], key, saltBase64);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "Không thể tạo Gist trên GitHub");
      }

      await setDerivedKey(key);
      const verificationStr = "verification_token";
      const { iv: vIv, ciphertext: vCiphertext } = await encryptData(
        verificationStr,
        key,
      );
      await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
      await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);
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
      return { success: true };
    }

    // D. Đảm bảo key đã được tạo (nếu chưa được tạo ở bước A do lúc đó chưa có salt)
    if (!key) {
      key = await getOrDeriveKey(password, saltBase64);
    }

    // E. Nếu đây là onboarding (sessionToken chứa token thô) và nay đã có salt, thực hiện mã hóa lưu vào đĩa
    if (sessionToken && typeof sessionToken === "string") {
      const { iv, ciphertext } = await encryptData(sessionToken, key);
      await updateSettings({
        githubTokenEncrypted: ciphertext,
        githubTokenIv: iv,
      });
    }

    if (!hasExistingGist || !existingGistContent) {
      // Có salt nhưng không có Gist (ví dụ Gist bị xóa thủ công trên GitHub), tạo lại Gist trống
      const uploadRes = await syncVaultToGist([], key, saltBase64);
      if (!uploadRes.success) {
        return {
          success: false,
          error: uploadRes.error || "Lỗi tải két sắt từ Gist",
        };
      }

      await setDerivedKey(key);
      const verificationStr = "verification_token";
      const { iv: vIv, ciphertext: vCiphertext } = await encryptData(
        verificationStr,
        key,
      );
      await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
      await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);
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
      return { success: true };
    }

    // F. Giải mã dữ liệu két sắt từ Gist
    const payload = GistPayloadSchema.parse(JSON.parse(existingGistContent));
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

    await setDerivedKey(key);
    const verificationStr = "verification_token";
    const { iv: vIv, ciphertext: vCiphertext } = await encryptData(
      verificationStr,
      key,
    );
    await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
    await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);
    await setSessionUnlocked(true);
    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);

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

    return { success: true };
  } catch (err) {
    clearDerivedKey();
    const errMsg = err instanceof Error ? err.message : String(err);
    if (
      errMsg.includes("OperationError") || errMsg === "login_error_wrong_mp"
    ) {
      console.warn("[Store] Unlock failed: Incorrect master password");
      return { success: false, error: "login_error_wrong_mp" };
    }
    console.error("[Store] Unlock failed:", err);
    return { success: false, error: errMsg || "login_error_wrong_mp" };
  }
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

export async function unlockWithKey(
  key: CryptoKey,
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getAllSettings();
    const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
    const githubConfigured = !!settings.githubTokenEncrypted || !!sessionToken;
    if (!githubConfigured) {
      return { success: false, error: "Chưa cấu hình Token GitHub" };
    }

    clearDerivedKey(); // Reset

    // Save key bytes to session storage
    await setDerivedKey(key);

    // Decrypt GitHub Token
    if (settings.githubTokenEncrypted && settings.githubTokenIv) {
      try {
        const decrypted = await decryptData(
          settings.githubTokenEncrypted,
          settings.githubTokenIv,
          key,
        );
        await setSessionItem(SESSION_KEY_GITHUB_TOKEN, decrypted);
      } catch (_e) {
        console.warn("Failed to decrypt githubToken with provided key");
      }
    }

    let existingGistContent = "";
    let hasExistingGist = false;

    // B. Tải Gist từ GitHub về
    const sendResult = await sendMessageToBackground({
      type: MSG_DOWNLOAD_FROM_GIST,
    });
    if (sendResult.isErr()) {
      throw new Error(sendResult.error);
    }
    const downloadRes = DownloadFromGistResponseSchema.parse(sendResult.value);
    if (downloadRes.success && downloadRes.content) {
      existingGistContent = downloadRes.content;
      hasExistingGist = true;
    }

    if (!hasExistingGist || !existingGistContent) {
      return { success: false, error: "Không tìm thấy két sắt trên GitHub" };
    }

    // F. Giải mã dữ liệu két sắt từ Gist
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

    const verificationStr = "verification_token";
    const { iv: vIv, ciphertext: vCiphertext } = await encryptData(
      verificationStr,
      key,
    );
    await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
    await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);
    await setSessionUnlocked(true);
    await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingGistContent);

    const sessionVal = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
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

    return { success: true };
  } catch (err) {
    console.error("[Store] Unlock with key failed:", err);
    clearDerivedKey();
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi mở khóa" };
  }
}
