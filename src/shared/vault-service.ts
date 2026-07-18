import { setStore, store } from "./store.ts";
import { reconcile } from "solid-js/store";
import {
  getMasterPassword,
  setMasterPassword,
  updateSettings,
} from "./storage.ts";
import {
  decryptData,
  deriveKey,
  generateSalt,
  getOrDeriveKey,
  setDerivedKey,
} from "./crypto.ts";
import {
  type VaultItem,
  VaultItemSchema,
  VaultItemType,
  VaultListSchema,
} from "./types.ts";
import { t } from "./i18n.ts";
import {
  parseAndValidateBitwardenCsv,
  parseAndValidateBrowserCsv,
  parseAndValidateImportJson,
} from "./import-export.ts";
import { syncVaultToGist } from "./sync-utils.ts";
import { setGlobalLoading } from "./ui-service.ts";
import { APP_NAME } from "./constants.ts";

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
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

        const targetType = item.type !== undefined
          ? Number(item.type)
          : Number(v.type);

        const baseItem: Record<string, unknown> = {
          id: v.id,
          type: targetType,
          name: item.name !== undefined ? item.name : v.name,
          notes: item.notes !== undefined ? item.notes : v.notes,
          favorite: item.favorite !== undefined ? item.favorite : v.favorite,
          reprompt: item.reprompt !== undefined
            ? item.reprompt
            : (v.reprompt !== undefined ? v.reprompt : 0),
          fields: item.fields !== undefined ? item.fields : v.fields,
          creationDate: v.creationDate,
          revisionDate: now,
        };

        if (targetType === VaultItemType.Login) {
          baseItem.login = "login" in item
            ? item.login
            : ("login" in v ? v.login : {
              username: "",
              password: "",
              totp: "",
              uris: [],
              fido2Credentials: [],
            });
        } else if (targetType === VaultItemType.Card) {
          baseItem.card = "card" in item ? item.card : ("card" in v ? v.card : {
            cardholderName: "",
            brand: "",
            number: "",
            expMonth: "",
            expYear: "",
            code: "",
          });
        } else if (targetType === VaultItemType.Identity) {
          baseItem.identity = "identity" in item
            ? item.identity
            : ("identity" in v ? v.identity : {
              title: "",
              firstName: "",
              middleName: "",
              lastName: "",
              username: "",
              company: "",
              ssn: "",
              passportNumber: "",
              licenseNumber: "",
              email: "",
              phone: "",
              address1: "",
              address2: "",
              address3: "",
              city: "",
              state: "",
              postalCode: "",
              country: "",
            });
        } else if (targetType === VaultItemType.SshKey) {
          baseItem.sshKey = "sshKey" in item
            ? item.sshKey
            : ("sshKey" in v ? v.sshKey : {
              privateKey: "",
              publicKey: "",
              keyFingerprint: "",
            });
        }

        return VaultItemSchema.parse(baseItem);
      });
    } else {
      // New
      const targetType = item.type !== undefined
        ? Number(item.type)
        : VaultItemType.Login;
      const baseItem: Record<string, unknown> = {
        id: crypto.randomUUID(),
        type: targetType,
        name: item.name || "Chưa đặt tên",
        notes: item.notes || "",
        favorite: item.favorite || false,
        reprompt: item.reprompt || 0,
        fields: item.fields || [],
        creationDate: now,
        revisionDate: now,
      };

      if (targetType === VaultItemType.Login) {
        baseItem.login = "login" in item ? item.login : {
          username: "",
          password: "",
          totp: "",
          uris: [],
          fido2Credentials: [],
        };
      } else if (targetType === VaultItemType.Card) {
        baseItem.card = "card" in item ? item.card : {
          cardholderName: "",
          brand: "",
          number: "",
          expMonth: "",
          expYear: "",
          code: "",
        };
      } else if (targetType === VaultItemType.Identity) {
        baseItem.identity = "identity" in item ? item.identity : {
          title: "",
          firstName: "",
          middleName: "",
          lastName: "",
          username: "",
          company: "",
          ssn: "",
          passportNumber: "",
          licenseNumber: "",
          email: "",
          phone: "",
          address1: "",
          address2: "",
          address3: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        };
      } else if (targetType === VaultItemType.SshKey) {
        baseItem.sshKey = "sshKey" in item ? item.sshKey : {
          privateKey: "",
          publicKey: "",
          keyFingerprint: "",
        };
      }

      updatedList = [...store.vaultItems, VaultItemSchema.parse(baseItem)];
    }

    const uploadRes = await syncVaultToGist(updatedList, key, store.salt);

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ lên GitHub Gist");
    }

    setStore("vaultItems", reconcile(uploadRes.validatedList || updatedList));
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi lưu tài khoản" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function deleteItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
  try {
    const password = await getMasterPassword();
    if (!password || !store.salt) throw new Error("Vault is locked");
    const key = await getOrDeriveKey(password, store.salt);

    const filtered = store.vaultItems.filter((v) => v.id !== id);
    const uploadRes = await syncVaultToGist(filtered, key, store.salt);

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ lên GitHub Gist");
    }

    setStore("vaultItems", reconcile(uploadRes.validatedList || filtered));
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi xóa tài khoản" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function changeMasterPassword(
  currentPass: string,
  newPass: string,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
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

    const uploadRes = await syncVaultToGist(
      store.vaultItems,
      newKey,
      newSaltBase64,
    );

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ mật khẩu mới lên Gist");
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
    setGlobalLoading(false);
  }
}

