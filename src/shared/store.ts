import { createStore, reconcile } from "solid-js/store";
import {
  clearMasterPassword,
  getAllSettings,
  getMasterPassword,
  type GithubUser,
  isSessionUnlocked,
  setMasterPassword,
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
  setDerivedKey,
} from "./crypto.ts";
import {
  type CardVaultItem,
  type ConfirmType,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  ThemeMode,
  type ThemeModeType,
  type ToastType,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
  type VaultTimeoutAction,
  View,
} from "./types.ts";
import { setLanguage, SupportLanguage, t } from "./i18n.ts";
import { parseAndValidateImportJson } from "./import-export.ts";
import { APP_NAME } from "./constants.ts";
export { View };

export interface AppStore {
  githubToken: string;
  gistId: string;
  salt: string;
  cachedGithubUser: GithubUser | null;
  lastSync: number;
  language: "en" | "vi";
  welcomeAccepted: boolean;

  isLoaded: boolean;
  isLocked: boolean;
  view: View;
  vaultItems: VaultItem[];
  selectedItem: VaultItem | null;

  syncing: boolean;
  syncError: string;

  // Global Toast States
  toastMessage: string;
  toastType: ToastType;

  // Reusable Confirmation Modal States
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    resolve: ((value: boolean) => void) | null;
  };
  // Master Password Reprompt Modal States
  repromptModal: {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
  };
  transitionClass: string;
  theme: ThemeModeType;
  globalLoading: boolean;
  globalLoadingText: string;

  // PIN settings
  pinUnlockEnabled: boolean;
  pinUnlockValue: string;
  pinUnlockIv: string;
  pinUnlockSalt: string;
  requireMasterPasswordOnRestart: boolean;
  // Session timeout settings
  vaultTimeout: string;
  vaultTimeoutAction: VaultTimeoutAction;
  sessionUnlocked: boolean;
}

const [store, setStore] = createStore<AppStore>({
  githubToken: "",
  gistId: "",
  salt: "",
  cachedGithubUser: null,
  lastSync: 0,
  language: "en",
  welcomeAccepted: false,

  isLoaded: false,
  isLocked: true,
  view: View.Login,
  vaultItems: [],
  selectedItem: null,

  syncing: false,
  syncError: "",

  toastMessage: "",
  toastType: "success",

  confirmModal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    resolve: null,
  },
  repromptModal: {
    isOpen: false,
    resolve: null,
  },
  transitionClass: "",
  theme: ThemeMode.Dark,
  globalLoading: false,
  globalLoadingText: "",

  pinUnlockEnabled: false,
  pinUnlockValue: "",
  pinUnlockIv: "",
  pinUnlockSalt: "",
  requireMasterPasswordOnRestart: true,
  vaultTimeout: "onRestart",
  vaultTimeoutAction: "lock",
  sessionUnlocked: false,
});

export { store };

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

function isLoginVaultItem(item: VaultItem): item is LoginVaultItem {
  return item.type === VaultItemType.Login;
}

function isCardVaultItem(item: VaultItem): item is CardVaultItem {
  return item.type === VaultItemType.Card;
}

const viewDepths: Record<View, number> = {
  [View.Login]: 0,
  [View.Vault]: 1,
  [View.Generator]: 2,
  [View.Settings]: 3,
  [View.ItemDetail]: 2,
  [View.ItemEdit]: 3,
  [View.Language]: 4,
  [View.VaultOptions]: 4,
  [View.Theme]: 4,
  [View.Fido2Prompt]: 5,
  [View.Welcome]: 0,
  [View.AccountSecurity]: 4,
  [View.ChangeMasterPassword]: 5,
};

let transitionToggle = false;

