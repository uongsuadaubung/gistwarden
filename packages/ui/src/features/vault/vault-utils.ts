import { t } from "@/core/i18n.ts";
import { View } from "@/core/types.ts";
import { CustomFieldType, VaultItemType } from "@gistwarden/domain";
import {
  type BaseVaultItem,
  CustomFieldTypeSchema,
  type VaultField,
  type VaultItem,
  VaultItemSchema,
} from "@gistwarden/domain";
import { confirm, setGlobalLoading, showToast } from "../../core/ui-service.ts";
import { deleteItem } from "@/features/vault/vault-service.ts";
import { navigate } from "@/core/navigation.ts";

export function mapCustomFields(
  fields?:
    | Array<
      { name?: string | null; value?: string | null; type?: number | null }
    >
    | null,
): VaultField[] {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map((f) => {
    const parsed = CustomFieldTypeSchema.safeParse(f.type);
    return {
      name: (f.name ?? "").trim(),
      value: (f.value ?? "").trim(),
      type: parsed.success ? parsed.data : CustomFieldType.Text,
    };
  });
}

export interface CreateBaseVaultItemInput {
  id?: string;
  name?: string | null;
  notes?: string | null;
  favorite?: boolean | null;
  reprompt?: number | null;
  fields?:
    | Array<
      { name?: string | null; value?: string | null; type?: number | null }
    >
    | null;
  creationDate?: string | null;
  revisionDate?: string | null;
  fallbackName?: string;
}

export function createBaseVaultItem(
  input: CreateBaseVaultItemInput,
): BaseVaultItem {
  const now = new Date().toISOString();
  return {
    id: input.id !== undefined ? input.id : crypto.randomUUID(),
    name: (input.name ?? "").trim() || (input.fallbackName ?? ""),
    notes: (input.notes ?? "").trim(),
    favorite: !!input.favorite,
    reprompt: input.reprompt ?? 0,
    fields: mapCustomFields(input.fields),
    creationDate: input.creationDate || now,
    revisionDate: input.revisionDate || now,
  };
}

export const getVaultItemTypeLabel = (type: VaultItemType | "all") => {
  switch (type) {
    case VaultItemType.Login:
      return t("vault_item_login");
    case VaultItemType.Card:
      return t("vault_item_card");
    case VaultItemType.Identity:
      return t("vault_item_identity");
    case VaultItemType.SecureNote:
      return t("vault_item_note");
    case VaultItemType.SshKey:
      return t("vault_item_ssh_key");
    default:
      return t("vault_filter_type");
  }
};

export const getVaultItemTitle = (type: VaultItemType, isEdit = false) => {
  if (isEdit) {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_title_edit_note");
      case VaultItemType.Card:
        return t("edit_title_edit_card");
      case VaultItemType.Identity:
        return t("edit_title_edit_identity");
      case VaultItemType.SshKey:
        return t("edit_title_edit_ssh_key");
      default:
        return t("edit_title_edit_login");
    }
  } else {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_title_add_note");
      case VaultItemType.Card:
        return t("edit_title_add_card");
      case VaultItemType.Identity:
        return t("edit_title_add_identity");
      case VaultItemType.SshKey:
        return t("edit_title_add_ssh_key");
      default:
        return t("edit_title_add_login");
    }
  }
};

export const getVaultItemToastMsg = (type: VaultItemType, isEdit = false) => {
  if (isEdit) {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_toast_updated_note");
      case VaultItemType.Card:
        return t("edit_toast_updated_card");
      case VaultItemType.Identity:
        return t("edit_toast_updated_identity");
      case VaultItemType.SshKey:
        return t("edit_toast_updated_ssh_key");
      default:
        return t("edit_toast_updated_login");
    }
  } else {
    switch (type) {
      case VaultItemType.SecureNote:
        return t("edit_toast_created_note");
      case VaultItemType.Card:
        return t("edit_toast_created_card");
      case VaultItemType.Identity:
        return t("edit_toast_created_identity");
      case VaultItemType.SshKey:
        return t("edit_toast_created_ssh_key");
      default:
        return t("edit_toast_created_login");
    }
  }
};

export const getVaultItemDetailTitle = (type: VaultItemType | undefined) => {
  switch (Number(type)) {
    case VaultItemType.SecureNote:
      return t("detail_title_note");
    case VaultItemType.Card:
      return t("detail_title_card");
    case VaultItemType.Identity:
      return t("detail_title_identity");
    case VaultItemType.SshKey:
      return t("detail_title_ssh_key");
    default:
      return t("detail_title_login");
  }
};

