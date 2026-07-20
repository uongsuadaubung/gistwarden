import { updateSettings } from "@/core/storage.ts";
import { getSessionKey } from "@/core/crypto.ts";
import { setStore, store } from "@/core/store.ts";
import { reconcile } from "solid-js/store";
import {
  type VaultItem,
  VaultItemSchema,
  VaultItemType,
} from "@/core/types.ts";
import { SyncResponseSchema } from "@/features/sync/sync-utils.ts";
import { sendMessageToBackground } from "@/core/messaging.ts";

import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";
import { MSG_DELETE_GIST, STORE_KEY_VAULT_ITEMS } from "@/core/constants.ts";

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
  try {
    const key = await getSessionKey();
    if (!key || !store.salt) throw new Error("Vault is locked");

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

    setStore(
      STORE_KEY_VAULT_ITEMS,
      reconcile(uploadRes.validatedList || updatedList),
    );
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
    const key = await getSessionKey();
    if (!key || !store.salt) throw new Error("Vault is locked");

    const filtered = store.vaultItems.filter((v) => v.id !== id);
    const uploadRes = await syncVaultToGist(filtered, key, store.salt);

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ lên GitHub Gist");
    }

    setStore(
      STORE_KEY_VAULT_ITEMS,
      reconcile(uploadRes.validatedList || filtered),
    );
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi xóa tài khoản" };
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
      const rawRes = await sendMessageToBackground({
        type: MSG_DELETE_GIST,
        content: gistId,
      }).catch(() => null);

      const res = SyncResponseSchema.parse(rawRes);

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
