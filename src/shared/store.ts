import { createStore } from "solid-js/store";
import {
  clearMasterPassword,
  getAllSettings,
  getMasterPassword,
  type GithubUser,
  setMasterPassword,
  subscribeToSettings,
  updateSettings,
} from "./storage.ts";
import { decryptData, deriveKey, encryptData, generateSalt } from "./crypto.ts";
import {
  ImportArraySchema,
  type ImportItem,
  ImportObjectSchema,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
  View,
} from "./types.ts";
export { View };

export interface AppStore {
  githubToken: string;
  gistId: string;
  salt: string;
  cachedGithubUser: GithubUser | null;
  lastSync: number;
  oauthClientId: string;
  oauthWorkerUrl: string;

  isLoaded: boolean;
  isLocked: boolean;
  view: View;
  vaultItems: VaultItem[];
  selectedItem: VaultItem | null;

  syncing: boolean;
  syncError: string;

  // Global Toast States
  toastMessage: string;
  toastType: "success" | "error" | "info";

  // Reusable Confirmation Modal States
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger";
    resolve: ((value: boolean) => void) | null;
  };
}

const [store, setStore] = createStore<AppStore>({
  githubToken: "",
  gistId: "",
  salt: "",
  cachedGithubUser: null,
  lastSync: 0,
  oauthClientId: "Ov23liRxwWqLXD5AOkNW",
  oauthWorkerUrl: "https://gistwarden.uongsuadaubung.workers.dev",

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
});

export { store };

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Derived cryptokey helper
let derivedCryptoKey: CryptoKey | null = null;

async function getOrDeriveKey(
  password: string,
  saltBase64: string,
): Promise<CryptoKey> {
  if (derivedCryptoKey) return derivedCryptoKey;

  // Convert salt from base64
  const binaryString = atob(saltBase64);
  const salt = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    salt[i] = binaryString.charCodeAt(i);
  }

  derivedCryptoKey = await deriveKey(password, salt);
  return derivedCryptoKey;
}

function isLoginVaultItem(item: VaultItem): item is LoginVaultItem {
  return item.type === VaultItemType.Login;
}