export async function clearVault(): Promise<
  { success: boolean; error?: string }
> {
  setGlobalLoading(true);
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
    setGlobalLoading(false);
  }
}

export async function syncVault(): Promise<
  { success: boolean; error?: string }
> {
  setStore("syncing", true);
  setStore("syncError", "");
  setGlobalLoading(true, t("vault_syncing"));
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
    setGlobalLoading(false);
  }
}

export async function importJsonData(
  jsonString: string,
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  setGlobalLoading(true, t("vault_importing"));
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

    console.log(`[${APP_NAME} Import] Dang tai len Gist...`);
    const uploadRes = await syncVaultToGist(
      importRes.combinedItems,
      key,
      store.salt,
    );

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Loi dong bo len Gist");
    }

    setStore(
      "vaultItems",
      reconcile(uploadRes.validatedList || importRes.combinedItems),
    );
    console.log(`[${APP_NAME} Import] Import HOAN TAT thanh cong!`);
    return { success: true, importedCount: importRes.importedCount };
  } catch (err) {
    console.error(`[${APP_NAME} Import] Loi import:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Loi nhap file JSON" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function importCsvData(
  csvString: string,
  type: "browser" | "bitwarden",
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  setGlobalLoading(true, t("vault_importing"));
  try {
    const importRes = type === "bitwarden"
      ? parseAndValidateBitwardenCsv(csvString, store.vaultItems)
      : parseAndValidateBrowserCsv(csvString, store.vaultItems);

    if (!importRes.success) {
      throw new Error(importRes.error);
    }

    const password = await getMasterPassword();
    if (!password || !store.salt) throw new Error("Vault is locked");
    const key = await getOrDeriveKey(password, store.salt);

    console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
    const uploadRes = await syncVaultToGist(
      importRes.combinedItems,
      key,
      store.salt,
    );

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ lên Gist");
    }

    setStore(
      "vaultItems",
      reconcile(uploadRes.validatedList || importRes.combinedItems),
    );
    console.log(`[${APP_NAME} Import] Import CSV HOÀN TẤT thành công!`);
    return { success: true, importedCount: importRes.importedCount };
  } catch (err) {
    console.error(`[${APP_NAME} Import] Lỗi import CSV:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  } finally {
    setGlobalLoading(false);
  }
}
