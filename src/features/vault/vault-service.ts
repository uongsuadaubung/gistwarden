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
import { MSG_DELETE_GIST, STORE_KEY_VAULT_ITEMS } from "@/core/constants.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { z } from "zod";

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !store.salt) {
    return err("login_title_locked");
  }

  let updatedList: VaultItem[];
  const now = new Date().toISOString();

  if (item.id) {
    // Edit
    const mappedItems = store.vaultItems.map((v) => {
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

      return baseItem;
    });

    const parseResult = z.array(VaultItemSchema).safeParse(mappedItems);
    if (!parseResult.success) {
      return err("edit_error_save_failed");
    }
    updatedList = parseResult.data;
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

    const parseResult = VaultItemSchema.safeParse(baseItem);
    if (!parseResult.success) {
      return err("edit_error_save_failed");
    }

    updatedList = [...store.vaultItems, parseResult.data];
  }

  const uploadRes = await syncVaultToGist(updatedList, key, store.salt);
  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setStore(
    STORE_KEY_VAULT_ITEMS,
    reconcile(validatedList),
  );
  return ok();
}

export async function deleteItem(
  id: string,
): Promise<Result<void, TranslationKey>> {
  return await deleteVaultItems([id]);
}

export async function deleteVaultItems(
  ids: string[],
): Promise<Result<void, TranslationKey>> {
  if (ids.length === 0) {
    return ok();
  }
  const key = await getSessionKey();
  if (!key || !store.salt) {
    return err("login_title_locked");
  }

  const idSet = new Set(ids);
  const filtered = store.vaultItems.filter((v) => !idSet.has(v.id));
  const uploadRes = await syncVaultToGist(filtered, key, store.salt);

  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setStore(
    STORE_KEY_VAULT_ITEMS,
    reconcile(validatedList),
  );
  return ok();
}

export async function clearVault(): Promise<Result<void, TranslationKey>> {
  const gistId = store.gistId;
  if (gistId) {
    const sendResult = await sendMessageToBackground({
      type: MSG_DELETE_GIST,
      content: gistId,
    });
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }

    const parseRes = SyncResponseSchema.safeParse(sendResult.value);
    if (!parseRes.success) {
      return err("settings_clear_vault_fail");
    }
    const res = parseRes.data;

    if (!res.success) {
      return err("settings_clear_vault_fail");
    }
  }

  // Reset local settings
  const updateSettingsRes = await updateSettings({ gistId: "", lastSync: 0 });
  if (updateSettingsRes.isErr()) {
    return err(updateSettingsRes.error);
  }

  setStore({
    gistId: "",
    vaultItems: [],
    lastSync: 0,
  });
  return ok();
}