export const storeActions = {
  async init() {
    console.log("[Store] Initializing Gistwarden Store...");
    const settings = await getAllSettings();
    const masterPassword = await getMasterPassword();

    setStore({
      githubToken: settings.githubToken,
      gistId: settings.gistId,
      salt: settings.salt,
      cachedGithubUser: settings.cachedGithubUser,
      lastSync: settings.lastSync,
      oauthClientId: settings.oauthClientId,
      oauthWorkerUrl: settings.oauthWorkerUrl,
    });

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
          setStore({
            vaultItems: items,
            isLocked: false,
            view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
          });
        } else {
          // If downloading fails but we have setup, it could be network issue or empty gist
          setStore({
            isLocked: false,
            view: isFido2Prompt ? View.Fido2Prompt : View.Vault,
          });
        }
      } catch (err) {
        console.error("[Store] Decryption on load failed:", err);
        setStore("isLocked", true);
        if (!isFido2Prompt) setStore("view", View.Login);
      }
    } else {
      setStore("isLocked", true);
      if (!isFido2Prompt) setStore("view", View.Login);
    }

    // Subscribe to settings changes
    subscribeToSettings((newSettings) => {
      setStore({
        githubToken: newSettings.githubToken,
        gistId: newSettings.gistId,
        salt: newSettings.salt,
        cachedGithubUser: newSettings.cachedGithubUser,
        lastSync: newSettings.lastSync,
        oauthClientId: newSettings.oauthClientId,
        oauthWorkerUrl: newSettings.oauthWorkerUrl,
      });
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

      derivedCryptoKey = null; // Reset

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
        setStore({
          vaultItems: [],
          isLocked: false,
          view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
        });
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
        setStore({
          vaultItems: [],
          isLocked: false,
          view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
        });
        return { success: true };
      }

      // 4. Giải mã dữ liệu két sắt từ Gist
      const payload = JSON.parse(existingGistContent);
      const decrypted = await decryptData(payload.ciphertext, payload.iv, key);
      const items = VaultListSchema.parse(JSON.parse(decrypted));

      await setMasterPassword(password);
      setStore({
        vaultItems: items,
        isLocked: false,
        view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault,
      });

      return { success: true };
    } catch (err) {
      console.error("[Store] Unlock failed:", err);
      derivedCryptoKey = null;
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
    derivedCryptoKey = null;
    setStore({
      vaultItems: [],
      isLocked: true,
      view: store.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
    });
  },

  async logout() {
    await clearMasterPassword();
    derivedCryptoKey = null;
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
    });
  },

  async saveItem(
    item: Partial<VaultItem>,
  ): Promise<{ success: boolean; error?: string }> {
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
              favorite: item.favorite !== undefined ? item.favorite : v.favorite,
              fields: item.fields !== undefined ? item.fields : v.fields,
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
              favorite: item.favorite !== undefined ? item.favorite : v.favorite,
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
            fields: item.fields || [],
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

      setStore("vaultItems", validatedList);
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi lưu tài khoản" };
    }
  },

  async deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
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

      setStore("vaultItems", validatedList);
      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi xóa tài khoản" };
    }
  },

  async changeMasterPassword(
    currentPass: string,
    newPass: string,
  ): Promise<{ success: boolean; error?: string }> {
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
      derivedCryptoKey = newKey; // Update in-memory key reference
      await setMasterPassword(newPass);
      await updateSettings({ salt: newSaltBase64 });
      setStore("salt", newSaltBase64);

      return { success: true };
    } catch (err) {
      console.error("[Store] Change Master Password failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Lỗi đổi mật khẩu" };
    }
  },

  async clearVault(): Promise<{ success: boolean; error?: string }> {
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
    }
  },

  async syncVault(): Promise<{ success: boolean; error?: string }> {
    setStore("syncing", true);
    setStore("syncError", "");
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

      setStore("vaultItems", items);
      setStore("syncing", false);
      return { success: true };
    } catch (err) {
      setStore("syncing", false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStore("syncError", errMsg || "Lỗi đồng bộ");
      return { success: false, error: errMsg || "Lỗi đồng bộ" };
    }
  },

  async importJsonData(
    jsonString: string,
  ): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    try {
      console.log("[Gistwarden Import] Bat dau doc file JSON...");
      const parsed = JSON.parse(jsonString);
      let itemsToImport: ImportItem[] = [];

      // Validate structure using Zod
      console.log("[Gistwarden Import] Thu parse dang Array...");
      const parseArray = ImportArraySchema.safeParse(parsed);
      if (parseArray.success) {
        console.log("[Gistwarden Import] Parse dang Array thanh cong!");
        itemsToImport = parseArray.data;
      } else {
        console.log(
          "[Gistwarden Import] Parse dang Array that bai:",
          parseArray.error.issues,
        );
        console.log(
          "[Gistwarden Import] Thu parse dang Object ({ items: [...] })...",
        );
        const parseObject = ImportObjectSchema.safeParse(parsed);
        if (parseObject.success) {
          console.log("[Gistwarden Import] Parse dang Object thanh cong!");
          itemsToImport = parseObject.data.items;
        } else {
          console.log(
            "[Gistwarden Import] Parse dang Object that bai:",
            parseObject.error.issues,
          );
          const errorMsg = parseArray.error
            ? parseArray.error.issues[0].message
            : "Dinh dang JSON khong hop le";
          throw new Error(`Xac thuc Zod that bai: ${errorMsg}`);
        }
      }

      console.log(
        `[Gistwarden Import] Da tim thay ${itemsToImport.length} tai khoan can import.`,
      );

      // Convert imported items to VaultItems
      const now = new Date().toISOString();
      const newVaultItems: VaultItem[] = itemsToImport.map((item, index) => {
        const isLogin = item.type === VaultItemType.Login;
        const loginData = isLogin ? item.login : undefined;
        const rawFido = loginData?.fido2Credentials;
        console.log(
          `[Gistwarden Import] Tai khoan thu ${index + 1} ("${item.name}"):`,
          {
            hasLogin: !!loginData,
            rawFidoCredentialsCount: rawFido?.length || 0,
            rawFidoData: rawFido,
          },
        );

        if (item.type === VaultItemType.SecureNote) {
          return {
            id: crypto.randomUUID(),
            type: VaultItemType.SecureNote,
            name: item.name,
            notes: item.notes || "",
            favorite: item.favorite,
            fields: item.fields?.map((f) => ({
              type: f.type ?? 0,
              name: f.name || "",
              value: f.value || "",
            })) || [],
            creationDate: now,
            revisionDate: now,
          };
        } else {
          return {
            id: crypto.randomUUID(),
            type: VaultItemType.Login,
            name: item.name,
            notes: item.notes || "",
            favorite: item.favorite,
            fields: item.fields?.map((f) => ({
              type: f.type ?? 0,
              name: f.name || "",
              value: f.value || "",
            })) || [],
            login: {
              username: item.login.username || "",
              password: item.login.password || "",
              totp: item.login.totp || "",
              uris: item.login.uris?.map((u) => ({ uri: u.uri })) || [],
              fido2Credentials: item.login.fido2Credentials || [],
            },
            creationDate: now,
            revisionDate: now,
          };
        }
      });

      console.log(
        "[Gistwarden Import] Bat dau kiem tra va luu vao danh sach chung...",
      );
      const combinedItems = [...store.vaultItems, ...newVaultItems];
      const validatedList = VaultListSchema.parse(combinedItems);

      const password = await getMasterPassword();
      if (!password || !store.salt) throw new Error("Vault is locked");
      const key = await getOrDeriveKey(password, store.salt);

      const encrypted = await encryptData(JSON.stringify(validatedList), key);
      const payload = JSON.stringify({
        salt: store.salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      console.log("[Gistwarden Import] Dang tai len Gist...");
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

      setStore("vaultItems", validatedList);
      console.log("[Gistwarden Import] Import HOAN TAT thanh cong!");
      return { success: true, importedCount: newVaultItems.length };
    } catch (err) {
      console.error("[Gistwarden Import] Loi import:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg || "Loi nhap file JSON" };
    }
  },

  async saveOauthConfig(clientId: string, workerUrl: string): Promise<void> {
    await updateSettings({
      oauthClientId: clientId,
      oauthWorkerUrl: workerUrl,
    });
    setStore({
      oauthClientId: clientId,
      oauthWorkerUrl: workerUrl,
    });
  },

  navigate(newView: View) {
    setStore("view", newView);
  },

  selectItem(item: VaultItem | null) {
    setStore("selectedItem", item);
    if (item) {
      setStore("view", View.ItemDetail);
    }
  },

  showToast(message: string, type: "success" | "error" | "info" = "success") {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setStore({ toastMessage: message, toastType: type });
    toastTimeoutId = setTimeout(() => {
      setStore("toastMessage", "");
    }, 2000);
  },

  confirm(
    title: string,
    message: string,
    type: "info" | "warning" | "danger" = "info",
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
};
