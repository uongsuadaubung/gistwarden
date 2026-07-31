import {
  type BaseVaultItem,
  CustomFieldTypeSchema,
  type VaultField,
  type VaultItem,
  VaultItemSchema,
} from "./vault-schemas.ts";
import { CustomFieldType, VaultItemType } from "./vault-types.ts";

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
  folderId?: string | null;
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
    folderId: input.folderId !== undefined ? input.folderId : null,
    name: (input.name ?? "").trim() || (input.fallbackName ?? ""),
    notes: (input.notes ?? "").trim(),
    favorite: !!input.favorite,
    reprompt: input.reprompt ?? 0,
    fields: mapCustomFields(input.fields),
    creationDate: input.creationDate || now,
    revisionDate: input.revisionDate || now,
  };
}

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
    folderId: patch.folderId !== undefined ? patch.folderId : existing.folderId,
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
    folderId: patch.folderId || null,
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