export const storeActions = {
  async init() {
    console.log(`[Store] Initializing ${APP_NAME} Store...`);
    const settings = await getAllSettings();
    const masterPassword = await getMasterPassword();
    const sessionUnlockedVal = await isSessionUnlocked();

    let currentTheme: "dark" | "light" = "dark";
    if (typeof chrome !== "undefined" && chrome.storage) {
      const res = await chrome.storage.local.get(
        `${APP_NAME.toLowerCase()}_theme`,
      );
      currentTheme = res[`${APP_NAME.toLowerCase()}_theme`] === "light"
        ? "light"
        : "dark";
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
    });

    setLanguage(
      settings.language === "vi" ? SupportLanguage.Vi : SupportLanguage.En,
    );

    // Check mode FIDO2 prompt
    const params = new URLSearchParams(window.location.search);
    const isFido2Prompt = params.get("mode") === "fido2-prompt";

    if (isFido2Prompt) {
      setStore("view", View.Fido2Prompt);
    }

    if (settings.githubToken && masterPassword && settings.salt) {
      try {
        const key = await getOrDeriveKey(masterPassword, settings.salt);
        const res = await new Promise<{ success: boolean; content?: string }>(
          (resolve) => {
            chrome.runtime.sendMessage({ type: "DOWNLOAD_FROM_GIST" }, resolve);
          },
        );

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
          }

          setStore({
            vaultItems: items,
            isLocked: false,
            view: targetView,
            selectedItem,
          });
          chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});
        } else {
          // If downloading fails but we have setup, it could be network issue or empty gist
          setStore({
            isLocked: false,
            view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
          });
          chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});
        }
      } catch (err) {
        console.error("[Store] Decryption on load failed:", err);
        setStore("isLocked", true);
        if (!isFido2Prompt) setStore("view", View.Login);
      }
    } else {
      setStore("isLocked", true);
      if (!isFido2Prompt) {
        if (!settings.githubToken && !settings.welcomeAccepted) {
          setStore("view", View.Welcome);
        } else {
          setStore("view", View.Login);
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
          newSettings.language === "vi"
            ? SupportLanguage.Vi
            : SupportLanguage.En,
        );
      }
    });

    setStore("isLoaded", true);
  },

  async unlock(
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
        const downloadRes = await new Promise<
          { success: boolean; content?: string; error?: string }
        >((resolve) => {
          chrome.runtime.sendMessage({ type: "DOWNLOAD_FROM_GIST" }, resolve);
        });

        if (downloadRes.success && downloadRes.content) {
          try {
            const payload = JSON.parse(downloadRes.content);
            if (payload.salt) {
              saltBase64 = payload.salt;
              await updateSettings({ salt: saltBase64 });
              setStore("salt", saltBase64);
              existingGistContent = downloadRes.content;
              hasExistingGist = true;
            }
          } catch (_err) {
            // Lỗi định dạng JSON, coi như chưa có Gist hợp lệ
          }
        }
      } else {
        // Nếu đã có salt cục bộ, tải dữ liệu két sắt từ Gist về bình thường
        const downloadRes = await new Promise<
          { success: boolean; content?: string; error?: string }
        >((resolve) => {
          chrome.runtime.sendMessage({ type: "DOWNLOAD_FROM_GIST" }, resolve);
        });
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
        setStore("salt", saltBase64);

        const key = await getOrDeriveKey(password, saltBase64);
        const encrypted = await encryptData(JSON.stringify([]), key);
        const payload = JSON.stringify({
          salt: saltBase64,
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
        });

        const res = await new Promise<{ success: boolean; error?: string }>(
          (resolve) => {
            chrome.runtime.sendMessage({
              type: "UPLOAD_TO_GIST",
              content: payload,
            }, resolve);
          },
        );

        if (!res.success) {
          throw new Error(res.error || "Không thể tạo Gist trên GitHub");
        }

        await setMasterPassword(password);
        await setSessionUnlocked(true);
        setStore({
          vaultItems: [],
          isLocked: false,
          view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
          sessionUnlocked: true,
        });
        chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});
        return { success: true };
      }

      // 3. Sử dụng salt (được khôi phục từ Gist hoặc có sẵn) để tạo khóa
      const key = await getOrDeriveKey(password, saltBase64);

      if (!hasExistingGist || !existingGistContent) {
        // Có salt nhưng không có Gist (có thể bị xóa trên GitHub), tạo lại Gist trống
        const encrypted = await encryptData(JSON.stringify([]), key);
        const payload = JSON.stringify({
          salt: saltBase64,
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
        });

        const uploadRes = await new Promise<
          { success: boolean; error?: string }
        >((resolve) => {
          chrome.runtime.sendMessage({
            type: "UPLOAD_TO_GIST",
            content: payload,
          }, resolve);
        });

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
        chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});
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
      setStore({
        vaultItems: items,
        isLocked: false,
        view: targetView,
        selectedItem,
        sessionUnlocked: true,
      });
      chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});

      return { success: true };
    } catch (err) {
      console.error("[Store] Unlock failed:", err);
      clearDerivedKey();
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Mật khẩu Master không đúng" };
    }
  },

  async setupGithub(
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    const res = await new Promise<
      {
        success: boolean;
        username?: string;
        avatarUrl?: string;
        error?: string;
      }
    >((resolve) => {
      chrome.runtime.sendMessage({ type: "VALIDATE_TOKEN", token }, resolve);
    });

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
  },

  async lock() {
    await clearMasterPassword();
    clearDerivedKey();
    setStore({
      vaultItems: [],
      isLocked: true,
      view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
    });
  },

  async logout() {
    await clearMasterPassword();
    await setSessionUnlocked(false);
    clearDerivedKey();
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
  },

  async acceptWelcome() {
    await updateSettings({ welcomeAccepted: true });
    setStore({
      welcomeAccepted: true,
      view: View.Login,
    });
  },

  async saveItem(
    item: Partial<VaultItem>,
  ): Promise<{ success: boolean; error?: string }> {
    storeActions.setGlobalLoading(true);
    try {
      const password = await getMasterPassword();
      if (!password || !store.salt) throw new Error("Vault is locked");
      const key = await getOrDeriveKey(password, store.salt);

      let updatedList: VaultItem[];
      const now = new Date().toISOString();

      if (item.id) {
        // Edit
        updatedList = store.vaultItems.map((v) => {
          if (v.id !== item.id) return v;

          const targetType = item.type !== undefined ? item.type : v.type;
          if (targetType === VaultItemType.SecureNote) {
            return {
              id: v.id,
              type: VaultItemType.SecureNote,
              name: item.name !== undefined ? item.name : v.name,
              notes: item.notes !== undefined ? item.notes : v.notes,
              favorite: item.favorite !== undefined
                ? item.favorite
                : v.favorite,
              reprompt: item.reprompt !== undefined
                ? item.reprompt
                : (v.reprompt !== undefined ? v.reprompt : 0),
              fields: item.fields !== undefined ? item.fields : v.fields,
              creationDate: v.creationDate,
              revisionDate: now,
            };
          }

          if (targetType === VaultItemType.Card) {
            const itemCard = "card" in item ? item.card : undefined;
            if (!isCardVaultItem(v)) {
              return {
                id: v.id,
                type: VaultItemType.Card,
                name: item.name !== undefined ? item.name : v.name,
                notes: item.notes !== undefined ? item.notes : v.notes,
                favorite: item.favorite !== undefined
                  ? item.favorite
                  : v.favorite,
                reprompt: item.reprompt !== undefined
                  ? item.reprompt
                  : (v.reprompt !== undefined ? v.reprompt : 0),
                fields: item.fields !== undefined ? item.fields : v.fields,
                card: itemCard || {
                  cardholderName: "",
                  brand: "",
                  number: "",
                  expMonth: "",
                  expYear: "",
                  code: "",
                },
                creationDate: v.creationDate,
                revisionDate: now,
              };
            }
            return {
              id: v.id,
              type: VaultItemType.Card,
              name: item.name !== undefined ? item.name : v.name,
              notes: item.notes !== undefined ? item.notes : v.notes,
              favorite: item.favorite !== undefined
                ? item.favorite
                : v.favorite,
              reprompt: item.reprompt !== undefined
                ? item.reprompt
                : (v.reprompt !== undefined ? v.reprompt : 0),
              fields: item.fields !== undefined ? item.fields : v.fields,
              card: itemCard !== undefined ? itemCard : v.card,
              creationDate: v.creationDate,
              revisionDate: now,
            };
          }

          const itemLogin = "login" in item ? item.login : undefined;

          // If changing type from SecureNote to Login, or v is not typed as Login yet
          if (!isLoginVaultItem(v)) {
            return {
              id: v.id,
              type: VaultItemType.Login,
              name: item.name !== undefined ? item.name : v.name,
              notes: item.notes !== undefined ? item.notes : v.notes,
              favorite: item.favorite !== undefined
                ? item.favorite
                : v.favorite,
              reprompt: item.reprompt !== undefined
                ? item.reprompt
                : (v.reprompt !== undefined ? v.reprompt : 0),
              fields: item.fields !== undefined ? item.fields : v.fields,
              login: itemLogin || {
                username: "",
                password: "",
                totp: "",
                uris: [],
                fido2Credentials: [],
              },
              creationDate: v.creationDate,
              revisionDate: now,
            };
          }

          // v is safely narrowed to LoginVaultItem, so v.login is guaranteed to exist
          return {
            id: v.id,
            type: VaultItemType.Login,
            name: item.name !== undefined ? item.name : v.name,
            notes: item.notes !== undefined ? item.notes : v.notes,
            favorite: item.favorite !== undefined ? item.favorite : v.favorite,
            reprompt: item.reprompt !== undefined
              ? item.reprompt
              : (v.reprompt !== undefined ? v.reprompt : 0),
            fields: item.fields !== undefined ? item.fields : v.fields,
            login: itemLogin !== undefined ? itemLogin : v.login,
            creationDate: v.creationDate,
            revisionDate: now,
          };
        });
      } else {
        // New
        const targetType = item.type || VaultItemType.Login;
        if (targetType === VaultItemType.SecureNote) {
          const newItem: SecureNoteVaultItem = {
            id: crypto.randomUUID(),
            type: VaultItemType.SecureNote,
            name: item.name || "Chưa đặt tên",
            notes: item.notes,
            favorite: item.favorite || false,
            reprompt: item.reprompt || 0,
            fields: item.fields || [],
            creationDate: now,
            revisionDate: now,
          };
          updatedList = [...store.vaultItems, newItem];
        } else if (targetType === VaultItemType.Card) {
          const itemCard = "card" in item ? item.card : undefined;
          const newItem: CardVaultItem = {
            id: crypto.randomUUID(),
            type: VaultItemType.Card,
            name: item.name || "Chưa đặt tên",
            notes: item.notes,
            favorite: item.favorite || false,
            reprompt: item.reprompt || 0,
            fields: item.fields || [],
            card: itemCard || {
              cardholderName: "",
              brand: "",
              number: "",
              expMonth: "",
              expYear: "",
              code: "",
            },
            creationDate: now,
            revisionDate: now,
          };
          updatedList = [...store.vaultItems, newItem];
        } else {
          const itemLogin = "login" in item ? item.login : undefined;
          const newItem: LoginVaultItem = {
            id: crypto.randomUUID(),
            type: VaultItemType.Login,
            name: item.name || "Chưa đặt tên",
            notes: item.notes,
            favorite: item.favorite || false,
            reprompt: item.reprompt || 0,
            fields: item.fields || [],
            login: itemLogin || {
              username: "",
              password: "",
              totp: "",
              uris: [],
              fido2Credentials: [],
            },
            creationDate: now,
            revisionDate: now,
          };
          updatedList = [...store.vaultItems, newItem];
        }
      }

      // Validate via Zod
      const validatedList = VaultListSchema.parse(updatedList);

      // Encrypt and upload
      const encrypted = await encryptData(JSON.stringify(validatedList), key);
      const payload = JSON.stringify({
        salt: store.salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      const res = await new Promise<{ success: boolean; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage({
            type: "UPLOAD_TO_GIST",
            content: payload,
          }, resolve);
        },
      );

      if (!res.success) {
        throw new Error(res.error || "Lỗi đồng bộ lên GitHub Gist");
      }

      setStore("vaultItems", reconcile(validatedList));
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi lưu tài khoản" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  async deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
    storeActions.setGlobalLoading(true);
    try {
      const password = await getMasterPassword();
      if (!password || !store.salt) throw new Error("Vault is locked");
      const key = await getOrDeriveKey(password, store.salt);

      const filtered = store.vaultItems.filter((v) => v.id !== id);
      const validatedList = VaultListSchema.parse(filtered);

      // Encrypt and upload
      const encrypted = await encryptData(JSON.stringify(validatedList), key);
      const payload = JSON.stringify({
        salt: store.salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      const res = await new Promise<{ success: boolean; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage({
            type: "UPLOAD_TO_GIST",
            content: payload,
          }, resolve);
        },
      );

      if (!res.success) {
        throw new Error(res.error || "Lỗi đồng bộ lên GitHub Gist");
      }

      setStore("vaultItems", reconcile(validatedList));
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi xóa tài khoản" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  async changeMasterPassword(
    currentPass: string,
    newPass: string,
  ): Promise<{ success: boolean; error?: string }> {
    storeActions.setGlobalLoading(true);
    try {
      const activePass = await getMasterPassword();
      if (currentPass !== activePass) {
        return { success: false, error: "Mật khẩu Master hiện tại không đúng" };
      }
      if (!newPass.trim()) {
        return {
          success: false,
          error: "Mật khẩu Master mới không được để trống",
        };
      }

      // 1. Generate a new salt
      const rawSalt = generateSalt();
      const newSaltBase64 = btoa(String.fromCharCode(...rawSalt));

      // 2. Derive new key
      const newKey = await deriveKey(newPass, rawSalt);

      // 3. Encrypt existing vault items with the new key
      const encrypted = await encryptData(
        JSON.stringify(store.vaultItems),
        newKey,
      );
      const payload = JSON.stringify({
        salt: newSaltBase64,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      // 4. Upload to Gist
      const res = await new Promise<{ success: boolean; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage({
            type: "UPLOAD_TO_GIST",
            content: payload,
          }, resolve);
        },
      );

      if (!res.success) {
        throw new Error(res.error || "Lỗi đồng bộ mật khẩu mới lên Gist");
      }

      // 5. Update local state, session, and settings
      setDerivedKey(newKey); // Update in-memory key reference
      await setMasterPassword(newPass);
      await updateSettings({ salt: newSaltBase64 });
      setStore({
        salt: newSaltBase64,
      });

      return { success: true };
    } catch (err) {
      console.error("[Store] Change Master Password failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi đổi mật khẩu" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  async clearVault(): Promise<{ success: boolean; error?: string }> {
    storeActions.setGlobalLoading(true);
    try {
      const gistId = store.gistId;
      if (gistId) {
        const res = await new Promise<{ success: boolean; error?: string }>(
          (resolve) => {
            chrome.runtime.sendMessage({
              type: "DELETE_GIST",
              content: gistId,
            }, resolve);
          },
        );

        if (!res.success) {
          throw new Error(res.error || "Lỗi xóa Gist trên GitHub");
        }
      }

      // Reset local settings
      await updateSettings({ gistId: "", lastSync: 0 });
      setStore({
        gistId: "",
        vaultItems: [],
        lastSync: 0,
      });
      return { success: true };
    } catch (err) {
      console.error("[Store] Clear vault failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi xóa toàn bộ tài khoản" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  async syncVault(): Promise<{ success: boolean; error?: string }> {
    setStore("syncing", true);
    setStore("syncError", "");
    storeActions.setGlobalLoading(true, t("vault_syncing"));
    try {
      const password = await getMasterPassword();
      if (!password || !store.salt) throw new Error("Vault is locked");
      const key = await getOrDeriveKey(password, store.salt);

      const res = await new Promise<
        { success: boolean; content?: string; error?: string }
      >((resolve) => {
        chrome.runtime.sendMessage({ type: "DOWNLOAD_FROM_GIST" }, resolve);
      });

      if (!res.success) {
        throw new Error(res.error || "Không thể tải dữ liệu Gist");
      }

      const payload = JSON.parse(res.content || "{}");
      const decrypted = await decryptData(payload.ciphertext, payload.iv, key);
      const items = VaultListSchema.parse(JSON.parse(decrypted));

      setStore("vaultItems", reconcile(items));
      setStore("syncing", false);
      return { success: true };
    } catch (err) {
      setStore("syncing", false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStore("syncError", errMsg || "Lỗi đồng bộ");
      return { success: false, error: errMsg || "Lỗi đồng bộ" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  async importJsonData(
    jsonString: string,
  ): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    storeActions.setGlobalLoading(true, t("vault_importing"));
    try {
      const importRes = parseAndValidateImportJson(
        jsonString,
        store.vaultItems,
      );
      if (!importRes.success) {
        throw new Error(importRes.error);
      }

      const password = await getMasterPassword();
      if (!password || !store.salt) throw new Error("Vault is locked");
      const key = await getOrDeriveKey(password, store.salt);

      const encrypted = await encryptData(
        JSON.stringify(importRes.combinedItems),
        key,
      );
      const payload = JSON.stringify({
        salt: store.salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      console.log(`[${APP_NAME} Import] Dang tai len Gist...`);
      const uploadRes = await new Promise<{ success: boolean; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage({
            type: "UPLOAD_TO_GIST",
            content: payload,
          }, resolve);
        },
      );

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "Loi dong bo len Gist");
      }

      setStore("vaultItems", reconcile(importRes.combinedItems));
      console.log(`[${APP_NAME} Import] Import HOAN TAT thanh cong!`);
      return { success: true, importedCount: importRes.importedCount };
    } catch (err) {
      console.error(`[${APP_NAME} Import] Loi import:`, err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Loi nhap file JSON" };
    } finally {
      storeActions.setGlobalLoading(false);
    }
  },

  navigate(newView: View) {
    const oldView = store.view;
    const oldDepth = viewDepths[oldView] ?? 0;
    const newDepth = viewDepths[newView] ?? 0;
    let direction: "forward" | "backward" | "none" = "none";
    if (newDepth > oldDepth) {
      direction = "forward";
    } else if (newDepth < oldDepth) {
      direction = "backward";
    }

    // Toggle class suffix to force animation re-trigger
    transitionToggle = !transitionToggle;
    const suffix = transitionToggle ? "a" : "b";
    const transitionClass = direction === "none"
      ? ""
      : `slide-${direction}-${suffix}`;

    setStore({
      view: newView,
      transitionClass,
    });
  },

  selectItem(item: VaultItem | null) {
    setStore("selectedItem", item);
    if (item) {
      transitionToggle = !transitionToggle;
      const suffix = transitionToggle ? "a" : "b";
      setStore({
        view: View.ItemDetail,
        transitionClass: `slide-forward-${suffix}`,
      });
    }
  },

  async openItem(item: VaultItem, targetView: View = View.ItemDetail) {
    if (item.reprompt === 1) {
      const authorized = await storeActions.requestReprompt();
      if (!authorized) return;
    }
    setStore("selectedItem", item);
    transitionToggle = !transitionToggle;
    const suffix = transitionToggle ? "a" : "b";
    setStore({
      view: targetView,
      transitionClass: `slide-forward-${suffix}`,
    });
  },

  requestReprompt(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      setStore("repromptModal", {
        isOpen: true,
        resolve,
      });
    });
  },

  resolveReprompt(success: boolean) {
    const modal = store.repromptModal;
    if (modal.resolve) {
      modal.resolve(success);
    }
    setStore("repromptModal", {
      isOpen: false,
      resolve: null,
    });
  },

  showToast(message: string, type: ToastType = "success") {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setStore({ toastMessage: message, toastType: type });
    toastTimeoutId = setTimeout(() => {
      setStore("toastMessage", "");
    }, 2000);
  },

  setGlobalLoading(val: boolean, text = "") {
    setStore({ globalLoading: val, globalLoadingText: text });
  },

  confirm(
    title: string,
    message: string,
    type: ConfirmType = "info",
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      setStore("confirmModal", {
        isOpen: true,
        title,
        message,
        type,
        resolve,
      });
    });
  },

  resolveConfirm(result: boolean) {
    const modal = store.confirmModal;
    if (modal.resolve) {
      modal.resolve(result);
    }
    setStore("confirmModal", {
      isOpen: false,
      title: "",
      message: "",
      type: "info",
      resolve: null,
    });
  },

  async updateLanguage(lang: "en" | "vi") {
    setStore("language", lang);
    setLanguage(lang === "vi" ? SupportLanguage.Vi : SupportLanguage.En);
    await updateSettings({ language: lang });
  },

  async updateTheme(newTheme: "dark" | "light") {
    setStore("theme", newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set({
        [`${APP_NAME.toLowerCase()}_theme`]: newTheme,
      });
    }
  },

  async setPinUnlock(
    pin: string,
    requireRestart: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    storeActions.setGlobalLoading(true);
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
      storeActions.setGlobalLoading(false);
    }
  },

  async disablePinUnlock(): Promise<void> {
    await updateSettings({
      pinUnlockEnabled: false,
      pinUnlockValue: "",
      pinUnlockIv: "",
      pinUnlockSalt: "",
    });
  },

  async updateSessionTimeout(
    timeout: string,
    action: VaultTimeoutAction,
  ): Promise<void> {
    await updateSettings({
      vaultTimeout: timeout,
      vaultTimeoutAction: action,
    });
    chrome.runtime.sendMessage({ type: "RESET_TIMEOUT" }).catch(() => {});
  },
};