export const deleteVaultItemWithConfirm = async (
  item: VaultItem,
  onSuccess?: () => void,
) => {
  const confirmed = await confirm(
    t("edit_confirm_delete_title"),
    t("edit_confirm_delete_msg", { name: item.name }),
    "danger",
  );
  if (!confirmed) return false;

  setGlobalLoading(true);
  const res = await deleteItem(item.id);
  setGlobalLoading(false);

  if (res.isOk()) {
    showToast(t("toast_success"), "success");
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(View.Vault);
    }
    return true;
  } else {
    showToast(t(res.error), "error");
    return false;
  }
};

function isVaultItemType(val: number): val is VaultItemType {
  return val === VaultItemType.Login ||
    val === VaultItemType.Card ||
    val === VaultItemType.Identity ||
    val === VaultItemType.SecureNote ||
    val === VaultItemType.SshKey;
}

function getSubPayload(item: unknown, key: string): unknown {
  if (item && typeof item === "object") {
    return Reflect.get(item, key);
  }
  return undefined;
}

const VAULT_ITEM_TYPE_KEY_MAP: Record<VaultItemType, string> = {
  [VaultItemType.Login]: "login",
  [VaultItemType.Card]: "card",
  [VaultItemType.Identity]: "identity",
  [VaultItemType.SecureNote]: "secureNote",
  [VaultItemType.SshKey]: "sshKey",
};

const DEFAULT_VAULT_ITEM_PAYLOADS: Record<
  VaultItemType,
  Record<string, unknown>
> = {
  [VaultItemType.Login]: {
    username: "",
    password: "",
    totp: "",
    uris: [],
    fido2Credentials: [],
  },
  [VaultItemType.Card]: {
    cardholderName: "",
    brand: "",
    number: "",
    expMonth: "",
    expYear: "",
    code: "",
  },
  [VaultItemType.Identity]: {
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    company: "",
    ssn: "",
    passportNumber: "",
    licenseNumber: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
  [VaultItemType.SecureNote]: { type: 0 },
  [VaultItemType.SshKey]: {
    privateKey: "",
    publicKey: "",
    fingerprint: "",
    keyType: "",
    passphrase: "",
  },
};

export function mergeVaultItem(
  existing: VaultItem,
  patch: Partial<VaultItem>,
): VaultItem {
  const now = new Date().toISOString();
  const targetType = patch.type !== undefined
    ? Number(patch.type)
    : Number(existing.type);

  const baseItem: Record<string, unknown> = {
    id: existing.id,
    type: targetType,
    name: patch.name !== undefined ? patch.name : existing.name,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
    favorite: patch.favorite !== undefined ? patch.favorite : existing.favorite,
    reprompt: patch.reprompt !== undefined
      ? patch.reprompt
      : (existing.reprompt !== undefined ? existing.reprompt : 0),
    fields: patch.fields !== undefined ? patch.fields : existing.fields,
    creationDate: existing.creationDate,
    revisionDate: now,
  };

  if (isVaultItemType(targetType)) {
    const payloadKey = VAULT_ITEM_TYPE_KEY_MAP[targetType];
    const patchPayload = getSubPayload(patch, payloadKey);
    const existingPayload = getSubPayload(existing, payloadKey);
    baseItem[payloadKey] = patchPayload ?? existingPayload ??
      DEFAULT_VAULT_ITEM_PAYLOADS[targetType];
  }

  const parsed = VaultItemSchema.safeParse(baseItem);
  if (parsed.success) {
    return parsed.data;
  }
  return existing;
}

export function createDefaultVaultItem(
  patch: Partial<VaultItem>,
): VaultItem {
  const now = new Date().toISOString();
  const targetType = patch.type !== undefined
    ? Number(patch.type)
    : VaultItemType.Login;

  const baseItem: Record<string, unknown> = {
    id: patch.id || crypto.randomUUID(),
    type: targetType,
    name: patch.name || "Chưa đặt tên",
    notes: patch.notes || "",
    favorite: patch.favorite || false,
    reprompt: patch.reprompt || 0,
    fields: patch.fields || [],
    creationDate: now,
    revisionDate: now,
  };

  if (isVaultItemType(targetType)) {
    const payloadKey = VAULT_ITEM_TYPE_KEY_MAP[targetType];
    const patchPayload = getSubPayload(patch, payloadKey);
    baseItem[payloadKey] = patchPayload ??
      DEFAULT_VAULT_ITEM_PAYLOADS[targetType];
  }

  const parsed = VaultItemSchema.safeParse(baseItem);
  if (parsed.success) {
    return parsed.data;
  }
  return {
    id: crypto.randomUUID(),
    type: VaultItemType.Login,
    name: "Chưa đặt tên",
    notes: "",
    favorite: false,
    reprompt: 0,
    fields: [],
    creationDate: now,
    revisionDate: now,
    login: {
      username: "",
      password: "",
      totp: "",
      uris: [],
      fido2Credentials: [],
    },
  };
}
